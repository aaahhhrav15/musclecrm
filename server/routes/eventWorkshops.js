const express = require('express');
const router = express.Router();
const eventWorkshopController = require('../controllers/eventWorkshopController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Get all events and workshops
router.get('/', eventWorkshopController.getAllEvents);

// Create a new event or workshop
router.post('/', eventWorkshopController.createEvent);

// Get a single event or workshop
router.get('/:id', eventWorkshopController.getEvent);

// Update an event or workshop
router.put('/:id', eventWorkshopController.updateEvent);

// Delete an event or workshop
router.delete('/:id', eventWorkshopController.deleteEvent);

module.exports = router; 