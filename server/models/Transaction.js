const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
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
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: false
    },
    transactionType: {
        type: String,
        enum: ['MEMBERSHIP_JOINING', 'MEMBERSHIP_RENEWAL', 'INVOICE_PAYMENT', 'PERSONAL_TRAINING', 'OTHER'],
        required: true
    },
    transactionDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true
    },
    membershipType: {
        type: String,
        enum: ['none', 'basic', 'premium', 'vip'],
        default: 'none'
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'card', 'upi', 'bank_transfer', 'other'],
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
        default: 'SUCCESS'
    }
}, {
    timestamps: true
});

// Add indexes for common queries
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ gymId: 1, transactionDate: -1 });
transactionSchema.index({ transactionType: 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 