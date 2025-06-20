const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const Gym = require('../models/Gym');
const Invoice = require('../models/Invoice');

const router = express.Router();

// Apply both auth and gymAuth middleware to all routes
router.use(auth);
router.use(gymAuth);

// Get all customers for the gym
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const query = { gymId: req.gymId };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Customer.countDocuments(query);

    // Get paginated customers
    const customers = await Customer.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, customers, total });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Error fetching customers' });
  }
});

// Get total count of customers
router.get('/count', auth, async (req, res) => {
  try {
    console.log('Getting customer count for user:', req.user._id);
    const count = await Customer.countDocuments({ userId: req.user._id });
    console.log('Total customers found:', count);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting customer count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting customer count',
      error: error.message 
    });
  }
});

// Get a specific customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, message: 'Error fetching customer' });
  }
});

// Create a new customer
router.post('/', async (req, res) => {
  try {
    // Fetch gymCode from the gym document
    const gym = await Gym.findById(req.gymId);
    const gymCode = gym ? gym.gymCode : undefined;
    const customer = new Customer({
      ...req.body,
      userId: req.user._id,
      gymId: req.gymId,
      gymCode,
    });
    await customer.save();
    
    // Automatically create invoice if membership fees are greater than 0
    let invoice = null;
    if (customer.membershipFees > 0) {
      try {
        // Get the last invoice number with proper error handling
        let nextNumber = 1;
        try {
          const lastInvoice = await Invoice.findOne({}, {}, { sort: { 'invoiceNumber': -1 } });
          if (lastInvoice && lastInvoice.invoiceNumber) {
            const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV', ''));
            if (!isNaN(lastNumber)) {
              nextNumber = lastNumber + 1;
            }
          }
        } catch (error) {
          console.error('Error getting last invoice number:', error);
          // Use timestamp as fallback
          nextNumber = Math.floor(Date.now() / 1000);
        }
        
        const invoiceNumber = `INV${String(nextNumber).padStart(5, '0')}`;

        // Create invoice item for membership
        const membershipItem = {
          description: `${customer.membershipType.toUpperCase()} Membership - ${customer.membershipDuration} months`,
          quantity: 1,
          unitPrice: customer.membershipFees,
          amount: customer.membershipFees
        };

        // Set due date to 7 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        invoice = new Invoice({
          userId: req.user._id,
          gymId: req.gymId,
          customerId: customer._id,
          invoiceNumber,
          amount: customer.membershipFees,
          currency: 'INR',
          status: 'pending',
          dueDate,
          items: [membershipItem],
          notes: `Membership joining fees for ${customer.name} - ${customer.membershipType.toUpperCase()} plan for ${customer.membershipDuration} months`
        });

        await invoice.save();
      } catch (invoiceError) {
        console.error('Failed to create invoice:', invoiceError);
        // Don't fail the entire operation if invoice creation fails
      }
    }

    // Exclude gymCode from the response
    const customerObj = customer.toObject();
    delete customerObj.gymCode;
    
    res.status(201).json({ 
      success: true, 
      customer: customerObj,
      invoice: invoice ? invoice.toObject() : null
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, message: 'Error creating customer' });
  }
});

// Update a customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      source,
      membershipType,
      membershipFees,
      membershipDuration,
      joinDate,
      membershipStartDate,
      membershipEndDate,
      transactionDate,
      paymentMode,
      notes,
      birthday
    } = req.body;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingCustomer = await Customer.findOne({ 
        email, 
        _id: { $ne: id } // Exclude current customer
      });
      
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already in use by another customer'
        });
      }
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Store old membership fees to detect renewal
    const oldMembershipFees = customer.membershipFees;
    const oldMembershipType = customer.membershipType;
    const oldMembershipDuration = customer.membershipDuration;
    
    // Consider it a renewal if membership fees are provided and greater than 0
    // This handles cases where the same membership type is renewed
    const isRenewal = membershipFees !== undefined && membershipFees > 0;

    console.log('Renewal detection:', {
      oldMembershipFees,
      newMembershipFees: membershipFees,
      oldMembershipType,
      newMembershipType: membershipType,
      oldMembershipDuration,
      newMembershipDuration: membershipDuration,
      isRenewal
    });

    // Update customer fields
    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (source) customer.source = source;
    if (membershipType) customer.membershipType = membershipType;
    if (membershipFees !== undefined) customer.membershipFees = membershipFees;
    if (membershipDuration !== undefined) customer.membershipDuration = membershipDuration;
    if (joinDate) customer.joinDate = joinDate;
    if (membershipStartDate) customer.membershipStartDate = membershipStartDate;
    if (membershipEndDate !== undefined) customer.membershipEndDate = membershipEndDate;
    if (transactionDate) customer.transactionDate = transactionDate;
    if (paymentMode) customer.paymentMode = paymentMode;
    if (notes !== undefined) customer.notes = notes;
    if (birthday !== undefined) customer.birthday = birthday;

    await customer.save();

    // Automatically create invoice for membership renewal
    let invoice = null;
    if (isRenewal && membershipFees > 0) {
      console.log('Creating renewal invoice for customer:', customer.name);
      try {
        // Get the last invoice number with proper error handling
        let nextNumber = 1;
        try {
          const lastInvoice = await Invoice.findOne({}, {}, { sort: { 'invoiceNumber': -1 } });
          if (lastInvoice && lastInvoice.invoiceNumber) {
            const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV', ''));
            if (!isNaN(lastNumber)) {
              nextNumber = lastNumber + 1;
            }
          }
        } catch (error) {
          console.error('Error getting last invoice number:', error);
          // Use timestamp as fallback
          nextNumber = Math.floor(Date.now() / 1000);
        }
        
        const invoiceNumber = `INV${String(nextNumber).padStart(5, '0')}`;
        console.log('Generated invoice number:', invoiceNumber);

        // Create invoice item for membership renewal
        const renewalItem = {
          description: `${membershipType.toUpperCase()} Membership Renewal - ${membershipDuration} months`,
          quantity: 1,
          unitPrice: membershipFees,
          amount: membershipFees
        };

        // Set due date to 7 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        invoice = new Invoice({
          userId: req.user._id,
          gymId: req.gymId,
          customerId: customer._id,
          invoiceNumber,
          amount: membershipFees,
          currency: 'INR',
          status: 'pending',
          dueDate,
          items: [renewalItem],
          notes: `Membership renewal fees for ${customer.name} - ${membershipType.toUpperCase()} plan for ${membershipDuration} months`
        });

        await invoice.save();
        console.log('Renewal invoice created successfully:', invoice.invoiceNumber);
      } catch (invoiceError) {
        console.error('Failed to create renewal invoice:', invoiceError);
        // Don't fail the entire operation if invoice creation fails
      }
    } else {
      console.log('No renewal invoice created. isRenewal:', isRenewal, 'membershipFees:', membershipFees);
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer,
      invoice: invoice ? invoice.toObject() : null
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer'
    });
  }
});

// Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, message: 'Error deleting customer' });
  }
});

module.exports = router;
