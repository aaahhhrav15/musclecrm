const mongoose = require('mongoose');

const assignedWorkoutPlanSchema = new mongoose.Schema({
  memberId: { 
    type: String, 
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

// Add index for better query performance
assignedWorkoutPlanSchema.index({ memberId: 1, planId: 1 });
assignedWorkoutPlanSchema.index({ startDate: -1 });

const AssignedWorkoutPlan = mongoose.model('AssignedWorkoutPlan', assignedWorkoutPlanSchema);

module.exports = AssignedWorkoutPlan; 