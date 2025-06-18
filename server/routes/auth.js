const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Gym = require('../models/Gym');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Function to generate a unique gym code
const generateGymCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let gymCode;
  let isUnique = false;

  while (!isUnique) {
    // Generate a 6-character alphanumeric code
    gymCode = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      gymCode += characters[randomIndex];
    }

    // Check if the gym code already exists
    const existingGym = await Gym.findOne({ gymCode });
    if (!existingGym) {
      isUnique = true;
    }
  }

  return gymCode;
};

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/logos');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Configure multer for file upload
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/profile');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register a new user
router.post('/register', upload.single('logo'), async (req, res) => {
  try {
    const { name, email, password, industry, role, gymName, phone, address } = req.body;
    const logo = req.file ? `/uploads/logos/${req.file.filename}` : undefined;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    let gymId;
    let gymData;

    // If it's a gym user, create the gym first
    if (industry === 'gym') {
      if (!gymName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Gym name is required for gym industry users' 
        });
      }

      // Generate a unique gym code
      const gymCode = await generateGymCode();

      const newGym = new Gym({
        gymCode,
        name: gymName,
        logo: logo,
        address: address,
        contactInfo: {
          phone: phone,
          email: email
        },
        status: 'active',
        createdAt: new Date()
      });

      const savedGym = await newGym.save();
      gymId = savedGym._id;
      gymData = {
        id: savedGym._id,
        gymCode: savedGym.gymCode,
        name: savedGym.name
      };
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      industry,
      role: role || 'owner',
      gymId: industry === 'gym' ? gymId : undefined
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Set the token in a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry,
        role: user.role,
        gymId: user.gymId
      },
      gym: industry === 'gym' ? gymData : undefined
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error in registration',
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Set the token in a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry,
        role: user.role,
        gymId: user.gymId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Error in login' });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  });
  
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, industry, phone } = req.body;
    
    // Find and update user
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (industry) user.industry = industry;
    if (phone) user.phone = phone;
    
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry,
        role: user.role,
        phone: user.phone,
        membershipType: user.membershipType,
        joinDate: user.joinDate
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

// Update profile image
router.put('/profile-image', auth, profileUpload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete old profile image if exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '../../uploads/profile', path.basename(user.profileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new profile image
    const imageUrl = `/uploads/profile/${req.file.filename}`;
    user.profileImage = imageUrl;
    await user.save();

    res.json({
      success: true,
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Profile image update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile image' });
  }
});

// Delete profile image
router.delete('/profile-image', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.profileImage) {
      const imagePath = path.join(__dirname, '../../uploads/profile', path.basename(user.profileImage));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    user.profileImage = null;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image removed successfully'
    });
  } catch (error) {
    console.error('Profile image deletion error:', error);
    res.status(500).json({ success: false, message: 'Server error removing profile image' });
  }
});

module.exports = router;
