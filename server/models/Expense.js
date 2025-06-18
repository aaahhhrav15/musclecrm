const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  receipt: {
    data: {
      type: Buffer,
      required: false
    },
    contentType: {
      type: String,
      required: false
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema); 