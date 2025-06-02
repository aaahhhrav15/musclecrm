const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const { addDays } = require('date-fns');

// Get all bookings with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      startDate,
      endDate,
      trainerId,
      classId,
      customerId,
      status
    } = req.query;

    const query = { userId: req.user._id };

    // Apply filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (trainerId) query.trainerId = trainerId;
    if (classId) query.classId = classId;
    if (customerId) query.customerId = customerId;

    // Date range filter
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { startTime: -1 },
      populate: [
        { path: 'customerId', select: 'name email phone' },
        { path: 'trainerId', select: 'name email' },
        { path: 'classId', select: 'name description' },
        { path: 'equipmentId', select: 'name description' }
      ]
    };

    const bookings = await Booking.find(query, null, options);
    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
});

// Get booking calendar data
router.get('/calendar', auth, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const query = { 
      userId: req.user._id,
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (type) query.type = type;

    const bookings = await Booking.find(query)
      .populate('customerId', 'name')
      .populate('trainerId', 'name')
      .populate('classId', 'name')
      .populate('equipmentId', 'name')
      .sort({ startTime: 1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Get calendar data error:', error);
    res.status(500).json({ success: false, message: 'Error fetching calendar data' });
  }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
    .populate('customerId', 'name email phone')
    .populate('trainerId', 'name email')
    .populate('classId', 'name description')
    .populate('equipmentId', 'name description');

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
    const {
      customerId,
      type,
      startTime,
      endTime,
      classId,
      trainerId,
      equipmentId,
      notes,
      status,
      price,
      currency
    } = req.body;

    console.log('Received booking data:', req.body);

    // Validate customer exists
    const customer = await Customer.findOne({ _id: customerId, userId: req.user._id });
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found',
        details: `No customer found with ID: ${customerId}`
      });
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      userId: req.user._id,
      $or: [
        // New booking starts during an existing booking
        {
          startTime: { $lte: new Date(startTime) },
          endTime: { $gt: new Date(startTime) }
        },
        // New booking ends during an existing booking
        {
          startTime: { $lt: new Date(endTime) },
          endTime: { $gte: new Date(endTime) }
        },
        // New booking completely contains an existing booking
        {
          startTime: { $gte: new Date(startTime) },
          endTime: { $lte: new Date(endTime) }
        }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: 'A booking already exists for this time slot',
        details: {
          existingBooking: {
            startTime: overlappingBooking.startTime,
            endTime: overlappingBooking.endTime,
            type: overlappingBooking.type
          }
        }
      });
    }

    // For class bookings, validate class exists
    if (type === 'class') {
      if (!classId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Class ID is required for class bookings' 
        });
      }
      // Since we're using static class IDs, we'll just validate it's not empty
      if (typeof classId !== 'string' || classId.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Invalid class ID'
        });
      }
    }

    // For personal training, validate trainer exists
    if (type === 'personal_training') {
      if (!trainerId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Trainer ID is required for personal training bookings' 
        });
      }
      // Since we're using trainer names, we'll just validate it's not empty
      if (typeof trainerId !== 'string' || trainerId.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Invalid trainer name'
        });
      }
    }

    // For equipment bookings, validate equipment exists
    if (type === 'equipment') {
      if (!equipmentId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Equipment ID is required for equipment bookings' 
        });
      }
      // Since we're using equipment names, we'll just validate it's not empty
      if (typeof equipmentId !== 'string' || equipmentId.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Invalid equipment name'
        });
      }
    }

    // Validate dates
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time and end time are required'
      });
    }

    // Validate price
    if (!price || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    // Create a simplified booking object
    const bookingData = {
      userId: req.user._id,
      customerId,
      type,
      startTime,
      endTime,
      notes,
      status,
      createdBy: req.user._id,
      price,
      currency: currency || 'INR'
    };

    // Add type-specific fields
    if (type === 'class') {
      bookingData.classId = classId;
    } else if (type === 'personal_training') {
      bookingData.trainerId = trainerId;
    } else if (type === 'equipment') {
      bookingData.equipmentId = equipmentId;
    }

    const newBooking = await Booking.create(bookingData);
    let invoice = null;

    try {
      // Create invoice for the booking
      invoice = new Invoice({
        bookingId: newBooking._id,
        customerId: newBooking.customerId,
        amount: newBooking.price,
        currency: newBooking.currency,
        dueDate: addDays(new Date(), 7), // Due in 7 days
        items: [{
          description: `${newBooking.type} booking`,
          quantity: 1,
          unitPrice: newBooking.price,
          amount: newBooking.price
        }]
      });
      await invoice.save();
    } catch (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      // Continue with the response even if invoice creation fails
    }

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('customerId', 'name email phone');

    return res.status(201).json({ 
      success: true, 
      booking: populatedBooking, 
      invoice,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: messages 
      });
    }

    // Handle other errors
    return res.status(500).json({ 
      success: false, 
      message: 'Error creating booking',
      error: error.message 
    });
  }
});

// Update booking
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      startTime,
      endTime,
      status,
      notes
    } = req.body;

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { startTime, endTime, status, notes },
      { new: true, runValidators: true }
    )
    .populate('customerId', 'name email phone')
    .populate('trainerId', 'name email')
    .populate('classId', 'name description')
    .populate('equipmentId', 'name description');

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
