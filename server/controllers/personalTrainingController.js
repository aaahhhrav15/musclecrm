const PersonalTrainingAssignment = require('../models/PersonalTrainingAssignment');
const Customer = require('../models/Customer');
const Trainer = require('../models/Trainer');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');

// List all assignments for a gym
exports.getAssignments = async (req, res) => {
  try {
    const { gymId } = req.query;
    const assignments = await PersonalTrainingAssignment.find(gymId ? { gymId } : {})
      .populate('customerId', 'name email')
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
      fees
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
    const invoice = new Invoice({
      userId: req.user._id, // User ID from auth middleware
      gymId,
      customerId,
      amount: fees,
      currency: 'INR',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      items: [{
        description: `Personal Training with ${duration} month(s) duration`,
        quantity: 1,
        unitPrice: fees,
        amount: fees
      }],
      notes: `Personal training assignment starting ${start.toLocaleDateString()}`
    });
    await invoice.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: customerId, // Set to customerId so transactions are linked to the customer
      gymId,
      invoiceId: invoice._id,
      transactionType: 'PERSONAL_TRAINING',
      transactionDate: new Date(),
      amount: fees,
      paymentMode: 'cash', // Default payment mode
      description: `Personal training fees for ${duration} month(s)`,
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
        fees
      },
      { new: true }
    ).populate('customerId', 'name email phone')
     .populate('trainerId', 'name email');

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Update customer's personalTrainer field
    await Customer.findByIdAndUpdate(customerId, {
      personalTrainer: trainerId
    });

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

    // Delete the assignment
    await PersonalTrainingAssignment.findByIdAndDelete(id);

    res.json({ message: 'Assignment deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 