const mongoose = require('mongoose');

const assignedWorkoutPlanSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  memberName: {
    type: String,
    required: true
  },
  planId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'WorkoutPlan', 
    required: true 
  },
  plan: {
    name: { type: String, required: true },
    goal: { type: String, required: true },
    duration: { type: Number, required: true },
    level: { type: String, required: true },
    weeks: [{
      weekNumber: { type: Number, required: true },
      days: [{
        dayNumber: { type: Number, required: true },
        exercises: [{
          name: { type: String, required: true },
          sets: { type: Number, required: true },
          reps: { type: Number, required: true },
          restTime: { type: Number, required: true },
          notes: { type: String }
        }]
      }]
    }]
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  notes: { 
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
  }, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
assignedWorkoutPlanSchema.index({ customerId: 1, planId: 1 });
assignedWorkoutPlanSchema.index({ gymId: 1 });

const AssignedWorkoutPlan = mongoose.model('AssignedWorkoutPlan', assignedWorkoutPlanSchema);

module.exports = AssignedWorkoutPlan; 