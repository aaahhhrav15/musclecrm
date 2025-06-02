const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  type: {
    type: String,
    enum: ['membership', 'expense', 'sale'],
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [{
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
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  notes: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'upi', 'other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'failed'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Generate invoice number before saving
InvoiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate amounts before saving
InvoiceSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
    this.total = this.subtotal + this.tax;
    this.remainingAmount = this.total - this.paidAmount;
  }
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
