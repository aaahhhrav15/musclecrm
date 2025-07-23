const PersonalTrainingAssignment = require('../models/PersonalTrainingAssignment');
const Customer = require('../models/Customer');
const Trainer = require('../models/Trainer');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Gym = require('../models/Gym'); // Add at top if not present

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// List all assignments for a gym
exports.getAssignments = async (req, res) => {
  try {
    const { gymId } = req.query;
    const assignments = await PersonalTrainingAssignment.find(gymId ? { gymId } : {})
      .populate('customerId', 'name email phone') // <-- add phone here
      .populate('trainerId', 'name email');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new assignment
exports.createAssignment = async (req, res) => {
  try {
    const { customerId, trainerId, gymId, startDate, duration, fees } = req.body;
    if (!customerId || !trainerId || !gymId || !startDate || !duration || !fees) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if customer has an active membership
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    if (!customer.membershipEndDate || new Date(customer.membershipEndDate) < new Date()) {
      return res.status(400).json({ error: 'Cannot assign personal training. Customer does not have an active membership.' });
    }

    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(duration));
    end.setDate(end.getDate() - 1); // End date is the day before the same date next period

    // Create the assignment
    const assignment = new PersonalTrainingAssignment({
      customerId,
      trainerId,
      gymId,
      startDate: start,
      duration,
      endDate: end,
      fees,
      notes: req.body.notes || ''
    });
    await assignment.save();

    // Populate trainer details
    const populatedAssignment = await PersonalTrainingAssignment.findById(assignment._id)
      .populate('trainerId', 'name email phone dateOfBirth specialization experience status bio clients gymId');

    // Update customer's personalTrainer field with full assignment
    await Customer.findByIdAndUpdate(customerId, {
      personalTrainer: populatedAssignment
    });

    // Generate invoice for personal training
    const gym = await Gym.findById(gymId);
    if (!gym) return res.status(400).json({ error: 'Gym not found' });
    const gymCode = gym.gymCode;
    const invoiceCounter = gym.invoiceCounter || 1;
    const invoiceNumber = `${gymCode}${String(invoiceCounter).padStart(6, '0')}`;
    const dateRange = start && end ? ` (${formatDate(start)} to ${formatDate(end)})` : '';
    const invoice = new Invoice({
      userId: req.user._id, // User ID from auth middleware
      gymId,
      customerId,
      invoiceNumber,
      amount: fees,
      currency: 'INR',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      items: [{
        description: `Personal Training with ${duration} month(s) duration${dateRange}`,
        quantity: 1,
        unitPrice: fees,
        amount: fees
      }],
      notes: `Personal training assignment for period${dateRange}`
    });
    await invoice.save();
    // Increment the gym's invoiceCounter
    gym.invoiceCounter = invoiceCounter + 1;
    await gym.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: customerId, // Set to customerId so transactions are linked to the customer
      gymId,
      invoiceId: invoice._id,
      transactionType: 'PERSONAL_TRAINING',
      transactionDate: new Date(),
      amount: fees,
      paymentMode: 'cash', // Default payment mode
      description: `Personal training fees for ${duration} month(s)${dateRange}`,
      status: 'SUCCESS'
    });
    await transaction.save();

    // Update customer's totalSpent
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { totalSpent: fees }
    });

    res.status(201).json({
      assignment: populatedAssignment,
      invoice: invoice,
      transaction: transaction
    });
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update an assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, trainerId, gymId, startDate, duration, fees } = req.body;
    
    if (!customerId || !trainerId || !gymId || !startDate || !duration || !fees) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(duration));
    end.setDate(end.getDate() - 1); // End date is the day before the same date next period

    const assignment = await PersonalTrainingAssignment.findByIdAndUpdate(
      id,
      {
        customerId,
        trainerId,
        gymId,
        startDate: start,
        duration,
        endDate: end,
        fees,
        notes: req.body.notes || ''
      },
      { new: true }
    ).populate('customerId', 'name email phone')
     .populate('trainerId', 'name email');

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Update customer's personalTrainer field with full assignment
    await Customer.findByIdAndUpdate(customerId, {
      personalTrainer: assignment
    });

    // Update the most recent related invoice (if any)
    const invoice = await Invoice.findOne({
      customerId,
      gymId,
      'items.description': /Personal Training/
    }).sort({ createdAt: -1 });
    if (invoice) {
      const dateRange = start && end ? ` (${formatDate(start)} to ${formatDate(end)})` : '';
      invoice.amount = fees;
      invoice.dueDate = end;
      invoice.items = [{
        description: `Personal Training with ${duration} month(s) duration${dateRange}`,
        quantity: 1,
        unitPrice: fees,
        amount: fees
      }];
      invoice.notes = `Personal training assignment for period${dateRange}`;
      await invoice.save();
    }

    // Update the most recent related transaction (if any)
    const transaction = await Transaction.findOne({
      userId: customerId,
      gymId,
      transactionType: 'PERSONAL_TRAINING'
    }).sort({ createdAt: -1 });
    if (transaction) {
      transaction.amount = fees;
      transaction.description = `Personal training fees for ${duration} month(s)`;
      transaction.transactionDate = new Date();
      await transaction.save();
    }

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await PersonalTrainingAssignment.findById(id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Remove personalTrainer from customer
    await Customer.findByIdAndUpdate(assignment.customerId, {
      $unset: { personalTrainer: 1 }
    });

    // Delete all related invoices
    await Invoice.deleteMany({
      customerId: assignment.customerId,
      gymId: assignment.gymId,
      'items.description': /Personal Training/
    });

    // Delete all related transactions
    await Transaction.deleteMany({
      userId: assignment.customerId,
      gymId: assignment.gymId,
      transactionType: { $in: ['PERSONAL_TRAINING', 'PERSONAL_TRAINING_RENEWAL'] }
    });

    // Delete the assignment
    await PersonalTrainingAssignment.findByIdAndDelete(id);

    res.json({ message: 'Assignment deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Renew an assignment
exports.renewAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, duration, endDate, fees, gymId, paymentMode, transactionDate } = req.body;
    if (!startDate || !duration || !endDate || !fees || !gymId) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Find the assignment to get the customerId
    const assignment = await PersonalTrainingAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    // Check if customer has an active membership
    const customer = await Customer.findById(assignment.customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    if (!customer.membershipEndDate || new Date(customer.membershipEndDate) < new Date()) {
      return res.status(400).json({ error: 'Cannot renew personal training. Customer does not have an active membership.' });
    }

    // Determine renewal period
    let renewalStart, renewalEnd;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentEnd = new Date(assignment.endDate);
    currentEnd.setHours(0, 0, 0, 0);
    let invoicePeriodStart, invoicePeriodEnd;
    if (currentEnd >= now) {
      // PT is active, keep original start date for assignment, but invoice should only cover the new period
      renewalStart = new Date(assignment.startDate);
      renewalEnd = new Date(currentEnd);
      renewalEnd.setMonth(renewalEnd.getMonth() + Number(duration));
      renewalEnd.setDate(renewalEnd.getDate()); // keep same day of month
      // Invoice period: day after current end to new end
      invoicePeriodStart = new Date(currentEnd);
      invoicePeriodStart.setDate(invoicePeriodStart.getDate() + 1);
      invoicePeriodEnd = new Date(renewalEnd);
    } else {
      // PT is not active, use provided startDate
      renewalStart = new Date(startDate);
      renewalEnd = new Date(renewalStart);
      renewalEnd.setMonth(renewalEnd.getMonth() + Number(duration));
      renewalEnd.setDate(renewalEnd.getDate() - 1);
      // Invoice period: full new assignment
      invoicePeriodStart = new Date(renewalStart);
      invoicePeriodEnd = new Date(renewalEnd);
    }
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    const invoiceDateRange = invoicePeriodStart && invoicePeriodEnd ? ` (${formatDate(invoicePeriodStart)} to ${formatDate(invoicePeriodEnd)})` : '';

    // Update the assignment
    const updatedAssignment = await PersonalTrainingAssignment.findByIdAndUpdate(
      id,
      {
        startDate: renewalStart,
        duration,
        endDate: renewalEnd,
        fees,
        notes: req.body.notes || ''
      },
      { new: true }
    ).populate('customerId', 'name email phone')
     .populate('trainerId', 'name email');

    if (!updatedAssignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Update customer's personalTrainer field with full assignment
    await Customer.findByIdAndUpdate(assignment.customerId._id || assignment.customerId, {
      personalTrainer: updatedAssignment
    });

    // Generate invoice for renewal
    const gym = await Gym.findById(gymId);
    if (!gym) return res.status(400).json({ error: 'Gym not found' });
    const gymCode = gym.gymCode;
    const invoiceCounter = gym.invoiceCounter || 1;
    const invoiceNumber = `${gymCode}${String(invoiceCounter).padStart(6, '0')}`;
    const invoice = new Invoice({
      userId: req.user._id,
      gymId,
      customerId: assignment.customerId._id || assignment.customerId,
      invoiceNumber,
      amount: fees,
      currency: 'INR',
      dueDate: renewalEnd,
      items: [{
        description: `Personal Training Renewal (${duration} month(s))${invoiceDateRange}`,
        quantity: duration,
        unitPrice: fees / duration,
        amount: fees
      }],
      notes: `Personal training renewal for period${invoiceDateRange}`
    });
    await invoice.save();
    // Increment the gym's invoiceCounter
    gym.invoiceCounter = invoiceCounter + 1;
    await gym.save();

    // Create transaction record
    const txn = new Transaction({
      userId: assignment.customerId._id || assignment.customerId,
      gymId,
      invoiceId: invoice._id,
      transactionType: 'PERSONAL_TRAINING_RENEWAL',
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      amount: fees,
      paymentMode: paymentMode || 'cash',
      membershipType: 'none',
      description: `Personal training renewal for ${duration} month(s)${invoiceDateRange}` ,
      status: 'SUCCESS'
    });
    await txn.save();

    // Update customer's totalSpent
    await Customer.findByIdAndUpdate(assignment.customerId._id || assignment.customerId, {
      $inc: { totalSpent: fees }
    });

    // Fetch the latest updated assignment to ensure frontend gets the correct endDate
    const latestAssignment = await PersonalTrainingAssignment.findById(id)
      .populate('customerId', 'name email phone')
      .populate('trainerId', 'name email');

    res.status(200).json({
      assignment: latestAssignment,
      invoice,
      transaction: txn
    });
  } catch (err) {
    console.error('Error renewing assignment:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get assignments expiring today or in the next 7 days
exports.getExpiringAssignments = async (req, res) => {
  try {
    const { gymId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);
    const filter = {
      endDate: { $gte: today, $lte: sevenDaysFromNow }
    };
    if (gymId) filter.gymId = gymId;
    const assignments = await PersonalTrainingAssignment.find(filter)
      .populate('customerId', 'name email')
      .populate('trainerId', 'name email');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 