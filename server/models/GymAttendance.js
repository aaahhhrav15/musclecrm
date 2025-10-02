const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true,
  },
  gymCode: {
    type: String,
    required: true,
  },
  markedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  dateKey: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Create index for efficient queries
attendanceSchema.index({ gymId: 1, dateKey: 1 });
attendanceSchema.index({ userId: 1, dateKey: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendances');

module.exports = Attendance;
