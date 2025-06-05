const mongoose = require('mongoose');

const classScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    }
  },
  {
    timestamps: true
  }
);

// Add index for efficient querying
classScheduleSchema.index({ startTime: 1, endTime: 1 });
classScheduleSchema.index({ instructor: 1 });
classScheduleSchema.index({ status: 1 });

module.exports = mongoose.model('ClassSchedule', classScheduleSchema); 