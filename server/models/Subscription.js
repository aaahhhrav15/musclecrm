const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  gymName: {
    type: String,
    required: true
  },
  gymOwner: {
    type: String,
    required: true
  },
  gymEmail: {
    type: String,
    required: true
  },
  gymPhone: {
    type: String,
    required: true
  },
  // CRM Subscription Details
  crmSubscription: {
    planType: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true
    },
    planName: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active'
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'bank_transfer', 'cash', 'other'],
      default: 'razorpay'
    },
    transactionId: {
      type: String,
      default: ''
    }
  },
  // App Access Details
  appAccess: {
    enabled: {
      type: Boolean,
      default: false
    },
    registeredUsers: {
      type: Number,
      default: 0
    },
    costPerUserPerMonth: {
      type: Number,
      default: 41.67 // ₹500/12 = ₹41.67 per month
    },
    totalAppCost: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    // Individual user subscriptions (monthly billing)
    userSubscriptions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
      },
      userName: {
        type: String,
        required: true
      },
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
      },
      monthlyAmount: {
        type: Number,
        default: 41.67 // ₹500/12 per month
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // Total Cost Calculation
  totalCost: {
    type: Number,
    default: 0
  },
  // Subscription History
  subscriptionHistory: [{
    planType: String,
    planName: String,
    amount: Number,
    startDate: Date,
    endDate: Date,
    status: String,
    paymentStatus: String,
    paymentDate: Date,
    transactionId: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Payment History
  paymentHistory: [{
    amount: Number,
    paymentType: {
      type: String,
      enum: ['crm_subscription', 'app_access', 'renewal', 'upgrade', 'other']
    },
    paymentStatus: String,
    paymentDate: Date,
    transactionId: String,
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Notes and Comments
  notes: {
    type: String,
    default: ''
  },
  // Auto-renewal settings
  autoRenewal: {
    enabled: {
      type: Boolean,
      default: false
    },
    nextRenewalDate: Date,
    reminderSent: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
subscriptionSchema.index({ gymId: 1 });
subscriptionSchema.index({ 'crmSubscription.status': 1 });
subscriptionSchema.index({ 'crmSubscription.endDate': 1 });
subscriptionSchema.index({ createdAt: -1 });

// Virtual for calculating days until expiry
subscriptionSchema.virtual('daysUntilExpiry').get(function() {
  if (this.crmSubscription.status === 'active') {
    const now = new Date();
    const endDate = new Date(this.crmSubscription.endDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
  return 0;
});

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.crmSubscription.status === 'active' && 
         new Date(this.crmSubscription.endDate) > now;
});

// Method to calculate total cost
subscriptionSchema.methods.calculateTotalCost = function() {
  const crmCost = this.crmSubscription.amount || 0;
  const appCost = this.appAccess.totalAppCost || 0;
  this.totalCost = crmCost + appCost;
  return this.totalCost;
};

// Method to update app access cost based on active user subscriptions (monthly billing)
subscriptionSchema.methods.updateAppAccessCost = function() {
  const now = new Date();
  let totalCost = 0;
  let activeUsers = 0;
  
  // Calculate cost for each active user subscription
  this.appAccess.userSubscriptions.forEach(userSub => {
    if (userSub.status === 'active' && 
        new Date(userSub.endDate) > now && 
        new Date(userSub.startDate) <= now) {
      
      // Calculate monthly cost based on days in current month
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // Calculate days user was active in current month
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);
      
      const userStartInMonth = new Date(Math.max(userSub.startDate, monthStart));
      const userEndInMonth = new Date(Math.min(userSub.endDate, monthEnd));
      
      const daysActive = Math.max(0, Math.ceil((userEndInMonth - userStartInMonth) / (1000 * 60 * 60 * 24)) + 1);
      
      // Pro-rated monthly cost
      const monthlyCost = (userSub.monthlyAmount * daysActive) / daysInMonth;
      totalCost += monthlyCost;
      activeUsers++;
    }
  });
  
  this.appAccess.totalAppCost = Math.round(totalCost * 100) / 100; // Round to 2 decimal places
  this.appAccess.registeredUsers = activeUsers;
  this.calculateTotalCost();
  this.appAccess.lastUpdated = new Date();
  return this;
};

// Method to add subscription to history
subscriptionSchema.methods.addToHistory = function() {
  this.subscriptionHistory.push({
    planType: this.crmSubscription.planType,
    planName: this.crmSubscription.planName,
    amount: this.crmSubscription.amount,
    startDate: this.crmSubscription.startDate,
    endDate: this.crmSubscription.endDate,
    status: this.crmSubscription.status,
    paymentStatus: this.crmSubscription.paymentStatus,
    paymentDate: new Date(),
    transactionId: this.crmSubscription.transactionId
  });
};

// Method to add payment to history
subscriptionSchema.methods.addPaymentToHistory = function(paymentData) {
  this.paymentHistory.push({
    amount: paymentData.amount,
    paymentType: paymentData.paymentType,
    paymentStatus: paymentData.paymentStatus,
    paymentDate: paymentData.paymentDate || new Date(),
    transactionId: paymentData.transactionId,
    description: paymentData.description
  });
};

// Method to add a new user subscription (monthly billing)
subscriptionSchema.methods.addUserSubscription = function(userId, userName) {
  const now = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now
  
  const userSubscription = {
    userId: userId,
    userName: userName,
    startDate: now,
    endDate: endDate,
    status: 'active',
    monthlyAmount: 41.67, // ₹500/12 = ₹41.67 per month
    createdAt: now
  };
  
  this.appAccess.userSubscriptions.push(userSubscription);
  this.updateAppAccessCost();
  return this;
};

// Method to remove a user subscription
subscriptionSchema.methods.removeUserSubscription = function(userId) {
  const userSub = this.appAccess.userSubscriptions.find(sub => 
    sub.userId.toString() === userId.toString()
  );
  
  if (userSub) {
    userSub.status = 'cancelled';
    this.updateAppAccessCost();
  }
  
  return this;
};

// Method to renew a user subscription
subscriptionSchema.methods.renewUserSubscription = function(userId) {
  const userSub = this.appAccess.userSubscriptions.find(sub => 
    sub.userId.toString() === userId.toString()
  );
  
  if (userSub) {
    const now = new Date();
    const newEndDate = new Date();
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    
    userSub.startDate = now;
    userSub.endDate = newEndDate;
    userSub.status = 'active';
    userSub.monthlyAmount = 41.67; // ₹500/12 = ₹41.67 per month
    
    this.updateAppAccessCost();
  }
  
  return this;
};

// Method to get expiring user subscriptions (within 30 days)
subscriptionSchema.methods.getExpiringUserSubscriptions = function() {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return this.appAccess.userSubscriptions.filter(userSub => 
    userSub.status === 'active' && 
    new Date(userSub.endDate) <= thirtyDaysFromNow &&
    new Date(userSub.endDate) > now
  );
};

// Method to calculate monthly billing for a specific month
subscriptionSchema.methods.calculateMonthlyBilling = function(year, month) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const daysInMonth = monthEnd.getDate();
  
  let totalCost = 0;
  let activeUsers = [];
  
  this.appAccess.userSubscriptions.forEach(userSub => {
    if (userSub.status === 'active') {
      // Calculate days user was active in this month
      const userStartInMonth = new Date(Math.max(userSub.startDate, monthStart));
      const userEndInMonth = new Date(Math.min(userSub.endDate, monthEnd));
      
      const daysActive = Math.max(0, Math.ceil((userEndInMonth - userStartInMonth) / (1000 * 60 * 60 * 24)) + 1);
      
      if (daysActive > 0) {
        // Pro-rated monthly cost
        const monthlyCost = (userSub.monthlyAmount * daysActive) / daysInMonth;
        totalCost += monthlyCost;
        
        activeUsers.push({
          userId: userSub.userId,
          userName: userSub.userName,
          daysActive: daysActive,
          monthlyCost: Math.round(monthlyCost * 100) / 100,
          startDate: userSub.startDate,
          endDate: userSub.endDate
        });
      }
    }
  });
  
  return {
    month: month,
    year: year,
    totalCost: Math.round(totalCost * 100) / 100,
    daysInMonth: daysInMonth,
    activeUsers: activeUsers,
    userCount: activeUsers.length
  };
};

// Pre-save middleware to calculate costs
subscriptionSchema.pre('save', function(next) {
  this.calculateTotalCost();
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
