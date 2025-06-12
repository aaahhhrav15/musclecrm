const mongoose = require('mongoose');

const healthAssessmentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  memberName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Basic Information
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  height: {
    type: Number, // in cm
    required: true
  },
  weight: {
    type: Number, // in kg
    required: true
  },
  // Health Metrics
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  heartRate: Number,
  bodyFatPercentage: Number,
  bmi: Number,
  // Medical History
  medicalConditions: [{
    condition: String,
    diagnosed: Boolean,
    medications: [String]
  }],
  allergies: [String],
  // Lifestyle
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
    required: true
  },
  smokingStatus: {
    type: String,
    enum: ['never', 'former', 'current'],
    required: true
  },
  alcoholConsumption: {
    type: String,
    enum: ['none', 'occasional', 'moderate', 'heavy'],
    required: true
  },
  // Fitness Goals
  goals: [{
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness', 'health_improvement']
  }],
  // Physical Assessment
  flexibility: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent']
  },
  strength: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent']
  },
  endurance: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent']
  },
  // Notes and Recommendations
  notes: String,
  recommendations: [String],
  // Assessment Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'pending'
  },
  // Gym Reference
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
healthAssessmentSchema.index({ memberId: 1, date: -1 });
healthAssessmentSchema.index({ gymId: 1 });

const HealthAssessment = mongoose.model('HealthAssessment', healthAssessmentSchema);

module.exports = HealthAssessment; 