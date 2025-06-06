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
    const { customerId, bookingId, items, amount, dueDate, notes, status, currency } = req.body;

    // Generate a 6-digit invoice number
    const invoiceCount = await Invoice.countDocuments({ userId: req.user._id });
    const invoiceNumber = `INV${String(invoiceCount + 1).padStart(5, '0')}`;

    const invoice = new Invoice({
      userId: req.user._id,
      customerId,
      bookingId,
      invoiceNumber,
      items,
      amount,
      dueDate,
      notes,
      status: status || 'pending',
      currency: currency || 'USD'
    });

    await invoice.save();

    // Populate customer and booking details
    await invoice.populate('customerId', 'name email phone');
    if (bookingId) {
      await invoice.populate('bookingId', 'type startTime endTime');
    }

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating invoice',
      error: error.message 
    });
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

// Generate Professional PDF Invoice
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    console.log('Generating professional PDF for invoice:', req.params.id);
    
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
      .populate('customerId', 'name email phone address')
      .populate('bookingId', 'type startTime endTime');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: 'FlexCRM',
        Subject: 'Professional Invoice'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Helper functions
    const formatDate = (date) => {
      try {
        if (!date) return 'N/A';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return format(dateObj, 'MMM dd, yyyy');
      } catch (error) {
        return 'Invalid Date';
      }
    };

    const formatCurrency = (amount, currency = 'USD') => {
      return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
    };

    const addLine = (startX, startY, endX, endY, color = '#CCCCCC', width = 1) => {
      doc.strokeColor(color)
         .lineWidth(width)
         .moveTo(startX, startY)
         .lineTo(endX, endY)
         .stroke();
    };

    // Colors
    const colors = {
      primary: '#2563eb',
      secondary: '#64748b',
      text: '#1e293b',
      light: '#f1f5f9',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444'
    };

    let currentY = 40;

    // Header Section
    // Company Logo (Simple professional design)
    doc.fillColor(colors.primary)
       .rect(50, currentY, 50, 50)
       .fill();
    
    doc.fillColor('white')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('FC', 65, currentY + 15);

    // Company Details
    doc.fillColor(colors.text)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('FLEXCRM', 120, currentY + 5);

    doc.fillColor(colors.secondary)
       .fontSize(10)
       .font('Helvetica')
       .text('Premium Fitness Management System', 120, currentY + 30)
       .text('123 Fitness Street, Mumbai, Maharashtra 400001', 120, currentY + 42)
       .text('Phone: +91 9876543210 | Email: info@flexcrm.com', 120, currentY + 54);

    // Invoice Title and Number (Right side)
    doc.fillColor(colors.primary)
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('INVOICE', 400, currentY, { align: 'right' });

    // Invoice details box - Made taller to accommodate all content
    doc.rect(400, currentY + 35, 145, 95)
       .fillColor(colors.light)
       .fill()
       .strokeColor(colors.primary)
       .lineWidth(1)
       .stroke();

    doc.fillColor(colors.text)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Invoice Number:', 410, currentY + 45)
       .font('Helvetica')
       .text(invoice.invoiceNumber || 'INV-001', 410, currentY + 58);

    doc.font('Helvetica-Bold')
       .text('Invoice Date:', 410, currentY + 75)
       .font('Helvetica')
       .text(formatDate(invoice.createdAt), 410, currentY + 88);

    doc.font('Helvetica-Bold')
       .text('Due Date:', 410, currentY + 105)
       .font('Helvetica')
       .text(formatDate(invoice.dueDate), 410, currentY + 118);

    currentY += 100;

    // Status Badge - Moved up
    const statusColors = {
      'paid': colors.success,
      'pending': colors.warning,
      'cancelled': colors.danger,
      'draft': colors.secondary
    };
    
    const statusColor = statusColors[invoice.status] || colors.secondary;
    doc.fillColor(statusColor)
       .rect(50, currentY, 80, 22)
       .fill();
    
    doc.fillColor('white')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(invoice.status.toUpperCase(), 50, currentY + 7, {
         width: 80,
         align: 'center'
       });

    currentY += 35;

    // Bill To Section
    doc.fillColor(colors.text)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('BILL TO:', 50, currentY);

    doc.rect(50, currentY + 15, 240, 85)
       .fillColor('#fafafa')
       .fill()
       .strokeColor('#e2e8f0')
       .lineWidth(1)
       .stroke();

    doc.fillColor(colors.text)
       .fontSize(13)
       .font('Helvetica-Bold')
       .text(invoice.customerId?.name || 'N/A', 60, currentY + 25);

    doc.fillColor(colors.secondary)
       .fontSize(9)
       .font('Helvetica')
       .text(`Email: ${invoice.customerId?.email || 'N/A'}`, 60, currentY + 42)
       .text(`Phone: ${invoice.customerId?.phone || 'N/A'}`, 60, currentY + 55);

    if (invoice.customerId?.address) {
      doc.text(`Address: ${invoice.customerId.address}`, 60, currentY + 68, {
        width: 220,
        height: 25
      });
    }

    // Booking Details (if exists)
    if (invoice.bookingId) {
      doc.fillColor(colors.text)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('SERVICE DETAILS:', 310, currentY);

      doc.rect(310, currentY + 15, 235, 85)
         .fillColor('#fafafa')
         .fill()
         .strokeColor('#e2e8f0')
         .lineWidth(1)
         .stroke();

      doc.fillColor(colors.text)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(`Service: ${invoice.bookingId.type || 'N/A'}`, 320, currentY + 25);

      doc.fillColor(colors.secondary)
         .fontSize(9)
         .font('Helvetica')
         .text(`Start Date: ${formatDate(invoice.bookingId.startTime)}`, 320, currentY + 42)
         .text(`End Date: ${formatDate(invoice.bookingId.endTime)}`, 320, currentY + 55);
    }

    currentY += 115;

    // Items Table
    const tableStartY = currentY;
    const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Amount'];
    const columnWidths = [250, 60, 100, 85];
    const columnPositions = [50, 300, 360, 460];

    // Table Header
    doc.rect(50, tableStartY, 495, 25)
       .fillColor(colors.primary)
       .fill();

    doc.fillColor('white')
       .fontSize(10)
       .font('Helvetica-Bold');

    tableHeaders.forEach((header, index) => {
      const align = index === 0 ? 'left' : 'center';
      doc.text(header, columnPositions[index] + 8, tableStartY + 8, {
        width: columnWidths[index] - 16,
        align: align
      });
    });

    currentY = tableStartY + 25;

    // Table Rows
    if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
      invoice.items.forEach((item, index) => {
        const rowHeight = 30;
        const isEven = index % 2 === 0;
        
        // Alternate row colors
        if (isEven) {
          doc.rect(50, currentY, 495, rowHeight)
             .fillColor('#f8fafc')
             .fill();
        }

        // Row border
        doc.rect(50, currentY, 495, rowHeight)
           .strokeColor('#e2e8f0')
           .lineWidth(0.5)
           .stroke();

        // Item data
        doc.fillColor(colors.text)
           .fontSize(9)
           .font('Helvetica')
           .text(item.description || 'No description', columnPositions[0] + 8, currentY + 10, {
             width: columnWidths[0] - 16,
             ellipsis: true
           });

        doc.text((item.quantity || 0).toString(), columnPositions[1] + 8, currentY + 10, {
           width: columnWidths[1] - 16,
           align: 'center'
         });

        doc.text(formatCurrency(item.unitPrice || 0, invoice.currency), columnPositions[2] + 8, currentY + 10, {
           width: columnWidths[2] - 16,
           align: 'center'
         });

        doc.fillColor(colors.text)
           .font('Helvetica-Bold')
           .text(formatCurrency(item.amount || 0, invoice.currency), columnPositions[3] + 8, currentY + 10, {
             width: columnWidths[3] - 16,
             align: 'center'
           });

        currentY += rowHeight;
      });
    } else {
      // No items row
      doc.rect(50, currentY, 495, 30)
         .fillColor('#f8fafc')
         .fill()
         .strokeColor('#e2e8f0')
         .lineWidth(0.5)
         .stroke();

      doc.fillColor(colors.secondary)
         .fontSize(9)
         .font('Helvetica')
         .text('No items found', 60, currentY + 10);
      
      currentY += 30;
    }

    // Totals Section
    currentY += 15;
    const totalsStartX = 350;
    const totalsWidth = 195;

    const subtotal = invoice.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const tax = invoice.tax || 0;
    const total = invoice.amount || subtotal + tax;

    // Totals background
    doc.rect(totalsStartX, currentY, totalsWidth, 75)
       .fillColor('#f8fafc')
       .fill()
       .strokeColor('#e2e8f0')
       .lineWidth(1)
       .stroke();

    // Subtotal
    doc.fillColor(colors.text)
       .fontSize(10)
       .font('Helvetica')
       .text('Subtotal:', totalsStartX + 12, currentY + 12);
    
    doc.text(formatCurrency(subtotal, invoice.currency), totalsStartX + 12, currentY + 12, {
       width: totalsWidth - 24,
       align: 'right'
     });

    // Tax
    doc.text('Tax:', totalsStartX + 12, currentY + 28);
    doc.text(formatCurrency(tax, invoice.currency), totalsStartX + 12, currentY + 28, {
       width: totalsWidth - 24,
       align: 'right'
     });

    // Total line
    addLine(totalsStartX + 12, currentY + 45, totalsStartX + totalsWidth - 12, currentY + 45, colors.primary, 1);

    // Total
    doc.fillColor(colors.primary)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('TOTAL:', totalsStartX + 12, currentY + 55);
    
    doc.text(formatCurrency(total, invoice.currency), totalsStartX + 12, currentY + 55, {
       width: totalsWidth - 24,
       align: 'right'
     });

    currentY += 90;

    // Notes Section
    if (invoice.notes && invoice.notes.trim()) {
      doc.fillColor(colors.text)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('NOTES:', 50, currentY);

      doc.rect(50, currentY + 15, 495, 45)
         .fillColor('#f8fafc')
         .fill()
         .strokeColor('#e2e8f0')
         .lineWidth(1)
         .stroke();

      doc.fillColor(colors.secondary)
         .fontSize(9)
         .font('Helvetica')
         .text(invoice.notes, 60, currentY + 25, {
           width: 475,
           height: 25
         });

      currentY += 70;
    }

    // Payment Terms
    currentY += 15;
    doc.fillColor(colors.text)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('PAYMENT TERMS:', 50, currentY);

    const paymentTerms = [
      '• Payment is due within 30 days of invoice date',
      '• Late payments may incur additional charges',
      '• Please reference invoice number when making payment'
    ];

    doc.fillColor(colors.secondary)
       .fontSize(8)
       .font('Helvetica');

    paymentTerms.forEach((term, index) => {
      doc.text(term, 50, currentY + 18 + (index * 10));
    });

    // Footer
    const footerY = 750;
    addLine(50, footerY, 545, footerY, colors.primary, 1);

    doc.fillColor(colors.secondary)
       .fontSize(8)
       .font('Helvetica')
       .text('This invoice was generated electronically and is valid without signature.', 50, footerY + 10, {
         width: 495,
         align: 'center'
       });

    // Finalize PDF
    doc.end();
    
    console.log('Professional PDF generated successfully');
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating PDF',
      error: error.message
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