const GymBilling = require('../models/GymBilling');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Customer = require('../models/Customer');
const Gym = require('../models/Gym');
const mongoose = require('mongoose');

// Get gym billing summary for a specific month
const getGymBillingForMonth = async (req, res) => {
  try {
    const { gymId, year, month } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ success: false, message: 'Invalid gym ID' });
    }
    
    const billing = await GymBilling.getGymBillingForMonth(gymId, parseInt(year), parseInt(month));
    
    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        message: 'No billing found for this gym and month' 
      });
    }
    
    res.json({
      success: true,
      data: billing.getBillingSummary()
    });
  } catch (error) {
    console.error('Error fetching gym billing:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching gym billing', 
      error: error.message 
    });
  }
};

// Get all billing for a gym
const getGymAllBilling = async (req, res) => {
  try {
    const { gymId } = req.params;
    const { includeDetails } = req.query; // Optional query param to include full details
    
    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ success: false, message: 'Invalid gym ID' });
    }
    
    // If includeDetails is true, return full billing details in one query (avoids N+1 problem)
    if (includeDetails === 'true') {
      const billing = await GymBilling.find({ gymId })
        .sort({ billingYear: -1, billingMonth: -1 })
        .populate('memberBills.memberId', 'name email phone')
        .lean();
      
      // Transform the data to match the expected format
      const transformedBilling = billing.map(b => ({
        billingId: b.billingId,
        billingMonth: b.billingMonth,
        billingYear: b.billingYear,
        monthName: new Date(b.billingYear, b.billingMonth - 1).toLocaleDateString('en-US', { month: 'long' }),
        totalBillAmount: b.totalBillAmount,
        totalPaidAmount: b.totalPaidAmount,
        totalPendingAmount: b.totalPendingAmount,
        totalOverdueAmount: b.totalOverdueAmount,
        billingStatus: b.billingStatus,
        memberCount: b.memberBills?.length || 0,
        dueDate: b.dueDate,
        paymentDeadline: b.paymentDeadline,
        memberBills: b.memberBills?.map(bill => {
          const memberIdObj = bill.memberId;
          const memberId = typeof memberIdObj === 'object' && memberIdObj ? memberIdObj._id.toString() : (memberIdObj?.toString() || bill.memberId?.toString());
          const memberName = (typeof memberIdObj === 'object' && memberIdObj ? memberIdObj.name : null) || bill.memberName || 'Unknown Member';
          const memberEmail = (typeof memberIdObj === 'object' && memberIdObj ? memberIdObj.email : null) || bill.memberEmail || '';
          const memberPhone = (typeof memberIdObj === 'object' && memberIdObj ? memberIdObj.phone : null) || bill.memberPhone || '';
          
          return {
            memberId,
            memberName,
            memberEmail,
            memberPhone,
            membershipType: bill.membershipType || 'basic',
            membershipStartDate: bill.membershipStartDate || null,
            membershipEndDate: bill.membershipEndDate || null,
            daysActive: bill.daysActive || 0,
            daysInMonth: bill.daysInMonth || 30,
            fixedMonthlyFee: bill.originalMonthlyFee || bill.fixedMonthlyFee || 41.67,
            proRatedAmount: bill.monthlyFee || 0,
            isActive: bill.isActive !== undefined ? bill.isActive : true,
            originalMonthlyFee: bill.originalMonthlyFee || bill.fixedMonthlyFee || 41.67
          };
        }) || [],
        billingBreakdown: b.billingBreakdown,
        paymentHistory: b.paymentHistory || [],
        isFinalized: b.isFinalized || false,
        finalizedAt: b.finalizedAt
      }));
      
      res.json({
        success: true,
        data: transformedBilling
      });
    } else {
      // Return basic billing info only (original behavior)
      const billing = await GymBilling.find({ gymId })
        .sort({ billingYear: -1, billingMonth: -1 })
        .select('billingId billingMonth billingYear totalBillAmount totalPaidAmount totalPendingAmount billingStatus dueDate paymentDeadline createdAt')
        .lean();
      
      res.json({
        success: true,
        data: billing
      });
    }
  } catch (error) {
    console.error('Error fetching gym billing history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching gym billing history', 
      error: error.message 
    });
  }
};

// Get detailed billing for a specific billing ID
const getBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    
    const billing = await GymBilling.findOne({ billingId })
      .populate('memberBills.memberId', 'name email phone')
      .populate('gymId', 'name gymCode');
    
    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Billing not found' 
      });
    }
    
    res.json({
      success: true,
      data: billing
    });
  } catch (error) {
    console.error('Error fetching billing details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching billing details', 
      error: error.message 
    });
  }
};

// Create monthly billing for a gym
const createMonthlyBilling = async (req, res) => {
  try {
    const { gymId, billingMonth, billingYear, dueDate, paymentDeadline } = req.body;

    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ success: false, message: 'Invalid gym ID' });
    }

    // Ensure billing month is unique per gym/year/month combination
    const existingBilling = await GymBilling.getGymBillingForMonth(gymId, billingYear, billingMonth);
    if (existingBilling) {
      return res.status(400).json({
        success: false,
        message: 'Billing already exists for this month'
      });
    }

    // Get gym information
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Collect active members and their pro-rated billing details
    const { memberBills, totalBillAmount } = await calculateRealTimeBilling(gymId);

    if (!memberBills.length) {
      return res.status(400).json({
        success: false,
        message: 'No billable members found for this gym'
      });
    }

    const billing = new GymBilling({
      gymId,
      gymName: gym.name,
      billingMonth,
      billingYear,
      dueDate: new Date(dueDate),
      paymentDeadline: new Date(paymentDeadline),
      memberBills,
      totalBillAmount
    });

    // Calculate totals & persist
    billing.calculateTotals();
    await billing.save();

    res.json({
      success: true,
      message: 'Monthly billing created successfully',
      data: billing.getBillingSummary()
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.gymId) {
      return res.status(400).json({
        success: false,
        message: 'Billing already exists for this month'
      });
    }

    console.error('Error creating monthly billing:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating monthly billing',
      error: error.message
    });
  }
};

// Mark billing as PAID (full amount only - no partial payments)
const addPayment = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { paymentMethod, transactionId, description, processedBy } = req.body;
    
    const billing = await GymBilling.findOne({ billingId });
    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Billing not found' 
      });
    }
    
    // Check if already paid
    if (billing.billingStatus === 'fully_paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Billing is already marked as paid' 
      });
    }
    
    // Mark entire bill as PAID (full amount)
    billing.addPayment({
      amount: billing.totalBillAmount, // Always pay full amount
      paymentMethod,
      transactionId,
      description: description || `Full payment for ${billing.gymName} - ${billing.billingMonth}/${billing.billingYear}`,
      processedBy,
      paymentDate: new Date()
    });
    
    await billing.save();
    
    res.json({
      success: true,
      message: `Bill marked as PAID. Amount: ₹${billing.totalBillAmount}`,
      data: billing.getBillingSummary()
    });
  } catch (error) {
    console.error('Error marking payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error marking payment', 
      error: error.message 
    });
  }
};

// Get billing statistics for admin dashboard
const getBillingStatistics = async (req, res) => {
  try {
    const { gymId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({ success: false, message: 'Invalid gym ID' });
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Get current month billing
    const currentBilling = await GymBilling.getGymBillingForMonth(gymId, currentYear, currentMonth);
    
    // Get total paid amount till now
    const totalPaidResult = await GymBilling.aggregate([
      { $match: { gymId: new mongoose.Types.ObjectId(gymId) } },
      { $group: { _id: null, totalPaid: { $sum: '$totalPaidAmount' } } }
    ]);
    
    // Get billing history for last 12 months
    const billingHistory = await GymBilling.find({ gymId })
      .sort({ billingYear: -1, billingMonth: -1 })
      .limit(12)
      .select('billingMonth billingYear totalBillAmount totalPaidAmount billingStatus');
    
    const statistics = {
      currentMonth: {
        totalBill: currentBilling ? currentBilling.totalBillAmount : 0,
        totalPaid: currentBilling ? currentBilling.totalPaidAmount : 0,
        totalPending: currentBilling ? currentBilling.totalPendingAmount : 0,
        billingStatus: currentBilling ? currentBilling.billingStatus : 'no_billing'
      },
      totalPaidTillNow: totalPaidResult[0]?.totalPaid || 0,
      billingHistory: billingHistory.map(billing => ({
        month: billing.billingMonth,
        year: billing.billingYear,
        totalBill: billing.totalBillAmount,
        totalPaid: billing.totalPaidAmount,
        status: billing.billingStatus
      }))
    };
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching billing statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching billing statistics', 
      error: error.message 
    });
  }
};

// Get all pending and overdue bills
const getPendingBills = async (req, res) => {
  try {
    const pendingBills = await GymBilling.getPendingBills();
    const overdueBills = await GymBilling.getOverdueBills();
    
    res.json({
      success: true,
      data: {
        pending: pendingBills,
        overdue: overdueBills
      }
    });
  } catch (error) {
    console.error('Error fetching pending bills:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pending bills', 
      error: error.message 
    });
  }
};

// Update billing status
const updateBillingStatus = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { status, notes } = req.body;
    
    const billing = await GymBilling.findOne({ billingId });
    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Billing not found' 
      });
    }
    
    billing.billingStatus = status;
    if (notes) {
      billing.notes = notes;
    }
    
    await billing.save();
    
    res.json({
      success: true,
      message: 'Billing status updated successfully',
      data: billing.getBillingSummary()
    });
  } catch (error) {
    console.error('Error updating billing status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating billing status', 
      error: error.message 
    });
  }
};

// Get current month billing for gym users (REAL-TIME CALCULATION - NOT STORED IN DB)
const getCurrentMonthBilling = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based, but our model uses 1-based
    
    const gymId = req.gymId;
    
    console.log(`\n=== GETTING CURRENT MONTH BILLING (REAL-TIME) ===`);
    console.log(`Gym ID: ${gymId}`);
    console.log(`Current Year: ${currentYear}, Current Month: ${currentMonth}`);
    console.log(`Today: ${now.toDateString()}`);
    
    // Get gym information to check creation date
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }
    
    const gymCreatedAt = new Date(gym.createdAt);
    const gymCreatedYear = gymCreatedAt.getFullYear();
    const gymCreatedMonth = gymCreatedAt.getMonth() + 1;
    
    console.log(`Gym Created: ${gymCreatedAt.toDateString()}`);
    console.log(`Gym Created Year: ${gymCreatedYear}, Month: ${gymCreatedMonth}`);
    
    // Check if current month is before gym creation
    if (currentYear < gymCreatedYear || (currentYear === gymCreatedYear && currentMonth < gymCreatedMonth)) {
      console.log(`Current month ${currentMonth}/${currentYear} is before gym creation ${gymCreatedMonth}/${gymCreatedYear}`);
      return res.json({ 
        success: true, 
        billing: null,
        monthName: now.toLocaleString('default', { month: 'long' }),
        message: 'Gym was not active during this month'
      });
    }
    
    // IMPORTANT: For current month, calculate in real-time - DO NOT fetch from DB
    console.log('Calculating current month billing in real-time (not from DB)');
    const billing = await calculateCurrentMonthBillingRealTime(gymId, currentYear, currentMonth, gym.name);
    
    if (billing) {
      const billingSummary = {
        billingId: `CURRENT-${gym.name.substring(0, 3).toUpperCase()}-${currentYear}${currentMonth.toString().padStart(2, '0')}`,
        gymName: gym.name,
        billingMonth: currentMonth,
        billingYear: currentYear,
        monthName: now.toLocaleString('default', { month: 'long' }),
        totalMembers: billing.memberBills.length,
        totalBillAmount: billing.totalBillAmount,
        totalPaidAmount: 0, // Current month has no payments yet (will be added when stored)
        totalPendingAmount: billing.totalBillAmount,
        totalOverdueAmount: 0,
        billingStatus: 'draft', // Current month is always draft until finalized
        dueDate: new Date(currentYear, currentMonth, 0), // Last day of current month
        paymentDeadline: new Date(currentYear, currentMonth, 0),
        billingBreakdown: billing.billingBreakdown,
        memberBills: billing.memberBills,
        paymentHistory: [], // Empty for current month as no payments yet
        isFinalized: false,
        isRealTime: true // Flag to indicate this is real-time calculation
      };
      
      res.json({ 
        success: true, 
        billing: billingSummary,
        monthName: now.toLocaleString('default', { month: 'long' })
      });
    } else {
      res.json({ 
        success: true, 
        billing: null,
        monthName: now.toLocaleString('default', { month: 'long' }),
        message: 'No active members for current month'
      });
    }
  } catch (error) {
    console.error('Error fetching current month billing:', error);
    res.status(500).json({ success: false, message: 'Error fetching current month billing' });
  }
};

// Get monthly billing for gym users
const getMonthlyBilling = async (req, res) => {
  try {
    const { year, month } = req.params;
    const gymId = req.gymId;
    
    const billing = await GymBilling.getGymBillingForMonth(gymId, parseInt(year), parseInt(month));
    
    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        message: 'No billing found for this month' 
      });
    }
    
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
    
    res.json({ 
      success: true, 
      billing: billing.getBillingSummary(),
      monthName: monthName
    });
  } catch (error) {
    console.error('Error fetching monthly billing:', error);
    res.status(500).json({ success: false, message: 'Error fetching monthly billing' });
  }
};

// Get billing history for gym users
const getBillingHistory = async (req, res) => {
  try {
    const { months } = req.query;
    const monthsToFetch = parseInt(months) || 6;
    const gymId = req.gymId;
    
    // Get gym information to check creation date
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gym not found' 
      });
    }
    
    const now = new Date();
    const billingHistory = [];
    
    // Calculate how many months to fetch based on gym creation date
    const gymCreatedAt = new Date(gym.createdAt);
    const gymCreatedYear = gymCreatedAt.getFullYear();
    const gymCreatedMonth = gymCreatedAt.getMonth() + 1; // Convert to 1-based month
    
    console.log(`\n=== BILLING HISTORY FOR GYM: ${gym.name} (FINALIZED MONTHS ONLY) ===`);
    console.log(`Gym Created: ${gymCreatedAt.toDateString()}`);
    console.log(`Gym Created Year: ${gymCreatedYear}, Month: ${gymCreatedMonth}`);
    
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Calculate months from gym creation to now (excluding current month)
    const monthsFromCreation = (now.getFullYear() - gymCreatedYear) * 12 + (now.getMonth() + 1) - gymCreatedMonth;
    const actualMonthsToFetch = Math.min(monthsToFetch, Math.max(1, monthsFromCreation));
    
    console.log(`Months from creation: ${monthsFromCreation}`);
    console.log(`Actual months to fetch: ${actualMonthsToFetch} (excluding current month)`);
    
    // Start from previous month (i=1 to skip current month)
    for (let i = 1; i <= actualMonthsToFetch; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const monthName = targetDate.toLocaleString('default', { month: 'long' });
      
      // Skip months before gym creation
      if (year < gymCreatedYear || (year === gymCreatedYear && month < gymCreatedMonth)) {
        console.log(`Skipping ${monthName} ${year} - before gym creation`);
        continue;
      }
      
      // Skip current month (should never happen with i starting at 1, but safety check)
      if (year === currentYear && month === currentMonth) {
        console.log(`Skipping ${monthName} ${year} - current month (not finalized yet)`);
        continue;
      }
      
      // Fetch billing from database (finalized or not for backward compatibility)
      const billing = await GymBilling.findOne({
        gymId: gymId,
        billingYear: year,
        billingMonth: month
      });
      
      if (billing) {
        const summary = billing.getBillingSummary();
        summary.memberBills = billing.memberBills || [];
        summary.isFinalized = billing.isFinalized || false;
        summary.finalizedAt = billing.finalizedAt || null;
        billingHistory.push({
          month: month,
          year: year,
          monthName: monthName,
          billingId: summary.billingId,
          totalBillAmount: summary.totalBillAmount,
          totalPaidAmount: summary.totalPaidAmount,
          totalPendingAmount: summary.totalPendingAmount,
          totalOverdueAmount: summary.totalOverdueAmount,
          billingStatus: summary.billingStatus,
          memberCount: summary.totalMembers,
          dueDate: summary.dueDate,
          paymentDeadline: summary.paymentDeadline,
          memberBills: summary.memberBills,
          billingBreakdown: summary.billingBreakdown,
          paymentHistory: summary.paymentHistory || [],
          isFinalized: billing.isFinalized || false,
          finalizedAt: billing.finalizedAt || null
        });
      } else {
        // For historical months without finalized billing, return empty data
        console.log(`No finalized billing for ${monthName} ${year}`);
        billingHistory.push({
          month: month,
          year: year,
          monthName: monthName,
          billingId: null,
          totalBillAmount: 0,
          totalPaidAmount: 0,
          totalPendingAmount: 0,
          totalOverdueAmount: 0,
          billingStatus: 'no_billing',
          memberCount: 0,
          dueDate: null,
          paymentDeadline: null,
          memberBills: [],
          billingBreakdown: {},
          isFinalized: false,
          finalizedAt: null
        });
      }
    }
    
    res.json({ success: true, billingHistory });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ success: false, message: 'Error fetching billing history' });
  }
};

// Get billing analytics for gym users
const getBillingAnalytics = async (req, res) => {
  try {
    const gymId = req.gymId;
    
    // Get billing data for last 6 months
    const now = new Date();
    const analytics = {
      totalRevenue: 0,
      totalMembers: 0,
      averageMonthlyRevenue: 0,
      monthlyBreakdown: [],
      membershipTypeBreakdown: {
        basic: { count: 0, revenue: 0 },
        premium: { count: 0, revenue: 0 },
        vip: { count: 0, revenue: 0 },
        personal_training: { count: 0, revenue: 0 }
      }
    };
    
    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const monthName = targetDate.toLocaleString('default', { month: 'long' });
      
      const billing = await GymBilling.getGymBillingForMonth(gymId, year, month);
      
      if (billing) {
        const summary = billing.getBillingSummary();
        analytics.totalRevenue += summary.totalBillAmount;
        analytics.totalMembers += summary.totalMembers;
        
        analytics.monthlyBreakdown.push({
          month: month,
          year: year,
          monthName: monthName,
          revenue: summary.totalBillAmount,
          members: summary.totalMembers,
          paid: summary.totalPaidAmount,
          pending: summary.totalPendingAmount,
          overdue: summary.totalOverdueAmount
        });
        
        // Update membership type breakdown
        Object.keys(summary.billingBreakdown).forEach(type => {
          const breakdown = summary.billingBreakdown[type];
          analytics.membershipTypeBreakdown[type].count += breakdown.count;
          analytics.membershipTypeBreakdown[type].revenue += breakdown.totalAmount;
        });
      }
    }
    
    analytics.averageMonthlyRevenue = analytics.monthlyBreakdown.length > 0 
      ? analytics.totalRevenue / analytics.monthlyBreakdown.length 
      : 0;
    
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching billing analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching billing analytics' });
  }
};

// Mark gym billing as PAID (for gym users - full amount only)
const addGymPayment = async (req, res) => {
  try {
    const { billingId, paymentMethod, transactionId, description } = req.body;
    const gymId = req.gymId;
    
    const billing = await GymBilling.findOne({ 
      billingId: billingId,
      gymId: gymId 
    });
    
    if (!billing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Billing not found' 
      });
    }
    
    // Check if already paid
    if (billing.billingStatus === 'fully_paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Billing is already marked as paid' 
      });
    }
    
    // Mark entire bill as PAID (full amount)
    const paymentData = {
      amount: billing.totalBillAmount, // Always pay full amount
      paymentMethod: paymentMethod || 'cash',
      transactionId: transactionId || `PAY_${Date.now()}`,
      description: description || `Full payment for ${billing.monthName} ${billing.billingYear}`,
      paymentDate: new Date(),
      processedBy: gymId // Gym itself is processing
    };
    
    billing.addPayment(paymentData);
    await billing.save();
    
    res.json({ 
      success: true, 
      message: `Bill marked as PAID. Amount: ₹${billing.totalBillAmount}`,
      billing: billing.getBillingSummary() 
    });
  } catch (error) {
    console.error('Error marking payment:', error);
    res.status(500).json({ success: false, message: 'Error marking payment' });
  }
};

// Razorpay: Create order for a gym billing (full amount, server-trusted amount)
const createRazorpayOrderForBilling = async (req, res) => {
  try {
    const { billingId } = req.params;
    const gymId = req.gymId || req.adminId || null;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Razorpay credentials not configured' });
    }

    const billing = await GymBilling.findOne({ billingId });
    if (!billing) {
      return res.status(404).json({ success: false, message: 'Billing not found' });
    }

    if (billing.billingStatus === 'fully_paid') {
      return res.status(400).json({ success: false, message: 'Billing already paid' });
    }

    // Production safety: always compute payable amount on server
    const amountInPaise = Math.round((billing.totalBillAmount - (billing.totalPaidAmount || 0)) * 100);
    if (amountInPaise <= 0) {
      return res.status(400).json({ success: false, message: 'No payable amount for this bill' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: billingId,
      notes: {
        billingMonth: String(billing.billingMonth),
        billingYear: String(billing.billingYear)
      }
    };

    const order = await razorpay.orders.create(orderOptions);
    return res.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Error creating Razorpay order for billing:', error);
    return res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

// Razorpay: Verify payment and mark billing paid
const verifyRazorpayPaymentForBilling = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid Razorpay response' });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    const billing = await GymBilling.findOne({ billingId });
    if (!billing) {
      return res.status(404).json({ success: false, message: 'Billing not found' });
    }

    // Mark as paid (full payment). If you support partials, adjust accordingly.
    const paymentData = {
      amount: billing.totalBillAmount - (billing.totalPaidAmount || 0),
      paymentMethod: 'online',
      transactionId: razorpay_payment_id,
      description: `Razorpay payment for ${billing.monthName} ${billing.billingYear}`,
      paymentDate: new Date(),
      processedBy: req.gymId || req.adminId || 'system'
    };

    billing.addPayment(paymentData);
    await billing.save();

    return res.json({ success: true, message: 'Payment verified and bill marked as paid', billing: billing.getBillingSummary() });
  } catch (error) {
    console.error('Error verifying Razorpay payment for billing:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};
// Helper function to calculate current month billing in real-time (NOT STORED IN DB)
async function calculateCurrentMonthBillingRealTime(gymId, year, month, gymName) {
  try {
    // Get active customers for current month with pro-rated billing
    const activeCustomers = await getActiveCustomersForMonthWithProRatedBilling(gymId, year, month);
    
    console.log(`Real-time calculation: ${activeCustomers.length} active customers`);
    
    if (activeCustomers.length === 0) {
      return null;
    }
    
    // Create member bills with pro-rated amounts (including daysActive)
    const memberBills = activeCustomers.map(customer => ({
      memberId: customer._id,
      memberName: customer.name,
      memberEmail: customer.email || '',
      memberPhone: customer.phone || '',
      membershipType: customer.membershipType || 'basic',
      monthlyFee: customer.proRatedAmount || 0,
      notes: customer.notes || '',
      daysActive: customer.daysActive || 0, // Store days active for current month
      daysInMonth: customer.daysInMonth || 30,
      originalMonthlyFee: customer.fixedMonthlyFee || 41.67
    }));
    
    // Calculate totals
    let totalBillAmount = 0;
    const billingBreakdown = {
      basic: { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
      premium: { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
      vip: { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
      personal_training: { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 }
    };
    
    memberBills.forEach(bill => {
      totalBillAmount += bill.monthlyFee;
      
      if (billingBreakdown[bill.membershipType]) {
        billingBreakdown[bill.membershipType].count += 1;
        billingBreakdown[bill.membershipType].totalAmount += bill.monthlyFee;
        billingBreakdown[bill.membershipType].pendingAmount += bill.monthlyFee;
      }
    });
    
    console.log(`Real-time billing calculated: ${totalBillAmount} for ${memberBills.length} members`);
    
    return {
      memberBills,
      totalBillAmount,
      billingBreakdown
    };
  } catch (error) {
    console.error('Error calculating real-time billing:', error);
    throw error;
  }
}

// Helper function to create monthly billing (STORES IN DB - ONLY FOR FINALIZED MONTHS)
async function createMonthlyBillingHelper(gymId, year, month) {
  const gym = await Gym.findById(gymId);
  if (!gym) {
    throw new Error('Gym not found');
  }
  
  // Get active customers for this month with pro-rated billing
  const activeCustomers = await getActiveCustomersForMonthWithProRatedBilling(gymId, year, month);
  
  console.log(`Active customers with pro-rated billing: ${activeCustomers.length}`);
  
  // Create member bills with pro-rated amounts
  const memberBills = activeCustomers.map(customer => ({
    memberId: customer._id,
    memberName: customer.name,
    memberEmail: customer.email || '', // No filler email
    memberPhone: customer.phone || '', // No filler phone
    membershipType: customer.membershipType || 'basic', // Keep original membershipType
    monthlyFee: customer.proRatedAmount || 0, // Use pro-rated amount
    notes: customer.notes || '',
    daysActive: customer.daysActive || 0,
    daysInMonth: customer.daysInMonth || 30,
    originalMonthlyFee: customer.fixedMonthlyFee || 41.67 // Use fixed fee
  }));
  
  // Calculate due date (last day of the month)
  const dueDate = new Date(year, month, 0); // Last day of the month
  const paymentDeadline = new Date(year, month, 0); // Last day of the month
  
  const billing = new GymBilling({
    gymId: gymId,
    gymName: gym.name,
    billingMonth: month,
    billingYear: year,
    memberBills: memberBills,
    dueDate: dueDate,
    paymentDeadline: paymentDeadline,
    billingStatus: 'sent'
  });
  
  // Calculate totals
  billing.calculateTotals();
  
  console.log(`Final billing created:`, {
    totalMembers: billing.totalMembers,
    totalBillAmount: billing.totalBillAmount,
    memberBillsCount: billing.memberBills.length
  });
  
  return await billing.save();
}

// Helper function to update existing monthly billing
async function updateMonthlyBilling(billing, year, month) {
  // Get current active customers with pro-rated billing
  const activeCustomers = await getActiveCustomersForMonthWithProRatedBilling(billing.gymId, year, month);
  
  // Update member bills with pro-rated amounts
  const memberBills = activeCustomers.map(customer => ({
    memberId: customer._id,
    memberName: customer.name,
    memberEmail: customer.email || '', // No filler email
    memberPhone: customer.phone || '', // No filler phone
    membershipType: customer.membershipType || 'basic', // Keep original membershipType
    monthlyFee: customer.proRatedAmount || 0, // Use pro-rated amount
    notes: customer.notes || '',
    daysActive: customer.daysActive || 0,
    daysInMonth: customer.daysInMonth || 30,
    originalMonthlyFee: customer.fixedMonthlyFee || 41.67 // Use fixed fee
  }));
  
  billing.memberBills = memberBills;
  billing.calculateTotals();
  
  return await billing.save();
}

// Helper function to get active customers for a specific month
async function getActiveCustomersForMonth(gymId, year, month) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // Last day of the month
  
  const customers = await Customer.find({
    gymId: gymId,
    membershipStartDate: { $exists: true, $ne: null },
    $or: [
      // Customer started before or during this month and ends after this month
      {
        membershipStartDate: { $lte: monthEnd },
        membershipEndDate: { $gte: monthStart }
      },
      // Customer started during this month (regardless of end date)
      {
        membershipStartDate: { $gte: monthStart, $lte: monthEnd }
      },
      // Customer has no end date (ongoing membership)
      {
        membershipStartDate: { $lte: monthEnd },
        membershipEndDate: { $exists: false }
      }
    ]
  });
  
  return customers;
}

// Helper function to get active customers with pro-rated billing calculation
async function getActiveCustomersForMonthWithProRatedBilling(gymId, year, month) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // Last day of the month
  const today = new Date();
  
  // Normalize dates to start of day
  monthStart.setHours(0, 0, 0, 0);
  monthEnd.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  console.log(`\n=== DEBUGGING BILLING FOR GYM ${gymId} ===`);
  console.log(`Month: ${year}-${month}, Month Start: ${monthStart}, Month End: ${monthEnd}`);
  console.log(`Today: ${today}`);
  
  // For current month, use today's date as the end date for calculation
  const calculationEndDate = (year === today.getFullYear() && month === today.getMonth() + 1) 
    ? today 
    : monthEnd;
  
  console.log(`Calculation End Date: ${calculationEndDate}`);
  
  // First, let's see all customers for this gym
  const allCustomers = await Customer.find({ gymId: gymId });
  console.log(`Total customers found for gym: ${allCustomers.length}`);
  
  // Check customer details
  allCustomers.forEach((customer, index) => {
    console.log(`Customer ${index + 1}:`, {
      name: customer.name,
      membershipType: customer.membershipType,
      membershipFees: customer.membershipFees,
      membershipStartDate: customer.membershipStartDate,
      membershipEndDate: customer.membershipEndDate,
      joinDate: customer.joinDate
    });
  });
  
  // Updated query to focus only on subscription dates (ignore fees)
  const customers = await Customer.find({
    gymId: gymId,
    membershipStartDate: { $exists: true, $ne: null },
    $or: [
      // Customer started before or during this month and ends after this month
      {
        membershipStartDate: { $lte: monthEnd },
        membershipEndDate: { $gte: monthStart }
      },
      // Customer started during this month (regardless of end date)
      {
        membershipStartDate: { $gte: monthStart, $lte: monthEnd }
      },
      // Customer has no end date (ongoing membership)
      {
        membershipStartDate: { $lte: monthEnd },
        membershipEndDate: { $exists: false }
      }
    ]
  });
  
  console.log(`Customers matching billing criteria: ${customers.length}`);
  
  // Let's try a more flexible approach - get all customers and filter manually
  const allCustomersForGym = await Customer.find({ gymId: gymId });
  console.log(`All customers for gym: ${allCustomersForGym.length}`);
  
  // Filter customers based only on subscription dates (ignore fees)
  const customersFiltered = allCustomersForGym.filter(customer => {
    // Only check if customer has start date (ignore fees and membershipType)
    const hasStartDate = customer.membershipStartDate;
    
    // Customer should be billed if they have a start date
    const shouldBeBilled = hasStartDate;
    
    console.log(`Customer ${customer.name}:`, {
      hasStartDate,
      shouldBeBilled,
      membershipType: customer.membershipType,
      membershipFees: customer.membershipFees,
      membershipStartDate: customer.membershipStartDate,
      membershipEndDate: customer.membershipEndDate
    });
    
    return shouldBeBilled;
  });
  
  console.log(`Filtered customers: ${customersFiltered.length}`);
  
  // Now apply date filtering
  const customersWithDateFilter = customersFiltered.filter(customer => {
    const startDate = customer.membershipStartDate;
    const endDate = customer.membershipEndDate;
    
    const isActiveInMonth = (
      // Customer started before or during this month and ends after this month
      (startDate <= monthEnd && (!endDate || endDate >= monthStart)) ||
      // Customer started during this month
      (startDate >= monthStart && startDate <= monthEnd) ||
      // Customer has no end date and started before or during this month
      (!endDate && startDate <= monthEnd)
    );
    
    console.log(`Customer ${customer.name} date filter:`, {
      startDate,
      endDate,
      monthStart,
      monthEnd,
      isActiveInMonth
    });
    
    return isActiveInMonth;
  });
  
  console.log(`Customers after date filtering: ${customersWithDateFilter.length}`);
  
  // Use the manually filtered customers
  const finalCustomers = customersWithDateFilter;
  
  // Fixed monthly fee for all customers (₹500 per year = ₹41.67 per month)
  const FIXED_MONTHLY_FEE = 41.67; // ₹500/12 = ₹41.67 per month per customer
  
  // Calculate pro-rated billing for each customer
  const customersWithProRatedBilling = finalCustomers.map(customer => {
    // Calculate the actual period the customer was active in this month
    const customerStartInMonth = new Date(Math.max(customer.membershipStartDate, monthStart));
    const customerEndInMonth = new Date(Math.min(
      customer.membershipEndDate || calculationEndDate, 
      calculationEndDate
    ));
    
    // Normalize dates to start of day to avoid time-related calculation issues
    customerStartInMonth.setHours(0, 0, 0, 0);
    customerEndInMonth.setHours(0, 0, 0, 0);
    
    // Edge case: If start date is after end date, customer wasn't active
    if (customerStartInMonth > customerEndInMonth) {
      console.log(`Customer ${customer.name} was not active in this month (start after end)`);
      return {
        ...customer.toObject(),
        daysActive: 0,
        daysInMonth: new Date(year, month, 0).getDate(),
        proRatedAmount: 0,
        fixedMonthlyFee: FIXED_MONTHLY_FEE
      };
    }
    
    // Calculate days active in this month (inclusive of both start and end dates)
    // Use a more accurate calculation that considers actual dates
    const timeDiff = customerEndInMonth.getTime() - customerStartInMonth.getTime();
    const daysActive = Math.max(1, Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1);
    
    // Get actual days in the month (28/29/30/31)
    const daysInMonth = new Date(year, month, 0).getDate(); // Last day of the month
    
    // Edge case handling: Ensure daysActive doesn't exceed daysInMonth
    const finalDaysActive = Math.min(daysActive, daysInMonth);
    
    // Calculate pro-rated amount using fixed fee
    const proRatedAmount = (FIXED_MONTHLY_FEE * finalDaysActive) / daysInMonth;
    
    console.log(`Customer ${customer.name} billing calculation:`, {
      membershipStartDate: customer.membershipStartDate,
      membershipEndDate: customer.membershipEndDate,
      customerStartInMonth: customerStartInMonth.toDateString(),
      customerEndInMonth: customerEndInMonth.toDateString(),
      monthStart: monthStart.toDateString(),
      monthEnd: monthEnd.toDateString(),
      calculationEndDate: calculationEndDate.toDateString(),
      timeDiff: timeDiff,
      rawDaysActive: daysActive,
      finalDaysActive: finalDaysActive,
      daysInMonth,
      fixedFee: FIXED_MONTHLY_FEE,
      proRatedAmount: Math.round(proRatedAmount * 100) / 100,
      formula: `(${FIXED_MONTHLY_FEE} * ${finalDaysActive}) / ${daysInMonth} = ${proRatedAmount}`,
      edgeCaseHandled: daysActive !== finalDaysActive ? `Days capped from ${daysActive} to ${finalDaysActive}` : 'No edge case',
      calculationMethod: `floor(timeDiff / (1000*60*60*24)) + 1 = ${daysActive} days`
    });
    
    return {
      ...customer.toObject(),
      daysActive: finalDaysActive,
      daysInMonth: daysInMonth,
      proRatedAmount: Math.round(proRatedAmount * 100) / 100, // Round to 2 decimal places
      customerStartInMonth: customerStartInMonth,
      customerEndInMonth: customerEndInMonth,
      fixedMonthlyFee: FIXED_MONTHLY_FEE
    };
  });
  
  console.log(`Final customers with pro-rated billing: ${customersWithProRatedBilling.length}`);
  customersWithProRatedBilling.forEach((customer, index) => {
    console.log(`Final Customer ${index + 1}:`, {
      name: customer.name,
      daysActive: customer.daysActive,
      proRatedAmount: customer.proRatedAmount,
      originalFee: customer.membershipFees
    });
  });
  
  return customersWithProRatedBilling;
}

// Get master monthly billing for all gyms (Admin only)
const getMasterMonthlyBilling = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthName = now.toLocaleString('default', { month: 'long' });
    
    // Get all gyms
    const gyms = await Gym.find();
    
    let masterBilling = {
      month: currentMonth,
      year: currentYear,
      monthName: monthName,
      totalGyms: gyms.length,
      totalRevenue: 0,
      totalMembers: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      gymBills: []
    };
    
    for (const gym of gyms) {
      console.log(`\n=== MASTER CRM BILLING FOR GYM: ${gym.name} (${gym._id}) ===`);
      
      // Check if gym was created before current month
      const gymCreatedAt = new Date(gym.createdAt);
      const gymCreatedYear = gymCreatedAt.getFullYear();
      const gymCreatedMonth = gymCreatedAt.getMonth() + 1;
      
      console.log(`Gym Created: ${gymCreatedAt.toDateString()}`);
      
      // Skip gyms that were created after current month
      if (currentYear < gymCreatedYear || (currentYear === gymCreatedYear && currentMonth < gymCreatedMonth)) {
        console.log(`Skipping gym ${gym.name} - created after current month`);
        continue;
      }
      
      // Get or create billing for this gym
      let billing = await GymBilling.getGymBillingForMonth(gym._id, currentYear, currentMonth);
      
      if (!billing) {
        console.log(`Creating new billing for gym ${gym.name}`);
        billing = await createMonthlyBillingHelper(gym._id, currentYear, currentMonth);
      } else {
        console.log(`Updating existing billing for gym ${gym.name}`);
        billing = await updateMonthlyBilling(billing, currentYear, currentMonth);
      }
      
      // Debug: Check the member bills data
      console.log(`Master CRM - Gym ${gym.name} member bills:`, billing.memberBills.map(bill => ({
        memberName: bill.memberName,
        daysActive: bill.daysActive,
        daysInMonth: bill.daysInMonth,
        monthlyFee: bill.monthlyFee,
        originalMonthlyFee: bill.originalMonthlyFee
      })));
      
      const billingSummary = billing.getBillingSummary();
      
      masterBilling.totalRevenue += billingSummary.totalBillAmount;
      masterBilling.totalMembers += billingSummary.totalMembers;
      masterBilling.totalPaid += billingSummary.totalPaidAmount;
      masterBilling.totalPending += billingSummary.totalPendingAmount;
      masterBilling.totalOverdue += billingSummary.totalOverdueAmount;
      
      masterBilling.gymBills.push({
        gymId: gym._id,
        gymName: gym.name,
        gymCode: gym.gymCode,
        gymOwner: gym.owner,
        gymEmail: gym.email,
        gymPhone: gym.phone,
        billingId: billingSummary.billingId,
        totalBillAmount: billingSummary.totalBillAmount,
        totalPaidAmount: billingSummary.totalPaidAmount,
        totalPendingAmount: billingSummary.totalPendingAmount,
        totalOverdueAmount: billingSummary.totalOverdueAmount,
        billingStatus: billingSummary.billingStatus,
        memberCount: billingSummary.totalMembers,
        dueDate: billingSummary.dueDate,
        paymentDeadline: billingSummary.paymentDeadline,
        billingBreakdown: billingSummary.billingBreakdown
      });
    }
    
    // Sort by total bill amount (highest first)
    masterBilling.gymBills.sort((a, b) => b.totalBillAmount - a.totalBillAmount);
    
    res.json({ success: true, masterBilling });
  } catch (error) {
    console.error('Error fetching master monthly billing:', error);
    res.status(500).json({ success: false, message: 'Error fetching master monthly billing' });
  }
};

// Finalize billing for previous month (called on 1st of each month)
const finalizePreviousMonthBilling = async (req, res) => {
  try {
    const now = new Date();
    const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // Handle January
    const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    console.log(`\n=== FINALIZING BILLING FOR ${previousYear}-${previousMonth} ===`);
    
    // Get all gyms
    const gyms = await Gym.find();
    let finalizedCount = 0;
    let errorCount = 0;
    
    for (const gym of gyms) {
      try {
        // Check if gym was created before the month being finalized
        const gymCreatedAt = new Date(gym.createdAt);
        const gymCreatedYear = gymCreatedAt.getFullYear();
        const gymCreatedMonth = gymCreatedAt.getMonth() + 1;
        
        // Skip gyms that were created after the month being finalized
        if (previousYear < gymCreatedYear || (previousYear === gymCreatedYear && previousMonth < gymCreatedMonth)) {
          console.log(`Skipping gym ${gym.name} - created after ${previousYear}-${previousMonth}`);
          continue;
        }
        
        // Check if billing exists for this gym and month
        const existingBilling = await GymBilling.findOne({
          gymId: gym._id,
          billingYear: previousYear,
          billingMonth: previousMonth,
          isFinalized: false
        });
        
        if (existingBilling) {
          // Finalize the billing
          await GymBilling.finalizeBillingForMonth(gym._id, previousYear, previousMonth);
          console.log(`✅ Finalized billing for gym: ${gym.name} (${previousYear}-${previousMonth})`);
          finalizedCount++;
        } else {
          // Create billing for this gym if it doesn't exist
          console.log(`📝 Creating billing for gym: ${gym.name} (${previousYear}-${previousMonth})`);
          await createMonthlyBillingHelper(gym._id, previousYear, previousMonth);
          
          // Then finalize it
          await GymBilling.finalizeBillingForMonth(gym._id, previousYear, previousMonth);
          console.log(`✅ Created and finalized billing for gym: ${gym.name} (${previousYear}-${previousMonth})`);
          finalizedCount++;
        }
      } catch (error) {
        console.error(`❌ Error finalizing billing for gym ${gym.name}:`, error.message);
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Billing finalization completed for ${previousYear}-${previousMonth}`,
      data: {
        previousYear,
        previousMonth,
        totalGyms: gyms.length,
        finalizedCount,
        errorCount,
        finalizedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error finalizing previous month billing:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error finalizing previous month billing', 
      error: error.message 
    });
  }
};

module.exports = {
  getGymBillingForMonth,
  getGymAllBilling,
  getBillingDetails,
  createMonthlyBilling,
  addPayment,
  getBillingStatistics,
  getPendingBills,
  updateBillingStatus,
  getCurrentMonthBilling,
  getMonthlyBilling,
  getBillingHistory,
  getBillingAnalytics,
  addGymPayment,
  getMasterMonthlyBilling,
  finalizePreviousMonthBilling,
  createRazorpayOrderForBilling,
  verifyRazorpayPaymentForBilling
};
