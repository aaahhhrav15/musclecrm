const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const s3Service = require('../services/s3Service');

// Configure multer for product image uploads with 50MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1, // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files with specific MIME types
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  }
});

// List products for gym
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ gymId: req.user.gymId })
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
      ;
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
    console.log('=== PRODUCT CREATION REQUEST ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    console.log('User gymId:', req.user.gymId);
    
    const { name, sku, price, imageUrl } = req.body;
    
    console.log('Extracted fields:');
    console.log('  - name:', name, 'type:', typeof name);
    console.log('  - sku:', sku, 'type:', typeof sku);
    console.log('  - price:', price, 'type:', typeof price);
    console.log('  - imageUrl:', imageUrl ? 'present' : 'missing', 'type:', typeof imageUrl);
    
    // Check for required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!sku) missingFields.push('sku');
    if (typeof price !== 'number') missingFields.push('price (must be number)');
    if (!imageUrl) missingFields.push('image');
    
    if (missingFields.length > 0) {
      console.log('❌ Validation failed. Missing fields:', missingFields);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields 
      });
    }
    
    console.log('✅ All required fields present');

    // Handle image upload to S3
    let finalImageUrl = null;
    
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      console.log('📸 Processing image (data URL)...');
      try {
        // Convert data URL to buffer
        const base64Data = imageUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Upload to S3
        const uploadResult = await s3Service.uploadProductImage(imageBuffer, 'product-image.png');
        finalImageUrl = uploadResult.url;
        console.log('✅ Image uploaded to S3:', finalImageUrl);
      } catch (error) {
        console.error('❌ Error uploading image to S3:', error);
        return res.status(400).json({ 
          success: false, 
          message: 'Error uploading image: ' + error.message 
        });
      }
    } else if (imageUrl && imageUrl.startsWith('http')) {
      console.log('📸 Using direct S3 URL:', imageUrl);
      finalImageUrl = imageUrl;
    } else {
      console.log('❌ No valid image found');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid image format. Please provide a valid image.' 
      });
    }

    // Prepare product data with S3 URL
    const productData = {
      name,
      sku,
      price,
      imageUrl: finalImageUrl,
      overview: req.body.overview || '',
      keyBenefits: req.body.keyBenefits || [],
      fastFacts: req.body.fastFacts || '',
      usage: req.body.usage || '',
      marketedBy: req.body.marketedBy || '',
      manufacturedBy: req.body.manufacturedBy || '',
      disclaimer: req.body.disclaimer || '',
      storage: req.body.storage || '',
      shelfLife: req.body.shelfLife || '',
      gymId: req.user.gymId
    };
    
    console.log('📦 Final product data:', JSON.stringify(productData, null, 2));

    const product = new Product(productData);
    console.log('💾 Saving product to database...');
    await product.save();
    console.log('✅ Product saved successfully with ID:', product._id);
    console.log('✅ Final imageUrl:', product.imageUrl);
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
    // Prepare update data
    const updateData = { ...req.body };
    delete updateData.customerId;
    delete updateData.url;

    // Handle image upload to S3 if a new image is provided
    if (updateData.imageUrl && updateData.imageUrl.startsWith('data:image/')) {
      console.log('📸 Processing new product image for update...');
      try {
        // Convert data URL to buffer
        const base64Data = updateData.imageUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Upload to S3
        const uploadResult = await s3Service.uploadProductImage(imageBuffer, 'product-image.png');
        updateData.imageUrl = uploadResult.url;
        console.log('✅ New product image uploaded to S3:', updateData.imageUrl);
      } catch (error) {
        console.error('❌ Error uploading new product image to S3:', error);
        return res.status(400).json({ 
          success: false, 
          message: 'Error uploading new image: ' + error.message 
        });
      }
    } else if (updateData.imageUrl && !updateData.imageUrl.startsWith('http')) {
      // If imageUrl is provided but not a valid URL or base64, remove it
      console.log('⚠️ Invalid image format provided, removing imageUrl');
      delete updateData.imageUrl;
    }

    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, gymId: req.user.gymId },
      updateData,
      { new: true, runValidators: true }
    );
    
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


