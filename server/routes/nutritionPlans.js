const express = require('express');
const router = express.Router();
const NutritionPlan = require('../models/NutritionPlan');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const nutritionPlanController = require('../controllers/nutritionPlanController');

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

// Generate nutrition plan using Gemini
router.post('/gemini', nutritionPlanController.generateNutritionPlan);

// Create a new nutrition plan
router.post('/', nutritionPlanController.createNutritionPlan);

// Get a specific nutrition plan
router.get('/:id', nutritionPlanController.getNutritionPlan);

// Update a nutrition plan
router.put('/:id', nutritionPlanController.updateNutritionPlan);

// Delete a nutrition plan
router.delete('/:id', nutritionPlanController.deleteNutritionPlan);

module.exports = router; 