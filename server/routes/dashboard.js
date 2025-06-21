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

// Get dashboard overview data
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const industry = req.user.industry;
    const gymId = req.user.gymId;

    // Get date range for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get gym information if user is from a gym
    let gymInfo = null;
    if (industry === 'gym' && gymId) {
      gymInfo = await Gym.findById(gymId);
    }

    // Get total customers (filtered by gym if applicable)
    const customerQuery = industry === 'gym' ? { userId: userId, gymId } : { userId: userId };
    const totalCustomers = await Customer.countDocuments(customerQuery);
    const previousTotalCustomers = await Customer.countDocuments({
      ...customerQuery,
      createdAt: { $lt: startOfMonth }
    });

    // Get monthly bookings (filtered by gym if applicable)
    const bookingQuery = {
      ...customerQuery,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    };
    const monthlyBookings = await Booking.countDocuments(bookingQuery);
    const previousMonthlyBookings = await Booking.countDocuments({
      ...customerQuery,
      createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
    });

    // Get monthly revenue (filtered by gym if applicable)
    const revenueQuery = {
      ...customerQuery,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'paid'
    };
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: revenueQuery
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const previousMonthlyRevenue = await Invoice.aggregate([
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
    ]);

    // Get industry-specific stats
    let industryStats = {};
    if (industry === 'gym' && gymInfo) {
      const activeMembers = await Customer.countDocuments({
        ...customerQuery,
        membershipStatus: 'active'
      });

      // Calculate attendance rate
      const totalAttendance = await Booking.countDocuments({
        ...customerQuery,
        status: 'completed',
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      const attendanceRate = totalCustomers > 0 ? (totalAttendance / totalCustomers) * 100 : 0;

      // Get membership distribution
      const membershipDistribution = await Customer.aggregate([
        {
          $match: customerQuery
        },
        {
          $group: {
            _id: '$membershipType',
            count: { $sum: 1 }
          }
        }
      ]);

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

    // Get recent activities (filtered by gym if applicable)
    const recentActivities = await Booking.find(bookingQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .select('customer status createdAt');

    // Get revenue overview for charts (filtered by gym if applicable)
    const revenueOverview = await Invoice.aggregate([
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
    ]);

    res.json({
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
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
});

// Get dashboard data
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gymId = req.user.gymId;
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    console.log('Fetching dashboard data for user:', userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Members Section
    console.log('Fetching member metrics...');
    const totalMembers = await Customer.countDocuments({ userId });

    // Calculate active members (membership duration hasn't expired)
    const activeMembers = await Customer.countDocuments({
      userId,
      $expr: {
        $and: [
          { $gt: ['$membershipDuration', 0] },
          {
            $gt: [
              {
                $add: [
                  { $toDate: '$joinDate' },
                  { $multiply: ['$membershipDuration', 30 * 24 * 60 * 60 * 1000] } // Convert months to milliseconds (30 days per month)
                ]
              },
              new Date()
            ]
          }
        ]
      }
    });

    // Calculate inactive members (membership duration has expired)
    const inactiveMembers = await Customer.countDocuments({
      userId,
      $expr: {
        $or: [
          { $lte: ['$membershipDuration', 0] },
          {
            $lte: [
              {
                $add: [
                  { $toDate: '$joinDate' },
                  { $multiply: ['$membershipDuration', 30 * 24 * 60 * 60 * 1000] } // Convert months to milliseconds (30 days per month)
                ]
              },
              new Date()
            ]
          }
        ]
      }
    });

    // Calculate today's expiring memberships
    const todayExpiry = await Customer.countDocuments({
      userId,
      $expr: {
        $and: [
          { $gt: ['$membershipDuration', 0] },
          {
            $eq: [
              {
                $dateToString: {
                  date: {
                    $add: [
                      { $toDate: '$joinDate' },
                      { $multiply: ['$membershipDuration', 30 * 24 * 60 * 60 * 1000] } // Convert months to milliseconds (30 days per month)
                    ]
                  },
                  format: '%Y-%m-%d'
                }
              },
              {
                $dateToString: {
                  date: new Date(),
                  format: '%Y-%m-%d'
                }
              }
            ]
          }
        ]
      }
    });

    const todayEmployees = await Customer.countDocuments({
      userId,
      joinDate: { $gte: today, $lt: tomorrow }
    });

    const todayEnrolled = await Customer.countDocuments({
      userId,
      joinDate: { $gte: today, $lt: tomorrow }
    });

    // Calculate today's birthdays
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    
    console.log('Today\'s date:', today);
    console.log('Today\'s month:', todayMonth);
    console.log('Today\'s day:', todayDay);

    // First, let's find all customers and log their birthdays
    const allCustomers = await Customer.find({ userId });
    console.log('All customers:', allCustomers.map(c => ({
      name: c.name,
      birthday: c.birthday
    })));

    // Get all customers and filter in memory
    const customers = await Customer.find({ userId });
    const todayMemberBirthdays = customers.filter(customer => {
      if (!customer.birthday) return false;
      const birthday = new Date(customer.birthday);
      return birthday.getMonth() + 1 === todayMonth && birthday.getDate() === todayDay;
    }).length;

    console.log('Today\'s member birthdays count:', todayMemberBirthdays);

    // Get all employees and filter in memory
    const employees = await GymStaff.find({ userId });
    const todayEmployeeBirthdays = employees.filter(employee => {
      if (!employee.dateOfBirth) return false;
      const birthday = new Date(employee.dateOfBirth);
      return birthday.getMonth() + 1 === todayMonth && birthday.getDate() === todayDay;
    }).length;

    console.log('Fetching financial metrics...');
    const totalMemberAmount = await Customer.aggregate([
      { 
        $match: { 
          userId
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalSpent' } 
        } 
      }
    ]);

    const todayInvoices = await Invoice.countDocuments({
      userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const totalInvoices = await Invoice.countDocuments({ userId });

    const todayDueAmount = await Invoice.aggregate([
      {
        $match: {
          userId,
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
    ]);

    const todayExpense = await Invoice.aggregate([
      {
        $match: {
          userId,
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
    ]);

    const totalExpense = await Invoice.aggregate([
      {
        $match: {
          userId,
          type: 'expense'
        }
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);

    const todayEnquiry = await Lead.countDocuments({
      gymId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayFollowUps = await Lead.countDocuments({
      gymId,
      followUpDate: { $gte: today, $lt: tomorrow }
    });

    // Member Profit Section
    const memberAmount = totalMemberAmount[0]?.total || 0;
    const memberExpense = totalExpense[0]?.total || 0;
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

    console.log('Dashboard data fetched successfully');
    res.json({
      success: true,
      metrics: {
        members: {
          totalMembers: totalMembers || 0,
          activeMembers: activeMembers || 0,
          inactiveMembers: inactiveMembers || 0,
          todayEmployees: todayEmployees || 0,
          todayExpiry: todayExpiry || 0,
          todayEnrolled: todayEnrolled || 0,
          totalMemberAmount: totalMemberAmount[0]?.total || 0,
          todayEmployeeBirthdays: todayEmployeeBirthdays || 0,
          todayInvoices: todayInvoices || 0,
          totalInvoices: totalInvoices || 0,
          todayDueAmount: todayDueAmount[0]?.total || 0,
          todayMemberBirthdays: todayMemberBirthdays || 0,
          todayExpense: todayExpense[0]?.total || 0,
          totalExpense: totalExpense[0]?.total || 0,
          todayEnquiry: todayEnquiry || 0,
          todayFollowUps: todayFollowUps || 0
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
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data', error: error.message });
  }
});

module.exports = router; 