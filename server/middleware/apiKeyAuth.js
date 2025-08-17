const ApiKey = require('../models/ApiKey');

// API Key authentication middleware
const apiKeyAuth = async (req, res, next) => {
  try {
    // Get API key from headers
    const apiKey = req.header('X-API-Key') || req.header('x-api-key') || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ 
        success: false, 
        error: 'API key is required',
        code: 'API_KEY_MISSING'
      });
    }

    // Find and validate API key (universal key, not tied to specific gym)
    const keyDoc = await ApiKey.findOne({ 
      apiKey: apiKey, 
      isActive: true 
    });
    
    if (!keyDoc) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Check if API key is expired
    if (keyDoc.isExpired()) {
      return res.status(401).json({ 
        success: false, 
        error: 'API key has expired',
        code: 'API_KEY_EXPIRED'
      });
    }

    // Attach API key info to request (no gym info yet)
    req.apiKey = keyDoc;

    // Increment usage count
    await keyDoc.incrementUsage();

    next();
  } catch (error) {
    console.error('API Key authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Permission checking middleware
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.apiKey.permissions.includes(requiredPermission)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Simple rate limiting check (without express-rate-limit)
const simpleRateLimit = (req, res, next) => {
  if (!req.apiKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // For now, just pass through - we can implement rate limiting later
  next();
};

module.exports = {
  apiKeyAuth,
  checkPermission,
  simpleRateLimit
};
