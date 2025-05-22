
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: String,
    phone: String
  },
  service: {
    name: {
      type: String,
      required: true
    },
    duration: Number,
    price: Number
  },
  staff: {
    id: mongoose.Schema.Types.ObjectId,
    name: String
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed', 'No-show'],
    default: 'Pending'
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', BookingSchema);
