const express = require('express');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all invoices with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentStatus,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.user._id };

    // Add search query if provided
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add payment status filter if provided
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: sortOptions,
      populate: 'customerId'
    };

    const invoices = await Invoice.find(query, null, options);
    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      invoices,
      total
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices' });
  }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('customerId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoice' });
  }
});

// Create new invoice
router.post('/', auth, async (req, res) => {
  try {
    const {
      customerId,
      date,
      dueDate,
      items,
      tax,
      notes,
      paymentMethod
    } = req.body;

    // Verify customer exists and belongs to user
    const customer = await Customer.findOne({
      _id: customerId,
      userId: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const newInvoice = await Invoice.create({
      userId: req.user._id,
      customerId,
      date,
      dueDate,
      items,
      tax,
      notes,
      paymentMethod,
      subtotal: items.reduce((sum, item) => sum + item.amount, 0),
      total: items.reduce((sum, item) => sum + item.amount, 0) + tax,
      remainingAmount: items.reduce((sum, item) => sum + item.amount, 0) + tax
    });

    res.status(201).json({ success: true, invoice: newInvoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ success: false, message: 'Error creating invoice' });
  }
});

// Update invoice
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      date,
      dueDate,
      items,
      tax,
      notes,
      paymentMethod,
      status,
      paymentStatus,
      paidAmount
    } = req.body;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        date,
        dueDate,
        items,
        tax,
        notes,
        paymentMethod,
        status,
        paymentStatus,
        paidAmount,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        total: items.reduce((sum, item) => sum + item.amount, 0) + tax,
        remainingAmount: items.reduce((sum, item) => sum + item.amount, 0) + tax - (paidAmount || 0)
      },
      { new: true, runValidators: true }
    ).populate('customerId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ success: false, message: 'Error updating invoice' });
  }
});

// Delete invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ success: false, message: 'Error deleting invoice' });
  }
});

module.exports = router;
