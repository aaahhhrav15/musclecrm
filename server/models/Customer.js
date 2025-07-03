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
  gymCode: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'walk-in', 'social_media', 'other'],
    default: 'other'
  },
  membershipType: {
    type: String,
    enum: ['none', 'basic', 'premium', 'vip'],
    default: 'none'
  },
  membershipFees: {
    type: Number,
    default: 0
  },
  membershipDuration: {
    type: Number,
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  membershipStartDate: {
    type: Date,
    default: Date.now
  },
  membershipEndDate: {
    type: Date
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'other'],
    default: 'cash'
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  personalTrainer: {
    type: Object,
    required: false
  },
  notes: {
    type: String,
    trim: true
  },
  birthday: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for common queries
customerSchema.index({ userId: 1, email: 1 });
customerSchema.index({ userId: 1, name: 1 });
customerSchema.index({ gymId: 1 });
customerSchema.index({ personalTrainer: 1 });

module.exports = mongoose.model('Customer', customerSchema);
