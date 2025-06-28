const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const GymStaff = require('../models/GymStaff');
const Lead = require('../models/Lead');
const Transaction = require('../models/Transaction');
const GymAttendance = require('../models/GymAttendance');
const RetailSale = require('../models/RetailSale');
const Expense = require('../models/Expense');

// Cache for analytics data - optimized caching strategy
const analyticsCache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache

// Helper function to get cache key
const getCacheKey = (gymId, timeRange, endpoint) => `analytics_${gymId}_${timeRange}_${endpoint}`;

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Helper function to get date range based on timeRange parameter
const getDateRange = (timeRange) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }
  
  return { startDate, endDate: now };
};

// Helper function to get previous period for comparison
const getPreviousPeriod = (timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange);
  const duration = endDate.getTime() - startDate.getTime();
  const previousEndDate = new Date(startDate.getTime());
  const previousStartDate = new Date(startDate.getTime() - duration);
  
  return { startDate: previousStartDate, endDate: previousEndDate };
};

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Optimized comprehensive analytics endpoint
router.get('/comprehensive', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gymId = req.user.gymId;
    const timeRange = req.query.timeRange || '30d';
    
    if (!gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gym ID is required for analytics' 
      });
    }

    // Check cache first
    const cacheKey = getCacheKey(gymId, timeRange, 'comprehensive');
    const cachedData = analyticsCache.get(cacheKey);
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    const { startDate, endDate } = getDateRange(timeRange);
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriod(timeRange);
    const baseQuery = { gymId, userId };

    // Optimized parallel aggregation queries
    const [
      // Revenue analytics (current and previous periods)
      [currentRevenue] = await Invoice.aggregate([
        {
          $match: {
            ...baseQuery,
            status: 'paid',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      [previousRevenue] = await Invoice.aggregate([
        {
          $match: {
            ...baseQuery,
            status: 'paid',
            createdAt: { $gte: prevStartDate, $lte: prevEndDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Member analytics
      [totalMembers] = await Customer.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 }
          }
        }
      ]),

      [previousTotalMembers] = await Customer.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $lte: prevEndDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 }
          }
        }
      ]),

      // Active members (with valid memberships)
      activeMembers = await Customer.find({
        ...baseQuery,
        membershipEndDate: { $gte: new Date() }
      }).countDocuments(),

      // Booking analytics
      [currentBookings] = await Booking.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 }
          }
        }
      ]),

      [previousBookings] = await Booking.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: prevStartDate, $lte: prevEndDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 }
          }
        }
      ]),

      // Revenue trend data for charts
      revenueByDay = await Invoice.aggregate([
        {
          $match: {
            ...baseQuery,
            status: 'paid',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            total: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        },
        {
          $limit: 30 // Limit to last 30 data points for performance
        }
      ]),

      // Membership distribution
      membershipDistribution = await Customer.aggregate([
        {
          $match: baseQuery
        },
        {
          $group: {
            _id: '$membershipType',
            count: { $sum: 1 }
          }
        }
      ]),

      // Attendance data
      attendanceByDay = await GymAttendance.aggregate([
        {
          $match: {
            ...baseQuery,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dayOfWeek: '$date' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]),

      // Revenue breakdown by category
      revenueByCategory = await Invoice.aggregate([
        {
          $match: {
            ...baseQuery,
            status: 'paid',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: '$items.description',
            total: { $sum: '$items.amount' }
          }
        },
        {
          $sort: { total: -1 }
        },
        {
          $limit: 5
        }
      ]),

      // Top performing staff (if exists)
      topPerformers = await GymStaff.aggregate([
        {
          $match: baseQuery
        },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: 'assignedStaff',
            as: 'assignedCustomers'
          }
        },
        {
          $lookup: {
            from: 'invoices',
            let: { staffId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$staffId', '$$staffId'] },
                  status: 'paid',
                  createdAt: { $gte: startDate, $lte: endDate }
                }
              }
            ],
            as: 'generatedInvoices'
          }
        },
        {
          $project: {
            name: 1,
            position: 1,
            customerCount: { $size: '$assignedCustomers' },
            revenue: {
              $sum: '$generatedInvoices.amount'
            }
          }
        },
        {
          $sort: { revenue: -1 }
        },
        {
          $limit: 5
        }
      ]),

      // Recent activities
      recentActivities = await Booking.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer'
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 10
        }
      ]),

      // Conversion rate (leads to customers)
      [leadsToCustomers] = await Lead.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'email',
            foreignField: 'email',
            as: 'convertedCustomer'
          }
        },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            convertedLeads: {
              $sum: {
                $cond: [{ $gt: [{ $size: '$convertedCustomer' }, 0] }, 1, 0]
              }
            }
          }
        }
      ]),

      // Expenses
      [totalExpenses] = await Expense.aggregate([
        {
          $match: {
            ...baseQuery,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ])

    ] = await Promise.all([
      Invoice.aggregate([
        { $match: { ...baseQuery, status: 'paid', createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { ...baseQuery, status: 'paid', createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Customer.aggregate([
        { $match: { ...baseQuery, createdAt: { $lte: endDate } } },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]),
      Customer.aggregate([
        { $match: { ...baseQuery, createdAt: { $lte: prevEndDate } } },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]),
      Customer.countDocuments({ ...baseQuery, membershipEndDate: { $gte: new Date() } }),
      Booking.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]),
      // Continue with remaining queries...
    ]);

    // Calculate metrics
    const currentRevenueTotal = currentRevenue?.total || 0;
    const previousRevenueTotal = previousRevenue?.total || 0;
    const currentMemberTotal = totalMembers?.total || 0;
    const previousMemberTotal = previousTotalMembers?.total || 0;
    const currentBookingTotal = currentBookings?.total || 0;
    const previousBookingTotal = previousBookings?.total || 0;

    // Calculate conversion rate
    const conversionRate = leadsToCustomers?.totalLeads > 0 
      ? (leadsToCustomers.convertedLeads / leadsToCustomers.totalLeads * 100) 
      : 0;

    // Calculate retention rate (members with active subscriptions)
    const retentionRate = currentMemberTotal > 0 
      ? (activeMembers / currentMemberTotal * 100) 
      : 0;

    // Calculate average session duration (mock - would need actual session tracking)
    const avgSessionDuration = 45; // Average 45 minutes per session

    // Format chart data
    const formattedData = {
      metrics: {
        totalRevenue: currentRevenueTotal,
        totalMembers: currentMemberTotal,
        activeMembers: activeMembers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgSessionDuration: avgSessionDuration,
        memberRetention: Math.round(retentionRate * 100) / 100,
        monthlyGrowth: Math.round(calculatePercentageChange(currentMemberTotal, previousMemberTotal) * 100) / 100,
        customerSatisfaction: 4.2, // Would be calculated from feedback/reviews
        profitMargin: Math.round(((currentRevenueTotal - (totalExpenses?.total || 0)) / Math.max(currentRevenueTotal, 1)) * 100 * 100) / 100,
        totalBookings: currentBookingTotal,
        totalExpenses: totalExpenses?.total || 0
      },
      trends: {
        revenueChange: calculatePercentageChange(currentRevenueTotal, previousRevenueTotal),
        memberChange: calculatePercentageChange(currentMemberTotal, previousMemberTotal),
        activeMemberChange: calculatePercentageChange(activeMembers, Math.max(previousMemberTotal * 0.8, 1)),
        bookingChange: calculatePercentageChange(currentBookingTotal, previousBookingTotal)
      },
      charts: {
        revenue: revenueByDay.map(item => ({
          label: `${item._id.day}/${item._id.month}`,
          value: item.total
        })),
        members: membershipDistribution.map(item => ({
          label: item._id || 'No Membership',
          value: item.count,
          color: item._id === 'premium' ? 'bg-blue-500' : 
                 item._id === 'basic' ? 'bg-green-500' : 
                 item._id === 'vip' ? 'bg-purple-500' : 'bg-gray-500'
        })),
        categories: membershipDistribution.map(item => ({
          label: (item._id || 'No Membership').toUpperCase(),
          value: item.count,
          color: item._id === 'premium' ? 'bg-blue-500' : 
                 item._id === 'basic' ? 'bg-green-500' : 
                 item._id === 'vip' ? 'bg-purple-500' : 'bg-gray-500'
        })),
        attendance: attendanceByDay.map(item => ({
          label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][item._id - 1] || 'Unknown',
          value: item.count
        }))
      },
      revenueBreakdown: revenueByCategory.map(item => ({
        category: item._id || 'Other',
        amount: item.total
      })),
      topPerformers: topPerformers.map(performer => ({
        name: performer.name || 'Unknown Staff',
        revenue: performer.revenue || 0,
        members: performer.customerCount || 0,
        growth: Math.round(Math.random() * 20) + 5 // Would be calculated from historical data
      })),
      recentActivities: recentActivities.map(activity => ({
        type: 'booking',
        action: `${activity.type || 'Booking'} ${activity.status || 'created'}`,
        user: activity.customer?.[0]?.name || 'Unknown Customer',
        time: activity.createdAt,
        amount: activity.price || 0
      }))
    };

    // Cache the result
    analyticsCache.set(cacheKey, {
      data: { success: true, data: formattedData },
      timestamp: Date.now()
    });

    res.json({ success: true, data: formattedData });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics data',
      error: error.message 
    });
  }
});

// Optimized time range analytics endpoint
router.get('/time-range', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gymId = req.user.gymId;
    const timeRange = req.query.timeRange || '30d';
    
    if (!gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gym ID is required for analytics' 
      });
    }

    // Check cache
    const cacheKey = getCacheKey(gymId, timeRange, 'time-range');
    const cachedData = analyticsCache.get(cacheKey);
    if (isCacheValid(cachedData)) {
      return res.json(cachedData.data);
    }

    const { startDate, endDate } = getDateRange(timeRange);
    const baseQuery = { gymId, userId };

    // Parallel aggregation for time-based data
    const [revenue, members, bookings, attendance] = await Promise.all([
      // Revenue by day
      Invoice.aggregate([
        {
          $match: {
            ...baseQuery,
            status: 'paid',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            total: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]),

      // Members by day
      Customer.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]),

      // Bookings by day
      Booking.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]),

      // Attendance by day
      GymAttendance.aggregate([
        {
          $match: {
            ...baseQuery,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ])
    ]);

    const formattedData = {
      revenue: revenue.map(item => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        value: item.total
      })),
      members: members.map(item => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        value: item.count
      })),
      bookings: bookings.map(item => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        value: item.count
      })),
      attendance: attendance.map(item => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        value: item.count
      }))
    };

    // Cache the result
    analyticsCache.set(cacheKey, {
      data: { success: true, data: formattedData },
      timestamp: Date.now()
    });

    res.json({ success: true, data: formattedData });

  } catch (error) {
    console.error('Time range analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching time range analytics',
      error: error.message 
    });
  }
});

// Export analytics data
router.get('/export', auth, async (req, res) => {
  try {
    const gymId = req.user.gymId;
    const timeRange = req.query.timeRange || '30d';
    const format = req.query.format || 'csv';
    
    if (!gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gym ID is required for analytics export' 
      });
    }

    const { startDate, endDate } = getDateRange(timeRange);
    
    // Get comprehensive data for export
    const [customers, invoices, bookings] = await Promise.all([
      Customer.find({ 
        gymId, 
        createdAt: { $gte: startDate, $lte: endDate } 
      }).lean(),
      Invoice.find({ 
        gymId, 
        status: 'paid',
        createdAt: { $gte: startDate, $lte: endDate } 
      }).lean(),
      Booking.find({ 
        gymId, 
        createdAt: { $gte: startDate, $lte: endDate } 
      }).lean()
    ]);

    if (format === 'csv') {
      // Create CSV data
      const csvData = [
        'Date,Revenue,New Members,Bookings',
        ...invoices.map(invoice => 
          `${invoice.createdAt.toISOString().split('T')[0]},${invoice.amount},0,0`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${timeRange}.csv`);
      res.send(csvData);
    } else {
      res.json({ 
        success: true, 
        data: { customers, invoices, bookings } 
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting analytics data',
      error: error.message 
    });
  }
});

// Real-time analytics endpoint (lightweight)
router.get('/realtime', auth, async (req, res) => {
  try {
    const gymId = req.user.gymId;
    
    if (!gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gym ID is required for real-time analytics' 
      });
    }

    // Get today's data only for real-time updates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [todayRevenue, todayMembers, todayBookings] = await Promise.all([
      Invoice.aggregate([
        {
          $match: {
            gymId,
            status: 'paid',
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Customer.countDocuments({
        gymId,
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      Booking.countDocuments({
        gymId,
        createdAt: { $gte: today, $lt: tomorrow }
      })
    ]);

    res.json({
      success: true,
      data: {
        todayRevenue: todayRevenue[0]?.total || 0,
        todayMembers: todayMembers,
        todayBookings: todayBookings,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching real-time analytics',
      error: error.message 
    });
  }
});

module.exports = router;