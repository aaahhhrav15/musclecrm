const mongoose = require('mongoose');

const eventWorkshopSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['event', 'workshop'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
eventWorkshopSchema.index({ gymId: 1 });
eventWorkshopSchema.index({ date: 1 });

module.exports = mongoose.model('EventWorkshop', eventWorkshopSchema); 