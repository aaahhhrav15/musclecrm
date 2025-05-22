
const express = require('express');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all invoices with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = { userId: req.user._id };
    
    // Add status filter if provided
    if (status && status !== 'All') {
      query.status = status;
    }
    
    // Add search query if provided
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { issueDate: -1 }
    };
    
    const invoices = await Invoice.find(query, null, options);
    const total = await Invoice.countDocuments(query);
    
    // Format response to match frontend expectations
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.invoiceNumber,
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email,
        phone: invoice.customer.phone || '',
        address: invoice.customer.address || ''
      },
      status: invoice.status,
      total: invoice.total,
      date: invoice.issueDate,
      dueDate: invoice.dueDate
    }));
    
    res.json({
      success: true,
      invoices: formattedInvoices,
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
      invoiceNumber: req.params.id,
      userId: req.user._id 
    });
    
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
    const { customer, items, subtotal, tax, discount, total, notes, dueDate } = req.body;
    
    // Generate unique invoice number
    const invoiceCount = await Invoice.countDocuments({ userId: req.user._id });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(4, '0')}`;
    
    const newInvoice = await Invoice.create({
      userId: req.user._id,
      invoiceNumber,
      customer,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      dueDate
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
    const { customer, items, status, subtotal, tax, discount, total, notes, dueDate } = req.body;
    
    const invoice = await Invoice.findOneAndUpdate(
      { invoiceNumber: req.params.id, userId: req.user._id },
      { customer, items, status, subtotal, tax, discount, total, notes, dueDate },
      { new: true, runValidators: true }
    );
    
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
      invoiceNumber: req.params.id,
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
