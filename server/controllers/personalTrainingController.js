const PersonalTrainingAssignment = require('../models/PersonalTrainingAssignment');
const Customer = require('../models/Customer');
const Trainer = require('../models/Trainer');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Gym = require('../models/Gym'); // Add at top if not present
const { capitalizeName } = require('../lib/nameUtils');

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
    const { customerId, trainerId, gymId, startDate, duration, durationMonths, durationDays, fees } = req.body;
    if (!customerId || !trainerId || !gymId || !startDate || !fees) {
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

    // Handle duration - support both old format (duration) and new format (durationMonths + durationDays)
    let months = 0;
    let days = 0;
    
    if (durationMonths !== undefined && durationDays !== undefined) {
      // New format
      months = Number(durationMonths) || 0;
      days = Number(durationDays) || 0;
    } else if (duration !== undefined) {
      // Old format - convert to new format
      months = Number(duration) || 0;
      days = 0;
    } else {
      return res.status(400).json({ error: 'Duration information is required (either duration or durationMonths + durationDays).' });
    }

    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    
    if (months > 0) {
      end.setMonth(end.getMonth() + months);
    }
    if (days > 0) {
      end.setDate(end.getDate() + days);
    }
    
    // Subtract 1 day to make end date inclusive
    end.setDate(end.getDate() - 1);

    // Create the assignment
    const assignment = new PersonalTrainingAssignment({
      customerId,
      trainerId,
      gymId,
      startDate: start,
      duration: months, // Keep for backward compatibility
      durationMonths: months,
      durationDays: days,
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
    
    // Create duration description
    let durationDescription = '';
    if (months > 0 && days > 0) {
      durationDescription = `${months} month(s) and ${days} day(s)`;
    } else if (months > 0) {
      durationDescription = `${months} month(s)`;
    } else if (days > 0) {
      durationDescription = `${days} day(s)`;
    } else {
      durationDescription = '1 day';
    }
    
    const invoice = new Invoice({
      userId: req.user._id, // User ID from auth middleware
      gymId,
      customerId,
      customerName: capitalizeName(customer.name || ''),
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      invoiceNumber,
      amount: fees,
      currency: 'INR',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      items: [{
        description: `Personal Training with ${durationDescription} duration${dateRange}`,
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
      description: `Personal training fees for ${durationDescription}${dateRange}`,
      status: 'SUCCESS'
    });
    await transaction.save();

    // Update customer's totalSpent by recalculating from all transactions
    try {
      const transactions = await Transaction.find({ userId: customerId });
      const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      await Customer.findByIdAndUpdate(customerId, {
        totalSpent: totalSpent
      });
      console.log(`Updated totalSpent for customer ${customer.name}: ${totalSpent}`);
    } catch (error) {
      console.error('Error updating customer totalSpent:', error);
      // Don't fail the assignment creation if totalSpent update fails
    }

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
    const { customerId, trainerId, gymId, startDate, duration, durationMonths, durationDays, fees } = req.body;
    
    if (!customerId || !trainerId || !gymId || !startDate || !fees) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Capture original assignment to get old fees
    const originalAssignment = await PersonalTrainingAssignment.findById(id);
    if (!originalAssignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    const originalFees = originalAssignment.fees || 0;

    // Handle duration - support both old format (duration) and new format (durationMonths + durationDays)
    let months = 0;
    let days = 0;
    
    if (durationMonths !== undefined && durationDays !== undefined) {
      // New format
      months = Number(durationMonths) || 0;
      days = Number(durationDays) || 0;
    } else if (duration !== undefined) {
      // Old format - convert to new format
      months = Number(duration) || 0;
      days = 0;
    } else {
      return res.status(400).json({ error: 'Duration information is required (either duration or durationMonths + durationDays).' });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    
    if (months > 0) {
      end.setMonth(end.getMonth() + months);
    }
    if (days > 0) {
      end.setDate(end.getDate() + days);
    }
    
    // Subtract 1 day to make end date inclusive
    end.setDate(end.getDate() - 1);

    const assignment = await PersonalTrainingAssignment.findByIdAndUpdate(
      id,
      {
        customerId,
        trainerId,
        gymId,
        startDate: start,
        duration: months, // Keep for backward compatibility
        durationMonths: months,
        durationDays: days,
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
      
      // Create duration description
      let durationDescription = '';
      if (months > 0 && days > 0) {
        durationDescription = `${months} month(s) and ${days} day(s)`;
      } else if (months > 0) {
        durationDescription = `${months} month(s)`;
      } else if (days > 0) {
        durationDescription = `${days} day(s)`;
      } else {
        durationDescription = '1 day';
      }
      
      invoice.amount = fees;
      invoice.dueDate = end;
      invoice.items = [{
        description: `Personal Training with ${durationDescription} duration${dateRange}`,
        quantity: 1,
        unitPrice: fees,
        amount: fees
      }];
      invoice.notes = `Personal training assignment for period${dateRange}`;
      await invoice.save();
    }

    // Create modification transaction if fees changed
    if (fees !== originalFees) {
      const feeDifference = fees - originalFees;
      if (feeDifference !== 0) {
        try {
          // Create duration description
          let durationDescription = '';
          if (months > 0 && days > 0) {
            durationDescription = `${months} month(s) and ${days} day(s)`;
          } else if (months > 0) {
            durationDescription = `${months} month(s)`;
          } else if (days > 0) {
            durationDescription = `${days} day(s)`;
          } else {
            durationDescription = '1 day';
          }
          
          const description = `Personal training fees modified from ₹${originalFees} to ₹${fees} for ${durationDescription}`;
          
          const modificationTransaction = new Transaction({
            userId: customerId,
            gymId,
            transactionType: 'PERSONAL_TRAINING_MODIFICATION',
            transactionDate: new Date(),
            amount: feeDifference,
            paymentMode: 'cash', // Default payment mode
            description: description,
            status: 'SUCCESS'
          });
          
          await modificationTransaction.save();
          console.log(`Created personal training modification transaction: ${description}, difference: ₹${feeDifference}`);
        } catch (error) {
          console.error('Error creating personal training modification transaction:', error);
          // Don't fail the update if transaction creation fails
        }
      }
    }

    // Update customer's totalSpent by recalculating from all transactions
    try {
      const transactions = await Transaction.find({ userId: customerId });
      const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      await Customer.findByIdAndUpdate(customerId, {
        totalSpent: totalSpent
      });
      console.log(`Updated totalSpent for customer ${customerId}: ${totalSpent}`);
    } catch (error) {
      console.error('Error updating customer totalSpent:', error);
      // Don't fail the update if totalSpent update fails
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
    const { startDate, duration, durationMonths, durationDays, endDate, fees, gymId, paymentMode, transactionDate } = req.body;
    if (!startDate || !fees || !gymId) {
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

    // Handle duration - support both old format (duration) and new format (durationMonths + durationDays)
    let months = 0;
    let days = 0;
    
    if (durationMonths !== undefined && durationDays !== undefined) {
      // New format
      months = Number(durationMonths) || 0;
      days = Number(durationDays) || 0;
    } else if (duration !== undefined) {
      // Old format - convert to new format
      months = Number(duration) || 0;
      days = 0;
    } else {
      return res.status(400).json({ error: 'Duration information is required (either duration or durationMonths + durationDays).' });
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
      
      if (months > 0) {
        renewalEnd.setMonth(renewalEnd.getMonth() + months);
      }
      if (days > 0) {
        renewalEnd.setDate(renewalEnd.getDate() + days);
      }
      
      // Invoice period: day after current end to new end
      invoicePeriodStart = new Date(currentEnd);
      invoicePeriodStart.setDate(invoicePeriodStart.getDate() + 1);
      invoicePeriodEnd = new Date(renewalEnd);
    } else {
      // PT is not active, use provided startDate
      renewalStart = new Date(startDate);
      renewalEnd = new Date(renewalStart);
      
      if (months > 0) {
        renewalEnd.setMonth(renewalEnd.getMonth() + months);
      }
      if (days > 0) {
        renewalEnd.setDate(renewalEnd.getDate() + days);
      }
      
      // Subtract 1 day to make end date inclusive
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

    // Create duration description
    let durationDescription = '';
    if (months > 0 && days > 0) {
      durationDescription = `${months} month(s) and ${days} day(s)`;
    } else if (months > 0) {
      durationDescription = `${months} month(s)`;
    } else if (days > 0) {
      durationDescription = `${days} day(s)`;
    } else {
      durationDescription = '1 day';
    }

    // Update the assignment
    const updatedAssignment = await PersonalTrainingAssignment.findByIdAndUpdate(
      id,
      {
        startDate: renewalStart,
        duration: months, // Keep for backward compatibility
        durationMonths: months,
        durationDays: days,
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
      customerName: capitalizeName(customer.name || ''),
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      invoiceNumber,
      amount: fees,
      currency: 'INR',
      dueDate: renewalEnd,
      items: [{
        description: `Personal Training Renewal (${durationDescription})${invoiceDateRange}`,
        quantity: months > 0 ? months : 1,
        unitPrice: fees / (months > 0 ? months : 1),
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
      description: `Personal training renewal for ${durationDescription}${invoiceDateRange}`,
      status: 'SUCCESS'
    });
    await txn.save();

    // Update customer's totalSpent by recalculating from all transactions
    const customerId = assignment.customerId._id || assignment.customerId;
    try {
      const transactions = await Transaction.find({ userId: customerId });
      const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      await Customer.findByIdAndUpdate(customerId, {
        totalSpent: totalSpent
      });
      console.log(`Updated totalSpent for customer ${customerId}: ${totalSpent}`);
    } catch (error) {
      console.error('Error updating customer totalSpent:', error);
      // Don't fail the renewal if totalSpent update fails
    }

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