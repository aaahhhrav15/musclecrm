const mongoose = require('mongoose');

const accountabilitySchema = new mongoose.Schema({
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
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
accountabilitySchema.index({ gymId: 1, createdAt: -1 });
accountabilitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Accountability', accountabilitySchema);
