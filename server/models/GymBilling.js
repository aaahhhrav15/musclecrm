const mongoose = require('mongoose');

const memberBillingSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  memberName: {
    type: String,
    required: true
  },
  memberEmail: {
    type: String,
    required: false,
    default: ''
  },
  memberPhone: {
    type: String,
    required: false,
    default: ''
  },
  membershipType: {
    type: String,
    enum: ['basic', 'premium', 'vip', 'personal_training', 'none'],
    required: true
  },
  monthlyFee: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    default: ''
  },
  daysActive: {
    type: Number,
    default: 0
  },
  daysInMonth: {
    type: Number,
    default: 30
  },
  originalMonthlyFee: {
    type: Number,
    default: 41.67
  }
}, {
  timestamps: true
});

const gymBillingSchema = new mongoose.Schema({
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
  billingMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  billingYear: {
    type: Number,
    required: true,
    min: 2020
  },
  totalMembers: {
    type: Number,
    required: true,
    default: 0
  },
  totalBillAmount: {
    type: Number,
    required: true,
    default: 0
  },
  totalPaidAmount: {
    type: Number,
    required: true,
    default: 0
  },
  totalPendingAmount: {
    type: Number,
    required: true,
    default: 0
  },
  totalOverdueAmount: {
    type: Number,
    required: true,
    default: 0
  },
  billingStatus: {
    type: String,
    enum: ['draft', 'sent', 'partial_paid', 'fully_paid', 'overdue'],
    default: 'draft'
  },
  billingDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentDeadline: {
    type: Date,
    required: true
  },
  memberBills: [memberBillingSchema],
  // Billing breakdown by membership type
  billingBreakdown: {
    basic: {
      count: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 }
    },
    premium: {
      count: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 }
    },
    vip: {
      count: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 }
    },
    personal_training: {
      count: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 }
    }
  },
  // Payment history for this billing cycle
  paymentHistory: [{
    paymentDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'online'],
      required: true
    },
    transactionId: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: ''
    },
  }],
  // Reminder settings
  reminders: {
    sent: {
      type: Boolean,
      default: false
    },
    sentDate: {
      type: Date,
      default: null
    },
    reminderCount: {
      type: Number,
      default: 0
    }
  },
  // Notes and comments
  notes: {
    type: String,
    default: ''
  },
  // Auto-generated billing ID
  billingId: {
    type: String,
    unique: true,
    required: false // Will be set by pre-save hook
  },
  // Flag to distinguish between current month (real-time) and finalized historical billing
  isFinalized: {
    type: Boolean,
    default: false
  },
  // Date when this billing was finalized (stored as historical record)
  finalizedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
gymBillingSchema.index({ gymId: 1, billingYear: 1, billingMonth: 1 });
gymBillingSchema.index({ billingStatus: 1 });
gymBillingSchema.index({ dueDate: 1 });
gymBillingSchema.index({ billingId: 1 });

// Pre-save middleware to generate billing ID
gymBillingSchema.pre('save', function(next) {
  if (!this.billingId) {
    const year = this.billingYear;
    const month = this.billingMonth.toString().padStart(2, '0');
    const gymCode = this.gymName ? this.gymName.substring(0, 3).toUpperCase() : 'GYM';
    this.billingId = `BILL-${gymCode}-${year}${month}-${Date.now().toString().slice(-6)}`;
  }
  next();
});

// Method to calculate totals
gymBillingSchema.methods.calculateTotals = function() {
  let totalBill = 0;
  
  // Reset breakdown
  this.billingBreakdown = {
    basic: { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
    premium: { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
    vip: { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
    personal_training: { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 }
  };
  
  this.memberBills.forEach(bill => {
    totalBill += bill.monthlyFee;
    
    // Update breakdown
    if (this.billingBreakdown[bill.membershipType]) {
      this.billingBreakdown[bill.membershipType].count += 1;
      this.billingBreakdown[bill.membershipType].totalAmount += bill.monthlyFee;
    }
  });
  
  this.totalBillAmount = totalBill;
  this.totalMembers = this.memberBills.length;
  
  // Calculate paid/pending amounts based on gym-level payments
  const totalPaidFromPayments = this.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  this.totalPaidAmount = totalPaidFromPayments;
  this.totalPendingAmount = Math.max(0, totalBill - totalPaidFromPayments);
  this.totalOverdueAmount = 0; // Will be calculated based on payment deadline
  
  // Update billing status based on gym-level payments
  if (totalPaidFromPayments === 0) {
    this.billingStatus = 'sent';
  } else if (totalPaidFromPayments >= totalBill) {
    this.billingStatus = 'fully_paid';
  } else if (totalPaidFromPayments > 0) {
    this.billingStatus = 'partial_paid';
  }
  
  // Check for overdue
  const now = new Date();
  if (now > this.paymentDeadline && this.totalPendingAmount > 0) {
    this.billingStatus = 'overdue';
    this.totalOverdueAmount = this.totalPendingAmount;
  }
  
  return this;
};

// Method to add payment
gymBillingSchema.methods.addPayment = function(paymentData) {
  this.paymentHistory.push({
    paymentDate: paymentData.paymentDate || new Date(),
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod,
    transactionId: paymentData.transactionId,
    description: paymentData.description,
    processedBy: paymentData.processedBy
  });
  
  // Recalculate totals based on gym-level payments
  this.calculateTotals();
  return this;
};

// Method to get billing summary
gymBillingSchema.methods.getBillingSummary = function() {
  return {
    billingId: this.billingId,
    gymName: this.gymName,
    billingMonth: this.billingMonth,
    billingYear: this.billingYear,
    totalMembers: this.totalMembers,
    totalBillAmount: this.totalBillAmount,
    totalPaidAmount: this.totalPaidAmount,
    totalPendingAmount: this.totalPendingAmount,
    totalOverdueAmount: this.totalOverdueAmount,
    billingStatus: this.billingStatus,
    dueDate: this.dueDate,
    paymentDeadline: this.paymentDeadline,
    billingBreakdown: this.billingBreakdown,
    paymentHistory: this.paymentHistory,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to get gym billing for a specific month
gymBillingSchema.statics.getGymBillingForMonth = function(gymId, year, month) {
  return this.findOne({
    gymId: gymId,
    billingYear: year,
    billingMonth: month
  });
};

// Static method to get all gyms with pending bills
gymBillingSchema.statics.getPendingBills = function() {
  return this.find({
    billingStatus: { $in: ['sent', 'partial_paid', 'overdue'] }
  }).populate('gymId', 'name gymCode');
};

// Static method to get overdue bills
gymBillingSchema.statics.getOverdueBills = function() {
  const now = new Date();
  return this.find({
    billingStatus: { $in: ['sent', 'partial_paid'] },
    paymentDeadline: { $lt: now }
  }).populate('gymId', 'name gymCode');
};

// Static method to finalize billing for a specific month (mark as historical)
gymBillingSchema.statics.finalizeBillingForMonth = function(gymId, year, month) {
  return this.findOneAndUpdate(
    { 
      gymId: gymId, 
      billingYear: year, 
      billingMonth: month,
      isFinalized: false 
    },
    { 
      isFinalized: true, 
      finalizedAt: new Date() 
    },
    { new: true }
  );
};

// Static method to get finalized (historical) billing
gymBillingSchema.statics.getFinalizedBillingForMonth = function(gymId, year, month) {
  return this.findOne({
    gymId: gymId,
    billingYear: year,
    billingMonth: month,
    isFinalized: true
  });
};

const GymBilling = mongoose.model('GymBilling', gymBillingSchema);

module.exports = GymBilling;
