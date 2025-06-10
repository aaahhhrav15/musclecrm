const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const Notification = require('../models/Notification');

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
    const customer = new Customer({
      ...req.body,
      userId: req.user._id,
      gymId: req.gymId
    });
    await customer.save();
    res.status(201).json({ success: true, customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, message: 'Error creating customer' });
  }
});

// Update a customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, gymId: req.gymId },
      req.body,
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, message: 'Error updating customer' });
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
