const express = require('express');
const router = express.Router();
const ApiKey = require('../models/ApiKey');
const auth = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

// GET /api/api-keys - Get all API keys for the gym
router.get('/', auth, checkSubscription, async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({ 
      gymId: req.gymId 
    }).select('-apiKey'); // Don't send the actual API key in the list

    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys'
    });
  }
});

// POST /api/api-keys - Generate new API key (without auth for testing)
router.post('/', async (req, res) => {
  try {
    const { clientName, clientEmail, permissions, rateLimit } = req.body;

    // Validate required fields
    if (!clientName || !clientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Client name and email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Generate new API key
    const apiKey = ApiKey.generateApiKey();

          // Create API key document (universal key, not tied to specific gym)
      const newApiKey = new ApiKey({
        apiKey,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        permissions: permissions || ['accountability_create', 'accountability_read'],
        rateLimit: {
          requestsPerHour: rateLimit?.requestsPerHour || 100,
          requestsPerDay: rateLimit?.requestsPerDay || 1000
        }
      });

    await newApiKey.save();

    // Return the API key only once (for security)
    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: {
        keyId: newApiKey.keyId,
        apiKey: apiKey, // Only returned once
        clientName: newApiKey.clientName,
        clientEmail: newApiKey.clientEmail,
        permissions: newApiKey.permissions,
        rateLimit: newApiKey.rateLimit,
        createdAt: newApiKey.createdAt,
        expiresAt: newApiKey.expiresAt
      }
    });

  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

// PUT /api/api-keys/:keyId - Update API key
router.put('/:keyId', auth, checkSubscription, async (req, res) => {
  try {
    const { permissions, rateLimit, isActive } = req.body;

    const apiKey = await ApiKey.findOne({
      keyId: req.params.keyId,
      gymId: req.gymId
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    // Update fields
    if (permissions !== undefined) {
      apiKey.permissions = permissions;
    }

    if (rateLimit !== undefined) {
      apiKey.rateLimit = {
        requestsPerHour: rateLimit.requestsPerHour || apiKey.rateLimit.requestsPerHour,
        requestsPerDay: rateLimit.requestsPerDay || apiKey.rateLimit.requestsPerDay
      };
    }

    if (isActive !== undefined) {
      apiKey.isActive = isActive;
    }

    await apiKey.save();

    res.json({
      success: true,
      message: 'API key updated successfully',
      data: {
        keyId: apiKey.keyId,
        clientName: apiKey.clientName,
        clientEmail: apiKey.clientEmail,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        isActive: apiKey.isActive,
        lastUsed: apiKey.lastUsed,
        usageCount: apiKey.usageCount,
        updatedAt: apiKey.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update API key'
    });
  }
});

// DELETE /api/api-keys/:keyId - Delete API key
router.delete('/:keyId', auth, checkSubscription, async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      keyId: req.params.keyId,
      gymId: req.gymId
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    await ApiKey.findByIdAndDelete(apiKey._id);

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete API key'
    });
  }
});

// GET /api/api-keys/:keyId/usage - Get API key usage statistics
router.get('/:keyId/usage', auth, checkSubscription, async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      keyId: req.params.keyId,
      gymId: req.gymId
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    res.json({
      success: true,
      data: {
        keyId: apiKey.keyId,
        clientName: apiKey.clientName,
        usageCount: apiKey.usageCount,
        lastUsed: apiKey.lastUsed,
        createdAt: apiKey.createdAt,
        rateLimit: apiKey.rateLimit,
        isActive: apiKey.isActive,
        isExpired: apiKey.isExpired()
      }
    });

  } catch (error) {
    console.error('Error fetching API key usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API key usage'
    });
  }
});

module.exports = router;
