const express = require('express');
const router = express.Router();
// Using the existing MongoDB collection directly
const mongoose = require('mongoose');
const db = mongoose.connection;
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const Customer = require('../models/Customer');

// Get all accountabilities for a gym (with pagination)
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

    // Get accountabilities from existing collection with userIds (scoped to gym) and date filter
    console.log('Accountabilities filter (derived by userIds):', JSON.stringify(filter, null, 2));
    const allAccountabilities = await db.collection('accountabilities').find(filter).toArray();
    console.log(`Found ${allAccountabilities.length} accountabilities for gym ${gymId}`);
    
    // Populate customer information for each accountability
    const populatedAccountabilities = await Promise.all(
      allAccountabilities.map(async (accountability) => {
        try {
          const customer = await Customer.findById(accountability.userId).select('name email phone');
          return {
            ...accountability,
            user: customer ? {
              _id: customer._id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone
            } : null
          };
        } catch (error) {
          console.log('Error populating customer for userId:', accountability.userId, error.message);
          return {
            ...accountability,
            user: null
          };
        }
      })
    );
    
    // Use populated accountabilities
    let accountabilities = populatedAccountabilities;
    
    // Sort the results manually since we're using raw collection
    populatedAccountabilities.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return sortOrder === 'desc' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'description') {
        return sortOrder === 'desc' ? b.description.localeCompare(a.description) : a.description.localeCompare(b.description);
      }
      return 0;
    });

    // Apply pagination
    const paginatedAccountabilities = populatedAccountabilities.slice(skip, skip + parseInt(limit));

    // Get total count for pagination
    const total = populatedAccountabilities.length;

    res.json({
      success: true,
      data: paginatedAccountabilities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching accountabilities:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accountabilities',
      error: error.message
    });
  }
});

// Get accountability by ID
router.get('/:id', auth, gymAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const gymId = req.gymId;

    const accountability = await db.collection('accountabilities').findOne({ _id: new mongoose.Types.ObjectId(id) });
    
    // Populate customer information
    if (accountability) {
      try {
        const customer = await Customer.findById(accountability.userId).select('name email phone gymId');
        // Authorize: ensure the accountability belongs to a customer from this gym
        if (!customer || String(customer.gymId) !== String(gymId)) {
          return res.status(404).json({ success: false, message: 'Accountability not found' });
        }
        accountability.user = customer ? {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        } : null;
      } catch (error) {
        console.log('Error populating customer for userId:', accountability.userId, error.message);
        accountability.user = null;
      }
    }

    if (!accountability) {
      return res.status(404).json({
        success: false,
        message: 'Accountability not found'
      });
    }

    res.json({
      success: true,
      data: accountability
    });
  } catch (error) {
    console.error('Error fetching accountability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accountability'
    });
  }
});

// Get accountabilities by user ID
router.get('/user/:userId', auth, gymAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const gymId = req.gymId;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

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

    // Get accountabilities for specific user from existing collection
    const accountabilities = await db.collection('accountabilities').find({ 
      userId 
    }).toArray();
    
    // Populate customer information for each accountability
    const populatedAccountabilities = await Promise.all(
      accountabilities.map(async (accountability) => {
        try {
          const customer = await Customer.findById(accountability.userId).select('name email phone');
          return {
            ...accountability,
            user: customer ? {
              _id: customer._id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone
            } : null
          };
        } catch (error) {
          console.log('Error populating customer for userId:', accountability.userId, error.message);
          return {
            ...accountability,
            user: null
          };
        }
      })
    );
    
    // Sort the results manually since we're using raw collection
    accountabilities.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return sortOrder === 'desc' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'description') {
        return sortOrder === 'desc' ? b.description.localeCompare(a.description) : a.description.localeCompare(b.description);
      }
      return 0;
    });

    // Apply pagination
    const paginatedAccountabilities = accountabilities.slice(skip, skip + parseInt(limit));

    // Get total count for pagination
    const total = accountabilities.length;

    res.json({
      success: true,
      data: paginatedAccountabilities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user accountabilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user accountabilities'
    });
  }
});

module.exports = router;
