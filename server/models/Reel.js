const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  caption: {
    type: String,
    trim: true,
    default: ''
  },
  s3Key: {
    type: String,
    required: true
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

reelSchema.index({ gymId: 1, createdAt: -1 });

module.exports = mongoose.model('Reel', reelSchema);


