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

// Generate PDF invoice with enhanced beautiful design
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
    
    // Create PDF document with enhanced settings
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: 'FlexCRM',
        Subject: 'Professional Invoice',
        Creator: 'FlexCRM Invoice System',
        Producer: 'FlexCRM PDF Generator'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Enhanced Helper Functions
    const formatDate = (date) => {
      try {
        if (!date) return 'N/A';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return format(dateObj, 'MMM dd, yyyy');
      } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid Date';
      }
    };

    const formatCurrency = (amount, currency = 'USD') => {
      return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
    };

    // Modern Color Palette
    const colors = {
      primary: '#1e40af',      // Deep Blue
      secondary: '#3b82f6',    // Blue
      accent: '#06b6d4',       // Cyan
      success: '#10b981',      // Emerald
      warning: '#f59e0b',      // Amber
      danger: '#ef4444',       // Red
      dark: '#1f2937',         // Dark Gray
      medium: '#6b7280',       // Medium Gray
      light: '#f3f4f6',        // Light Gray
      white: '#ffffff',
      black: '#000000'
    };

    // Enhanced Helper Functions
    const drawGradient = (x, y, width, height, startColor, endColor) => {
      const gradient = doc.linearGradient(x, y, x + width, y + height);
      gradient.stop(0, startColor).stop(1, endColor);
      doc.rect(x, y, width, height).fill(gradient);
    };

    const drawShadowBox = (x, y, width, height, radius = 0, shadowOffset = 3) => {
      // Shadow
      doc.fillColor('#00000015')
         .rect(x + shadowOffset, y + shadowOffset, width, height, radius)
         .fill();
      
      // Main box
      doc.fillColor(colors.white)
         .rect(x, y, width, height, radius)
         .fill()
         .strokeColor(colors.light)
         .lineWidth(1)
         .rect(x, y, width, height, radius)
         .stroke();
    };

    const drawModernCard = (x, y, width, height, title, content, icon = null) => {
      drawShadowBox(x, y, width, height, 8);
      
      if (title) {
        doc.fillColor(colors.primary)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(title, x + 20, y + 15);
      }
      
      if (content) {
        doc.fillColor(colors.dark)
           .fontSize(10)
           .font('Helvetica')
           .text(content, x + 20, y + 35, {
             width: width - 40,
             align: 'left'
           });
      }
    };

    // Start drawing the invoice
    let currentY = 0;

    // Header Section with Modern Gradient
    drawGradient(0, 0, 595, 140, colors.primary, colors.secondary);
    
    // Decorative elements
    doc.fillColor('#ffffff20')
       .circle(520, 40, 60)
       .fill()
       .circle(480, 100, 30)
       .fill()
       .circle(550, 120, 20)
       .fill();

    // Company Logo Area (Placeholder for actual logo)
    doc.fillColor(colors.white)
       .rect(40, 25, 60, 60, 30)
       .fill()
       .fillColor(colors.primary)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('FC', 60, 48);

    // Company Information
    doc.fillColor(colors.white)
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('FLEXCRM', 120, 35);

    doc.fillColor('#ffffff90')
       .fontSize(11)
       .font('Helvetica')
       .text('Premium Fitness Management', 120, 65)
       .text('123 Fitness Street, Mumbai, India', 120, 80)
       .text('Phone: +91 1234567890 | Email: info@flexcrm.com', 120, 95);

    // Invoice Details Card
    drawShadowBox(360, 25, 200, 90, 12);
    
    doc.fillColor(colors.primary)
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('INVOICE', 380, 45);

    doc.fillColor(colors.dark)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Invoice Number:', 380, 70)
       .fillColor(colors.medium)
       .font('Helvetica')
       .text(invoice.invoiceNumber || 'N/A', 460, 70);

    doc.fillColor(colors.dark)
       .font('Helvetica-Bold')
       .text('Date:', 380, 85)
       .fillColor(colors.medium)
       .font('Helvetica')
       .text(formatDate(invoice.createdAt), 460, 85);

    doc.fillColor(colors.dark)
       .font('Helvetica-Bold')
       .text('Due Date:', 380, 100)
       .fillColor(colors.medium)
       .font('Helvetica')
       .text(formatDate(invoice.dueDate), 460, 100);

    currentY = 160;

    // Status Badge
    const statusColors = {
      'paid': colors.success,
      'pending': colors.warning,
      'cancelled': colors.danger,
      'draft': colors.medium
    };
    
    const statusColor = statusColors[invoice.status] || colors.medium;
    doc.fillColor(statusColor)
       .rect(40, currentY, 100, 25, 12)
       .fill()
       .fillColor(colors.white)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(invoice.status.toUpperCase(), 40, currentY + 8, {
         width: 100,
         align: 'center'
       });

    currentY += 50;

    // Customer and Booking Information Cards
    const cardHeight = 120;
    
    // Customer Information Card
    drawModernCard(40, currentY, 250, cardHeight, 'BILL TO');
    
    doc.fillColor(colors.dark)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(invoice.customerId?.name || 'N/A', 60, currentY + 40);

    doc.fillColor(colors.medium)
       .fontSize(10)
       .font('Helvetica')
       .text(`Email: ${invoice.customerId?.email || 'N/A'}`, 60, currentY + 60)
       .text(`Phone: ${invoice.customerId?.phone || 'N/A'}`, 60, currentY + 75);

    // Booking Information Card (if exists)
    if (invoice.bookingId) {
      drawModernCard(305, currentY, 250, cardHeight, 'BOOKING DETAILS');
      
      doc.fillColor(colors.dark)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(`Service: ${invoice.bookingId.type || 'N/A'}`, 325, currentY + 40);

      doc.fillColor(colors.medium)
         .fontSize(10)
         .font('Helvetica')
         .text(`Start: ${formatDate(invoice.bookingId.startTime)}`, 325, currentY + 60)
         .text(`End: ${formatDate(invoice.bookingId.endTime)}`, 325, currentY + 75);
    }

    currentY += cardHeight + 30;

    // Items Table with Modern Design
    const tableStartY = currentY;
    const tableWidth = 515;
    const rowHeight = 35;
    
    // Table Header
    drawGradient(40, tableStartY, tableWidth, 40, colors.primary, colors.secondary);
    
    doc.fillColor(colors.white)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('DESCRIPTION', 55, tableStartY + 15)
       .text('QTY', 300, tableStartY + 15)
       .text('UNIT PRICE', 360, tableStartY + 15)
       .text('AMOUNT', 480, tableStartY + 15);

    currentY = tableStartY + 40;

    // Table Rows
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item, index) => {
        const isEven = index % 2 === 0;
        const rowColor = isEven ? colors.white : colors.light;
        
        doc.fillColor(rowColor)
           .rect(40, currentY, tableWidth, rowHeight)
           .fill();

        // Add subtle border
        doc.strokeColor('#e5e7eb')
           .lineWidth(0.5)
           .rect(40, currentY, tableWidth, rowHeight)
           .stroke();

        // Item details
        doc.fillColor(colors.dark)
           .fontSize(10)
           .font('Helvetica')
           .text(item.description || 'No description', 55, currentY + 12, {
             width: 200,
             ellipsis: true
           });

        doc.text(item.quantity?.toString() || '0', 300, currentY + 12, {
           width: 50,
           align: 'center'
         });

        doc.text(formatCurrency(item.unitPrice, invoice.currency), 360, currentY + 12, {
           width: 80,
           align: 'right'
         });

        doc.fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text(formatCurrency(item.amount, invoice.currency), 480, currentY + 12, {
             width: 60,
             align: 'right'
           });

        currentY += rowHeight;
      });
    } else {
      doc.fillColor(colors.light)
         .rect(40, currentY, tableWidth, rowHeight)
         .fill()
         .fillColor(colors.medium)
         .fontSize(10)
         .font('Helvetica')
         .text('No items found', 55, currentY + 12);
      currentY += rowHeight;
    }

    // Totals Section with Modern Card Design
    currentY += 20;
    const totalsCardWidth = 250;
    const totalsCardHeight = 120;
    
    drawShadowBox(305, currentY, totalsCardWidth, totalsCardHeight, 12);
    
    // Gradient background for totals
    drawGradient(305, currentY, totalsCardWidth, 40, colors.light, colors.white);
    
    const subtotal = invoice.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const tax = invoice.tax || 0;
    const total = invoice.amount || subtotal + tax;

    // Subtotal
    doc.fillColor(colors.dark)
       .fontSize(11)
       .font('Helvetica')
       .text('Subtotal:', 325, currentY + 20)
       .text(formatCurrency(subtotal, invoice.currency), 325, currentY + 20, {
         width: 210,
         align: 'right'
       });

    // Tax (if applicable)
    if (tax > 0) {
      doc.text('Tax:', 325, currentY + 40)
         .text(formatCurrency(tax, invoice.currency), 325, currentY + 40, {
           width: 210,
           align: 'right'
         });
    }

    // Total with emphasis
    doc.fillColor(colors.primary)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('TOTAL:', 325, currentY + 80)
       .text(formatCurrency(total, invoice.currency), 325, currentY + 80, {
         width: 210,
         align: 'right'
       });

    currentY += totalsCardHeight + 30;

    // Notes Section (if exists)
    if (invoice.notes) {
      drawModernCard(40, currentY, 515, 80, 'NOTES', invoice.notes);
      currentY += 100;
    }

    // Payment Instructions Section
    drawModernCard(40, currentY, 515, 140, 'PAYMENT INSTRUCTIONS');
    
    const paymentInstructions = [
      '• Payment is due within 30 days of invoice date',
      '• Late payments may incur additional charges',
      '• All payments should reference the invoice number',
      '• For payment queries, contact our billing department',
      '',
      'Bank Details:',
      'Bank Name: Premium Bank Ltd.',
      'Account Number: 1234567890',
      'Routing Number: 987654321'
    ];

    doc.fillColor(colors.medium)
       .fontSize(9)
       .font('Helvetica');
    
    paymentInstructions.forEach((instruction, index) => {
      doc.text(instruction, 60, currentY + 35 + (index * 12));
    });

    currentY += 160;

    // Footer with modern design
    const footerY = 750;
    
    // Footer background
    doc.fillColor(colors.light)
       .rect(0, footerY, 595, 60)
       .fill();

    // Decorative line
    doc.strokeColor(colors.primary)
       .lineWidth(3)
       .moveTo(40, footerY + 5)
       .lineTo(555, footerY + 5)
       .stroke();

    // Footer text
    doc.fillColor(colors.primary)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Thank you for your business!', 40, footerY + 20, {
         width: 515,
         align: 'center'
       });

    doc.fillColor(colors.medium)
       .fontSize(8)
       .font('Helvetica')
       .text('This is a computer-generated invoice. For questions, contact us at info@flexcrm.com', 40, footerY + 40, {
         width: 515,
         align: 'center'
       });

    // Add watermark for unpaid invoices
    if (invoice.status !== 'paid') {
      doc.fillColor('#ff000010')
         .fontSize(60)
         .font('Helvetica-Bold')
         .rotate(-45, { origin: [300, 400] })
         .text(invoice.status.toUpperCase(), 200, 400, {
           width: 200,
           align: 'center'
         })
         .rotate(45, { origin: [300, 400] });
    }

    // Finalize PDF
    doc.end();
    
    console.log('Enhanced PDF generation completed successfully');
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