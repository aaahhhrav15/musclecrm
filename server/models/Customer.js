
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  source: String,
  notes: String,
  membershipType: String,
  joinDate: {
    type: Date,
    default: Date.now
  },
  birthday: Date,
  totalSpent: {
    type: Number,
    default: 0
  },
  lastVisit: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema);
