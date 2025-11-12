const Subscription = require('../models/Subscription');
const Gym = require('../models/Gym');
const Customer = require('../models/Customer');

// Get all subscriptions (Master CRM view)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('gymId', 'name owner email phone')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, message: 'Error fetching subscriptions' });
  }
};

// Get subscription by gym ID
exports.getSubscriptionByGym = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ gymId: req.gymId })
      .populate('gymId', 'name owner email phone');
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found for this gym' });
    }
    
    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, message: 'Error fetching subscription' });
  }
};

// Create new subscription
exports.createSubscription = async (req, res) => {
  try {
    const {
      planType,
      planName,
      amount,
      startDate,
      endDate,
      paymentMethod,
      transactionId,
      notes
    } = req.body;

    // Get gym details
    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ gymId: req.gymId });
    if (existingSubscription) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription already exists for this gym. Use update instead.' 
      });
    }

    // Create subscription
    const subscription = new Subscription({
      gymId: req.gymId,
      gymName: gym.name,
      gymOwner: gym.owner,
      gymEmail: gym.email,
      gymPhone: gym.phone,
      crmSubscription: {
        planType,
        planName,
        amount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'active',
        paymentStatus: 'paid',
        paymentMethod,
        transactionId
      },
      notes
    });

    // Add to history
    subscription.addToHistory();
    subscription.addPaymentToHistory({
      amount,
      paymentType: 'crm_subscription',
      paymentStatus: 'paid',
      paymentDate: new Date(),
      transactionId,
      description: `CRM subscription payment - ${planName}`
    });

    const savedSubscription = await subscription.save();
    
    res.status(201).json({ success: true, subscription: savedSubscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(400).json({ 
      success: false,
      message: error.message,
      details: error.errors || 'Validation failed'
    });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  try {
    const {
      planType,
      planName,
      amount,
      startDate,
      endDate,
      paymentMethod,
      transactionId,
      notes,
      appAccess
    } = req.body;

    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Update CRM subscription details
    if (planType || planName || amount || startDate || endDate) {
      subscription.crmSubscription = {
        ...subscription.crmSubscription,
        ...(planType && { planType }),
        ...(planName && { planName }),
        ...(amount && { amount }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(paymentMethod && { paymentMethod }),
        ...(transactionId && { transactionId })
      };
    }

    // Update app access
    if (appAccess) {
      subscription.appAccess = {
        ...subscription.appAccess,
        ...appAccess
      };
      subscription.updateAppAccessCost();
    }

    if (notes) {
      subscription.notes = notes;
    }

    const updatedSubscription = await subscription.save();
    
    res.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(400).json({ 
      success: false,
      message: error.message
    });
  }
};

// Update app access (when users are registered)
exports.updateAppAccess = async (req, res) => {
  try {
    const { registeredUsers } = req.body;

    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Update registered users count
    subscription.appAccess.registeredUsers = registeredUsers;
    subscription.appAccess.enabled = registeredUsers > 0;
    subscription.updateAppAccessCost();

    // Add payment to history if there's a cost increase
    const previousCost = subscription.paymentHistory
      .filter(p => p.paymentType === 'app_access')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const newCost = subscription.appAccess.totalAppCost;
    if (newCost > previousCost) {
      subscription.addPaymentToHistory({
        amount: newCost - previousCost,
        paymentType: 'app_access',
        paymentStatus: 'paid',
        paymentDate: new Date(),
        transactionId: `APP_${Date.now()}`,
        description: `App access cost for ${registeredUsers} users`
      });
    }

    const updatedSubscription = await subscription.save();
    
    res.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating app access:', error);
    res.status(400).json({ 
      success: false,
      message: error.message
    });
  }
};

// Renew subscription
exports.renewSubscription = async (req, res) => {
  try {
    const {
      planType,
      planName,
      amount,
      startDate,
      endDate,
      paymentMethod,
      transactionId
    } = req.body;

    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Add current subscription to history
    subscription.addToHistory();

    // Update with new subscription details
    subscription.crmSubscription = {
      planType,
      planName,
      amount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'active',
      paymentStatus: 'paid',
      paymentMethod,
      transactionId
    };

    // Add renewal payment to history
    subscription.addPaymentToHistory({
      amount,
      paymentType: 'renewal',
      paymentStatus: 'paid',
      paymentDate: new Date(),
      transactionId,
      description: `Subscription renewal - ${planName}`
    });

    const updatedSubscription = await subscription.save();
    
    res.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(400).json({ 
      success: false,
      message: error.message
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    subscription.crmSubscription.status = 'cancelled';
    subscription.appAccess.enabled = false;
    
    const updatedSubscription = await subscription.save();
    
    res.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(400).json({ 
      success: false,
      message: error.message
    });
  }
};

// Get subscription analytics
exports.getSubscriptionAnalytics = async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    
    const analytics = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.isActive).length,
      expiredSubscriptions: subscriptions.filter(s => s.crmSubscription.status === 'expired').length,
      cancelledSubscriptions: subscriptions.filter(s => s.crmSubscription.status === 'cancelled').length,
      totalRevenue: subscriptions.reduce((sum, s) => sum + (s.totalCost || 0), 0),
      monthlyRevenue: subscriptions
        .filter(s => s.crmSubscription.planType === 'monthly')
        .reduce((sum, s) => sum + (s.crmSubscription.amount || 0), 0),
      yearlyRevenue: subscriptions
        .filter(s => s.crmSubscription.planType === 'yearly')
        .reduce((sum, s) => sum + (s.crmSubscription.amount || 0), 0),
      appAccessRevenue: subscriptions.reduce((sum, s) => sum + (s.appAccess.totalAppCost || 0), 0),
      totalRegisteredUsers: subscriptions.reduce((sum, s) => sum + (s.appAccess.registeredUsers || 0), 0),
      expiringSoon: subscriptions.filter(s => s.daysUntilExpiry <= 30 && s.daysUntilExpiry > 0).length
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
};

// Get subscription history
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ 
      success: true, 
      subscriptionHistory: subscription.subscriptionHistory,
      paymentHistory: subscription.paymentHistory
    });
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    res.status(500).json({ success: false, message: 'Error fetching history' });
  }
};

// Delete subscription
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndDelete({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    
    res.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ success: false, message: 'Error deleting subscription' });
  }
};

// Sync all subscriptions with current customer counts
exports.syncAllSubscriptions = async (req, res) => {
  try {
    const { syncAllSubscriptions } = require('../middleware/subscriptionUpdate');
    await syncAllSubscriptions();
    
    res.json({ success: true, message: 'All subscriptions synced successfully' });
  } catch (error) {
    console.error('Error syncing subscriptions:', error);
    res.status(500).json({ success: false, message: 'Error syncing subscriptions' });
  }
};

// Get payment history for a specific subscription
exports.getPaymentHistory = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ 
      success: true, 
      paymentHistory: subscription.paymentHistory,
      subscriptionHistory: subscription.subscriptionHistory
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment history' });
  }
};

// Add manual payment record
exports.addPaymentRecord = async (req, res) => {
  try {
    const { amount, paymentType, paymentStatus, transactionId, description } = req.body;
    
    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const paymentData = {
      amount: Number(amount),
      paymentType: paymentType || 'other',
      paymentStatus: paymentStatus || 'paid',
      paymentDate: new Date(),
      transactionId: transactionId || `MANUAL_${Date.now()}`,
      description: description || 'Manual payment record'
    };

    subscription.addPaymentToHistory(paymentData);
    subscription.calculateTotalCost();
    
    const updatedSubscription = await subscription.save();
    
    res.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error('Error adding payment record:', error);
    res.status(400).json({ 
      success: false,
      message: error.message
    });
  }
};

// Get user subscriptions for a gym
exports.getUserSubscriptions = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ 
      success: true, 
      userSubscriptions: subscription.appAccess.userSubscriptions,
      totalAppCost: subscription.appAccess.totalAppCost,
      activeUsers: subscription.appAccess.registeredUsers
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({ success: false, message: 'Error fetching user subscriptions' });
  }
};

// Renew a user subscription
exports.renewUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    subscription.renewUserSubscription(userId);
    await subscription.save();

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error renewing user subscription:', error);
    res.status(500).json({ success: false, message: 'Error renewing user subscription' });
  }
};

// Get expiring user subscriptions
exports.getExpiringUserSubscriptions = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ gymId: req.gymId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const expiringUsers = subscription.getExpiringUserSubscriptions();

    res.json({ success: true, expiringUsers });
  } catch (error) {
    console.error('Error fetching expiring user subscriptions:', error);
    res.status(500).json({ success: false, message: 'Error fetching expiring user subscriptions' });
  }
};

// Get detailed subscription analytics
exports.getDetailedAnalytics = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('gymId', 'name owner email phone');

    let analytics = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: 0,
      totalRevenue: 0,
      totalUsers: 0,
      activeUsers: 0,
      expiringUsers: 0,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      appAccessRevenue: 0,
      expiringSoon: 0
    };

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    subscriptions.forEach(subscription => {
      // CRM subscription analytics
      if (subscription.crmSubscription.status === 'active' && 
          new Date(subscription.crmSubscription.endDate) > now) {
        analytics.activeSubscriptions++;
        analytics.totalRevenue += subscription.crmSubscription.amount;
        
        if (subscription.crmSubscription.planType === 'monthly') {
          analytics.monthlyRevenue += subscription.crmSubscription.amount;
        } else {
          analytics.yearlyRevenue += subscription.crmSubscription.amount;
        }
        
        // Check if expiring soon
        if (new Date(subscription.crmSubscription.endDate) <= thirtyDaysFromNow) {
          analytics.expiringSoon++;
        }
      }

      // App access analytics
      analytics.appAccessRevenue += subscription.appAccess.totalAppCost;
      analytics.totalUsers += subscription.appAccess.userSubscriptions.length;
      
      subscription.appAccess.userSubscriptions.forEach(userSub => {
        if (userSub.status === 'active' && new Date(userSub.endDate) > now) {
          analytics.activeUsers++;
        }
        
        if (userSub.status === 'active' && 
            new Date(userSub.endDate) <= thirtyDaysFromNow &&
            new Date(userSub.endDate) > now) {
          analytics.expiringUsers++;
        }
      });
    });

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching detailed analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching detailed analytics' });
  }
};

// Get monthly billing for a specific month
exports.getMonthlyBilling = async (req, res) => {
  try {
    const { year, month } = req.params;
    const subscription = await Subscription.findOne({ gymId: req.gymId });
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const monthlyBilling = subscription.calculateMonthlyBilling(parseInt(year), parseInt(month));

    res.json({ success: true, monthlyBilling });
  } catch (error) {
    console.error('Error fetching monthly billing:', error);
    res.status(500).json({ success: false, message: 'Error fetching monthly billing' });
  }
};

// Get current month billing
exports.getCurrentMonthBilling = async (req, res) => {
  try {
    const gymBillingController = require('./gymBillingController');
    return await gymBillingController.getCurrentMonthBilling(req, res);
  } catch (error) {
    console.error('Error fetching current month billing:', error);
    res.status(500).json({ success: false, message: 'Error fetching current month billing' });
  }
};

// Get master monthly billing for all gyms (Admin only)
exports.getMasterMonthlyBilling = async (req, res) => {
  try {
    const gymBillingController = require('./gymBillingController');
    return await gymBillingController.getMasterMonthlyBilling(req, res);
  } catch (error) {
    console.error('Error fetching master monthly billing:', error);
    res.status(500).json({ success: false, message: 'Error fetching master monthly billing' });
  }
};

// Get monthly billing history for a specific gym
exports.getMonthlyBillingHistory = async (req, res) => {
  try {
    const gymBillingController = require('./gymBillingController');
    return await gymBillingController.getBillingHistory(req, res);
  } catch (error) {
    console.error('Error fetching monthly billing history:', error);
    res.status(500).json({ success: false, message: 'Error fetching monthly billing history' });
  }
};
