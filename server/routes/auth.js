const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Gym = require('../models/Gym');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const s3Service = require('../services/s3Service');

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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

// Multer error handler
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum size is 5MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Too many files. Only one file is allowed.' 
      });
    }
  }
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  next(err);
};

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
    fileSize: 50 * 1024 * 1024 // 50MB limit
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
router.post('/register', upload.single('logo'), handleMulterError, async (req, res) => {
  try {
    const { name, email, password, industry, role, gymName, phone, address } = req.body;
    const logoFile = req.file;

    // Parse address if it's a JSON string
    let parsedAddress;
    if (address) {
      try {
        parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
      } catch (error) {
        console.error('Error parsing address:', error);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid address format' 
        });
      }
    }

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

      // Handle logo upload to S3 if provided
      let logoUrl = null;
      if (logoFile) {
        try {
          console.log('Processing uploaded logo file for S3 upload...');
          console.log('File details:', {
            originalname: logoFile.originalname,
            mimetype: logoFile.mimetype,
            size: logoFile.size
          });
          
          // Upload to S3 using the file buffer
          const uploadResult = await s3Service.uploadLogo(logoFile.buffer, logoFile.originalname);
          logoUrl = uploadResult.url;
          console.log('Logo uploaded to S3 successfully:', uploadResult.url);
        } catch (error) {
          console.error('Error uploading logo to S3:', error);
          // Continue without logo if S3 upload fails
        }
      }

      const newGym = new Gym({
        gymCode,
        name: gymName,
        logo: logoUrl, // S3 URL instead of base64
        address: parsedAddress,
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
      secure: true,
      sameSite: 'none',
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
      secure: true,
      sameSite: 'none',
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
    secure: true,
    sameSite: 'none',
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

// --- Password Reset: Request Reset Code ---
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Generate 6-digit code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 1000 * 60 * 10; // 10 minutes
  user.resetPasswordCode = resetCode;
  user.resetPasswordExpires = expiry;
  await user.save();

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Your Password Reset Code',
    text: `Your password reset code is: ${resetCode}. It expires in 10 minutes.`
  };
  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Reset code sent to your email.' });
  } catch (err) {
    console.error('Nodemailer error:', err); // Log the full error for debugging
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
});

// --- Password Reset: Confirm Code & Set New Password ---
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ success: false, message: 'All fields are required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (!user.resetPasswordCode || !user.resetPasswordExpires) return res.status(400).json({ success: false, message: 'No reset code found. Please request again.' });
  if (user.resetPasswordCode !== code) return res.status(400).json({ success: false, message: 'Invalid reset code.' });
  if (Date.now() > user.resetPasswordExpires) return res.status(400).json({ success: false, message: 'Reset code expired.' });

  user.password = newPassword;
  user.resetPasswordCode = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Password has been reset successfully.' });
});

module.exports = router;
