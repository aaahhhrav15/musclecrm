const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, required: true, min: 1 },
  reps: { type: Number, required: true, min: 1 },
  restTime: { type: Number, required: true, min: 0 },
  notes: String,
});

const daySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  exercises: [exerciseSchema],
});

const weekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  days: [daySchema],
});

const workoutPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  goal: { type: String, required: true },
  duration: { type: Number, required: true, min: 1 },
  level: { type: String, required: true, enum: ['beginner', 'intermediate', 'advanced'] },
  weeks: [weekSchema],
}, { timestamps: true });

// Add indexes for better query performance
workoutPlanSchema.index({ gymId: 1 });

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);

module.exports = WorkoutPlan; 