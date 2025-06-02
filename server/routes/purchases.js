
const express = require('express');
const Purchase = require('../models/Purchase');
const auth = require('../middleware/auth');

const router = express.Router();

// Check if user has purchased a specific industry CRM
router.get('/check/:industry', auth, async (req, res) => {
  try {
    const { industry } = req.params;
    const userId = req.user._id;

    const purchase = await Purchase.findOne({ userId, industry });
    
    res.json({
      success: true,
      hasPurchased: !!purchase,
      purchase: purchase || null
    });
  } catch (error) {
    console.error('Purchase check error:', error);
    res.status(500).json({ success: false, message: 'Error checking purchase status' });
  }
});

// Get all user purchases
router.get('/my-purchases', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const purchases = await Purchase.find({ userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      purchases
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ success: false, message: 'Error fetching purchases' });
  }
});

// Create a new purchase
router.post('/create', auth, async (req, res) => {
  try {
    const { industry, amount, stripeSessionId } = req.body;
    const userId = req.user._id;

    // Check if purchase already exists
    const existingPurchase = await Purchase.findOne({ userId, industry });
    if (existingPurchase) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already purchased this CRM' 
      });
    }

    const purchase = new Purchase({
      userId,
      industry,
      amount: amount || 99,
      stripeSessionId,
      paymentStatus: 'completed'
    });

    await purchase.save();

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      purchase
    });
  } catch (error) {
    console.error('Purchase creation error:', error);
    res.status(500).json({ success: false, message: 'Error creating purchase' });
  }
});

module.exports = router;
