const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'walk-in', 'social_media', 'other'],
    default: 'other'
  },
  membershipType: {
    type: String,
    enum: ['basic', 'premium', 'vip', 'none'],
    default: 'none'
  },
  membershipFees: {
    type: Number,
    default: 0
  },
  membershipDuration: {
    type: Number,  // Duration in months
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  birthday: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for common queries
customerSchema.index({ userId: 1, email: 1 });
customerSchema.index({ userId: 1, name: 1 });
customerSchema.index({ gymId: 1 });

module.exports = mongoose.model('Customer', customerSchema);
