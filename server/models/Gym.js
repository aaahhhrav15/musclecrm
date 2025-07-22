const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
  gymCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  logo: {
    type: String, // Base64 string with MIME type (e.g., 'data:image/png;base64,...')
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  facilities: [{
    type: String
  }],
  membershipTypes: [{
    name: String,
    price: Number,
    duration: Number, // in months
    features: [String]
  }],
  settings: {
    maxMembers: Number,
    maxStaff: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  metrics: {
    totalMembers: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    monthlyRevenue: {
      type: Number,
      default: 0
    },
    averageAttendance: {
      type: Number,
      default: 0
    }
  },
  // Subscription fields
  subscriptionStartDate: {
    type: Date,
    default: null
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },
  subscriptionDuration: {
    type: String, // e.g., '1 month', '1 year'
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Add invoiceCounter for per-gym invoice numbering
  invoiceCounter: {
    type: Number,
    default: 1
  }
});

gymSchema.index({ gymNumber: 1 }, { unique: true, sparse: true });

// Update the updatedAt timestamp before saving
gymSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Gym', gymSchema); 