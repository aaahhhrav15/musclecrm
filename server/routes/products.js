const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// List products for gym
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ gymId: req.user.gymId })
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, gymId: req.user.gymId })
      .populate('customerId', 'name phone email');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create product
router.post('/', auth, async (req, res) => {
  try {
    const { name, sku, price, imageBase64, customerId } = req.body;
    if (!name || !sku || typeof price !== 'number' || !imageBase64) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Prepare product data, excluding undefined customerId
    const productData = {
      ...req.body,
      gymId: req.user.gymId
    };
    
    // Remove customerId if it's undefined
    if (productData.customerId === undefined) {
      delete productData.customerId;
    }

    const product = new Product(productData);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'SKU already exists' });
    }
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    // Prepare update data, handling undefined customerId
    const updateData = { ...req.body };
    
    // If customerId is undefined, set it to null to remove the reference
    if (updateData.customerId === undefined) {
      updateData.customerId = null;
    }

    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      updateData,
      { new: true, runValidators: true }
    ).populate('customerId', 'name phone email');
    
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;


