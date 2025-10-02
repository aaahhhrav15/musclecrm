const express = require('express');
const Attendance = require('../models/GymAttendance');
const Customer = require('../models/Customer');
const { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } = require('date-fns');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

const router = express.Router();

// Get attendance records with date filter
router.get('/', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const gymId = req.gym._id;
    console.log('Attendance request received:', { gymId, date });
    
    let startDate, endDate;
    const now = new Date();

    switch (date) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case 'thisWeek':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'lastWeek':
        startDate = startOfWeek(subWeeks(now, 1));
        endDate = endOfWeek(subWeeks(now, 1));
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'prevMonth':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }
    
    console.log('Date range:', { startDate, endDate });
    
    const attendance = await Attendance.find({
      gymId,
      markedAt: { $gte: startDate, $lt: endDate }
    })
      .populate('userId', 'name email')
      .sort({ markedAt: -1 });
      
    console.log('Found attendance records:', attendance.length);
    
    // Calculate 7-day average
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
    const weeklyAttendance = await Attendance.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId), markedAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$markedAt" } }, count: { $sum: 1 } } },
        { $group: { _id: null, total: { $sum: "$count" }, days: { $sum: 1 } } }
    ]);

    const sevenDayAvg = weeklyAttendance.length > 0 ? (weeklyAttendance[0].total / 7).toFixed(1) : '0.0';

    const stats = {
      totalToday: attendance.length,
      currentlyIn: 0,
      membersToday: attendance.filter(a => a.userId).length,
      sevenDayAverage: sevenDayAvg
    };
    
    // Update stats labels based on selected date range
    let periodLabel = 'Today';
    switch (date) {
      case 'yesterday':
        periodLabel = 'Yesterday';
        break;
      case 'thisWeek':
        periodLabel = 'This Week';
        break;
      case 'lastWeek':
        periodLabel = 'Last Week';
        break;
      case 'thisMonth':
        periodLabel = 'This Month';
        break;
      case 'prevMonth':
        periodLabel = 'Previous Month';
        break;
      default:
        periodLabel = 'Today';
    }
    
    console.log('Stats:', stats);
    console.log('Period label:', periodLabel);
      
    res.json({ 
      success: true, 
      data: attendance,
      stats: {
        ...stats,
        periodLabel
      }
    });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch attendance records',
      error: error.message 
    });
  }
});

// Get attendance history with pagination
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const gymId = req.gym._id;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const attendance = await Attendance.find({ gymId })
      .populate('userId', 'name email')
      .sort({ markedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Attendance.countDocuments({ gymId });
    const pages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      data: attendance,
      pagination: {
        total,
        page: parseInt(page),
        pages
      }
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance history' });
  }
});

// Check-in a customer
router.post('/check-in', async (req, res) => {
  try {
    const { userId, gymId, gymCode } = req.body;

    if (!userId || !gymId || !gymCode) {
      return res.status(400).json({ success: false, message: 'User ID, Gym ID, and Gym Code are required' });
    }
    
    const customer = await Customer.findById(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    const newAttendance = await Attendance.create({
      gymId: new mongoose.Types.ObjectId(gymId),
      userId: new mongoose.Types.ObjectId(userId),
      gymCode,
      markedAt: now,
      dateKey
    });
    
    const populatedAttendance = await Attendance.findById(newAttendance._id)
      .populate('userId', 'name email');
    
    res.status(201).json({ success: true, data: populatedAttendance });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Error checking in customer' });
  }
});

module.exports = router;
