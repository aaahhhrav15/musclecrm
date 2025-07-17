const mongoose = require('mongoose');

const gymStaffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    // required: true // Remove required
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active'
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  },
  experience: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Only enforce uniqueness when trainerId is not null
// Remove the old index if present in the DB
// gymStaffSchema.index({ gymId: 1, trainerId: 1 }, { unique: true });
gymStaffSchema.index(
  { gymId: 1, trainerId: 1 },
  { unique: true, partialFilterExpression: { trainerId: { $type: 'objectId' } } }
);

const GymStaff = mongoose.model('GymStaff', gymStaffSchema);

module.exports = GymStaff;
