
const mongoose = require('mongoose');

const gymMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  membershipType: {
    type: String,
    enum: ['Standard', 'Premium', 'VIP'],
    default: 'Standard'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Expiring'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const GymMember = mongoose.model('GymMember', gymMemberSchema);

module.exports = GymMember;
