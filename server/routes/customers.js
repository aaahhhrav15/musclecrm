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
const calculateMembershipEndDate = (startDate, durationInMonths = 0, durationInDays = 0) => {
  if (!startDate || (durationInMonths <= 0 && durationInDays <= 0)) {
    return null;
  }
  
  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return null;
  }
  
  let endDate = new Date(start);
  if (durationInMonths > 0) {
    endDate.setMonth(endDate.getMonth() + durationInMonths);
  }
  if (durationInDays > 0) {
    endDate.setDate(endDate.getDate() + durationInDays);
  }
  endDate.setDate(endDate.getDate() - 1); // End date is inclusive
  
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
          ...(search ? { 
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { phone: { $regex: search, $options: 'i' } },
              { notes: { $regex: search, $options: 'i' } }
            ]
          } : {})
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
    const allowedGenders = ['male', 'female', 'other'];
    if (!req.body.gender || !allowedGenders.includes(req.body.gender)) {
      return res.status(400).json({ success: false, message: 'Gender is required and must be one of male, female, or other' });
    }

    // Clear cache for this gym
    clearCustomerCache(req.gymId);

    // **OPTIMIZATION: Parallel gym lookup and customer creation preparation**
    const [gym] = await Promise.all([
      Gym.findById(req.gymId).lean()
    ]);
    
    const gymCode = gym ? gym.gymCode : undefined;
    
    // **OPTIMIZATION: Calculate membership end date automatically**
    let membershipEndDate = null;
    const months = parseInt(req.body.membershipDuration) || 0;
    const days = parseInt(req.body.membershipDays) || 0;
    if (req.body.membershipStartDate && (months > 0 || days > 0)) {
      membershipEndDate = calculateMembershipEndDate(
        req.body.membershipStartDate,
        months,
        days
      );
    }
    
    // Ensure hasRegistered cannot be set from the CRM payload
    if ('hasRegistered' in req.body) {
      delete req.body.hasRegistered;
    }

    const customer = new Customer({
      ...req.body,
      membershipDuration: months,
      membershipDays: days,
      gymId: req.gymId,
      gymCode,
      membershipEndDate // Store calculated end date in database
      // NOTE: hasRegistered will use the schema default (false) and
      // can only be flipped by backend processes outside the CRM.
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
        // Fetch gym to get gymCode and invoiceCounter
        const gym = await Gym.findById(req.gymId);
        if (!gym) throw new Error('Gym not found');
        const gymCode = gym.gymCode;
        const invoiceCounter = gym.invoiceCounter || 1;
        const invoiceNumber = `${gymCode}${String(invoiceCounter).padStart(6, '0')}`;
        
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
          customerName: customer.name || '',
          customerEmail: customer.email || '',
          customerPhone: customer.phone || '',
          invoiceNumber,
          amount: customer.membershipFees,
          currency: 'INR',
          status: 'pending',
          dueDate,
          items: [membershipItem],
          notes: `Membership joining fees for ${customer.name} - ${customer.membershipType.toUpperCase()} plan for ${customer.membershipDuration} months${dateRange}`
        });

        await invoice.save();
        // Increment the gym's invoiceCounter
        gym.invoiceCounter = invoiceCounter + 1;
        await gym.save();
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
      transactionDate, paymentMode, notes, birthday, height, weight, gender
    } = req.body;

    // Clear cache for this gym and specific customer
    clearCustomerCache(req.gymId);
    customerCache.delete(`customer_${id}`);

    // **OPTIMIZATION: Parallel validation and customer lookup**
    const operations = [
      Customer.findById(id)
    ];

    // Only check email uniqueness if email is being changed and not empty
    if (email && email.trim() !== '') {
      operations.push(
        Customer.findOne({ 
          email, 
          _id: { $ne: id } 
        }).lean()
      );
    }

    const results = await Promise.all(operations);
    const customer = results[0];
    
    // IMPORTANT: Capture the ORIGINAL values from the database BEFORE any updates
    const originalEndDateForInvoice = customer.membershipEndDate ? new Date(customer.membershipEndDate) : null;
    const originalStartDateForInvoice = customer.membershipStartDate ? new Date(customer.membershipStartDate) : null;
    const originalMembershipFees = customer.membershipFees || 0;
    const existingCustomer = (email && email.trim() !== '') ? results[1] : null;

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

    // Validate gender if provided
    const allowedGenders = ['male', 'female', 'other'];
    if (gender !== undefined && !allowedGenders.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Gender must be one of male, female, or other'
      });
    }

    // Update customer fields efficiently
    const updates = {
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(gender !== undefined && { gender }),
      ...(source && { source }),
      ...(membershipType && { membershipType }),
      ...(membershipFees !== undefined && { membershipFees }),
      ...(membershipDuration !== undefined && { membershipDuration }),
      ...(joinDate && { joinDate }),
      ...(membershipStartDate && { membershipStartDate }),
      ...(transactionDate && { transactionDate }),
      ...(paymentMode && { paymentMode }),
      ...(notes !== undefined && { notes }),
      ...(height !== undefined && { height }),
      ...(weight !== undefined && { weight })
    };

    // **OPTIMIZATION: Auto-calculate membership end date when start date or duration changes**
    let monthsU, daysU;
    if (membershipStartDate || membershipDuration !== undefined || req.body.membershipDays !== undefined) {
      if (membershipEndDate !== undefined) {
        updates.membershipEndDate = membershipEndDate;
      } else {
        const startDate = membershipStartDate || customer.membershipStartDate;
        monthsU = membershipDuration !== undefined ? parseInt(membershipDuration) : (customer.membershipDuration || 0);
        daysU = req.body.membershipDays !== undefined ? parseInt(req.body.membershipDays) : (customer.membershipDays || 0);
        
        if (startDate && (monthsU > 0 || daysU > 0)) {
          const calculatedEndDate = calculateMembershipEndDate(startDate, monthsU, daysU);
          updates.membershipEndDate = calculatedEndDate;
        } else {
          updates.membershipEndDate = null;
        }
      }
      updates.membershipDuration = monthsU !== undefined ? monthsU : (membershipDuration !== undefined ? parseInt(membershipDuration) : (customer.membershipDuration || 0));
      updates.membershipDays = daysU !== undefined ? daysU : (req.body.membershipDays !== undefined ? parseInt(req.body.membershipDays) : (customer.membershipDays || 0));
    } else if (membershipEndDate !== undefined) {
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

    // Create modification transaction if membershipFees changed (and it's not a renewal)
    if (!req.body.isRenewal && membershipFees !== undefined && membershipFees !== originalMembershipFees) {
      const feeDifference = membershipFees - originalMembershipFees;
      if (feeDifference !== 0) {
        try {
          const membershipTypeToUse = membershipType || updatedCustomer.membershipType || 'none';
          const membershipDurationToUse = membershipDuration !== undefined ? membershipDuration : updatedCustomer.membershipDuration || 0;
          const membershipDaysToUse = req.body.membershipDays !== undefined ? parseInt(req.body.membershipDays) : (updatedCustomer.membershipDays || 0);
          
          let durationDescription = '';
          if (membershipDurationToUse > 0 && membershipDaysToUse > 0) {
            durationDescription = `${membershipDurationToUse} month(s) and ${membershipDaysToUse} day(s)`;
          } else if (membershipDurationToUse > 0) {
            durationDescription = `${membershipDurationToUse} month(s)`;
          } else if (membershipDaysToUse > 0) {
            durationDescription = `${membershipDaysToUse} day(s)`;
          }
          
          const description = `Membership fees modified from ₹${originalMembershipFees} to ₹${membershipFees} for ${membershipTypeToUse.toUpperCase()}${durationDescription ? ` (${durationDescription})` : ''}`;
          
          const modificationTransaction = new Transaction({
            userId: id,
            gymId: req.gymId,
            transactionType: 'MEMBERSHIP_MODIFICATION',
            transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
            amount: feeDifference,
            membershipType: membershipTypeToUse,
            paymentMode: paymentMode || updatedCustomer.paymentMode || 'cash',
            description: description,
            status: 'SUCCESS'
          });
          
          await modificationTransaction.save();
          console.log(`Created membership modification transaction: ${description}, difference: ₹${feeDifference}`);
        } catch (error) {
          console.error('Error creating membership modification transaction:', error);
          // Don't fail the update if transaction creation fails
        }
      }
    }

    // Update totalSpent by recalculating from all transactions
    try {
      const allTransactions = await Transaction.find({ userId: id }).lean();
      const totalSpent = allTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
      updatedCustomer.totalSpent = totalSpent;
      await updatedCustomer.save();
      console.log(`Updated totalSpent for customer ${updatedCustomer.name}: ${totalSpent}`);
    } catch (error) {
      console.error('Error updating totalSpent:', error);
    }

    let invoice = null;
    if (req.body.isRenewal) {
      const feesToUse = membershipFees !== undefined ? membershipFees : updatedCustomer.membershipFees;
      const membershipTypeToUse = membershipType !== undefined ? membershipType : updatedCustomer.membershipType;
      const membershipDurationToUse = membershipDuration !== undefined ? membershipDuration : updatedCustomer.membershipDuration;
      const membershipDaysToUse = req.body.membershipDays !== undefined ? req.body.membershipDays : updatedCustomer.membershipDays;
      if (feesToUse > 0) {
        try {
          const gym = await Gym.findById(req.gymId);
          if (!gym) throw new Error('Gym not found');
          const gymCode = gym.gymCode;
          const invoiceCounter = gym.invoiceCounter || 1;
          const invoiceNumber = `${gymCode}${String(invoiceCounter).padStart(6, '0')}`;

          // --- Renewal Date Logic ---
          // For renewals, use the dates calculated by the frontend (they're already correct)
          let renewalStartDate, renewalEndDate;
          
          // Original dates are already captured at the beginning of the function
          
          console.log('Renewal request body:', {
            membershipStartDate: req.body.membershipStartDate,
            membershipEndDate: req.body.membershipEndDate,
            membershipDuration: req.body.membershipDuration,
            membershipDays: req.body.membershipDays,
            isRenewal: req.body.isRenewal
          });
          
          if (req.body.membershipStartDate && req.body.membershipEndDate) {
            // Use the dates calculated by the frontend
            renewalStartDate = new Date(req.body.membershipStartDate);
            renewalEndDate = new Date(req.body.membershipEndDate);
            console.log('Using frontend calculated dates:', {
              renewalStartDate: renewalStartDate.toISOString(),
              renewalEndDate: renewalEndDate.toISOString()
            });
          } else {
            // Fallback calculation if frontend didn't send dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentEndDate = updatedCustomer.membershipEndDate ? new Date(updatedCustomer.membershipEndDate) : null;
            
            if (currentEndDate && currentEndDate >= today) {
              // Membership is active - keep original start date, extend from current end date
              renewalStartDate = new Date(updatedCustomer.membershipStartDate); // Keep original start date
              const renewalFrom = new Date(currentEndDate);
              renewalFrom.setDate(renewalFrom.getDate() + 1);
              renewalEndDate = new Date(renewalFrom);
              
              // Calculate renewal end date by adding duration
              if (membershipDurationToUse > 0) {
                renewalEndDate.setMonth(renewalEndDate.getMonth() + membershipDurationToUse);
              }
              if (membershipDaysToUse > 0) {
                renewalEndDate.setDate(renewalEndDate.getDate() + membershipDaysToUse);
              }
              renewalEndDate.setDate(renewalEndDate.getDate() - 1); // Inclusive
            } else {
              // Membership expired, renewal starts from the provided start date
              renewalStartDate = req.body.membershipStartDate ? new Date(req.body.membershipStartDate) : new Date(today);
              renewalEndDate = new Date(renewalStartDate);
              
              // Calculate renewal end date by adding duration
              if (membershipDurationToUse > 0) {
                renewalEndDate.setMonth(renewalEndDate.getMonth() + membershipDurationToUse);
              }
              if (membershipDaysToUse > 0) {
                renewalEndDate.setDate(renewalEndDate.getDate() + membershipDaysToUse);
              }
              renewalEndDate.setDate(renewalEndDate.getDate() - 1); // Inclusive
            }
          }

          // Update customer membershipStartDate and membershipEndDate
          updatedCustomer.membershipStartDate = renewalStartDate;
          updatedCustomer.membershipEndDate = renewalEndDate;
          updatedCustomer.membershipDuration = membershipDurationToUse;
          updatedCustomer.membershipDays = membershipDaysToUse;
          
          console.log('Final dates being saved:', {
            membershipStartDate: renewalStartDate.toISOString(),
            membershipEndDate: renewalEndDate.toISOString(),
            membershipDuration: membershipDurationToUse,
            membershipDays: membershipDaysToUse,
            originalEndDateForInvoice: originalEndDateForInvoice?.toISOString(),
            originalStartDateForInvoice: originalStartDateForInvoice?.toISOString()
          });
          
          await updatedCustomer.save();

          const formatDate = (date) => {
            if (!date) return '';
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          };
          // For invoice, show the actual renewal period (new period being added)
          let invoiceStartDate, invoiceEndDate;
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Determine if this is an active membership renewal
          // For active membership renewals: renewal start date = original start date AND renewal extends beyond original end date
          const isActiveMembershipRenewal = originalEndDateForInvoice && 
            originalEndDateForInvoice >= today && 
            renewalStartDate.getTime() === originalStartDateForInvoice.getTime() &&
            renewalEndDate.getTime() > originalEndDateForInvoice.getTime();
          
          console.log('=== INVOICE DATE CALCULATION DEBUG ===');
          console.log('originalEndDateForInvoice:', originalEndDateForInvoice?.toISOString());
          console.log('renewalStartDate:', renewalStartDate.toISOString());
          console.log('renewalEndDate:', renewalEndDate.toISOString());
          console.log('originalStartDateForInvoice:', originalStartDateForInvoice?.toISOString());
          console.log('today:', today.toISOString());
          console.log('--- CONDITIONS ---');
          console.log('condition1 - originalEndDate >= today:', originalEndDateForInvoice && originalEndDateForInvoice >= today);
          console.log('condition2 - renewalStartDate === originalStartDate:', renewalStartDate.getTime() === originalStartDateForInvoice?.getTime());
          console.log('condition3 - renewalEndDate > originalEndDate:', renewalEndDate.getTime() > originalEndDateForInvoice?.getTime());
          console.log('FINAL RESULT - isActiveMembershipRenewal:', isActiveMembershipRenewal);
          console.log('=== END DEBUG ===');
          
          if (isActiveMembershipRenewal) {
            console.log('✅ TAKING ACTIVE MEMBERSHIP RENEWAL BRANCH');
            // Active membership renewal - invoice covers only the NEW period (day after original end to new end)
            console.log('BEFORE calculation:', {
              originalEndDateForInvoice: originalEndDateForInvoice.toISOString(),
              renewalEndDate: renewalEndDate.toISOString()
            });
            
            // For active membership renewals, the invoice start date should be the original end date + 1 day
            // This represents the NEW period being added to the existing membership
            invoiceStartDate = new Date(originalEndDateForInvoice);
            invoiceStartDate.setDate(invoiceStartDate.getDate() + 1);
            invoiceEndDate = new Date(renewalEndDate);
            
            console.log('AFTER calculation:', {
              invoiceStartDate: invoiceStartDate.toISOString(),
              invoiceEndDate: invoiceEndDate.toISOString()
            });
            console.log('Active membership renewal - invoice period:', {
              invoiceStartDate: invoiceStartDate.toISOString(),
              invoiceEndDate: invoiceEndDate.toISOString(),
              reason: 'Active membership being extended',
              originalEndDate: originalEndDateForInvoice.toISOString(),
              originalStartDate: originalStartDateForInvoice.toISOString(),
              renewalStartDate: renewalStartDate.toISOString()
            });
          } else {
            console.log('❌ TAKING EXPIRED/NEW MEMBERSHIP BRANCH');
            // Expired membership or new membership - invoice covers the full new membership
            invoiceStartDate = new Date(renewalStartDate);
            invoiceEndDate = new Date(renewalEndDate);
            console.log('Expired/New membership - invoice period:', {
              invoiceStartDate: invoiceStartDate.toISOString(),
              invoiceEndDate: invoiceEndDate.toISOString(),
              reason: originalEndDateForInvoice && originalEndDateForInvoice < today ? 'Membership expired' : 'New membership',
              note: 'This branch was taken instead of active membership renewal'
            });
          }
          
          const invoiceDateRange = ` (${formatDate(invoiceStartDate)} to ${formatDate(invoiceEndDate)})`;
          const membershipItem = {
            description: `${membershipTypeToUse?.toUpperCase() || 'MEMBERSHIP'} Membership Renewal - ${membershipDurationToUse} months${invoiceDateRange}`,
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
            customerName: updatedCustomer.name || '',
            customerEmail: updatedCustomer.email || '',
            customerPhone: updatedCustomer.phone || '',
            invoiceNumber,
            amount: feesToUse,
            currency: 'INR',
            dueDate,
            items: [membershipItem],
            notes: `Membership renewal fees for ${updatedCustomer.name} - ${membershipTypeToUse?.toUpperCase() || 'MEMBERSHIP'} plan for ${membershipDurationToUse} months${invoiceDateRange}`
          });
          await invoice.save();
          gym.invoiceCounter = invoiceCounter + 1;
          await gym.save();
        } catch (invoiceError) {
          console.error('Failed to create renewal invoice:', invoiceError);
        }
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