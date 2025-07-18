const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const Gym = require('../models/Gym');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const PersonalTrainingAssignment = require('../models/PersonalTrainingAssignment');
const Trainer = require('../models/Trainer');

const router = express.Router();

// Cache for storing customer data (simple in-memory cache)
const customerCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for customer data

// Helper function to get cache key
const getCacheKey = (gymId, queryParams) => {
  const params = JSON.stringify(queryParams);
  return `customers_${gymId}_${params}`;
};

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Clear cache when customers are modified
const clearCustomerCache = (gymId) => {
  const keysToDelete = [];
  for (const key of customerCache.keys()) {
    if (key.includes(`customers_${gymId}`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => customerCache.delete(key));
};

// **OPTIMIZATION: Calculate membership end date helper function**
const calculateMembershipEndDate = (startDate, durationInMonths) => {
  if (!startDate || !durationInMonths || durationInMonths <= 0) {
    return null;
  }
  
  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return null;
  }
  
  // Add months to start date and subtract 1 day
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + durationInMonths);
  endDate.setDate(endDate.getDate() - 1);
  
  return endDate;
};

// Apply both auth and gymAuth middleware to all routes
router.use(auth);
router.use(gymAuth);

// **OPTIMIZED: Get all customers for the gym with advanced caching and aggregation**
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const gymId = req.gymId;
    
    // Create cache key based on query parameters
    const cacheKey = getCacheKey(gymId, { search, page, limit });
    const cachedData = customerCache.get(cacheKey);
    
    // Return cached data if valid
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    // **OPTIMIZATION 1: Single aggregation pipeline for both data and count**
    const pipeline = [
      {
        $match: {
          gymId: gymId,
          ...(search ? { name: { $regex: search, $options: 'i' } } : {})
        }
      },
      {
        $facet: {
          // Get paginated data
          customers: [
            { $sort: { createdAt: -1 } },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
            {
              $addFields: {
                // **OPTIMIZATION: membershipEndDate is now stored in database, no calculation needed**
                memberStatus: {
                  $cond: {
                    if: {
                      $and: [
                        '$membershipEndDate',
                        { $gt: ['$membershipEndDate', new Date()] }
                      ]
                    },
                    then: 'active',
                    else: 'inactive'
                  }
                }
              }
            }
          ],
          // Get total count
          totalCount: [
            { $count: 'count' }
          ],
          // Get summary statistics
          stats: [
            {
              $group: {
                _id: null,
                totalCustomers: { $sum: 1 },
                totalRevenue: { $sum: '$totalSpent' },
                avgSpending: { $avg: '$totalSpent' },
                membershipTypes: {
                  $push: '$membershipType'
                }
              }
            }
          ]
        }
      }
    ];

    const [result] = await Customer.aggregate(pipeline);
    
    const customers = result.customers || [];
    const total = result.totalCount[0]?.count || 0;
    const stats = result.stats[0] || {};

    const responseData = {
      success: true,
      customers,
      total,
      stats: {
        totalCustomers: stats.totalCustomers || 0,
        totalRevenue: stats.totalRevenue || 0,
        avgSpending: stats.avgSpending || 0
      }
    };

    // Cache the result
    customerCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Error fetching customers' });
  }
});

// **OPTIMIZED: Get total count of customers with caching**
router.get('/count', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = `customer_count_${userId}`;
    const cachedData = customerCache.get(cacheKey);
    
    // Return cached count if valid
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    console.log('Getting customer count for user:', userId);
    const count = await Customer.countDocuments({ userId });
    console.log('Total customers found:', count);
    
    const responseData = { success: true, count };
    
    // Cache the result
    customerCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('Error getting customer count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting customer count',
      error: error.message 
    });
  }
});

// **OPTIMIZED: Get a specific customer with lean query**
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `customer_${req.params.id}`;
    const cachedData = customerCache.get(cacheKey);
    
    // Return cached customer if valid
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      gymId: req.gymId
    }).lean(); // Do not populate here, we will do it manually
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // If customer has a personalTrainer assignment, populate trainer details
    let personalTrainerAssignment = null;
    if (customer.personalTrainer) {
      let assignmentId = null;
      if (typeof customer.personalTrainer === 'string') {
        assignmentId = customer.personalTrainer;
      } else if (customer.personalTrainer._id) {
        assignmentId = customer.personalTrainer._id;
      }
      if (assignmentId) {
        personalTrainerAssignment = await PersonalTrainingAssignment.findById(assignmentId)
          .populate('trainerId', 'name email phone dateOfBirth specialization experience status bio clients gymId')
          .lean();
      }
    }
    if (personalTrainerAssignment) {
      customer.personalTrainer = personalTrainerAssignment;
    }

    // Fetch personal training assignments and transactions
    const assignments = await PersonalTrainingAssignment.find({ customerId: req.params.id })
      .populate('trainerId', 'name email phone');
    const transactions = await Transaction.find({ userId: req.params.id }).sort({ transactionDate: -1 });

    const responseData = {
      success: true,
      customer,
      personalTrainingAssignments: assignments,
      transactions
    };

    // Cache the result
    customerCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, message: 'Error fetching customer' });
  }
});

// **OPTIMIZED: Create a new customer with automatic end date calculation**
router.post('/', async (req, res) => {
  try {
    // Clear cache for this gym
    clearCustomerCache(req.gymId);

    // **OPTIMIZATION: Parallel gym lookup and customer creation preparation**
    const [gym] = await Promise.all([
      Gym.findById(req.gymId).lean()
    ]);
    
    const gymCode = gym ? gym.gymCode : undefined;
    
    // **OPTIMIZATION: Calculate membership end date automatically**
    let membershipEndDate = null;
    if (req.body.membershipStartDate && req.body.membershipDuration) {
      membershipEndDate = calculateMembershipEndDate(
        req.body.membershipStartDate, 
        parseInt(req.body.membershipDuration)
      );
    }
    
    const customer = new Customer({
      ...req.body,
      gymId: req.gymId,
      gymCode,
      membershipEndDate, // Store calculated end date in database
    });
    
    await customer.save();
    
    // **OPTIMIZATION: Parallel operations for totalSpent and invoice creation**
    const operations = [
      // Calculate totalSpent from transactions
      Transaction.find({ userId: customer._id }).lean(),
    ];

    // Only add invoice creation if membership fees > 0
    if (customer.membershipFees > 0) {
      operations.push(
        Invoice.findOne({}, {}, { sort: { 'invoiceNumber': -1 } }).lean()
      );
    }

    const [transactions, lastInvoice] = await Promise.all(operations);
    
    // Update totalSpent
    if (transactions) {
      const totalSpent = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
      customer.totalSpent = totalSpent;
      console.log(`Updated totalSpent for customer ${customer.name}: ${totalSpent}`);
    }

    // Create invoice if needed
    let invoice = null;
    if (customer.membershipFees > 0) {
      try {
        let nextNumber = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
          const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV', ''));
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }
        
        const invoiceNumber = `INV${String(nextNumber).padStart(5, '0')}`;
        const startDate = customer.membershipStartDate ? new Date(customer.membershipStartDate) : null;
        const endDate = customer.membershipEndDate ? new Date(customer.membershipEndDate) : null;
        const formatDate = (date) => {
          if (!date) return '';
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        };
        const dateRange = startDate && endDate ? ` (${formatDate(startDate)} to ${formatDate(endDate)})` : '';
        const membershipItem = {
          description: `${customer.membershipType.toUpperCase()} Membership - ${customer.membershipDuration} months${dateRange}`,
          quantity: 1,
          unitPrice: customer.membershipFees,
          amount: customer.membershipFees
        };

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        invoice = new Invoice({
          userId: req.user._id,
          gymId: req.gymId,
          customerId: customer._id,
          invoiceNumber,
          amount: customer.membershipFees,
          currency: 'INR',
          status: 'pending',
          dueDate,
          items: [membershipItem],
          notes: `Membership joining fees for ${customer.name} - ${customer.membershipType.toUpperCase()} plan for ${customer.membershipDuration} months${dateRange}`
        });

        await invoice.save();
      } catch (invoiceError) {
        console.error('Failed to create invoice:', invoiceError);
      }
    }

    // Save customer with updated totalSpent
    await customer.save();

    // Exclude gymCode from the response
    const customerObj = customer.toObject();
    delete customerObj.gymCode;
    
    res.status(201).json({ 
      success: true, 
      customer: customerObj,
      invoice: invoice ? invoice.toObject() : null
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    // Handle duplicate phone number error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.phone) {
      return res.status(400).json({ success: false, message: 'Phone number already exists' });
    }
    res.status(500).json({ success: false, message: error.message || 'Error creating customer' });
  }
});

// **OPTIMIZED: Update a customer with automatic end date calculation**
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, address, source, membershipType, membershipFees,
      membershipDuration, joinDate, membershipStartDate, membershipEndDate,
      transactionDate, paymentMode, notes, birthday
    } = req.body;

    // Clear cache for this gym and specific customer
    clearCustomerCache(req.gymId);
    customerCache.delete(`customer_${id}`);

    // **OPTIMIZATION: Parallel validation and customer lookup**
    const operations = [
      Customer.findById(id)
    ];

    // Only check email uniqueness if email is being changed
    if (email) {
      operations.push(
        Customer.findOne({ 
          email, 
          _id: { $ne: id } 
        }).lean()
      );
    }

    const results = await Promise.all(operations);
    const customer = results[0];
    const existingCustomer = email ? results[1] : null;

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already in use by another customer'
      });
    }

    // Update customer fields efficiently
    const updates = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(source && { source }),
      ...(membershipType && { membershipType }),
      ...(membershipFees !== undefined && { membershipFees }),
      ...(membershipDuration !== undefined && { membershipDuration }),
      ...(joinDate && { joinDate }),
      ...(membershipStartDate && { membershipStartDate }),
      ...(transactionDate && { transactionDate }),
      ...(paymentMode && { paymentMode }),
      ...(notes !== undefined && { notes })
    };

    // **OPTIMIZATION: Auto-calculate membership end date when start date or duration changes**
    if (membershipStartDate || membershipDuration !== undefined) {
      // If membershipEndDate is also provided, this is likely a renewal - use the provided end date
      if (membershipEndDate !== undefined) {
        updates.membershipEndDate = membershipEndDate;
      } else {
        // This is a new membership setup - calculate end date
        const startDate = membershipStartDate || customer.membershipStartDate;
        const duration = membershipDuration !== undefined ? membershipDuration : customer.membershipDuration;
        
        if (startDate && duration && duration > 0) {
          const calculatedEndDate = calculateMembershipEndDate(startDate, duration);
          updates.membershipEndDate = calculatedEndDate;
        } else {
          updates.membershipEndDate = null;
        }
      }
    } else if (membershipEndDate !== undefined) {
      // Only use provided end date if start date and duration are not being updated
      updates.membershipEndDate = membershipEndDate;
    }

    // Handle birthday with validation
    if (birthday !== undefined) {
      if (birthday === null || birthday === '') {
        updates.birthday = null;
      } else {
        const newBirthday = new Date(birthday);
        if (!isNaN(newBirthday.getTime())) {
          updates.birthday = newBirthday;
        }
      }
    }

    // **OPTIMIZATION: Parallel update operations**
    const [updatedCustomer, transactions] = await Promise.all([
      Customer.findByIdAndUpdate(id, updates, { new: true }),
      Transaction.find({ userId: id }).lean()
    ]);

    // Update totalSpent
    if (transactions) {
      const totalSpent = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
      updatedCustomer.totalSpent = totalSpent;
      await updatedCustomer.save();
      console.log(`Updated totalSpent for customer ${updatedCustomer.name}: ${totalSpent}`);
    }

    // Create invoice for membership renewal if membership fees > 0
    let invoice = null;
    const feesToUse = membershipFees !== undefined ? membershipFees : updatedCustomer.membershipFees;
    if (feesToUse > 0) {
      try {
        // Get the last invoice number to generate the next one
        const lastInvoice = await Invoice.findOne({}, {}, { sort: { 'invoiceNumber': -1 } }).lean();
        
        let nextNumber = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
          const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV', ''));
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }
        
        const invoiceNumber = `INV${String(nextNumber).padStart(5, '0')}`;
        const membershipTypeToUse = membershipType || updatedCustomer.membershipType;
        const membershipDurationToUse = membershipDuration || updatedCustomer.membershipDuration;
        
        // Calculate renewal period correctly based on current end date and today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let renewalStartDate = null;
        let renewalEndDate = null;
        if (membershipStartDate) {
          renewalStartDate = new Date(membershipStartDate);
        } else if (updatedCustomer.membershipEndDate) {
          const currentEndDate = new Date(updatedCustomer.membershipEndDate);
          currentEndDate.setHours(0, 0, 0, 0);
          renewalStartDate = new Date(currentEndDate);
          renewalStartDate.setDate(renewalStartDate.getDate() + 1);
        } else {
          renewalStartDate = today;
        }
        renewalEndDate = new Date(renewalStartDate);
        renewalEndDate.setMonth(renewalEndDate.getMonth() + membershipDurationToUse);
        renewalEndDate.setDate(renewalEndDate.getDate() - 1);
        const formatDate = (date) => {
          if (!date) return '';
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        };
        const dateRange = renewalStartDate && renewalEndDate ? ` (${formatDate(renewalStartDate)} to ${formatDate(renewalEndDate)})` : '';
        const membershipItem = {
          description: `${membershipTypeToUse.toUpperCase()} Membership Renewal - ${membershipDurationToUse} months${dateRange}`,
          quantity: 1,
          unitPrice: feesToUse,
          amount: feesToUse
        };

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        invoice = new Invoice({
          userId: req.user._id,
          gymId: req.gymId,
          customerId: updatedCustomer._id,
          invoiceNumber,
          amount: feesToUse,
          currency: 'INR',
          status: 'pending',
          dueDate,
          items: [membershipItem],
          notes: `Membership renewal fees for ${updatedCustomer.name} - ${membershipTypeToUse.toUpperCase()} plan for ${membershipDurationToUse} months${dateRange}`
        });

        await invoice.save();
      } catch (invoiceError) {
        console.error('Failed to create renewal invoice:', invoiceError);
      }
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: updatedCustomer,
      invoice: invoice ? invoice.toObject() : null
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer'
    });
  }
});

// **OPTIMIZED: Delete a customer with cache clearing**
router.delete('/:id', async (req, res) => {
  try {
    // Clear cache for this gym and specific customer
    clearCustomerCache(req.gymId);
    customerCache.delete(`customer_${req.params.id}`);

    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, message: 'Error deleting customer' });
  }
});

// **OPTIMIZED: Batch recalculate totalSpent with progress tracking**
router.post('/recalculate-totals', auth, async (req, res) => {
  try {
    // Clear all customer cache for this gym
    clearCustomerCache(req.user.gymId);

    // **OPTIMIZATION: Process in batches to avoid memory issues**
    const BATCH_SIZE = 100;
    let updatedCount = 0;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const customers = await Customer.find({ gymId: req.user.gymId })
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean();

      if (customers.length === 0) {
        hasMore = false;
        break;
      }

      // Process batch in parallel
      const batchPromises = customers.map(async (customer) => {
        try {
          const transactions = await Transaction.find({ userId: customer._id }).lean();
          const totalSpent = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
          
          if (customer.totalSpent !== totalSpent) {
            await Customer.findByIdAndUpdate(customer._id, { totalSpent });
            console.log(`Updated totalSpent for customer ${customer.name}: ${totalSpent}`);
            return 1; // Count this as updated
          }
          return 0;
        } catch (error) {
          console.error(`Error calculating totalSpent for customer ${customer.name}:`, error);
          return 0;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      updatedCount += batchResults.reduce((sum, count) => sum + count, 0);
      
      skip += BATCH_SIZE;
      
      // Break if we got fewer customers than batch size (last batch)
      if (customers.length < BATCH_SIZE) {
        hasMore = false;
      }
    }
    
    res.json({
      success: true,
      message: `Recalculated totalSpent for ${updatedCount} customers`,
      updatedCount
    });
  } catch (error) {
    console.error('Error recalculating totalSpent:', error);
    res.status(500).json({ success: false, message: 'Error recalculating totalSpent' });
  }
});

// **NEW: Clear cache endpoint for development**
router.delete('/cache/clear', auth, (req, res) => {
  clearCustomerCache(req.gymId);
  res.json({ success: true, message: 'Customer cache cleared successfully' });
});

// **NEW: Get customer statistics (cached)**
router.get('/stats/overview', async (req, res) => {
  try {
    const gymId = req.gymId;
    const cacheKey = `customer_stats_${gymId}`;
    const cachedData = customerCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    const stats = await Customer.aggregate([
      { $match: { gymId } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          avgSpending: { $avg: '$totalSpent' },
          membershipTypes: { $push: '$membershipType' }
        }
      }
    ]);

    const responseData = {
      success: true,
      stats: stats[0] || {
        totalCustomers: 0,
        totalRevenue: 0,
        avgSpending: 0,
        membershipTypes: []
      }
    };

    customerCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ message: 'Error fetching customer stats' });
  }
});

module.exports = router;