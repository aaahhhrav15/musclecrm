const express = require('express');
const router = express.Router();
const RetailSale = require('../models/RetailSale');
const auth = require('../middleware/auth');

// Get all retail sales
router.get('/', auth, async (req, res) => {
  try {
    const sales = await RetailSale.find({ gymId: req.user.gymId });
    res.json({ success: true, data: sales });
  } catch (error) {
    console.error('Error fetching retail sales:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new retail sale
router.post('/', auth, async (req, res) => {
  try {
    const sale = new RetailSale({
      ...req.body,
      gymId: req.user.gymId
    });
    await sale.save();
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    console.error('Error creating retail sale:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a retail sale
router.put('/:id', auth, async (req, res) => {
  try {
    const sale = await RetailSale.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    console.error('Error updating retail sale:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a retail sale
router.delete('/:id', auth, async (req, res) => {
  try {
    const sale = await RetailSale.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting retail sale:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 