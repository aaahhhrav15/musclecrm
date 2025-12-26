const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { gymAuth } = require('../middleware/gymAuth');
const gymBillingController = require('../controllers/gymBillingController');

// Admin-only routes
router.get('/gym/:gymId/month/:year/:month', adminAuth, gymBillingController.getGymBillingForMonth);
router.get('/gym/:gymId/all', adminAuth, gymBillingController.getGymAllBilling);
router.get('/details/:billingId', adminAuth, gymBillingController.getBillingDetails);
router.get('/statistics/:gymId', adminAuth, gymBillingController.getBillingStatistics);
router.get('/pending', adminAuth, gymBillingController.getPendingBills);
router.get('/master/current-month', adminAuth, gymBillingController.getMasterMonthlyBilling);
router.post('/finalize-previous-month', adminAuth, gymBillingController.finalizePreviousMonthBilling);
router.post('/backfill/:year/:month', adminAuth, gymBillingController.backfillBillingForMonthController);
router.post('/create', adminAuth, gymBillingController.createMonthlyBilling);

// Gym-specific routes (for gym users)
router.get('/current-month', gymAuth, gymBillingController.getCurrentMonthBilling);
router.get('/month/:year/:month', gymAuth, gymBillingController.getMonthlyBilling);
router.get('/history', gymAuth, gymBillingController.getBillingHistory);
router.get('/analytics', gymAuth, gymBillingController.getBillingAnalytics);
router.get('/unpaid-summary', gymAuth, gymBillingController.getUnpaidSummaryForGym);

// Payment routes (both admin and gym)
router.post('/:billingId/payment', adminAuth, gymBillingController.addPayment);
router.post('/payment', gymAuth, gymBillingController.addGymPayment);
// Razorpay order + verify (split endpoints for admin vs gym to avoid 401 collisions)
router.post('/admin/:billingId/razorpay/create-order', adminAuth, gymBillingController.createRazorpayOrderForBilling);
router.post('/admin/:billingId/razorpay/verify', adminAuth, gymBillingController.verifyRazorpayPaymentForBilling);

router.post('/gym/:billingId/razorpay/create-order', gymAuth, gymBillingController.createRazorpayOrderForBilling);
router.post('/gym/:billingId/razorpay/verify', gymAuth, gymBillingController.verifyRazorpayPaymentForBilling);

// Update billing status
router.put('/:billingId/status', adminAuth, gymBillingController.updateBillingStatus);

module.exports = router;
