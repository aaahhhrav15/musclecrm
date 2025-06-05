const express = require('express');
const ClassSchedule = require('../models/ClassSchedule');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all class schedules with filters
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const schedules = await ClassSchedule.find(query)
      .populate('instructor', 'name')
      .sort({ startTime: 1 });

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching class schedules:', error);
    res.status(500).json({ message: 'Error fetching class schedules' });
  }
});

// Get calendar data
router.get('/calendar', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const schedules = await ClassSchedule.find(query)
      .populate('instructor', 'name')
      .select('name startTime endTime status instructor')
      .sort({ startTime: 1 });

    res.json({ schedules });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ message: 'Error fetching calendar data' });
  }
});

// Get a single class schedule
router.get('/:id', auth, async (req, res) => {
  try {
    const schedule = await ClassSchedule.findById(req.params.id)
      .populate('instructor', 'name');

    if (!schedule) {
      return res.status(404).json({ message: 'Class schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching class schedule:', error);
    res.status(500).json({ message: 'Error fetching class schedule' });
  }
});

// Create a new class schedule
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      instructor,
      startTime,
      endTime,
      capacity,
      price,
      currency
    } = req.body;

    // Validate required fields
    if (!name || !description || !instructor || !startTime || !endTime || !capacity || !price) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Create schedule data with proper date conversion
    const scheduleData = {
      name,
      description,
      instructor,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      capacity: Number(capacity),
      price: Number(price),
      currency: currency || 'USD',
      status: 'scheduled',
      enrolledCount: 0
    };

    // Validate dates
    if (isNaN(scheduleData.startTime.getTime()) || isNaN(scheduleData.endTime.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Validate end time is after start time
    if (scheduleData.endTime <= scheduleData.startTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const schedule = new ClassSchedule(scheduleData);
    await schedule.save();

    const populatedSchedule = await ClassSchedule.findById(schedule._id)
      .populate('instructor', 'name');

    res.status(201).json(populatedSchedule);
  } catch (error) {
    console.error('Error creating class schedule:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating class schedule' });
  }
});

// Update a class schedule
router.patch('/:id', auth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.body.startTime) {
      updateData.startTime = new Date(req.body.startTime);
    }
    if (req.body.endTime) {
      updateData.endTime = new Date(req.body.endTime);
    }

    const schedule = await ClassSchedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('instructor', 'name');

    if (!schedule) {
      return res.status(404).json({ message: 'Class schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error updating class schedule:', error);
    res.status(500).json({ message: 'Error updating class schedule' });
  }
});

// Delete a class schedule
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await ClassSchedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Class schedule not found' });
    }

    res.json({ message: 'Class schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting class schedule:', error);
    res.status(500).json({ message: 'Error deleting class schedule' });
  }
});

module.exports = router; 