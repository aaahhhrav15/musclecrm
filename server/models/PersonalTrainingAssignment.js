const mongoose = require('mongoose');

const personalTrainingAssignmentSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in months - kept for backward compatibility
    required: true
  },
  durationMonths: {
    type: Number, // new field for months
    default: 0
  },
  durationDays: {
    type: Number, // new field for days
    default: 0
  },
  endDate: {
    type: Date,
    required: true
  },
  fees: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PersonalTrainingAssignment', personalTrainingAssignmentSchema); 