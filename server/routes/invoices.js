const express = require('express');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { gymAuth } = require('../middleware/gymAuth');
const Gym = require('../models/Gym');
const { capitalizeName } = require('../lib/nameUtils');

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
    
    // Capitalize customer names in invoices
    invoices.forEach(invoice => {
      if (invoice.customerId && invoice.customerId.name) {
        invoice.customerId.name = capitalizeName(invoice.customerId.name);
      }
      if (invoice.customerName) {
        invoice.customerName = capitalizeName(invoice.customerName);
      }
    });
    
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
    
    // Capitalize customer name
    if (invoice.customerId && invoice.customerId.name) {
      invoice.customerId.name = capitalizeName(invoice.customerId.name);
    }
    if (invoice.customerName) {
      invoice.customerName = capitalizeName(invoice.customerName);
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
    const { customerId, items, amount, dueDate, notes, currency, paymentMode } = req.body;
    const userId = req.user._id;
    const gymId = req.user.gymId;

    // Fetch gym to get gymCode and invoiceCounter
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(400).json({ success: false, message: 'Gym not found' });
    }
    const gymCode = gym.gymCode;
    const invoiceCounter = gym.invoiceCounter || 1;
    const invoiceNumber = `${gymCode}${String(invoiceCounter).padStart(6, '0')}`;

    // Fetch customer details to store in invoice
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(400).json({ success: false, message: 'Customer not found' });
    }

    const invoice = new Invoice({
      userId,
      gymId,
      customerId,
      customerName: capitalizeName(customer.name || ''),
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      invoiceNumber,
      items,
      amount,
      currency,
      status: 'paid', // Mark as 'paid' since payment mode is provided
      dueDate,
      notes
    });

    await invoice.save();

    // Increment the gym's invoiceCounter
    gym.invoiceCounter = invoiceCounter + 1;
    await gym.save();

    // Automatically create transaction record for the invoice
    let transaction = null;
    try {
      // Get customer details for transaction
      const customer = await Customer.findById(customerId);
      
      // Create transaction description from invoice items
      const itemDescriptions = items.map(item => `${item.description} (${item.quantity}x${item.unitPrice})`).join(', ');
      
      transaction = new Transaction({
        userId: customerId, // customerId is the user/customer ID
        gymId: gymId,
        transactionType: 'INVOICE_PAYMENT',
        transactionDate: new Date(),
        amount: amount,
        membershipType: customer?.membershipType || 'none',
        paymentMode: paymentMode || 'cash', // Use the provided payment mode or default to 'cash'
        description: `Payment for Invoice ${invoiceNumber}: ${itemDescriptions}`,
        status: 'SUCCESS' // Mark transaction as successful
      });

      await transaction.save();
      console.log('Transaction created for invoice:', invoiceNumber);
    } catch (transactionError) {
      console.error('Failed to create transaction for invoice:', transactionError);
      // Don't fail the entire operation if transaction creation fails
    }

    res.status(201).json({ 
      success: true, 
      data: invoice,
      transaction: transaction ? transaction.toObject() : null
    });
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

module.exports = router;