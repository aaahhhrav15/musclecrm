const mongoose = require('mongoose');

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
    unique: true
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
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
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

// Generate sequential invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      const lastInvoice = await this.constructor.findOne({}, {}, { sort: { 'invoiceNumber': -1 } });
      let nextNumber = 1;
      
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV', ''));
        nextNumber = lastNumber + 1;
      }
      
      this.invoiceNumber = `INV${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Add indexes for common queries
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ gymId: 1 });
invoiceSchema.index({ bookingId: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
