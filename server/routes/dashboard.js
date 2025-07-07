const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Gym = require('../models/Gym');
const GymStaff = require('../models/GymStaff');
const Lead = require('../models/Lead');
const RetailSale = require('../models/RetailSale');
const Expense = require('../models/Expense');
const PersonalTrainingAssignment = require('../models/PersonalTrainingAssignment');
const mongoose = require('mongoose');

// **OPTIMIZATION: Advanced caching with Redis-like structure**
const dashboardCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for faster updates
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // Cleanup every 10 minutes

// **OPTIMIZATION: Cache cleanup to prevent memory leaks**
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dashboardCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      dashboardCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

// Helper function to get cache key
const getCacheKey = (userId, gymId, type = 'main') => `dashboard_${userId}_${gymId || 'no_gym'}_${type}`;

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// **OPTIMIZATION: Pre-computed date ranges for better performance**
const getDateRanges = () => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return { today, tomorrow, sevenDaysFromNow, startOfMonth, endOfMonth };
};

// **OPTIMIZATION: Ultra-fast dashboard endpoint with single aggregation pipeline**
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gymId = req.user.gymId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // **OPTIMIZATION: Check cache first**
    const cacheKey = getCacheKey(userId, gymId);
    const cachedData = dashboardCache.get(cacheKey);
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    const { today, tomorrow, sevenDaysFromNow, startOfMonth, endOfMonth } = getDateRanges();

    // **OPTIMIZATION: Single massive aggregation pipeline for all customer metrics**
    const customerAggregation = Customer.aggregate([
      { $match: { userId, gymId } },
      {
        $facet: {
          // Basic counts
          totalCount: [{ $count: "count" }],
          
          // Today's enrollments
          todayEnrolled: [
            { $match: { joinDate: { $gte: today, $lt: tomorrow } } },
            { $count: "count" }
          ],
          
          // Total member amount
          totalAmount: [
            { $group: { _id: null, total: { $sum: { $ifNull: ["$totalSpent", 0] } } } }
          ],
          
          // Birthday calculations
          birthdays: [
            {
              $addFields: {
                birthdayMonth: { $month: "$birthday" },
                birthdayDay: { $dayOfMonth: "$birthday" }
              }
            },
            {
              $match: {
                birthdayMonth: today.getMonth() + 1,
                birthdayDay: today.getDate()
              }
            },
            { $count: "count" }
          ],
          
          // **OPTIMIZATION: Membership status using stored membershipEndDate**
          membershipStatus: [
            {
              $group: {
                _id: null,
                active: {
                  $sum: {
                    $cond: [
                      { $and: ["$membershipEndDate", { $gt: ["$membershipEndDate", new Date()] }] },
                      1,
                      0
                    ]
                  }
                },
                inactive: {
                  $sum: {
                    $cond: [
                      { $or: [{ $eq: ["$membershipEndDate", null] }, { $lte: ["$membershipEndDate", new Date()] }] },
                      1,
                      0
                    ]
                  }
                },
                expiringIn7Days: {
                  $sum: {
                    $cond: [
                      { $and: ["$membershipEndDate", { $gte: ["$membershipEndDate", today] }, { $lte: ["$membershipEndDate", sevenDaysFromNow] }] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    // **OPTIMIZATION: Parallel execution of all queries**
    const [
      customerMetrics,
      staffBirthdays,
      invoiceMetrics,
      leadMetrics,
      expenseMetrics,
      ptExpiringMetrics,
      retailMetrics
    ] = await Promise.all([
      customerAggregation,
      
      // Staff birthdays
      GymStaff.aggregate([
        { $match: { gymId } },
        {
          $addFields: {
            birthdayMonth: { $month: "$dateOfBirth" },
            birthdayDay: { $dayOfMonth: "$dateOfBirth" }
          }
        },
        {
          $match: {
            birthdayMonth: today.getMonth() + 1,
            birthdayDay: today.getDate()
          }
        },
        { $count: "count" }
      ]),
      
      // Invoice metrics
      Invoice.aggregate([
        { $match: { gymId } },
        {
          $facet: {
            todayInvoices: [
              { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
              { $count: "count" }
            ],
            totalInvoices: [{ $count: "count" }],
            todayDueAmount: [
              { $match: { dueDate: { $gte: today, $lt: tomorrow } } },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ]
          }
        }
      ]),
      
      // Lead metrics
      Lead.aggregate([
        { $match: { gymId } },
        {
          $facet: {
            todayEnquiry: [
              { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
              { $count: "count" }
            ],
            todayFollowUps: [
              { $match: { followUpDate: { $gte: today, $lt: tomorrow } } },
              { $count: "count" }
            ]
          }
        }
      ]),
      
      // Expense metrics - separate gym and retail expenses
      Expense.aggregate([
        { $match: { gymId } },
        {
          $facet: {
            // Gym expenses
            todayGymExpense: [
              { $match: { date: { $gte: today, $lt: tomorrow }, category: { $regex: /^gym$/i } } },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            monthlyGymExpense: [
              { $match: { date: { $gte: startOfMonth, $lte: endOfMonth }, category: { $regex: /^gym$/i } } },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            totalGymExpense: [
              { $match: { category: { $regex: /^gym$/i } } },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            // Retail expenses (POS)
            todayRetailExpense: [
              { $match: { date: { $gte: today, $lt: tomorrow }, category: { $in: ['Retail', 'retail'] } } },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            totalRetailExpense: [
              { $match: { category: { $in: ['Retail', 'retail'] } } },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ]
          }
        }
      ]),
      
      // Personal Training expiring metrics
      PersonalTrainingAssignment.aggregate([
        { $match: { gymId } },
        {
          $facet: {
            expiringToday: [
              { $match: { endDate: { $gte: today, $lt: tomorrow } } },
              { $count: "count" }
            ],
            expiringIn7Days: [
              { $match: { endDate: { $gte: today, $lte: sevenDaysFromNow } } },
              { $count: "count" }
            ]
          }
        }
      ]),
      
      // Retail sales metrics
      RetailSale.aggregate([
        { $match: { gymId } },
        {
          $facet: {
            todayRetailSales: [
              { $match: { saleDate: { $gte: today, $lt: tomorrow } } },
              { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ],
            totalRetailSales: [
              { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]
          }
        }
      ])
    ]);

    // **OPTIMIZATION: Extract all metrics efficiently**
    const customerData = customerMetrics[0];
    const totalMembers = customerData.totalCount[0]?.count || 0;
    const activeMembers = customerData.membershipStatus[0]?.active || 0;
    const inactiveMembers = customerData.membershipStatus[0]?.inactive || 0;
    const expiringIn7Days = customerData.membershipStatus[0]?.expiringIn7Days || 0;
    const todayEnrolled = customerData.todayEnrolled[0]?.count || 0;
    const totalMemberAmount = customerData.totalAmount[0]?.total || 0;
    const todayMemberBirthdays = customerData.birthdays[0]?.count || 0;

    const todayEmployeeBirthdays = staffBirthdays[0]?.count || 0;

    const invoiceData = invoiceMetrics[0];
    const todayInvoices = invoiceData.todayInvoices[0]?.count || 0;
    const totalInvoices = invoiceData.totalInvoices[0]?.count || 0;
    const todayDueAmount = invoiceData.todayDueAmount[0]?.total || 0;

    const leadData = leadMetrics[0];
    const todayEnquiry = leadData.todayEnquiry[0]?.count || 0;
    const todayFollowUps = leadData.todayFollowUps[0]?.count || 0;

    const expenseData = expenseMetrics[0];
    const todayGymExpense = expenseData.todayGymExpense[0]?.total || 0;
    const monthlyGymExpense = expenseData.monthlyGymExpense[0]?.total || 0;
    const totalGymExpense = expenseData.totalGymExpense[0]?.total || 0;
    const todayRetailExpense = expenseData.todayRetailExpense[0]?.total || 0;
    const totalRetailExpense = expenseData.totalRetailExpense[0]?.total || 0;

    const ptData = ptExpiringMetrics[0];
    const ptExpiringToday = ptData.expiringToday[0]?.count || 0;
    const ptExpiringIn7Days = ptData.expiringIn7Days[0]?.count || 0;

    const retailData = retailMetrics[0];
    const todayRetailSales = retailData.todayRetailSales[0]?.total || 0;
    const totalRetailSales = retailData.totalRetailSales[0]?.total || 0;

    // **OPTIMIZATION: Calculate profits efficiently with correct expense categories**
    const memberAmount = totalMemberAmount;
    const memberExpense = totalGymExpense; // Use gym expenses for member profit calculation
    const totalMemberProfit = memberAmount - memberExpense;
    const posProfit = totalRetailSales - totalRetailExpense; // Use actual retail expenses for POS profit
    const totalProfit = totalMemberProfit + posProfit;

    const result = {
      success: true,
      metrics: {
        members: {
          totalMembers,
          activeMembers,
          inactiveMembers,
          expiringIn7Days,
          todayEnrolled,
          totalMemberAmount,
          todayEmployeeBirthdays,
          todayInvoices,
          totalInvoices,
          todayDueAmount,
          todayMemberBirthdays,
          todayGymExpense,
          monthlyGymExpense,
          totalGymExpense,
          todayEnquiry,
          todayFollowUps,
          ptExpiringToday,
          ptExpiringIn7Days
        },
        memberProfit: {
          memberAmount,
          memberExpense,
          totalMemberProfit
        },
        pos: {
          todayRetailSales,
          totalRetailSales,
          todayRetailExpense,
          totalRetailExpense
        },
        posProfit: {
          posProfit
        },
        overallProfit: {
          totalProfit
        }
      }
    };

    // **OPTIMIZATION: Cache the result**
    dashboardCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json(result);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data', error: error.message });
  }
});

// **OPTIMIZATION: Separate endpoint for expiring customers with pagination**
router.get('/expiring-customers', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gymId = req.user.gymId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const cacheKey = `expiring_customers_${userId}_${gymId}_${page}_${limit}`;
    const cachedData = dashboardCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    const { today, sevenDaysFromNow } = getDateRanges();
    
    const [customers, total] = await Promise.all([
      Customer.find({
        userId,
        gymId,
        membershipEndDate: { $gte: today, $lte: sevenDaysFromNow }
      })
      .select('name email phone membershipEndDate membershipType')
      .sort({ membershipEndDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      
      Customer.countDocuments({
        userId,
        gymId,
        membershipEndDate: { $gte: today, $lte: sevenDaysFromNow }
      })
    ]);

    const responseData = {
      success: true,
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    dashboardCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching expiring customers:', error);
    res.status(500).json({ success: false, message: 'Error fetching expiring customers' });
  }
});

// **OPTIMIZATION: Lightweight real-time updates endpoint**
router.get('/realtime', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gymId = req.user.gymId;
    
    const cacheKey = `realtime_${userId}_${gymId}`;
    const cachedData = dashboardCache.get(cacheKey);
    
    // Shorter cache for real-time data
    if (cachedData && (Date.now() - cachedData.timestamp) < 30000) { // 30 seconds
      return res.json(cachedData.data);
    }

    const { today, tomorrow } = getDateRanges();

    // **OPTIMIZATION: Only fetch today's critical metrics**
    const [todayEnrolled, todayRevenue, todayGymExpense, todayRetailExpense] = await Promise.all([
      Customer.countDocuments({
        userId,
        gymId,
        joinDate: { $gte: today, $lt: tomorrow }
      }),
      
      Invoice.aggregate([
        { $match: { gymId, status: 'paid', createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      
      Expense.aggregate([
        { $match: { gymId, date: { $gte: today, $lt: tomorrow }, category: { $regex: /^gym$/i } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      
      Expense.aggregate([
        { $match: { gymId, date: { $gte: today, $lt: tomorrow }, category: { $in: ['Retail', 'retail'] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const result = {
      success: true,
      data: {
        todayEnrolled,
        todayRevenue: todayRevenue[0]?.total || 0,
        todayGymExpense: todayGymExpense[0]?.total || 0,
        todayRetailExpense: todayRetailExpense[0]?.total || 0,
        lastUpdated: new Date().toISOString()
      }
    };

    dashboardCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json(result);
  } catch (error) {
    console.error('Real-time dashboard error:', error);
    res.status(500).json({ success: false, message: 'Error fetching real-time data' });
  }
});

// Clear cache endpoint
router.delete('/cache', auth, (req, res) => {
  const userId = req.user._id;
  const gymId = req.user.gymId;
  
  // Clear all cache entries for this user
  for (const [key] of dashboardCache.entries()) {
    if (key.includes(`dashboard_${userId}_${gymId}`)) {
      dashboardCache.delete(key);
    }
  }
  
  res.json({ success: true, message: 'Cache cleared successfully' });
});

module.exports = router;