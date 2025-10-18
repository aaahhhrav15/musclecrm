const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Gym = require('../models/Gym');
const GymStaff = require('../models/GymStaff');
const Lead = require('../models/Lead');
const RetailSale = require('../models/RetailSale');
const Expense = require('../models/Expense');
const PersonalTrainingAssignment = require('../models/PersonalTrainingAssignment');
const NutritionPlan = require('../models/NutritionPlan');
const WorkoutPlan = require('../models/WorkoutPlan');
const AssignedWorkoutPlan = require('../models/AssignedWorkoutPlan');
const Trainer = require('../models/Trainer');
const GymAttendance = require('../models/GymAttendance');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Apply admin authentication middleware to all routes
router.use(adminAuth);

// Get overview statistics for all gyms
router.get('/overview', async (req, res) => {
  try {
    // Get total counts across all gyms
    const [
      totalUsers,
      totalGyms,
      totalCustomers,
      totalInvoices,
      totalRevenue,
      subscriptionStats
    ] = await Promise.all([
      User.countDocuments(),
      Gym.countDocuments(),
      Customer.countDocuments(),
      Invoice.countDocuments(),
      Transaction.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      // Subscription statistics
      Gym.aggregate([
        {
          $facet: {
            registeredGyms: [
              { $match: { subscriptionStartDate: null } },
              { $count: "count" }
            ],
            activeGyms: [
              {
                $match: {
                  subscriptionStartDate: { $exists: true, $ne: null },
                  subscriptionEndDate: { $gte: new Date() }
                }
              },
              { $count: "count" }
            ],
            expiredGyms: [
              {
                $match: {
                  subscriptionStartDate: { $exists: true, $ne: null },
                  subscriptionEndDate: { $lt: new Date() }
                }
              },
              { $count: "count" }
            ]
          }
        }
      ])
    ]);

    const result = {
      success: true,
      data: {
        totalUsers,
        totalGyms,
        totalCustomers,
        totalInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeSubscriptions: subscriptionStats[0]?.activeGyms[0]?.count || 0,
        subscriptionStats: {
          registeredGyms: subscriptionStats[0]?.registeredGyms[0]?.count || 0,
          activeGyms: subscriptionStats[0]?.activeGyms[0]?.count || 0,
          expiredGyms: subscriptionStats[0]?.expiredGyms[0]?.count || 0
        }
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ success: false, message: 'Error fetching admin overview data', error: error.message });
  }
});

// Get all gyms with basic information
router.get('/gyms', async (req, res) => {
  try {
    const gyms = await Gym.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: 'gymId',
          as: 'members'
        }
      },
      {
        $addFields: {
          memberCount: { $size: '$members' },
          subscriptionStatus: {
            $cond: {
              if: { $eq: ['$subscriptionStartDate', null] },
              then: 'registered',
              else: {
                $cond: {
                  if: { $gte: ['$subscriptionEndDate', new Date()] },
                  then: 'active',
                  else: 'expired'
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          gymCode: 1,
          createdAt: 1,
          logo: 1,
          address: 1,
          contactInfo: 1,
          subscriptionStartDate: 1,
          subscriptionEndDate: 1,
          memberCount: 1,
          subscriptionStatus: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json({
      success: true,
      data: gyms
    });
  } catch (error) {
    console.error('Admin gyms error:', error);
    res.status(500).json({ success: false, message: 'Error fetching gyms data', error: error.message });
  }
});

// Get detailed gym information
router.get('/gym/:gymId', async (req, res) => {
  try {
    const { gymId } = req.params;
    console.log('Fetching gym details for ID:', gymId);

    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ success: false, message: 'Invalid gym ID' });
    }

    // Get gym basic information
    const gym = await Gym.findById(gymId).lean();
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }
    console.log('Found gym:', gym.name);

    // Get comprehensive gym statistics
    console.log('Starting aggregation queries...');
    const [
      memberStats,
      staffStats,
      invoiceStats,
      nutritionPlanStats,
      workoutPlanStats,
      assignedWorkoutPlanStats,
      trainerStats,
      attendanceStats,
      revenueStats,
      expenseStats,
      leadStats,
      retailStats
    ] = await Promise.all([
      // Member statistics
      Customer.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        {
          $facet: {
            totalMembers: [{ $count: "count" }],
            activeMembers: [
              { $match: { membershipEndDate: { $gte: new Date() } } },
              { $count: "count" }
            ],
            inactiveMembers: [
              { $match: { membershipEndDate: { $lt: new Date() } } },
              { $count: "count" }
            ],
            newMembersThisMonth: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $count: "count" }
            ]
          }
        }
      ]),

      // Staff statistics
      GymStaff.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        {
          $facet: {
            totalStaff: [{ $count: "count" }],
            activeStaff: [
              { $match: { status: 'active' } },
              { $count: "count" }
            ]
          }
        }
      ]),

      // Invoice statistics
      Invoice.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        {
          $facet: {
            totalInvoices: [{ $count: "count" }],
            totalAmount: [
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            paidInvoices: [
              { $match: { status: 'paid' } },
              { $count: "count" }
            ],
            pendingInvoices: [
              { $match: { status: 'pending' } },
              { $count: "count" }
            ],
            thisMonthInvoices: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $count: "count" }
            ]
          }
        }
      ]),


      // Nutrition plan statistics
      NutritionPlan.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        {
          $facet: {
            totalNutritionPlans: [{ $count: "count" }],
            thisMonthPlans: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $count: "count" }
            ]
          }
        }
      ]),

      // Workout plan statistics
      WorkoutPlan.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        {
          $facet: {
            totalWorkoutPlans: [{ $count: "count" }],
            thisMonthPlans: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $count: "count" }
            ]
          }
        }
      ]),

      // Assigned workout plan statistics
      AssignedWorkoutPlan.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        {
          $facet: {
            totalAssignedPlans: [{ $count: "count" }]
          }
        }
      ]),

      // Trainer statistics
      Trainer.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        {
          $facet: {
            totalTrainers: [{ $count: "count" }],
            activeTrainers: [
              { $match: { status: 'active' } },
              { $count: "count" }
            ]
          }
        }
      ]),

      // Attendance statistics
      GymAttendance.aggregate([
        {
          $facet: {
            totalAttendance: [
              { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
              { $count: "count" }
            ],
            todayAttendance: [
              { 
                $match: { 
                  gymId: new mongoose.Types.ObjectId(gymId),
                  markedAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                  }
                }
              },
              { $count: "count" }
            ],
            thisMonthAttendance: [
              { 
                $match: { 
                  gymId: new mongoose.Types.ObjectId(gymId),
                  markedAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $count: "count" }
            ]
          }
        }
      ]),

      // Revenue statistics
      Transaction.aggregate([
        {
          $facet: {
            totalRevenue: [
              { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            thisMonthRevenue: [
              {
                $match: {
                  gymId: new mongoose.Types.ObjectId(gymId),
                  transactionDate: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            todayRevenue: [
              {
                $match: {
                  gymId: new mongoose.Types.ObjectId(gymId),
                  transactionDate: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                  }
                }
              },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ]
          }
        }
      ]),

      // Expense statistics
      Expense.aggregate([
        {
          $facet: {
            totalExpenses: [
              { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            thisMonthExpenses: [
              {
                $match: {
                  gymId: new mongoose.Types.ObjectId(gymId),
                  date: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ],
            todayExpenses: [
              {
                $match: {
                  gymId: new mongoose.Types.ObjectId(gymId),
                  date: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                  }
                }
              },
              { $group: { _id: null, total: { $sum: "$amount" } } }
            ]
          }
        }
      ]),

      // Lead statistics
      Lead.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        {
          $facet: {
            totalLeads: [{ $count: "count" }],
            convertedLeads: [
              { $match: { status: 'converted' } },
              { $count: "count" }
            ],
            thisMonthLeads: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $count: "count" }
            ]
          }
        }
      ]),

      // Retail sales statistics
      RetailSale.aggregate([
        {
          $facet: {
            totalRetailSales: [
              { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
              { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ],
            thisMonthRetailSales: [
              {
                $match: {
                  gymId: new mongoose.Types.ObjectId(gymId),
                  saleDate: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ],
            todayRetailSales: [
              {
                $match: {
                  gymId: new mongoose.Types.ObjectId(gymId),
                  saleDate: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                  }
                }
              },
              { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]
          }
        }
      ])
    ]);
    console.log('Aggregation queries completed successfully');

    // Process the aggregated data
    const memberData = memberStats[0];
    const staffData = staffStats[0];
    const invoiceData = invoiceStats[0];
    const nutritionData = nutritionPlanStats[0];
    const workoutData = workoutPlanStats[0];
    const assignedWorkoutPlanData = assignedWorkoutPlanStats[0];
    const trainerData = trainerStats[0];
    const attendanceData = attendanceStats[0];
    const revenueData = revenueStats[0];
    const expenseData = expenseStats[0];
    const leadData = leadStats[0];
    const retailData = retailStats[0];

    // Calculate subscription status
    const now = new Date();
    let subscriptionStatus = 'registered';
    if (gym.subscriptionStartDate && gym.subscriptionEndDate) {
      if (new Date(gym.subscriptionStartDate) <= now && now <= new Date(gym.subscriptionEndDate)) {
        subscriptionStatus = 'active';
      } else {
        subscriptionStatus = 'expired';
      }
    }

    const result = {
      success: true,
      data: {
        gym: {
          ...gym,
          subscriptionStatus
        },
        statistics: {
          members: {
            total: memberData.totalMembers[0]?.count || 0,
            active: memberData.activeMembers[0]?.count || 0,
            inactive: memberData.inactiveMembers[0]?.count || 0,
            newThisMonth: memberData.newMembersThisMonth[0]?.count || 0
          },
          staff: {
            total: staffData.totalStaff[0]?.count || 0,
            active: staffData.activeStaff[0]?.count || 0
          },
          invoices: {
            total: invoiceData.totalInvoices[0]?.count || 0,
            totalAmount: invoiceData.totalAmount[0]?.total || 0,
            paid: invoiceData.paidInvoices[0]?.count || 0,
            pending: invoiceData.pendingInvoices[0]?.count || 0,
            thisMonth: invoiceData.thisMonthInvoices[0]?.count || 0
          },
          nutritionPlans: {
            total: nutritionData.totalNutritionPlans[0]?.count || 0,
            thisMonth: nutritionData.thisMonthPlans[0]?.count || 0
          },
          workoutPlans: {
            total: workoutData.totalWorkoutPlans[0]?.count || 0,
            thisMonth: workoutData.thisMonthPlans[0]?.count || 0
          },
          assignedWorkoutPlans: {
            total: assignedWorkoutPlanData.totalAssignedPlans[0]?.count || 0
          },
          trainers: {
            total: trainerData.totalTrainers[0]?.count || 0,
            active: trainerData.activeTrainers[0]?.count || 0
          },
          attendance: {
            total: attendanceData.totalAttendance[0]?.count || 0,
            today: attendanceData.todayAttendance[0]?.count || 0,
            thisMonth: attendanceData.thisMonthAttendance[0]?.count || 0
          },
          revenue: {
            total: revenueData.totalRevenue[0]?.total || 0,
            thisMonth: revenueData.thisMonthRevenue[0]?.total || 0,
            today: revenueData.todayRevenue[0]?.total || 0
          },
          expenses: {
            total: expenseData.totalExpenses[0]?.total || 0,
            thisMonth: expenseData.thisMonthExpenses[0]?.total || 0,
            today: expenseData.todayExpenses[0]?.total || 0
          },
          leads: {
            total: leadData.totalLeads[0]?.count || 0,
            converted: leadData.convertedLeads[0]?.count || 0,
            thisMonth: leadData.thisMonthLeads[0]?.count || 0
          },
          retail: {
            totalSales: retailData.totalRetailSales[0]?.total || 0,
            thisMonthSales: retailData.thisMonthRetailSales[0]?.total || 0,
            todaySales: retailData.todayRetailSales[0]?.total || 0
          }
        }
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Admin gym detail error:', error);
    res.status(500).json({ success: false, message: 'Error fetching gym detail data', error: error.message });
  }
});

// Get users by industry for overview
router.get('/users-by-industry', async (req, res) => {
  try {
    const industryStats = await User.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 },
          gymCount: { $addToSet: '$gymId' }
        }
      },
      {
        $project: {
          industry: '$_id',
          count: 1,
          gymCount: { $size: '$gymCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: industryStats
    });
  } catch (error) {
    console.error('Industry stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching industry statistics', error: error.message });
  }
});

module.exports = router;
