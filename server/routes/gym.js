const express = require('express');
const router = express.Router();
const Gym = require('../models/Gym');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');

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
    res.json({ success: true, gym });
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

module.exports = router; 