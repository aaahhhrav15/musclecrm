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
    transactionDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMode: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema); 