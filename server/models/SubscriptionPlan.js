const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Monthly", "Yearly"
  duration: { type: String, enum: ['monthly', 'yearly'], required: true },
  price: { type: Number, required: true }
});

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema); 