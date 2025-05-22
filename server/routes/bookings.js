
const express = require('express');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all bookings with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { status, date, customerId, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id };
    
    // Add filters if provided
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (date) {
      // Create date range for the selected date (entire day)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (customerId) {
      query['customer.id'] = customerId;
    }
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { date: 1, startTime: 1 }
    };
    
    const bookings = await Booking.find(query, null, options);
    const total = await Booking.countDocuments(query);
    
    res.json({
      success: true,
      bookings,
      total
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Error fetching booking' });
  }
});

// Create new booking
router.post('/', auth, async (req, res) => {
  try {
    const { customer, service, staff, date, startTime, endTime, status, notes } = req.body;
    
    const newBooking = await Booking.create({
      userId: req.user._id,
      customer,
      service,
      staff,
      date,
      startTime,
      endTime,
      status,
      notes
    });
    
    res.status(201).json({ success: true, booking: newBooking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Error creating booking' });
  }
});

// Update booking
router.put('/:id', auth, async (req, res) => {
  try {
    const { customer, service, staff, date, startTime, endTime, status, notes } = req.body;
    
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { customer, service, staff, date, startTime, endTime, status, notes },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ success: false, message: 'Error updating booking' });
  }
});

// Delete booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ success: false, message: 'Error deleting booking' });
  }
});

module.exports = router;
