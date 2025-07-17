const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Get all plans
router.get('/', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Create a new plan
router.post('/', async (req, res) => {
  try {
    const { name, duration, price } = req.body;
    const plan = new SubscriptionPlan({ name, duration, price });
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create plan' });
  }
});

// Update a plan price
router.put('/:id', async (req, res) => {
  try {
    const { price } = req.body;
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { price }, { new: true });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update plan' });
  }
});

module.exports = router; 