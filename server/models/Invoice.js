const mongoose = require('mongoose');
const Gym = require('./Gym');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const invoiceSchema = new mongoose.Schema({
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
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    default: ''
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [invoiceItemSchema],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
invoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate sequential invoice number per gym
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      // Get gymCode for this gym
      const gym = await Gym.findById(this.gymId).lean();
      const gymCode = gym && gym.gymCode ? gym.gymCode : 'GYM';
      // Find the last invoice for this gym
      const lastInvoice = await this.constructor.findOne({ gymId: this.gymId }, {}, { sort: { createdAt: -1 } });
      let nextNumber = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        // Extract the numeric part after the gymCode
        const match = lastInvoice.invoiceNumber.match(/^[a-zA-Z0-9]+(\d{6})$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      this.invoiceNumber = `${gymCode}${String(nextNumber).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Add a pre-validate hook as a backup to pre-save
invoiceSchema.pre('validate', async function(next) {
  if (!this.invoiceNumber) {
    try {
      const lastInvoice = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
      let nextNumber = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/INV(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      this.invoiceNumber = `INV${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Add indexes for common queries
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ gymId: 1 });
invoiceSchema.index({ bookingId: 1 });
invoiceSchema.index({ customerId: 1 });

// **OPTIMIZATION: Add compound indexes for dashboard queries**
invoiceSchema.index({ gymId: 1, status: 1, createdAt: 1 });
invoiceSchema.index({ gymId: 1, dueDate: 1 });
invoiceSchema.index({ gymId: 1, amount: 1 });
invoiceSchema.index({ userId: 1, gymId: 1, createdAt: 1 });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
