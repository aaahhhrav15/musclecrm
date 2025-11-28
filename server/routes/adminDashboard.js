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
const GymBilling = require('../models/GymBilling');
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
        $lookup: {
          from: 'gymbillings',
          let: { gymId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$gymId', '$$gymId'] },
                    { $gt: ['$totalPendingAmount', 0] },
                    { $gt: ['$totalBillAmount', 0] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                pendingCount: { $sum: 1 }
              }
            }
          ],
          as: 'pendingBillingInfo'
        }
      },
      {
        $addFields: {
          pendingMonths: {
            $ifNull: [
              { $arrayElemAt: ['$pendingBillingInfo.pendingCount', 0] },
              0
            ]
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
          subscriptionStatus: 1,
          pendingMonths: 1
        }
      },
      { $unset: 'pendingBillingInfo' },
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

    // Calculate billing statistics - combine all billing queries in parallel
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Calculate current month billing in real-time for member details
    const FIXED_MONTHLY_FEE = 41.67; // ₹500/12 = ₹41.67 per month per customer
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);
    const today = new Date();
    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const calculationEndDate = (currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1) 
      ? today 
      : monthEnd;
    
    // Combine all billing-related queries in parallel
    const [
      currentBilling,
      activeCustomers,
      totalPaidResult,
      billingHistory,
      billingStats
    ] = await Promise.all([
      // Get current month billing (real-time calculation)
      GymBilling.getGymBillingForMonth(gymId, currentYear, currentMonth),
      
      // Get active customers for current month
      Customer.find({
        gymId: new mongoose.Types.ObjectId(gymId),
        membershipStartDate: { $exists: true, $ne: null },
        $or: [
          { membershipStartDate: { $lte: monthEnd }, membershipEndDate: { $gte: monthStart } },
          { membershipStartDate: { $gte: monthStart, $lte: monthEnd } },
          { membershipStartDate: { $lte: monthEnd }, membershipEndDate: { $exists: false } }
        ]
      }).lean(),
      
      // Get total paid till now (sum of all paid bills) - combined with billing history
      GymBilling.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        { $group: { _id: null, totalPaid: { $sum: '$totalPaidAmount' } } }
      ]),
      
      // Get billing history with pending/overdue info
      GymBilling.find({ gymId: new mongoose.Types.ObjectId(gymId) })
        .sort({ billingYear: -1, billingMonth: -1 })
        .select('billingMonth billingYear totalBillAmount totalPaidAmount totalPendingAmount totalOverdueAmount billingStatus')
        .lean(),
      
      // Get pending bills count and total pending amount (accurate calculation: billAmount - paidAmount)
      GymBilling.aggregate([
        { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
        {
          $facet: {
            pendingBills: [
              { $match: { billingStatus: { $in: ['sent', 'partial_paid', 'overdue', 'pending', 'draft'] } } },
              { 
                $group: { 
                  _id: null, 
                  count: { $sum: 1 }, 
                  totalPending: { 
                    $sum: { 
                      $subtract: ['$totalBillAmount', '$totalPaidAmount'] 
                    } 
                  } 
                } 
              }
            ],
            fullyPaidBills: [
              { $match: { billingStatus: 'fully_paid' } },
              { $group: { _id: null, count: { $sum: 1 } } }
            ]
          }
        }
      ])
    ]);
    
    // Calculate member billing details
    const memberBillingDetails = activeCustomers.map(customer => {
      const customerStartInMonth = new Date(Math.max(customer.membershipStartDate, monthStart));
      const customerEndInMonth = new Date(Math.min(
        customer.membershipEndDate || calculationEndDate,
        calculationEndDate
      ));
      customerStartInMonth.setHours(0, 0, 0, 0);
      customerEndInMonth.setHours(0, 0, 0, 0);
      
      const timeDiff = customerEndInMonth.getTime() - customerStartInMonth.getTime();
      const daysActive = Math.max(1, Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1);
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const finalDaysActive = Math.min(daysActive, daysInMonth);
      const proRatedAmount = (FIXED_MONTHLY_FEE * finalDaysActive) / daysInMonth;
      
      return {
        memberId: customer._id.toString(),
        memberName: customer.name || 'Unknown',
        memberEmail: customer.email || '',
        memberPhone: customer.phone || '',
        membershipStartDate: customer.membershipStartDate ? customer.membershipStartDate.toISOString() : null,
        membershipEndDate: customer.membershipEndDate ? customer.membershipEndDate.toISOString() : null,
        daysActive: finalDaysActive,
        daysInMonth: daysInMonth,
        fixedMonthlyFee: FIXED_MONTHLY_FEE,
        proRatedAmount: Math.round(proRatedAmount * 100) / 100,
        isActive: !customer.membershipEndDate || customer.membershipEndDate >= today
      };
    });
    
    // Calculate current month totals
    const currentMonthTotalBill = memberBillingDetails.reduce((sum, member) => sum + member.proRatedAmount, 0);
    const currentMonthTotalPaid = currentBilling ? currentBilling.totalPaidAmount : 0;
    const currentMonthTotalPending = Math.max(currentMonthTotalBill - currentMonthTotalPaid, 0);
    const currentMonthBillingStatus = currentBilling ? currentBilling.billingStatus : 'pending';
    const totalPaidTillNow = totalPaidResult[0]?.totalPaid || 0;
    
    // Extract billing statistics
    const pendingBillsData = billingStats[0]?.pendingBills[0] || { count: 0, totalPending: 0 };
    const fullyPaidBillsData = billingStats[0]?.fullyPaidBills[0] || { count: 0 };
    
    const totalPendingBills = pendingBillsData.count;
    // Calculate accurate pending amount: sum of (billAmount - paidAmount) for all unpaid bills
    const totalPendingAmount = pendingBillsData.totalPending || 0;
    const totalFullyPaidBills = fullyPaidBillsData.count;
    
    // Calculate total billed amount across all months
    const totalBilledAmount = billingHistory.reduce((sum, bill) => sum + (bill.totalBillAmount || 0), 0);

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
          },
          billing: {
            currentMonth: {
              totalBill: currentMonthTotalBill,
              totalPaid: currentMonthTotalPaid,
              totalPending: currentMonthTotalPending,
              billingStatus: currentMonthBillingStatus
            },
            totalPaidTillNow: totalPaidTillNow,
            totalBilledAmount: totalBilledAmount,
            totalPendingBills: totalPendingBills,
            totalPendingAmount: totalPendingAmount,
            totalFullyPaidBills: totalFullyPaidBills,
            billingHistory: billingHistory.map(billing => ({
              billingMonth: billing.billingMonth,
              billingYear: billing.billingYear,
              totalBillAmount: billing.totalBillAmount,
              totalPaidAmount: billing.totalPaidAmount,
              totalPendingAmount: billing.totalPendingAmount,
              totalOverdueAmount: billing.totalOverdueAmount,
              billingStatus: billing.billingStatus
            })),
            memberBillingDetails: memberBillingDetails
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
