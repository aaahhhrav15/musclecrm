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
router.get('/', nutritionPlanController.getAllNutritionPlans);

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