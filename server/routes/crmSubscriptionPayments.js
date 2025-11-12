const express = require('express');
const router = express.Router();
const crmSubscriptionPaymentController = require('../controllers/crmSubscriptionPaymentController');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');

// Create a new CRM subscription payment record
router.post('/', auth, gymAuth, crmSubscriptionPaymentController.createCrmSubscriptionPayment);


// Get all CRM subscription payments for the current gym
router.get('/', auth, gymAuth, crmSubscriptionPaymentController.getCrmSubscriptionPayments);

// Get CRM subscription payment by ID
router.get('/:id', auth, gymAuth, crmSubscriptionPaymentController.getCrmSubscriptionPaymentById);

// Get CRM subscription payment statistics
router.get('/stats/overview', auth, gymAuth, crmSubscriptionPaymentController.getCrmSubscriptionPaymentStats);

// Get current active subscription
router.get('/active/current', auth, gymAuth, crmSubscriptionPaymentController.getCurrentActiveSubscription);

module.exports = router;
