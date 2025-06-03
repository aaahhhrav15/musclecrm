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
      trainerId,
      classId,
      equipmentId,
      notes,
      price,
      currency
    } = req.body;

    // Create the booking
    const booking = await Booking.create({
      userId: req.user._id,
      customerId,
      type,
      startTime,
      endTime,
      trainerId,
      classId,
      equipmentId,
      notes,
      price,
      currency,
      status: 'scheduled',
      createdBy: req.user._id
    });

    // Populate the booking with customer and trainer/class/equipment details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customerId', 'name email')
      .populate('trainerId', 'name')
      .populate('classId', 'name')
      .populate('equipmentId', 'name');

    // Create invoice
    try {
      // Check if invoice already exists for this booking
      const existingInvoice = await Invoice.findOne({ bookingId: booking._id });
      if (existingInvoice) {
        console.log('Invoice already exists for this booking:', existingInvoice._id);
        res.status(201).json({
          success: true,
          message: 'Booking created successfully',
          booking: populatedBooking,
          invoice: existingInvoice
        });
        return;
      }

      // Create new invoice
      const invoice = await Invoice.create({
        userId: req.user._id,
        bookingId: booking._id,
        customerId,
        amount: price,
        currency,
        status: 'pending',
        dueDate: new Date(endTime),
        items: [{
          description: `${type.replace('_', ' ')} booking`,
          quantity: 1,
          unitPrice: price,
          amount: price
        }]
      });

      // Update booking with invoice ID
      await Booking.findByIdAndUpdate(booking._id, { invoiceId: invoice._id });

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: populatedBooking,
        invoice
      });
    } catch (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      // Still return success for booking creation
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: populatedBooking,
        invoiceError: invoiceError.message
      });
    }
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
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
