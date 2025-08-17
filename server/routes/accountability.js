const express = require('express');
const router = express.Router();
const Accountability = require('../models/Accountability');
const { apiKeyAuth, checkPermission, simpleRateLimit } = require('../middleware/apiKeyAuth');

// Helper function to validate base64 image
const validateBase64Image = (base64String) => {
  try {
    // Check if it's a valid base64 image
    if (!base64String.startsWith('data:image/')) {
      return { valid: false, error: 'Invalid image format. Must be base64 encoded image.' };
    }

    // Extract image type and data
    const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return { valid: false, error: 'Invalid base64 image format.' };
    }

    const imageType = matches[1].toLowerCase();
    const imageData = matches[2];

    // Check supported image types
    if (!['jpeg', 'jpg', 'png', 'webp'].includes(imageType)) {
      return { valid: false, error: 'Unsupported image type. Use JPEG, PNG, or WebP.' };
    }

    // Check image size (max 5MB)
    const sizeInBytes = Math.ceil((imageData.length * 3) / 4);
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (sizeInBytes > maxSize) {
      return { valid: false, error: 'Image size too large. Maximum size is 5MB.' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid image data.' };
  }
};

// POST /api/v1/accountability - Create new accountability post
router.post('/', 
  apiKeyAuth, 
  checkPermission('accountability_create'),
  simpleRateLimit,
  async (req, res) => {
    try {
      const { description, imageBase64, customerId, gymId } = req.body;

      // Validate required fields
      if (!description || !imageBase64 || !customerId || !gymId) {
        return res.status(400).json({
          success: false,
          error: 'Description, image, customerId, and gymId are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Validate description length
      if (description.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Description too long. Maximum 1000 characters.',
          code: 'DESCRIPTION_TOO_LONG'
        });
      }

      // Validate base64 image
      const imageValidation = validateBase64Image(imageBase64);
      if (!imageValidation.valid) {
        return res.status(400).json({
          success: false,
          error: imageValidation.error,
          code: 'INVALID_IMAGE'
        });
      }

      // Validate customer exists and belongs to this gym
      const Customer = require('../models/Customer');
      const customer = await Customer.findOne({
        _id: customerId,
        gymId: gymId
      });

      if (!customer) {
        return res.status(400).json({
          success: false,
          error: 'Customer not found or does not belong to this gym',
          code: 'CUSTOMER_NOT_FOUND'
        });
      }

      // Create accountability post
      const accountabilityPost = new Accountability({
        gymId: gymId,
        userId: customerId,
        description: description.trim(),
        imageBase64: imageBase64
      });

      await accountabilityPost.save();

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Accountability post created successfully',
        data: {
          postId: accountabilityPost._id,
          description: accountabilityPost.description,
          createdAt: accountabilityPost.createdAt
        }
      });

    } catch (error) {
      console.error('Error creating accountability post:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create accountability post',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// GET /api/v1/accountability - Get accountability posts
router.get('/', 
  apiKeyAuth, 
  checkPermission('accountability_read'),
  simpleRateLimit,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        customerId, 
        gymId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Validate gymId is provided
      if (!gymId) {
        return res.status(400).json({
          success: false,
          error: 'gymId is required',
          code: 'MISSING_GYM_ID'
        });
      }

      // Build query
      const query = {
        gymId: gymId
      };

      if (customerId) {
        query.userId = customerId;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const posts = await Accountability.find(query)
        .populate('userId', 'name email phone')
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .select('-imageBase64'); // Don't send image data in list

      const total = await Accountability.countDocuments(query);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error fetching accountability posts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch accountability posts',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// GET /api/v1/accountability/:id - Get specific accountability post
router.get('/:id', 
  apiKeyAuth, 
  checkPermission('accountability_read'),
  simpleRateLimit,
  async (req, res) => {
    try {
      const post = await Accountability.findOne({
        _id: req.params.id,
        gymId: req.gymId
      }).populate('userId', 'name email phone');

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Accountability post not found',
          code: 'POST_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: post
      });

    } catch (error) {
      console.error('Error fetching accountability post:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch accountability post',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// PUT /api/v1/accountability/:id - Update accountability post
router.put('/:id', 
  apiKeyAuth, 
  checkPermission('accountability_update'),
  simpleRateLimit,
  async (req, res) => {
    try {
      const { description } = req.body;

      const post = await Accountability.findOne({
        _id: req.params.id,
        gymId: req.gymId
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Accountability post not found',
          code: 'POST_NOT_FOUND'
        });
      }

      // Update description
      if (description !== undefined) {
        if (description.length > 1000) {
          return res.status(400).json({
            success: false,
            error: 'Description too long. Maximum 1000 characters.',
            code: 'DESCRIPTION_TOO_LONG'
          });
        }
        post.description = description.trim();
      }

      await post.save();

      res.json({
        success: true,
        message: 'Accountability post updated successfully',
        data: {
          postId: post._id,
          description: post.description,
          updatedAt: post.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating accountability post:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update accountability post',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// DELETE /api/v1/accountability/:id - Delete accountability post
router.delete('/:id', 
  apiKeyAuth, 
  checkPermission('accountability_delete'),
  simpleRateLimit,
  async (req, res) => {
    try {
      const post = await Accountability.findOne({
        _id: req.params.id,
        gymId: req.gymId
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Accountability post not found',
          code: 'POST_NOT_FOUND'
        });
      }

      // Hard delete
      await Accountability.findByIdAndDelete(post._id);

      res.json({
        success: true,
        message: 'Accountability post deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting accountability post:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete accountability post',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

module.exports = router;
