
const express = require('express');
const GymAttendance = require('../models/GymAttendance');
const GymMember = require('../models/GymMember');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all attendance records
router.get('/', auth, async (req, res) => {
  try {
    const attendance = await GymAttendance.find({ userId: req.user._id })
      .populate('memberId', 'name membershipType')
      .sort({ checkInTime: -1 });
      
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance records' });
  }
});

// Check-in a member
router.post('/check-in', auth, async (req, res) => {
  try {
    const { memberId, notes } = req.body;
    
    // Verify the member exists and belongs to the user
    const member = await GymMember.findOne({
      _id: memberId,
      userId: req.user._id
    });
    
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    
    // Check if the member already has an open check-in
    const existingAttendance = await GymAttendance.findOne({
      memberId,
      userId: req.user._id,
      checkOutTime: { $exists: false }
    });
    
    if (existingAttendance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Member already checked in',
        data: existingAttendance
      });
    }
    
    // Create new attendance record
    const newAttendance = await GymAttendance.create({
      userId: req.user._id,
      memberId,
      notes
    });
    
    // Populate member details
    const populatedAttendance = await GymAttendance.findById(newAttendance._id)
      .populate('memberId', 'name membershipType');
    
    res.status(201).json({ success: true, data: populatedAttendance });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Error checking in member' });
  }
});

// Check-out a member
router.put('/check-out/:id', auth, async (req, res) => {
  try {
    const { notes } = req.body;
    
    // Find attendance record
    const attendance = await GymAttendance.findOne({
      _id: req.params.id,
      userId: req.user._id,
      checkOutTime: { $exists: false }
    });
    
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Active attendance record not found' });
    }
    
    // Update check-out time and notes
    attendance.checkOutTime = new Date();
    if (notes) attendance.notes = notes;
    
    await attendance.save();
    
    // Populate member details
    const populatedAttendance = await GymAttendance.findById(attendance._id)
      .populate('memberId', 'name membershipType');
    
    res.json({ success: true, data: populatedAttendance });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Error checking out member' });
  }
});

// Get active (checked-in) members
router.get('/active', auth, async (req, res) => {
  try {
    const activeAttendance = await GymAttendance.find({
      userId: req.user._id,
      checkOutTime: { $exists: false }
    }).populate('memberId', 'name membershipType email phone');
    
    res.json({ success: true, data: activeAttendance });
  } catch (error) {
    console.error('Get active attendance error:', error);
    res.status(500).json({ success: false, message: 'Error fetching active attendance records' });
  }
});

// Get attendance by date range
router.get('/range', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and end dates are required' });
    }
    
    const attendance = await GymAttendance.find({
      userId: req.user._id,
      checkInTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('memberId', 'name membershipType')
      .sort({ checkInTime: -1 });
    
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Get attendance range error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance records' });
  }
});

module.exports = router;
