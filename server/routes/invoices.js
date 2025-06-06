const express = require('express');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      bookingId,
      date,
      dueDate,
      items,
      tax,
      notes,
      paymentMethod,
      amount,
      currency,
      status
    } = req.body;
    
    // Verify customer exists and belongs to user
    const customer = await Customer.findOne({
      _id: customerId,
      userId: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Verify booking exists if provided
    if (bookingId) {
      const booking = await Booking.findOne({
        _id: bookingId,
        userId: req.user._id
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
    }
    
    const newInvoice = await Invoice.create({
      userId: req.user._id,
      customerId,
      bookingId,
      date,
      dueDate,
      items,
      tax,
      notes,
      paymentMethod,
      amount,
      currency,
      status,
      subtotal: items.reduce((sum, item) => sum + item.amount, 0),
      total: amount,
      remainingAmount: amount
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

// Generate PDF invoice
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    console.log('Attempting to generate PDF for invoice:', req.params.id);
    
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
      .populate('customerId', 'name email phone')
      .populate('bookingId', 'type startTime endTime');

    console.log('Found invoice:', invoice ? 'Yes' : 'No');
    
    if (!invoice) {
      console.log('Invoice not found');
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    console.log('Creating PDF document...');
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: 'FlexCRM',
        Subject: 'Invoice',
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    console.log('Adding content to PDF...');

    // Add content to the PDF
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    // Invoice details
    doc.fontSize(12);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    
    // Safely format dates
    const formatDate = (date) => {
      try {
        if (!date) return 'N/A';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return format(dateObj, 'dd/MM/yyyy');
      } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid Date';
      }
    };

    // Use createdAt as the invoice date
    doc.text(`Date: ${formatDate(invoice.createdAt)}`);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`);
    doc.moveDown();

    // Customer details
    doc.text('Bill To:');
    if (invoice.customerId) {
      console.log('Customer details:', invoice.customerId);
      doc.text(invoice.customerId.name || 'N/A');
      doc.text(invoice.customerId.email || 'N/A');
      if (invoice.customerId.phone) {
        doc.text(invoice.customerId.phone);
      }
    } else {
      console.log('No customer details available');
      doc.text('Customer information not available');
    }
    doc.moveDown();

    // Items table
    doc.text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    doc.text('Description', 50, tableTop);
    doc.text('Quantity', 300, tableTop);
    doc.text('Unit Price', 400, tableTop);
    doc.text('Amount', 500, tableTop);
    doc.moveDown();

    // Table rows
    let y = doc.y;
    if (invoice.items && Array.isArray(invoice.items)) {
      console.log('Adding items to PDF:', invoice.items.length);
      invoice.items.forEach(item => {
        doc.text(item.description, 50, y);
        doc.text(item.quantity.toString(), 300, y);
        doc.text(`${invoice.currency} ${item.unitPrice.toFixed(2)}`, 400, y);
        doc.text(`${invoice.currency} ${item.amount.toFixed(2)}`, 500, y);
        y += 20;
      });
    } else {
      console.log('No items found in invoice');
      doc.text('No items found', 50, y);
    }

    // Totals
    doc.moveDown(2);
    // Calculate subtotal from items
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    doc.text(`Subtotal: ${invoice.currency} ${subtotal.toFixed(2)}`, { align: 'right' });
    
    // Use the total amount from the invoice
    doc.text(`Total: ${invoice.currency} ${invoice.amount.toFixed(2)}`, { align: 'right' });

    // Notes
    if (invoice.notes) {
      doc.moveDown(2);
      doc.text('Notes:', { underline: true });
      doc.text(invoice.notes);
    }

    console.log('Finalizing PDF...');
    
    // Finalize the PDF
    doc.end();
    
    console.log('PDF generation completed successfully');
  } catch (error) {
    console.error('Generate PDF error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating PDF',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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