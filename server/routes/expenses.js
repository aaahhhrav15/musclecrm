const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all expenses for a gym
router.get('/', auth, async (req, res) => {
  try {
    const { gymId, month, year } = req.query;
    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    let query = { gymId };
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

// Get total expenses for a gym
router.get('/total', auth, async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    const result = await Expense.aggregate([
      {
        $match: {
          gymId: new mongoose.Types.ObjectId(gymId)
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({ total: result[0]?.total || 0 });
  } catch (error) {
    console.error('Error calculating total expenses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get monthly expenses for a gym
router.get('/monthly', auth, async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    const result = await Expense.aggregate([
      {
        $match: {
          gymId: new mongoose.Types.ObjectId(gymId)
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1
        }
      }
    ]);

    // Format the response to include all months
    const monthlyData = result.map(item => ({
      month: item._id.month,
      year: item._id.year,
      total: item.total,
      count: item.count
    }));

    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get receipt for an expense
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { gymId } = req.query;

    console.log('Receipt request details:', {
      expenseId: id,
      gymId,
      isValidExpenseId: mongoose.Types.ObjectId.isValid(id),
      isValidGymId: mongoose.Types.ObjectId.isValid(gymId)
    });

    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ message: 'Invalid gym ID' });
    }

    // First check if the expense exists without the gymId filter
    const expenseExists = await Expense.findById(id);
    console.log('Expense check:', {
      exists: !!expenseExists,
      expenseGymId: expenseExists?.gymId?.toString(),
      requestedGymId: gymId,
      hasReceipt: expenseExists?.receipt ? true : false
    });

    if (!expenseExists) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Then check with the gymId filter
    const expense = await Expense.findOne({ _id: id, gymId });
    console.log('Expense with gym filter:', {
      found: !!expense,
      expenseGymId: expense?.gymId?.toString(),
      requestedGymId: gymId,
      hasReceipt: expense?.receipt ? true : false,
      receiptType: expense?.receipt ? typeof expense.receipt : null,
      hasReceiptData: expense?.receipt?.data ? true : false
    });

    if (!expense) {
      return res.status(404).json({ 
        message: 'Expense not found for this gym',
        details: {
          expenseExists: true,
          expenseGymId: expenseExists.gymId.toString(),
          requestedGymId: gymId
        }
      });
    }

    if (!expense.receipt || !expense.receipt.data) {
      return res.status(404).json({ message: 'No receipt found for this expense' });
    }

    // Convert Buffer to base64
    const base64Data = expense.receipt.data.toString('base64');
    
    res.json({ 
      receipt: base64Data,
      contentType: expense.receipt.contentType || 'application/pdf'
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ 
      message: 'Error fetching receipt',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add new expense
router.post('/', auth, async (req, res) => {
  try {
    const { gymId, amount, description, category, date, receipt } = req.body;
    
    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }
    if (!['Gym', 'Retail'].includes(category)) {
      return res.status(400).json({ message: 'Category must be either "gym" or "retail"' });
    }

    // Convert receipt to Buffer if it's a base64 string
    let receiptData = null;
    if (receipt && typeof receipt === 'string') {
      try {
        // Remove the data URL prefix if present
        const base64Data = receipt.includes('base64,') ? receipt.split('base64,')[1] : receipt;
        receiptData = {
          data: Buffer.from(base64Data, 'base64'),
          contentType: receipt.includes('data:') ? receipt.split(';')[0].split(':')[1] : 'application/pdf'
        };
      } catch (error) {
        console.error('Error processing receipt data:', error);
        return res.status(400).json({ message: 'Invalid receipt data format' });
      }
    }

    const expense = new Expense({
      gymId,
      amount,
      description,
      category,
      date: date || new Date(),
      receipt: receiptData
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Error creating expense' });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { gymId, amount, description, category, date, receipt } = req.body;

    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }
    if (!['gym', 'retail'].includes(category)) {
      return res.status(400).json({ message: 'Category must be either "gym" or "retail"' });
    }

    // Convert receipt to Buffer if it's a base64 string
    let receiptData = null;
    if (receipt && typeof receipt === 'string') {
      try {
        // Remove the data URL prefix if present
        const base64Data = receipt.includes('base64,') ? receipt.split('base64,')[1] : receipt;
        receiptData = {
          data: Buffer.from(base64Data, 'base64'),
          contentType: receipt.includes('data:') ? receipt.split(';')[0].split(':')[1] : 'application/pdf'
        };
      } catch (error) {
        console.error('Error processing receipt data:', error);
        return res.status(400).json({ message: 'Invalid receipt data format' });
      }
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, gymId },
      {
        amount,
        description,
        category,
        date: date || new Date(),
        receipt: receiptData
      },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Error updating expense' });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { gymId } = req.query;

    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    const expense = await Expense.findOneAndDelete({ _id: id, gymId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

module.exports = router; 