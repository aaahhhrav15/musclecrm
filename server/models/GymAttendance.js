const mongoose = require('mongoose');

const gymAttendanceSchema = new mongoose.Schema({
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
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: true,
});

const GymAttendance = mongoose.model('GymAttendance', gymAttendanceSchema);

module.exports = GymAttendance;
