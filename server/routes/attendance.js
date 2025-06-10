const express = require('express');
const GymAttendance = require('../models/GymAttendance');
const GymMember = require('../models/GymMember');
const auth = require('../middleware/auth');
const { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

const router = express.Router();

// Get attendance records with date filter
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const { date } = req.query;
    let dateFilter = {};

    // Handle different date filters
    if (date) {
      const today = new Date();
      switch (date) {
        case 'today':
          dateFilter = {
            checkInTime: {
              $gte: startOfDay(today),
              $lte: endOfDay(today)
            }
          };
          break;
        case 'yesterday':
          const yesterday = subDays(today, 1);
          dateFilter = {
            checkInTime: {
              $gte: startOfDay(yesterday),
              $lte: endOfDay(yesterday)
            }
          };
          break;
        case 'thisWeek':
          dateFilter = {
            checkInTime: {
              $gte: startOfWeek(today),
              $lte: endOfWeek(today)
            }
          };
          break;
        case 'lastWeek':
          const lastWeek = subDays(today, 7);
          dateFilter = {
            checkInTime: {
              $gte: startOfWeek(lastWeek),
              $lte: endOfWeek(lastWeek)
            }
          };
          break;
        case 'thisMonth':
          dateFilter = {
            checkInTime: {
              $gte: startOfMonth(today),
              $lte: endOfMonth(today)
            }
          };
          break;
        default:
          // If a specific date is provided
          const specificDate = new Date(date);
          if (!isNaN(specificDate.getTime())) {
            dateFilter = {
              checkInTime: {
                $gte: startOfDay(specificDate),
                $lte: endOfDay(specificDate)
              }
            };
          }
      }
    }

    const attendance = await GymAttendance.find({
      gymId: req.user.gymId,
      ...dateFilter
    })
      .populate('memberId', 'name membershipType')
      .sort({ checkInTime: -1 });
      
    // Calculate stats
    const stats = {
      totalToday: attendance.length,
      currentlyIn: attendance.filter(a => !a.checkOutTime).length,
      membersToday: attendance.filter(a => a.memberId).length,
      staffToday: attendance.filter(a => a.staffId).length
    };
      
    res.json({ 
      success: true, 
      data: attendance,
      stats 
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance records' });
  }
});

// Get attendance history with pagination
router.get('/history', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const { page = 1, limit = 10, startDate, endDate, memberId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { gymId: req.user.gymId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.checkInTime = {};
      if (startDate) query.checkInTime.$gte = new Date(startDate);
      if (endDate) query.checkInTime.$lte = new Date(endDate);
    }

    // Add member filter if provided
    if (memberId) {
      query.memberId = memberId;
    }

    const attendance = await GymAttendance.find(query)
      .populate('memberId', 'name membershipType')
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GymAttendance.countDocuments(query);

    res.json({
      success: true,
      data: attendance,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance history' });
  }
});

// Check-in a member
router.post('/check-in', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const { memberId, notes } = req.body;
    
    // Verify the member exists and belongs to the user
    const member = await GymMember.findOne({
      _id: memberId,
      gymId: req.user.gymId
    });
    
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    
    // Check if the member already has an open check-in
    const existingAttendance = await GymAttendance.findOne({
      memberId,
      gymId: req.user.gymId,
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
      gymId: req.user.gymId,
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
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const { notes } = req.body;
    
    // Find attendance record
    const attendance = await GymAttendance.findOne({
      _id: req.params.id,
      gymId: req.user.gymId,
      checkOutTime: { $exists: false }
    });
    
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Active attendance record not found' });
    }
    
    // Update check-out time
    attendance.checkOutTime = new Date();
    attendance.notes = notes || attendance.notes;
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
      gymId: req.user.gymId,
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
      gymId: req.user.gymId,
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
