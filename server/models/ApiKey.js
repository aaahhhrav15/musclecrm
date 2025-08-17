const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  keyId: {
    type: String,
    required: true,
    unique: true,
    default: () => `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: false  // Make it optional since it's a universal key
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientEmail: {
    type: String,
    required: true,
    trim: true
  },
  permissions: {
    type: [String],
    enum: ['accountability_create', 'accountability_read', 'accountability_update', 'accountability_delete', 'results_create', 'results_read', 'results_update', 'results_delete'],
    default: ['accountability_create', 'accountability_read', 'accountability_update', 'accountability_delete', 'results_create', 'results_read', 'results_update', 'results_delete']
  },
  rateLimit: {
    requestsPerHour: {
      type: Number,
      default: 100
    },
    requestsPerDay: {
      type: Number,
      default: 1000
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  usageCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from creation
  }
}, {
  timestamps: true
});

// Add indexes
apiKeySchema.index({ apiKey: 1 });
apiKeySchema.index({ gymId: 1 });
apiKeySchema.index({ isActive: 1 });

// Static method to generate API key
apiKeySchema.statics.generateApiKey = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Method to check if API key is expired
apiKeySchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Method to increment usage
apiKeySchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
