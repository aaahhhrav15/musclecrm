const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// **OPTIMIZATION 1: In-memory cache for expenses**
const expenseCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Helper function to get cache key
const getCacheKey = (gymId, queryParams) => {
  const params = JSON.stringify(queryParams);
  return `expenses_${gymId}_${params}`;
};

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Clear cache when expenses are modified
const clearExpenseCache = (gymId) => {
  const keysToDelete = [];
  for (const key of expenseCache.keys()) {
    if (key.includes(`expenses_${gymId}`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => expenseCache.delete(key));
};

// **OPTIMIZED: Get all expenses for a gym with advanced caching and aggregation**
router.get('/', auth, async (req, res) => {
  try {
    const { gymId, month, year } = req.query;
    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    // Create cache key based on query parameters
    const cacheKey = getCacheKey(gymId, { month, year });
    const cachedData = expenseCache.get(cacheKey);
    
    // Return cached data if valid
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    let query = { gymId: new mongoose.Types.ObjectId(gymId) };
    
    // **OPTIMIZATION 2: More efficient date filtering**
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // **OPTIMIZATION 3: Use lean() for better performance and select only needed fields**
    const expenses = await Expense.find(query)
      .select('amount description category date updatedAt')
      .sort({ date: -1, _id: -1 }) // Added _id for consistent sorting
      .lean(); // Use lean() for better performance

    // Cache the result
    expenseCache.set(cacheKey, {
      data: expenses,
      timestamp: Date.now()
    });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

// **OPTIMIZED: Get total expenses for a gym with caching**
router.get('/total', auth, async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    const cacheKey = `total_expenses_${gymId}`;
    const cachedData = expenseCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    // **OPTIMIZATION 4: More efficient aggregation pipeline**
    const result = await Expense.aggregate([
      {
        $match: {
          gymId: new mongoose.Types.ObjectId(gymId)
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }, // Added count for additional insights
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const responseData = { 
      total: result[0]?.total || 0,
      count: result[0]?.count || 0,
      avgAmount: result[0]?.avgAmount || 0
    };

    // Cache the result
    expenseCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error calculating total expenses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// **OPTIMIZED: Get monthly expenses for a gym with caching**
router.get('/monthly', auth, async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    const cacheKey = `monthly_expenses_${gymId}`;
    const cachedData = expenseCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    // **OPTIMIZATION 5: More efficient aggregation with better indexing**
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
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          categories: { $addToSet: '$category' } // Track categories per month
        }
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1
        }
      },
      {
        $limit: 24 // Limit to last 24 months for performance
      }
    ]);

    // Format the response to include all months with enhanced data
    const monthlyData = result.map(item => ({
      month: item._id.month,
      year: item._id.year,
      total: item.total,
      count: item.count,
      avgAmount: item.avgAmount,
      categories: item.categories
    }));

    // Cache the result
    expenseCache.set(cacheKey, {
      data: monthlyData,
      timestamp: Date.now()
    });

    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// **OPTIMIZED: Get receipt for an expense with caching**
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

    // **OPTIMIZATION 6: Cache receipt data**
    const cacheKey = `receipt_${id}_${gymId}`;
    const cachedData = expenseCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    // **OPTIMIZATION 7: Single optimized query with lean()** 
    const expense = await Expense.findOne({ 
      _id: id, 
      gymId: new mongoose.Types.ObjectId(gymId) 
    })
    .select('receipt gymId') // Only select needed fields
    .lean();

    console.log('Expense found:', {
      found: !!expense,
      hasReceipt: expense?.receipt ? true : false,
      receiptType: expense?.receipt ? typeof expense.receipt : null,
      hasReceiptData: expense?.receipt?.data ? true : false
    });

    if (!expense) {
      return res.status(404).json({ 
        message: 'Expense not found for this gym'
      });
    }

    if (!expense.receipt || !expense.receipt.data) {
      return res.status(404).json({ message: 'No receipt found for this expense' });
    }

    // Convert Buffer to base64
    const base64Data = expense.receipt.data.toString('base64');
    
    const responseData = { 
      receipt: base64Data,
      contentType: expense.receipt.contentType || 'application/pdf'
    };

    // Cache the result (receipts don't change often)
    expenseCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ 
      message: 'Error fetching receipt',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// **OPTIMIZED: Add new expense with cache clearing**
router.post('/', auth, async (req, res) => {
  try {
    const { gymId, amount, description, category, date, receipt } = req.body;
    
    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }
    if (!['Gym', 'Retail'].includes(category)) {
      return res.status(400).json({ message: 'Category must be either "Gym" or "Retail"' });
    }

    // **OPTIMIZATION 8: Validate required fields early**
    if (!amount || !description) {
      return res.status(400).json({ message: 'Amount and description are required' });
    }

    // Clear cache for this gym
    clearExpenseCache(gymId);

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
      gymId: new mongoose.Types.ObjectId(gymId),
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date: date ? new Date(date) : new Date(),
      receipt: receiptData
    });

    await expense.save();
    
    // **OPTIMIZATION 9: Return lean object**
    const responseExpense = expense.toObject();
    delete responseExpense.receipt; // Don't return receipt data in create response
    
    res.status(201).json(responseExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Error creating expense' });
  }
});

// **OPTIMIZED: Update expense with efficient validation and cache clearing**
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { gymId, amount, description, category, date, receipt } = req.body;

    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }
    if (!['Gym', 'Retail'].includes(category)) {
      return res.status(400).json({ message: 'Category must be either "Gym" or "Retail"' });
    }

    // **OPTIMIZATION 10: Validate ObjectIds early**
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    // Clear cache for this gym
    clearExpenseCache(gymId);

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

    // **OPTIMIZATION 11: Build update object efficiently**
    const updateData = {
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date: date ? new Date(date) : new Date()
    };

    if (receiptData) {
      updateData.receipt = receiptData;
    }

    const expense = await Expense.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id), 
        gymId: new mongoose.Types.ObjectId(gymId) 
      },
      updateData,
      { 
        new: true,
        select: '-receipt' // Don't return receipt data
      }
    ).lean();

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Error updating expense' });
  }
});

// **OPTIMIZED: Delete expense with cache clearing**
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { gymId } = req.query;

    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    // **OPTIMIZATION 12: Validate ObjectIds early**
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    // Clear cache for this gym
    clearExpenseCache(gymId);

    const expense = await Expense.findOneAndDelete({ 
      _id: new mongoose.Types.ObjectId(id), 
      gymId: new mongoose.Types.ObjectId(gymId) 
    }).lean();
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

// **NEW: Get expense statistics (cached)**
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) {
      return res.status(400).json({ message: 'Gym ID is required' });
    }

    const cacheKey = `expense_stats_${gymId}`;
    const cachedData = expenseCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    const stats = await Expense.aggregate([
      { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          categories: { $addToSet: '$category' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      }
    ]);

    const responseData = {
      success: true,
      stats: stats[0] || {
        totalExpenses: 0,
        totalAmount: 0,
        avgAmount: 0,
        categories: [],
        minAmount: 0,
        maxAmount: 0
      }
    };

    expenseCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({ message: 'Error fetching expense stats' });
  }
});

// **NEW: Clear cache endpoint for development**
router.delete('/cache/clear', auth, (req, res) => {
  const { gymId } = req.query;
  if (gymId) {
    clearExpenseCache(gymId);
  } else {
    expenseCache.clear();
  }
  res.json({ success: true, message: 'Expense cache cleared successfully' });
});

// **NEW: Bulk operations endpoint**
router.post('/bulk', auth, async (req, res) => {
  try {
    const { gymId, expenses } = req.body;
    
    if (!gymId || !Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ message: 'Gym ID and expenses array are required' });
    }

    // Clear cache for this gym
    clearExpenseCache(gymId);

    // **OPTIMIZATION 13: Bulk insert for better performance**
    const bulkExpenses = expenses.map(expense => ({
      ...expense,
      gymId: new mongoose.Types.ObjectId(gymId),
      amount: parseFloat(expense.amount),
      description: expense.description.trim(),
      date: expense.date ? new Date(expense.date) : new Date()
    }));

    const result = await Expense.insertMany(bulkExpenses, { ordered: false });
    
    res.status(201).json({
      success: true,
      message: `${result.length} expenses created successfully`,
      count: result.length
    });
  } catch (error) {
    console.error('Error creating bulk expenses:', error);
    res.status(500).json({ message: 'Error creating bulk expenses' });
  }
});

module.exports = router;