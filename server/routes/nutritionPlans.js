const express = require('express');
const router = express.Router();
const NutritionPlan = require('../models/NutritionPlan');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');

// Apply both auth and gymAuth middleware to all routes
router.use(auth);
router.use(gymAuth);

// Get all nutrition plans for the gym
router.get('/', async (req, res) => {
  try {
    const nutritionPlans = await NutritionPlan.find({ gymId: req.gymId })
      .sort({ createdAt: -1 });
    res.json({ success: true, nutritionPlans });
  } catch (error) {
    console.error('Error fetching nutrition plans:', error);
    res.status(500).json({ success: false, message: 'Error fetching nutrition plans' });
  }
});

// Create a new nutrition plan
router.post('/', async (req, res) => {
  try {
    const nutritionPlan = new NutritionPlan({
      ...req.body,
      gymId: req.gymId
    });
    await nutritionPlan.save();
    res.status(201).json({ success: true, nutritionPlan });
  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    res.status(500).json({ success: false, message: 'Error creating nutrition plan' });
  }
});

// Get a specific nutrition plan
router.get('/:id', async (req, res) => {
  try {
    const nutritionPlan = await NutritionPlan.findOne({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!nutritionPlan) {
      return res.status(404).json({ success: false, message: 'Nutrition plan not found' });
    }
    
    res.json({ success: true, nutritionPlan });
  } catch (error) {
    console.error('Error fetching nutrition plan:', error);
    res.status(500).json({ success: false, message: 'Error fetching nutrition plan' });
  }
});

// Update a nutrition plan
router.put('/:id', async (req, res) => {
  try {
    const nutritionPlan = await NutritionPlan.findOneAndUpdate(
      { _id: req.params.id, gymId: req.gymId },
      req.body,
      { new: true }
    );
    
    if (!nutritionPlan) {
      return res.status(404).json({ success: false, message: 'Nutrition plan not found' });
    }
    
    res.json({ success: true, nutritionPlan });
  } catch (error) {
    console.error('Error updating nutrition plan:', error);
    res.status(500).json({ success: false, message: 'Error updating nutrition plan' });
  }
});

// Delete a nutrition plan
router.delete('/:id', async (req, res) => {
  try {
    const nutritionPlan = await NutritionPlan.findOneAndDelete({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!nutritionPlan) {
      return res.status(404).json({ success: false, message: 'Nutrition plan not found' });
    }
    
    res.json({ success: true, message: 'Nutrition plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting nutrition plan:', error);
    res.status(500).json({ success: false, message: 'Error deleting nutrition plan' });
  }
});

module.exports = router; 