const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// Get all transactions for a gym
router.get('/gym/:gymId', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ gymId: req.params.gymId })
            .populate('userId', 'name email')
            .sort({ transactionDate: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get transactions for a specific user
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.params.userId })
            .sort({ transactionDate: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new transaction
router.post('/', auth, async (req, res) => {
    const transaction = new Transaction({
        userId: req.body.userId,
        gymId: req.body.gymId,
        transactionType: req.body.transactionType,
        transactionDate: req.body.transactionDate,
        amount: req.body.amount,
        membershipType: req.body.membershipType,
        paymentMode: req.body.paymentMode,
        description: req.body.description,
        status: req.body.status
    });

    try {
        const newTransaction = await transaction.save();
        
        // Update customer's totalSpent
        try {
            const customer = await Customer.findById(req.body.userId);
            if (customer) {
                const transactions = await Transaction.find({ userId: req.body.userId });
                const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                customer.totalSpent = totalSpent;
                await customer.save();
                console.log(`Updated totalSpent for customer ${customer.name}: ${totalSpent}`);
            }
        } catch (error) {
            console.error('Error updating customer totalSpent:', error);
            // Don't fail the transaction creation if totalSpent update fails
        }
        
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a transaction
router.patch('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Only allow updating specific fields
        const allowedFields = ['amount', 'paymentMode', 'description', 'transactionDate', 'status'];
        const updateData = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Convert transactionDate to proper Date object if it's a string
        if (updateData.transactionDate && typeof updateData.transactionDate === 'string') {
            updateData.transactionDate = new Date(updateData.transactionDate);
        }

        // Validate the update data
        if (updateData.amount !== undefined && (isNaN(updateData.amount) || updateData.amount < 0)) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        if (updateData.paymentMode !== undefined && !['cash', 'card', 'upi', 'bank_transfer', 'other'].includes(updateData.paymentMode)) {
            return res.status(400).json({ message: 'Invalid payment mode' });
        }

        if (updateData.status !== undefined && !['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(updateData.status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Use findByIdAndUpdate for partial updates
        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: false }
        );
        
        if (!updatedTransaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        // Update customer's totalSpent
        try {
            const customer = await Customer.findById(transaction.userId);
            if (customer) {
                const transactions = await Transaction.find({ userId: transaction.userId });
                const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                customer.totalSpent = totalSpent;
                await customer.save();
                console.log(`Updated totalSpent for customer ${customer.name}: ${totalSpent}`);
            }
        } catch (error) {
            console.error('Error updating customer totalSpent:', error);
        }
        
        res.json(updatedTransaction);
    } catch (error) {
        console.error('Transaction update error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete a transaction
router.delete('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const userId = transaction.userId; // Store userId before deletion
        
        await transaction.remove();
        
        // Update customer's totalSpent
        try {
            const customer = await Customer.findById(userId);
            if (customer) {
                const transactions = await Transaction.find({ userId });
                const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                customer.totalSpent = totalSpent;
                await customer.save();
                console.log(`Updated totalSpent for customer ${customer.name}: ${totalSpent}`);
            }
        } catch (error) {
            console.error('Error updating customer totalSpent:', error);
        }
        
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 