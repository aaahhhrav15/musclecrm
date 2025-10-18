const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Helper to generate admin JWT
const generateAdminToken = (email) => {
  return jwt.sign({ 
    email, 
    type: 'admin' 
  }, process.env.JWT_SECRET, {
    expiresIn: '24h' // Admin tokens expire in 24 hours for security
  });
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin credentials match environment variables
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // For now, we'll use simple string comparison for admin password
    // In production, you might want to hash the admin password
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Generate admin JWT token
    const token = generateAdminToken(email);

    // Set the admin token in a cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      token,
      admin: {
        email,
        type: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Error in admin login' });
  }
});

// Admin logout
router.post('/logout', (req, res) => {
  res.cookie('adminToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0
  });
  
  res.json({ success: true, message: 'Admin logged out successfully' });
});

// Get current admin
router.get('/me', adminAuth, async (req, res) => {
  try {
    res.json({ 
      success: true, 
      admin: req.admin 
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ success: false, message: 'Error fetching admin info' });
  }
});

module.exports = router;
