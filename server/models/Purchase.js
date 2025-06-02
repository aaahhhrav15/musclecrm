
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  industry: {
    type: String,
    required: true,
    enum: ['gym', 'spa', 'hotel', 'club']
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    default: 99 // $99 per industry CRM
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  stripeSessionId: {
    type: String
  }
}, {
  timestamps: true
});

// Ensure one purchase per user per industry
purchaseSchema.index({ userId: 1, industry: 1 }, { unique: true });

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;
