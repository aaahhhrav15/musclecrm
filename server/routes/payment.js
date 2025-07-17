const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();
const Gym = require('../models/Gym');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  console.log('Received create-order request:', req.body);
  try {
    const { planType, currency = 'INR', receipt, notes } = req.body;
    // Fetch price from MongoDB
    let duration = planType && planType.toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
    const plan = await SubscriptionPlan.findOne({ duration });
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Subscription plan not found' });
    }
    const amount = plan.price;
    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };
    console.log('Razorpay order options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
  }
});

// Verify payment
router.post('/verify', async (req, res) => {
  console.log('Received verify request:', req.body);
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');
    if (generated_signature === razorpay_signature) {
      // Payment is verified
      // Update gym subscription dates
      const gymId = req.gym?._id;
      if (!gymId) {
        return res.status(400).json({ success: false, message: 'Gym ID not found in request' });
      }
      // Fetch gym and check if subscription is still active
      const gym = await Gym.findById(gymId);
      if (gym && gym.subscriptionEndDate && new Date(gym.subscriptionEndDate) >= new Date()) {
        return res.status(400).json({ success: false, message: 'Subscription is still active. Renewal is only allowed after expiry.' });
      }
      const now = new Date();
      let endDate;
      if (planType === 'Yearly') {
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1); // End date is 1 year minus 1 day
      } else {
        // Default to monthly
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1); // End date is 1 month minus 1 day
      }
      await Gym.findByIdAndUpdate(gymId, {
        subscriptionStartDate: now,
        subscriptionEndDate: endDate,
        subscriptionDuration: planType === 'Yearly' ? '1 year' : '1 month'
      });
      return res.json({ success: true, message: 'Payment verified and subscription updated successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Razorpay payment verification error:', error);
    res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
  }
});

module.exports = router; 