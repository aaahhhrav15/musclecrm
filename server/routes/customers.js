const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const Notification = require('../models/Notification');
const Gym = require('../models/Gym');

const router = express.Router();

// Apply both auth and gymAuth middleware to all routes
router.use(auth);
router.use(gymAuth);

// Get all customers for the gym
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({ gymId: req.gymId });
    res.json({ success: true, customers });
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
    // Exclude gymCode from the response
    const customerObj = customer.toObject();
    delete customerObj.gymCode;
    res.status(201).json({ success: true, customer: customerObj });
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

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer
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
