const EventWorkshop = require('../models/EventWorkshop');

// Get all events and workshops
exports.getAllEvents = async (req, res) => {
  try {
    const events = await EventWorkshop.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new event or workshop
exports.createEvent = async (req, res) => {
  try {
    const event = new EventWorkshop(req.body);
    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors || 'Validation failed'
    });
  }
};

// Update an event or workshop
exports.updateEvent = async (req, res) => {
  try {
    const event = await EventWorkshop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an event or workshop
exports.deleteEvent = async (req, res) => {
  try {
    const event = await EventWorkshop.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single event or workshop
exports.getEvent = async (req, res) => {
  try {
    const event = await EventWorkshop.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 