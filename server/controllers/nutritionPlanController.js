const NutritionPlan = require('../models/NutritionPlan');

// Get all nutrition plans
exports.getAllNutritionPlans = async (req, res) => {
  try {
    const nutritionPlans = await NutritionPlan.find();
    res.json(nutritionPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new nutrition plan
exports.createNutritionPlan = async (req, res) => {
  try {
    const nutritionPlan = new NutritionPlan(req.body);
    const savedPlan = await nutritionPlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors || 'Validation failed'
    });
  }
};

// Update a nutrition plan
exports.updateNutritionPlan = async (req, res) => {
  try {
    const nutritionPlan = await NutritionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!nutritionPlan) {
      return res.status(404).json({ message: 'Nutrition plan not found' });
    }
    res.json(nutritionPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a nutrition plan
exports.deleteNutritionPlan = async (req, res) => {
  try {
    const nutritionPlan = await NutritionPlan.findByIdAndDelete(req.params.id);
    if (!nutritionPlan) {
      return res.status(404).json({ message: 'Nutrition plan not found' });
    }
    res.json({ message: 'Nutrition plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single nutrition plan
exports.getNutritionPlan = async (req, res) => {
  try {
    const nutritionPlan = await NutritionPlan.findById(req.params.id);
    if (!nutritionPlan) {
      return res.status(404).json({ message: 'Nutrition plan not found' });
    }
    res.json(nutritionPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 