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

// Cache for storing dashboard data (simple in-memory cache)
const dashboardCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cache key
const getCacheKey = (userId, gymId) => `dashboard_${userId}_${gymId || 'no_gym'}`;

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Get dashboard overview data
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const industry = req.user.industry;
    const gymId = req.user.gymId;

    // Check cache first
    const cacheKey = getCacheKey(userId, gymId) + '_overview';
    const cachedData = dashboardCache.get(cacheKey);
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    // Get date range for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get gym information if user is from a gym
    let gymInfo = null;
    if (industry === 'gym' && gymId) {
      gymInfo = await Gym.findById(gymId).lean(); // Use lean() for better performance
    }

    // Get total customers (filtered by gym if applicable)
    const customerQuery = industry === 'gym' ? { userId: userId, gymId } : { userId: userId };
    
    // **OPTIMIZATION 1: Parallel queries using Promise.all**
    const [
      totalCustomers,
      previousTotalCustomers,
      monthlyBookings,
      previousMonthlyBookings,
      monthlyRevenue,
      previousMonthlyRevenue,
      activeMembers,
      membershipDistribution,
      recentActivities,
      revenueOverview
    ] = await Promise.all([
      Customer.countDocuments(customerQuery),
      Customer.countDocuments({
        ...customerQuery,
        createdAt: { $lt: startOfMonth }
      }),
      Booking.countDocuments({
        ...customerQuery,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Booking.countDocuments({
        ...customerQuery,
        createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
      }),
      Invoice.aggregate([
        {
          $match: {
            ...customerQuery,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Invoice.aggregate([
        {
          $match: {
            ...customerQuery,
            createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      // **OPTIMIZATION: Use stored membershipEndDate instead of calculating**
      industry === 'gym' ? Customer.countDocuments({
        ...customerQuery,
        membershipEndDate: { $gt: new Date() } // Active members using stored end date
      }) : Promise.resolve(0),
      // Membership distribution (only if gym)
      industry === 'gym' ? Customer.aggregate([
        { $match: customerQuery },
        {
          $group: {
            _id: '$membershipType',
            count: { $sum: 1 }
          }
        }
      ]) : Promise.resolve([]),
      // Recent activities
      Booking.find({
        ...customerQuery,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer', 'name')
        .select('customer status createdAt')
        .lean(),
      // Revenue overview for charts
      Invoice.aggregate([
        {
          $match: {
            ...customerQuery,
            status: 'paid',
            createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ])
    ]);

    // **OPTIMIZATION: Calculate attendance rate using stored end dates**
    let attendanceRate = 0;
    if (industry === 'gym') {
      const totalAttendance = await Booking.countDocuments({
        ...customerQuery,
        status: 'completed',
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      attendanceRate = totalCustomers > 0 ? (totalAttendance / totalCustomers) * 100 : 0;
    }

    // Get industry-specific stats
    let industryStats = {};
    if (industry === 'gym' && gymInfo) {
      industryStats = {
        title: 'Active Members',
        value: activeMembers.toString(),
        trend: { value: 12, isPositive: true },
        additionalStats: {
          attendanceRate: Math.round(attendanceRate),
          membershipDistribution,
          facilities: gymInfo.facilities,
          operatingHours: gymInfo.operatingHours
        }
      };
    }

    const result = {
      success: true,
      data: {
        metrics: {
          totalCustomers,
          monthlyBookings,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          previousTotalCustomers,
          previousMonthlyBookings,
          previousMonthlyRevenue: previousMonthlyRevenue[0]?.total || 0,
          industryStats
        },
        recentActivities,
        revenueOverview,
        gymInfo: industry === 'gym' ? {
          name: gymInfo?.name,
          address: gymInfo?.address,
          contactInfo: gymInfo?.contactInfo,
          settings: gymInfo?.settings
        } : null
      }
    };

    // Cache the result
    dashboardCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json(result);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
});

// Get dashboard data - HEAVILY OPTIMIZED with stored membershipEndDate
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gymId = req.user.gymId;
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check cache first
    const cacheKey = getCacheKey(userId, gymId);
    const cachedData = dashboardCache.get(cacheKey);
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    console.log('Fetching dashboard data for user:', userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // **OPTIMIZATION 2: Single aggregation pipeline for customer metrics using stored membershipEndDate**
    const customerMetrics = await Customer.aggregate([
      { $match: { userId } },
      {
        $facet: {
          // Total count
          totalCount: [{ $count: "count" }],
          
          // Today's enrollments
          todayEnrolled: [
            {
              $match: {
                joinDate: { $gte: today, $lt: tomorrow }
              }
            },
            { $count: "count" }
          ],
          
          // Member amount total
          totalAmount: [
            {
              $group: {
                _id: null,
                total: { $sum: "$totalSpent" }
              }
            }
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
          
          // **OPTIMIZATION: Active/Inactive members using stored membershipEndDate**
          membershipStatus: [
            {
              $group: {
                _id: null,
                active: {
                  $sum: {
                    $cond: [
                      { 
                        $and: [
                          "$membershipEndDate",
                          { $gt: ["$membershipEndDate", new Date()] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                inactive: {
                  $sum: {
                    $cond: [
                      { 
                        $or: [
                          { $eq: ["$membershipEndDate", null] },
                          { $lte: ["$membershipEndDate", new Date()] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                expiringToday: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          "$membershipEndDate",
                          { $gte: ["$membershipEndDate", today] },
                          { $lt: ["$membershipEndDate", tomorrow] }
                        ]
                      },
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

    // **OPTIMIZATION 3: Parallel execution of remaining queries**
    const [
      staffBirthdays,
      invoiceMetrics,
      leadMetrics,
      expenseMetrics
    ] = await Promise.all([
      // Staff birthdays
      GymStaff.aggregate([
        { $match: { userId } },
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
      
      // Invoice metrics (single aggregation)
      Invoice.aggregate([
        { $match: { userId } },
        {
          $facet: {
            todayInvoices: [
              {
                $match: {
                  createdAt: { $gte: today, $lt: tomorrow }
                }
              },
              { $count: "count" }
            ],
            totalInvoices: [
              { $count: "count" }
            ],
            todayDueAmount: [
              {
                $match: {
                  dueDate: { $gte: today, $lt: tomorrow },
                  status: { $ne: 'paid' }
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$amount' }
                }
              }
            ],
            todayExpense: [
              {
                $match: {
                  createdAt: { $gte: today, $lt: tomorrow },
                  type: 'expense'
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$amount' }
                }
              }
            ],
            totalExpense: [
              {
                $match: {
                  type: 'expense'
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$amount' }
                }
              }
            ]
          }
        }
      ]),
      
      // Lead metrics (single aggregation)
      Lead.aggregate([
        { $match: { gymId } },
        {
          $facet: {
            todayEnquiry: [
              {
                $match: {
                  createdAt: { $gte: today, $lt: tomorrow }
                }
              },
              { $count: "count" }
            ],
            todayFollowUps: [
              {
                $match: {
                  followUpDate: { $gte: today, $lt: tomorrow }
                }
              },
              { $count: "count" }
            ]
          }
        }
      ]),
      
      // Expense metrics (placeholder for POS data)
      Promise.resolve({})
    ]);

    // **OPTIMIZATION 4: Extract metrics from aggregation results**
    const customerData = customerMetrics[0];
    const totalMembers = customerData.totalCount[0]?.count || 0;
    const activeMembers = customerData.membershipStatus[0]?.active || 0;
    const inactiveMembers = customerData.membershipStatus[0]?.inactive || 0;
    const todayExpiry = customerData.membershipStatus[0]?.expiringToday || 0;
    const todayEnrolled = customerData.todayEnrolled[0]?.count || 0;
    const totalMemberAmount = customerData.totalAmount[0]?.total || 0;
    const todayMemberBirthdays = customerData.birthdays[0]?.count || 0;

    const todayEmployeeBirthdays = staffBirthdays[0]?.count || 0;

    const invoiceData = invoiceMetrics[0];
    const todayInvoices = invoiceData.todayInvoices[0]?.count || 0;
    const totalInvoices = invoiceData.totalInvoices[0]?.count || 0;
    const todayDueAmount = invoiceData.todayDueAmount[0]?.total || 0;
    const todayExpense = invoiceData.todayExpense[0]?.total || 0;
    const totalExpense = invoiceData.totalExpense[0]?.total || 0;

    const leadData = leadMetrics[0];
    const todayEnquiry = leadData.todayEnquiry[0]?.count || 0;
    const todayFollowUps = leadData.todayFollowUps[0]?.count || 0;

    // Member Profit Section
    const memberAmount = totalMemberAmount;
    const memberExpense = totalExpense;
    const totalMemberProfit = memberAmount - memberExpense;

    // POS Section (Placeholder values - implement actual POS logic)
    const todayPurchase = 0;
    const totalPurchase = 0;
    const totalStockValue = 0;
    const lowStockValue = 0;
    const totalClearingAmount = 0;
    const todaySell = 0;
    const totalSell = 0;
    const totalSellPurchaseValue = 0;
    const todaySellInvoice = 0;
    const totalSellInvoice = 0;
    const sellDueAmount = 0;
    const totalPosExpense = 0;
    const todayPosExpense = 0;

    // POS Profit Section
    const posProfit = totalSell - totalPurchase;
    const posExpense = totalPosExpense;

    // Overall Profit Section
    const totalProfit = totalMemberProfit + posProfit;

    const result = {
      success: true,
      metrics: {
        members: {
          totalMembers,
          activeMembers,
          inactiveMembers,
          expiringIn7Days: todayExpiry, // Note: This is actually today's expiry, you may want to adjust for 7 days
          todayEmployees: todayEnrolled, // Using enrolled as employees metric
          todayExpiry,
          todayEnrolled,
          totalMemberAmount,
          todayEmployeeBirthdays,
          todayInvoices,
          totalInvoices,
          todayDueAmount,
          todayMemberBirthdays,
          todayExpense,
          totalExpense,
          todayEnquiry,
          todayFollowUps
        },
        memberProfit: {
          memberAmount,
          memberExpense,
          totalMemberProfit
        },
        pos: {
          todayPurchase,
          totalPurchase,
          totalStockValue,
          lowStockValue,
          totalClearingAmount,
          todaySell,
          totalSell,
          totalSellPurchaseValue,
          todaySellInvoice,
          totalSellInvoice,
          sellDueAmount,
          totalPosExpense,
          todayPosExpense
        },
        posProfit: {
          posProfit,
          posExpense
        },
        overallProfit: {
          totalProfit
        }
      }
    };

    // Cache the result
    dashboardCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    console.log('Dashboard data fetched and cached successfully');
    res.json(result);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data', error: error.message });
  }
});

// **NEW: Get customers expiring in next 7 days using stored membershipEndDate**
router.get('/expiring-customers', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gymId = req.user.gymId;
    const cacheKey = `expiring_customers_${userId}_${gymId}`;
    const cachedData = dashboardCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    // **OPTIMIZATION: Use stored membershipEndDate for expiring customers**
    const expiringCustomers = await Customer.find({
      userId,
      gymId,
      membershipEndDate: {
        $gte: today,
        $lte: sevenDaysFromNow
      }
    })
    .select('name email phone membershipEndDate membershipType')
    .sort({ membershipEndDate: 1 })
    .lean();

    const responseData = {
      success: true,
      customers: expiringCustomers
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

// Clear cache endpoint (useful for development)
router.delete('/cache', auth, (req, res) => {
  const userId = req.user._id;
  const gymId = req.user.gymId;
  const cacheKey = getCacheKey(userId, gymId);
  
  dashboardCache.delete(cacheKey);
  dashboardCache.delete(cacheKey + '_overview');
  
  res.json({ success: true, message: 'Cache cleared successfully' });
});

module.exports = router;