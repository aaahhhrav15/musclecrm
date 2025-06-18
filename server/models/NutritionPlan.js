const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  food_name: { type: String, required: true },
  quantity: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true }
});

const mealSchema = new mongoose.Schema({
  meal_type: { type: String, required: true },
  time: { type: String, required: true },
  calories: { type: Number, required: true },
  items: [foodItemSchema]
});

const nutritionPlanSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  plan_name: {
    type: String,
    required: true,
    trim: true
  },
  total_calories: {
    type: Number,
    required: true
  },
  protein_target: {
    type: Number,
    required: true
  },
  carbs_target: {
    type: Number,
    required: true
  },
  fat_target: {
    type: Number,
    required: true
  },
  created_date: {
    type: Date,
    default: Date.now
  },
  meals: [mealSchema],
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
nutritionPlanSchema.index({ gymId: 1 });
nutritionPlanSchema.index({ user_id: 1 });

const NutritionPlan = mongoose.model('NutritionPlan', nutritionPlanSchema);

module.exports = NutritionPlan; 