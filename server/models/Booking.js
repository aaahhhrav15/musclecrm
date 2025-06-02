const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  type: {
    type: String,
    enum: ['class', 'personal_training', 'equipment'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  classId: {
    type: String,
    required: function() {
      return this.type === 'class';
    }
  },
  trainerId: {
    type: String,
    required: function() {
      return this.type === 'personal_training';
    }
  },
  equipmentId: {
    type: String,
    required: function() {
      return this.type === 'equipment';
    }
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for common queries
bookingSchema.index({ userId: 1, startTime: 1 });
bookingSchema.index({ customerId: 1, startTime: 1 });
bookingSchema.index({ type: 1, startTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
