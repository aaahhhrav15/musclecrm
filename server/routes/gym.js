const express = require('express');
const router = express.Router();
const Gym = require('../models/Gym');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists with proper permissions
const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gym-' + req.gymId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Register a new gym (no auth required)
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      address,
      contactInfo,
      operatingHours,
      facilities,
      membershipTypes
    } = req.body;

    // Check if gym with same name already exists
    const existingGym = await Gym.findOne({ name });
    if (existingGym) {
      return res.status(400).json({ success: false, message: 'Gym with this name already exists' });
    }

    // Create new gym
    const gym = new Gym({
      name,
      address,
      contactInfo,
      operatingHours,
      facilities,
      membershipTypes
    });

    await gym.save();

    res.status(201).json({
      success: true,
      gym,
      message: 'Gym registered successfully'
    });
  } catch (error) {
    console.error('Gym registration error:', error);
    res.status(500).json({ success: false, message: 'Error registering gym' });
  }
});

// Apply both auth and gymAuth middleware to all routes below
router.use(auth);
router.use(gymAuth);

// Get gym information
router.get('/info', async (req, res) => {
  try {
    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Convert the gym object to a plain object
    const gymData = gym.toObject();

    // Add full URL for the logo if it exists
    if (gymData.logo) {
      gymData.logo = `${process.env.API_URL || 'http://localhost:5000'}/${gymData.logo}`;
    }

    res.json({ success: true, gym: gymData });
  } catch (error) {
    console.error('Error fetching gym info:', error);
    res.status(500).json({ success: false, message: 'Error fetching gym information' });
  }
});

// Update gym information
router.put('/info', async (req, res) => {
  try {
    // First find the gym
    const gym = await Gym.findById(req.gymId);
    
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Update the fields
    if (req.body.name) gym.name = req.body.name;
    if (req.body.contactInfo) {
      gym.contactInfo = {
        ...gym.contactInfo,
        ...req.body.contactInfo
      };
    }

    // Save the gym to trigger the pre-save middleware
    await gym.save();
    
    res.json({ success: true, gym });
  } catch (error) {
    console.error('Error updating gym info:', error);
    res.status(500).json({ success: false, message: 'Error updating gym information' });
  }
});

// Upload gym logo
router.put('/logo', auth, gymAuth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Delete old logo if exists
    if (gym.logo) {
      const oldLogoPath = path.join(process.cwd(), gym.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Update gym with new logo path
    const logoPath = req.file.path.replace(/\\/g, '/'); // Convert Windows path to URL format
    gym.logo = logoPath;
    await gym.save();

    // Return the full URL for the logo
    const logoUrl = `${process.env.API_URL || 'http://localhost:5000'}/${logoPath}`;

    res.json({
      success: true,
      logoUrl,
      message: 'Logo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ success: false, message: 'Error uploading logo' });
  }
});

// Delete gym logo
router.delete('/logo', auth, gymAuth, async (req, res) => {
  try {
    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Delete logo file if exists
    if (gym.logo) {
      const logoPath = path.join(process.cwd(), gym.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    // Remove logo path from gym document
    gym.logo = null;
    await gym.save();

    res.json({
      success: true,
      message: 'Logo removed successfully'
    });
  } catch (error) {
    console.error('Error removing logo:', error);
    res.status(500).json({ success: false, message: 'Error removing logo' });
  }
});

module.exports = router; 