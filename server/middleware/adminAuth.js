const jwt = require('jsonwebtoken');

const adminAuth = async (req, res, next) => {
  try {
    // Get token from cookies or authorization header
    const token = req.cookies.adminToken || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ success: false, message: 'Admin authentication token is missing or malformed' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid admin token' });
    }

    // Check admin credentials against environment variables
    if (decoded.email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Attach admin info to request
    req.admin = {
      email: decoded.email,
      type: 'admin'
    };
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, message: 'Invalid admin token' });
    }
    res.status(500).json({ success: false, message: 'Internal server error during admin authentication' });
  }
};

module.exports = adminAuth;
