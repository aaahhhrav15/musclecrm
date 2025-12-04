const CrmSubscriptionPayment = require('../models/CrmSubscriptionPayment');
const Gym = require('../models/Gym');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const mongoose = require('mongoose');

const buildAdminPaymentQuery = ({ status, subscriptionType, gymId, search }) => {
  const query = {};

  if (status) {
    query.status = status;
  }

  if (subscriptionType) {
    query.subscriptionType = subscriptionType;
  }

  if (gymId && mongoose.Types.ObjectId.isValid(gymId)) {
    query.gymId = gymId;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { gymName: regex },
      { customerName: regex },
      { customerEmail: regex },
      { customerPhone: regex },
      { razorpay_order_id: regex },
      { razorpay_payment_id: regex }
    ];
  }

  return query;
};

// Create a new CRM subscription payment record
const createCrmSubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionType,
      gymId,
      gymName,
      customerName,
      customerPhone,
      customerEmail,
      notes
    } = req.body;

    // Get subscription plan details
    const plan = await SubscriptionPlan.findOne({ 
      duration: subscriptionType === 'Yearly' ? 'yearly' : 'monthly' 
    });

    if (!plan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription plan not found' 
      });
    }

    // Calculate subscription dates
    const now = new Date();
    let endDate;
    if (subscriptionType === 'Yearly') {
      endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1);
    } else {
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
    }

    const paymentData = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: plan.price,
      currency: 'INR',
      subscriptionType,
      subscriptionDuration: subscriptionType === 'Yearly' ? '1 year' : '1 month',
      subscriptionStartDate: now,
      subscriptionEndDate: endDate,
      gymId,
      gymName,
      customerName,
      customerPhone,
      customerEmail,
      status: 'paid',
      notes: notes || ''
    };

    const payment = await CrmSubscriptionPayment.create(paymentData);

    res.status(201).json({
      success: true,
      message: 'CRM subscription payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error creating CRM subscription payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment record',
      error: error.message
    });
  }
};

// Get all CRM subscription payments for a gym
const getCrmSubscriptionPayments = async (req, res) => {
  try {
    const gymId = req.gymId;
    const { page = 1, limit = 10, status, subscriptionType } = req.query;

    const query = { gymId };
    if (status) query.status = status;
    if (subscriptionType) query.subscriptionType = subscriptionType;

    const payments = await CrmSubscriptionPayment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CrmSubscriptionPayment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching CRM subscription payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};

// Get CRM subscription payment by ID
const getCrmSubscriptionPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const gymId = req.gymId;

    const payment = await CrmSubscriptionPayment.findOne({ 
      _id: id, 
      gymId: gymId 
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching CRM subscription payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details',
      error: error.message
    });
  }
};

// Get CRM subscription payment statistics
const getCrmSubscriptionPaymentStats = async (req, res) => {
  try {
    const gymId = req.gymId;

    const stats = await CrmSubscriptionPayment.aggregate([
      { $match: { gymId: mongoose.Types.ObjectId(gymId) } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          monthlyPayments: {
            $sum: {
              $cond: [{ $eq: ['$subscriptionType', 'Monthly'] }, 1, 0]
            }
          },
          yearlyPayments: {
            $sum: {
              $cond: [{ $eq: ['$subscriptionType', 'Yearly'] }, 1, 0]
            }
          },
          paidPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, 1, 0]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      monthlyPayments: 0,
      yearlyPayments: 0,
      paidPayments: 0,
      failedPayments: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching CRM subscription payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statistics',
      error: error.message
    });
  }
};

// Get current active subscription
const getCurrentActiveSubscription = async (req, res) => {
  try {
    const gymId = req.gymId;
    const now = new Date();

    const activeSubscription = await CrmSubscriptionPayment.findOne({
      gymId: gymId,
      status: 'paid',
      subscriptionStartDate: { $lte: now },
      subscriptionEndDate: { $gte: now }
    }).sort({ createdAt: -1 });

    if (!activeSubscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      data: activeSubscription
    });
  } catch (error) {
    console.error('Error fetching current active subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active subscription',
      error: error.message
    });
  }
};

// Admin: Get CRM subscription payments across all gyms
const getAllCrmSubscriptionPaymentsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, subscriptionType, gymId, search } = req.query;

    const query = buildAdminPaymentQuery({ status, subscriptionType, gymId, search });

    const payments = await CrmSubscriptionPayment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const total = await CrmSubscriptionPayment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: parseInt(page, 10),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching CRM subscription payments (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CRM subscription payments',
      error: error.message
    });
  }
};

// Admin: Get CRM subscription payments for a specific gym
const getCrmSubscriptionPaymentsForGymAdmin = async (req, res) => {
  try {
    const { gymId } = req.params;
    const { page = 1, limit = 20, status, subscriptionType, search } = req.query;

    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gym ID'
      });
    }

    const query = buildAdminPaymentQuery({
      status,
      subscriptionType,
      gymId,
      search
    });

    const payments = await CrmSubscriptionPayment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const total = await CrmSubscriptionPayment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: parseInt(page, 10),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching CRM subscription payments for gym (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CRM subscription payments for gym',
      error: error.message
    });
  }
};

module.exports = {
  createCrmSubscriptionPayment,
  getCrmSubscriptionPayments,
  getCrmSubscriptionPaymentById,
  getCrmSubscriptionPaymentStats,
  getCurrentActiveSubscription,
  getAllCrmSubscriptionPaymentsAdmin,
  getCrmSubscriptionPaymentsForGymAdmin
};
