const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  source: {
    type: String
  },
  status: {
    type: String,
    default: "New"
  },
  followUpDate: {
    type: Date
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for common queries
LeadSchema.index({ gymId: 1 });
LeadSchema.index({ createdAt: 1 });
LeadSchema.index({ followUpDate: 1 });

module.exports = mongoose.model("Lead", LeadSchema);
