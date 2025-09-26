const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  razorpay_order_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  key_id: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  customer: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['paid', 'created', 'failed'],
    required: true,
    index: true
  },
  meta: {
    order: {
      amount: Number,
      amount_due: Number,
      amount_paid: Number,
      attempts: Number,
      created_at: Number,
      currency: String,
      entity: String,
      id: String,
      notes: [String],
      offer_id: String,
      receipt: String,
      status: String
    },
    products: [{
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      name: String,
      price: Number,
      quantity: Number,
      total: Number
    }],
    gym: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym'
      },
      name: String
    },
    isCartCheckout: {
      type: Boolean,
      default: false
    }
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

// Index for efficient queries
paymentSchema.index({ gymId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('payments', paymentSchema);
