const express = require('express');
const router = express.Router();
const EventWorkshop = require('../models/EventWorkshop');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');

// Apply both auth and gymAuth middleware to all routes
router.use(auth);
router.use(gymAuth);

// Get all events/workshops for the gym
router.get('/', async (req, res) => {
  try {
    const events = await EventWorkshop.find({ gymId: req.gymId })
      .sort({ date: 1 });
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Error fetching events' });
  }
});

// Create a new event/workshop
router.post('/', async (req, res) => {
  try {
    const event = new EventWorkshop({
      ...req.body,
      gymId: req.gymId
    });
    await event.save();
    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Error creating event' });
  }
});

// Get a specific event/workshop
router.get('/:id', async (req, res) => {
  try {
    const event = await EventWorkshop.findOne({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, message: 'Error fetching event' });
  }
});

// Update an event/workshop
router.put('/:id', async (req, res) => {
  try {
    const event = await EventWorkshop.findOneAndUpdate(
      { _id: req.params.id, gymId: req.gymId },
      req.body,
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Error updating event' });
  }
});

// Delete an event/workshop
router.delete('/:id', async (req, res) => {
  try {
    const event = await EventWorkshop.findOneAndDelete({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Error deleting event' });
  }
});

module.exports = router; 