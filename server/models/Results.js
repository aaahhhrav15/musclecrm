const mongoose = require('mongoose');

const resultsSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  imageBase64: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1000 // Reasonable weight limit
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
resultsSchema.index({ gymId: 1, createdAt: -1 });
resultsSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Results', resultsSchema);
