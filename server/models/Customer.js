const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
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
    required: false,
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
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
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
  membershipDays: {
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
  height: {
    type: Number,
    min: 0,
    max: 300, // Reasonable height range in cm
    required: false
  },
  weight: {
    type: Number,
    min: 0,
    max: 500, // Reasonable weight range in kg
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for common queries
customerSchema.index({ email: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ gymId: 1 });
customerSchema.index({ personalTrainer: 1 });

// **OPTIMIZATION: Add compound indexes for dashboard queries**
customerSchema.index({ gymId: 1, membershipEndDate: 1 });
customerSchema.index({ gymId: 1, joinDate: 1 });
customerSchema.index({ gymId: 1, birthday: 1 });
customerSchema.index({ gymId: 1, totalSpent: 1 });
customerSchema.index({ gymId: 1, membershipEndDate: 1 });
customerSchema.index({ gymId: 1, joinDate: 1 });

// **OPTIMIZATION: Text index for search functionality**
customerSchema.index({ name: 'text', email: 'text', phone: 'text', notes: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
