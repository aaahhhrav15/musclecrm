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
    transactionType: {
        type: String,
        enum: ['MEMBERSHIP_PURCHASE', 'MEMBERSHIP_RENEWAL', 'OTHER'],
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
        required: true
    },
    paymentMode: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'PENDING', 'FAILED'],
        default: 'SUCCESS'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema); 