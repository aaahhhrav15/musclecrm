const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// Get all customers
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      membershipType,
      source,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    console.log('Received filter parameters:', { search, membershipType, source, sortBy, sortOrder });
    
    const query = { userId: req.user._id };
    
    // Add search query if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Add membership type filter if provided
    if (membershipType) {
      query.membershipType = membershipType;
    }

    // Add source filter if provided
    if (source) {
      query.source = source;
    }
    
    console.log('Final query:', query);
    
    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    console.log('Sort options:', sortOptions);
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: sortOptions
    };
    
    const customers = await Customer.find(query, null, options);
    const total = await Customer.countDocuments(query);
    
    console.log('Found customers:', customers.length);
    
    res.json({
      success: true,
      customers,
      total
    });
  } catch (error) {
    console.error('Get customers error:', error);
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

// Get single customer
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, message: 'Error fetching customer' });
  }
});

// Create new customer
router.post('/', auth, async (req, res) => {
  try {
    const { membershipFees, ...customerData } = req.body;
    
    // Create customer with initial total spent from membership fees
    const customer = await Customer.create({
      userId: req.user._id,
      ...customerData,
      totalSpent: membershipFees || 0
    });

    // Create notification for customer creation
    const notification = await Notification.create({
      userId: req.user._id,
      type: 'customer_created',
      title: 'New Customer Added',
      message: `A new customer ${customer.name} has been added to the system`,
      data: {
        customerId: customer._id,
        customerName: customer.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer,
      notification
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, address, source, notes, membershipType, birthday } = req.body;
    
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, email, phone, address, source, notes, membershipType, birthday },
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'Error updating customer' });
  }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, message: 'Error deleting customer' });
  }
});

module.exports = router;
