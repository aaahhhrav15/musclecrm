const express = require('express');
const router = express.Router();
const nutritionPlanController = require('../controllers/nutritionPlanController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Get all nutrition plans
router.get('/', nutritionPlanController.getAllNutritionPlans);

// Create a new nutrition plan
router.post('/', nutritionPlanController.createNutritionPlan);

// Get a single nutrition plan
router.get('/:id', nutritionPlanController.getNutritionPlan);

// Update a nutrition plan
router.put('/:id', nutritionPlanController.updateNutritionPlan);

// Delete a nutrition plan
router.delete('/:id', nutritionPlanController.deleteNutritionPlan);

module.exports = router; 