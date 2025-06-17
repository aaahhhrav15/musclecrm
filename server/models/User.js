const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    required: true,
    enum: ['gym', 'spa', 'hotel', 'club']
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff', 'owner'],
    default: 'staff'
  },
  membershipType: {
    type: String
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  // Gym-specific fields
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: function() {
      return this.industry === 'gym';
    }
  },
  permissions: [{
    type: String,
    enum: ['view_dashboard', 'manage_members', 'manage_staff', 'manage_finance', 'manage_attendance', 'manage_workouts']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  bio: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
