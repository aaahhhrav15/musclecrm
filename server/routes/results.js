const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const mongoose = require('mongoose');
const db = mongoose.connection;
const Customer = require('../models/Customer');
const { capitalizeName } = require('../lib/nameUtils');

// GET /api/gym/results - Get all results with pagination and sorting
router.get('/', auth, gymAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', startDate, endDate } = req.query;
    const gymId = req.gymId;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Derive userIds for this gym from customers collection
    const gymCustomers = await Customer.find({ gymId }).select('_id');
    const userIds = gymCustomers.map(c => c._id);

    // Build combined filter (userIds in gym + date)
    let filter = { userId: { $in: userIds } };
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Get results from existing collection with derived userIds and date filter
    console.log('Results filter (derived by userIds):', JSON.stringify(filter, null, 2));
    const allResults = await db.collection('results').find(filter).toArray();
    console.log(`Found ${allResults.length} results for gym ${gymId}`);
    
    // Populate customer information for each result
    const populatedResults = await Promise.all(
      allResults.map(async (result) => {
        try {
          const customer = await Customer.findById(result.userId).select('name email phone');
          return {
            ...result,
            user: customer ? {
              _id: customer._id,
              name: capitalizeName(customer.name || ''),
              email: customer.email,
              phone: customer.phone
            } : null
          };
        } catch (error) {
          console.log('Error populating customer for userId:', result.userId, error.message);
          return {
            ...result,
            user: null
          };
        }
      })
    );
    
    // Use populated results
    let results = populatedResults;
    
    // Sort the results manually since we're using raw collection
    populatedResults.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return sortOrder === 'desc' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'description') {
        return sortOrder === 'desc' ? b.description.localeCompare(a.description) : a.description.localeCompare(b.description);
      }
      return 0;
    });

    // Apply pagination
    const paginatedResults = populatedResults.slice(skip, skip + parseInt(limit));

    // Get total count for pagination
    const total = populatedResults.length;

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
});

// GET /api/gym/results/:id - Get a specific result by ID
router.get('/:id', auth, gymAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const gymId = req.gymId;

    const result = await db.collection('results').findOne({ _id: new mongoose.Types.ObjectId(id) });
    
    // Populate customer information
    if (result) {
      try {
        const customer = await Customer.findById(result.userId).select('name email phone gymId');
        // Authorize: ensure the result belongs to a customer from this gym
        if (!customer || String(customer.gymId) !== String(gymId)) {
          return res.status(404).json({ success: false, message: 'Result not found' });
        }
        result.user = customer ? {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        } : null;
      } catch (error) {
        console.log('Error populating customer for userId:', result.userId, error.message);
        result.user = null;
      }
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch result',
      error: error.message
    });
  }
});

// GET /api/gym/results/user/:userId - Get results for a specific user
router.get('/user/:userId', auth, gymAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const gymId = req.gymId;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Ensure the user belongs to this gym
    const customer = await Customer.findById(userId).select('_id gymId');
    if (!customer || String(customer.gymId) !== String(gymId)) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit)
        }
      });
    }

    // Get results for specific user from existing collection
    const results = await db.collection('results').find({ 
      userId 
    }).toArray();
    
    // Populate customer information for each result
    const populatedResults = await Promise.all(
      results.map(async (result) => {
        try {
          const customer = await Customer.findById(result.userId).select('name email phone');
          return {
            ...result,
            user: customer ? {
              _id: customer._id,
              name: capitalizeName(customer.name || ''),
              email: customer.email,
              phone: customer.phone
            } : null
          };
        } catch (error) {
          console.log('Error populating customer for userId:', result.userId, error.message);
          return {
            ...result,
            user: null
          };
        }
      })
    );
    
    // Sort the results manually since we're using raw collection
    populatedResults.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return sortOrder === 'desc' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'description') {
        return sortOrder === 'desc' ? b.description.localeCompare(a.description) : a.description.localeCompare(b.description);
      }
      return 0;
    });

    // Apply pagination
    const paginatedResults = populatedResults.slice(skip, skip + parseInt(limit));

    // Get total count for pagination
    const total = populatedResults.length;

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user results',
      error: error.message
    });
  }
});

module.exports = router;
