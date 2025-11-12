const mongoose = require('mongoose');

const crmSubscriptionPaymentSchema = new mongoose.Schema({
  // Razorpay payment details
  razorpay_order_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  razorpay_payment_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  razorpay_signature: {
    type: String,
    required: true
  },
  
  // Payment amount and currency
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Subscription details
  subscriptionType: {
    type: String,
    enum: ['Monthly', 'Yearly'],
    required: true
  },
  subscriptionDuration: {
    type: String,
    required: true // e.g., "1 month", "1 year"
  },
  subscriptionStartDate: {
    type: Date,
    required: true
  },
  subscriptionEndDate: {
    type: Date,
    required: true
  },
  
  // Customer/Gym information
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true,
    index: true
  },
  gymName: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['paid', 'failed', 'pending'],
    default: 'paid',
    required: true,
    index: true
  },
  
  // Additional metadata
  notes: {
    type: String,
    default: ''
  },
  
  // Receipt information
  receipt: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
crmSubscriptionPaymentSchema.index({ gymId: 1, status: 1, createdAt: -1 });
crmSubscriptionPaymentSchema.index({ subscriptionType: 1, createdAt: -1 });
crmSubscriptionPaymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted amount
crmSubscriptionPaymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency,
  }).format(this.amount);
});

// Virtual for subscription period
crmSubscriptionPaymentSchema.virtual('subscriptionPeriod').get(function() {
  const start = new Date(this.subscriptionStartDate).toLocaleDateString('en-IN');
  const end = new Date(this.subscriptionEndDate).toLocaleDateString('en-IN');
  return `${start} - ${end}`;
});

// Method to check if subscription is active
crmSubscriptionPaymentSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'paid' && 
         this.subscriptionStartDate <= now && 
         this.subscriptionEndDate >= now;
};

// Method to check if subscription is expired
crmSubscriptionPaymentSchema.methods.isExpired = function() {
  const now = new Date();
  return this.subscriptionEndDate < now;
};

// Method to get days remaining
crmSubscriptionPaymentSchema.methods.getDaysRemaining = function() {
  const now = new Date();
  const endDate = new Date(this.subscriptionEndDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

module.exports = mongoose.model('CrmSubscriptionPayment', crmSubscriptionPaymentSchema);
