const express = require('express');
const router = express.Router();
const Gym = require('../models/Gym');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileService = require('../services/fileService');

// Ensure uploads directory exists with proper permissions
const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 }); // Set full permissions
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
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
      gymData.logo = `${process.env.API_URL || 'http://localhost:5001'}/${gymData.logo}`;
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
    console.log('Received logo upload request');
    console.log('Gym ID from auth:', req.gymId);
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      console.log('Gym not found:', req.gymId);
      return res.status(404).json({ message: 'Gym not found' });
    }

    console.log('Found gym:', gym._id);

    // Delete old logo if exists
    if (gym.logo) {
      console.log('Deleting old logo:', gym.logo);
      await fileService.deleteFile(gym.logo);
    }

    // Save new logo
    console.log('Saving new logo...');
    const logoPath = await fileService.saveFile(req.file);
    console.log('Logo saved with path:', logoPath);
    
    // Update gym with new logo path
    gym.logo = logoPath;
    await gym.save();
    console.log('Gym updated with new logo path');

    // Return the full URL for the logo
    const logoUrl = `${process.env.API_URL || 'http://localhost:5001'}/${logoPath}`;
    console.log('Returning logo URL:', logoUrl);

    res.json({ 
      message: 'Logo uploaded successfully', 
      logo: logoUrl 
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ 
      message: 'Error uploading logo', 
      error: error.message 
    });
  }
});

// Delete gym logo
router.delete('/logo', auth, gymAuth, async (req, res) => {
  try {
    const gym = await Gym.findById(req.gymId);
    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }

    if (gym.logo) {
      await fileService.deleteFile(gym.logo);
      gym.logo = null;
      await gym.save();
    }

    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ message: 'Error deleting logo', error: error.message });
  }
});

module.exports = router; 