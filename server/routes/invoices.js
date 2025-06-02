const express = require('express');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

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

// Generate invoice PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('bookingId', 'type startTime endTime');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice._id}.pdf`);
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(25).text('Invoice', { align: 'center' });
    doc.moveDown();
    
    // Customer details
    doc.fontSize(12).text(`Customer: ${invoice.customerId.name}`);
    doc.text(`Email: ${invoice.customerId.email}`);
    doc.moveDown();

    // Booking details
    doc.text(`Booking Type: ${invoice.bookingId.type}`);
    doc.text(`Date: ${format(new Date(invoice.bookingId.startTime), 'PPP')}`);
    doc.text(`Time: ${format(new Date(invoice.bookingId.startTime), 'p')} - ${format(new Date(invoice.bookingId.endTime), 'p')}`);
    doc.moveDown();

    // Items table
    doc.text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Table headers
    const tableTop = doc.y;
    doc.text('Description', 50, tableTop);
    doc.text('Quantity', 250, tableTop);
    doc.text('Unit Price', 350, tableTop);
    doc.text('Amount', 450, tableTop);
    doc.moveDown();

    // Table rows
    let y = doc.y;
    invoice.items.forEach(item => {
      doc.text(item.description, 50, y);
      doc.text(item.quantity.toString(), 250, y);
      doc.text(`${invoice.currency} ${item.unitPrice.toFixed(2)}`, 350, y);
      doc.text(`${invoice.currency} ${item.amount.toFixed(2)}`, 450, y);
      y += 20;
    });

    // Total
    doc.moveDown();
    doc.text(`Total Amount: ${invoice.currency} ${invoice.amount.toFixed(2)}`, { align: 'right' });
    doc.text(`Due Date: ${format(new Date(invoice.dueDate), 'PPP')}`, { align: 'right' });
    doc.text(`Status: ${invoice.status.toUpperCase()}`, { align: 'right' });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ message: 'Error updating invoice status' });
  }
});

module.exports = router;
