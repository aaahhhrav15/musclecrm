const express = require('express');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { gymAuth } = require('../middleware/gymAuth');
const Gym = require('../models/Gym');

const router = express.Router();

// Apply both auth and gymAuth middleware to all routes
router.use(auth);
router.use(gymAuth);

// Get all invoices for the gym
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find({ gymId: req.gymId })
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices' });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      gymId: req.gymId
    }).populate('customerId', 'name email phone');
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoice' });
  }
});

// Create new invoice
router.post('/', auth, async (req, res) => {
  try {
    const { customerId, items, amount, dueDate, notes, status, currency } = req.body;
    const userId = req.user._id;
    const gymId = req.user.gymId;

    // Get the last invoice number
    const lastInvoice = await Invoice.findOne({}, {}, { sort: { 'invoiceNumber': -1 } });
    let nextNumber = 1;
    
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV', ''));
      nextNumber = lastNumber + 1;
    }
    
    const invoiceNumber = `INV${String(nextNumber).padStart(5, '0')}`;

    const invoice = new Invoice({
      userId,
      gymId,
      customerId,
      invoiceNumber,
      items,
      amount,
      currency,
      status,
      dueDate,
      notes
    });

    await invoice.save();
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error creating invoice',
      error: error.errors || error
    });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, gymId: req.gymId },
      req.body,
      { new: true }
    );
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, message: 'Error updating invoice' });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, message: 'Error deleting invoice' });
  }
});

// Generate Professional PDF Invoice
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    console.log('Generating professional PDF for invoice:', req.params.id);
    
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      gymId: req.gymId
    })
      .populate('customerId', 'name email phone address')
      .populate('bookingId', 'type startTime endTime');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Fetch gym info
    const gym = await Gym.findById(req.gymId);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: gym?.name || 'FlexCRM',
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
    // Draw gym logo if available
    if (gym && gym.logo) {
      try {
        const fs = require('fs');
        const path = require('path');
        let logoPath = gym.logo;
        // If the logo path is relative (e.g., 'logos/filename.png'), resolve it to the uploads directory
        if (!/^https?:\/\//.test(logoPath) && !path.isAbsolute(logoPath)) {
          logoPath = path.join(__dirname, '../uploads', logoPath);
        }
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, currentY, { width: 50, height: 50 });
        }
      } catch (e) {
        // Do nothing if logo fails to load
      }
    }

    // Gym Details
    doc.fillColor(colors.text)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(gym?.name || 'Gym Name', 120, currentY + 5);

    doc.fillColor(colors.secondary)
      .fontSize(10)
      .font('Helvetica');
    let addressLine = '';
    if (gym?.address) {
      addressLine = [
        gym.address.street,
        gym.address.city,
        gym.address.state,
        gym.address.zipCode,
        gym.address.country
      ].filter(Boolean).join(', ');
    }
    doc.text(addressLine || 'Address not set', 120, currentY + 30);
    let phoneLine = '';
    if (gym?.contactInfo) {
      phoneLine = [
        gym.contactInfo.phone ? `Phone: ${gym.contactInfo.phone}` : '',
        gym.contactInfo.email ? `Email: ${gym.contactInfo.email}` : ''
      ].filter(Boolean).join(' | ');
    }
    doc.text(phoneLine || '', 120, currentY + 42);

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

    // (Status badge removed)
    currentY += 0;

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
    const total = invoice.amount || subtotal;

    // Totals background
    doc.rect(totalsStartX, currentY, totalsWidth, 40)
       .fillColor('#f8fafc')
       .fill()
       .strokeColor('#e2e8f0')
       .lineWidth(1)
       .stroke();

    // Only show total
    doc.fillColor(colors.primary)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('TOTAL:', totalsStartX + 12, currentY + 10);
    doc.text(formatCurrency(total, invoice.currency), totalsStartX + 12, currentY + 10, {
       width: totalsWidth - 24,
       align: 'right'
     });

    currentY += 45;

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