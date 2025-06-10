const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  time: { type: String, required: true },
  foods: [{
    name: { type: String, required: true },
    quantity: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true }
  }]
});

const nutritionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  features: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  goal: { type: String, required: true },
  targetCalories: { type: Number, required: true },
  targetProtein: { type: Number, required: true },
  targetCarbs: { type: Number, required: true },
  targetFats: { type: Number, required: true },
  meals: [mealSchema],
  notes: String
}, {
  timestamps: true
});

// Add indexes for better query performance
nutritionPlanSchema.index({ gymId: 1 });

const NutritionPlan = mongoose.model('NutritionPlan', nutritionPlanSchema);

module.exports = NutritionPlan; 