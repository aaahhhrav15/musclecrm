const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const crmSubscriptionPaymentController = require('../controllers/crmSubscriptionPaymentController');

// Get CRM subscription payments across all gyms
router.get('/', adminAuth, crmSubscriptionPaymentController.getAllCrmSubscriptionPaymentsAdmin);

// Get CRM subscription payments for a specific gym
router.get('/gym/:gymId', adminAuth, crmSubscriptionPaymentController.getCrmSubscriptionPaymentsForGymAdmin);

module.exports = router;

