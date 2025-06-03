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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, paidAmount } = req.body;

    // Validate status
    if (status && !['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paidAmount) updateData.paidAmount = paidAmount;

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('customerId', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    });
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

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice._id}.pdf`);
    doc.pipe(res);

    // Add logo or company name
    doc.fontSize(24)
       .fillColor('#2563eb') // Blue color
       .text('FlexCRM', { align: 'right' });
    
    doc.fontSize(12)
       .fillColor('#6b7280') // Gray color
       .text('123 Fitness Street', { align: 'right' })
       .text('Mumbai, India', { align: 'right' })
       .text('Phone: +91 1234567890', { align: 'right' })
       .text('Email: info@flexcrm.com', { align: 'right' })
       .moveDown(2);

    // Invoice title and number
    doc.fontSize(20)
       .fillColor('#111827') // Dark gray
       .text('INVOICE', { align: 'left' });
    
    doc.fontSize(12)
       .fillColor('#6b7280')
       .text(`Invoice #: ${invoice._id}`, { align: 'left' })
       .text(`Date: ${format(new Date(invoice.createdAt), 'PPP')}`, { align: 'left' })
       .text(`Due Date: ${format(new Date(invoice.dueDate), 'PPP')}`, { align: 'left' })
       .moveDown(2);

    // Customer details
    doc.fontSize(14)
       .fillColor('#111827')
       .text('Bill To:', { align: 'left' });
    
    doc.fontSize(12)
       .fillColor('#374151') // Medium gray
       .text(invoice.customerId.name, { align: 'left' })
       .text(invoice.customerId.email, { align: 'left' })
       .moveDown(2);

    // Booking details
    doc.fontSize(14)
       .fillColor('#111827')
       .text('Booking Details:', { align: 'left' });
    
    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Type: ${invoice.bookingId.type.replace('_', ' ').toUpperCase()}`, { align: 'left' })
       .text(`Date: ${format(new Date(invoice.bookingId.startTime), 'PPP')}`, { align: 'left' })
       .text(`Time: ${format(new Date(invoice.bookingId.startTime), 'p')} - ${format(new Date(invoice.bookingId.endTime), 'p')}`, { align: 'left' })
       .moveDown(2);

    // Items table header
    const tableTop = doc.y;
    doc.fontSize(12)
       .fillColor('#111827')
       .text('Description', 50, tableTop)
       .text('Quantity', 250, tableTop)
       .text('Unit Price', 350, tableTop)
       .text('Amount', 450, tableTop);

    // Draw table header line
    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .strokeColor('#e5e7eb') // Light gray
       .stroke();

    // Table rows
    let y = tableTop + 30;
    invoice.items.forEach(item => {
      doc.fontSize(12)
         .fillColor('#374151')
         .text(item.description, 50, y)
         .text(item.quantity.toString(), 250, y)
         .text(`${invoice.currency} ${item.unitPrice.toFixed(2)}`, 350, y)
         .text(`${invoice.currency} ${item.amount.toFixed(2)}`, 450, y);
      y += 25;
    });

    // Draw table bottom line
    doc.moveTo(50, y)
       .lineTo(550, y)
       .strokeColor('#e5e7eb')
       .stroke();

    // Total section
    doc.moveDown(2)
       .fontSize(14)
       .fillColor('#111827')
       .text(`Total Amount: ${invoice.currency} ${invoice.amount.toFixed(2)}`, { align: 'right' })
       .moveDown(1)
       .fontSize(12)
       .fillColor('#6b7280')
       .text(`Status: ${invoice.status.toUpperCase()}`, { align: 'right' });

    // Payment instructions
    doc.moveDown(3)
       .fontSize(12)
       .fillColor('#111827')
       .text('Payment Instructions:', { align: 'left' })
       .moveDown(0.5)
       .fontSize(11)
       .fillColor('#6b7280')
       .text('Please make the payment within 7 days of the invoice date.', { align: 'left' })
       .text('Bank: Example Bank', { align: 'left' })
       .text('Account: 1234567890', { align: 'left' })
       .text('IFSC: EXBK0001234', { align: 'left' });

    // Footer
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text('Thank you for your business!', 50, 750, { align: 'center', width: 500 })
       .text('This is a computer-generated invoice, no signature required.', 50, 765, { align: 'center', width: 500 });

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
