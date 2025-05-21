
const mongoose = require('mongoose');

const gymAttendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymMember',
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  checkOutTime: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

const GymAttendance = mongoose.model('GymAttendance', gymAttendanceSchema);

module.exports = GymAttendance;
