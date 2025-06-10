const express = require('express');
const ClassSchedule = require('../models/ClassSchedule');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');

const router = express.Router();

// Apply both auth and gymAuth middleware to all routes
router.use(auth);
router.use(gymAuth);

// Get all class schedules for the gym
router.get('/', async (req, res) => {
  try {
    const classSchedules = await ClassSchedule.find({ gymId: req.gymId })
      .populate('instructor', 'name email')
      .sort({ startTime: 1 });
    res.json({ success: true, classSchedules });
  } catch (error) {
    console.error('Error fetching class schedules:', error);
    res.status(500).json({ success: false, message: 'Error fetching class schedules' });
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

// Get a specific class schedule
router.get('/:id', async (req, res) => {
  try {
    const classSchedule = await ClassSchedule.findOne({
      _id: req.params.id,
      gymId: req.gymId
    }).populate('instructor', 'name email');
    
    if (!classSchedule) {
      return res.status(404).json({ success: false, message: 'Class schedule not found' });
    }
    
    res.json({ success: true, classSchedule });
  } catch (error) {
    console.error('Error fetching class schedule:', error);
    res.status(500).json({ success: false, message: 'Error fetching class schedule' });
  }
});

// Create a new class schedule
router.post('/', async (req, res) => {
  try {
    const classSchedule = new ClassSchedule({
      ...req.body,
      gymId: req.gymId
    });
    await classSchedule.save();
    res.status(201).json({ success: true, classSchedule });
  } catch (error) {
    console.error('Error creating class schedule:', error);
    res.status(500).json({ success: false, message: 'Error creating class schedule' });
  }
});

// Update a class schedule
router.put('/:id', async (req, res) => {
  try {
    const classSchedule = await ClassSchedule.findOneAndUpdate(
      { _id: req.params.id, gymId: req.gymId },
      req.body,
      { new: true }
    );
    
    if (!classSchedule) {
      return res.status(404).json({ success: false, message: 'Class schedule not found' });
    }
    
    res.json({ success: true, classSchedule });
  } catch (error) {
    console.error('Error updating class schedule:', error);
    res.status(500).json({ success: false, message: 'Error updating class schedule' });
  }
});

// Delete a class schedule
router.delete('/:id', async (req, res) => {
  try {
    const classSchedule = await ClassSchedule.findOneAndDelete({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!classSchedule) {
      return res.status(404).json({ success: false, message: 'Class schedule not found' });
    }
    
    res.json({ success: true, message: 'Class schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting class schedule:', error);
    res.status(500).json({ success: false, message: 'Error deleting class schedule' });
  }
});

module.exports = router; 