
const express = require('express');
const GymStaff = require('../models/GymStaff');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all staff
router.get('/', auth, async (req, res) => {
  try {
    const staff = await GymStaff.find({ userId: req.user._id });
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ success: false, message: 'Error fetching staff' });
  }
});

// Get single staff member
router.get('/:id', auth, async (req, res) => {
  try {
    const staff = await GymStaff.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({ success: false, message: 'Error fetching staff member' });
  }
});

// Create new staff member
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, position, hireDate, status } = req.body;
    
    const newStaff = await GymStaff.create({
      userId: req.user._id,
      name,
      email,
      phone,
      position,
      hireDate,
      status
    });
    
    res.status(201).json({ success: true, data: newStaff });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: 'Error creating staff member' });
  }
});

// Update staff member
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, position, hireDate, status } = req.body;
    
    const staff = await GymStaff.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, email, phone, position, hireDate, status },
      { new: true, runValidators: true }
    );
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ success: false, message: 'Error updating staff member' });
  }
});

// Delete staff member
router.delete('/:id', auth, async (req, res) => {
  try {
    const staff = await GymStaff.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ success: false, message: 'Error deleting staff member' });
  }
});

module.exports = router;
