const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const adminAuth = require('../middleware/adminAuth');

// Master CRM routes (Admin only)
router.get('/master/all', adminAuth, subscriptionController.getAllSubscriptions);
router.get('/master/analytics', adminAuth, subscriptionController.getSubscriptionAnalytics);

// Gym-specific subscription routes
router.get('/', gymAuth, subscriptionController.getSubscriptionByGym);
router.post('/', gymAuth, subscriptionController.createSubscription);
router.put('/', gymAuth, subscriptionController.updateSubscription);
router.delete('/', gymAuth, subscriptionController.deleteSubscription);

// App access management
router.put('/app-access', gymAuth, subscriptionController.updateAppAccess);

// Subscription lifecycle
router.post('/renew', gymAuth, subscriptionController.renewSubscription);
router.post('/cancel', gymAuth, subscriptionController.cancelSubscription);

// History and analytics
router.get('/history', gymAuth, subscriptionController.getSubscriptionHistory);
router.get('/payment-history', gymAuth, subscriptionController.getPaymentHistory);

// Payment management
router.post('/payment', gymAuth, subscriptionController.addPaymentRecord);

// Admin sync route
router.post('/master/sync', adminAuth, subscriptionController.syncAllSubscriptions);

// User subscription management
router.get('/users', gymAuth, subscriptionController.getUserSubscriptions);
router.post('/users/:userId/renew', gymAuth, subscriptionController.renewUserSubscription);
router.get('/users/expiring', gymAuth, subscriptionController.getExpiringUserSubscriptions);

// Detailed analytics
router.get('/analytics/detailed', adminAuth, subscriptionController.getDetailedAnalytics);

// Monthly billing
router.get('/billing/current-month', gymAuth, subscriptionController.getCurrentMonthBilling);
router.get('/billing/:year/:month', gymAuth, subscriptionController.getMonthlyBilling);
router.get('/billing/history', gymAuth, subscriptionController.getMonthlyBillingHistory);

// Master monthly billing (Admin only)
router.get('/master/billing/current-month', adminAuth, subscriptionController.getMasterMonthlyBilling);

module.exports = router;
