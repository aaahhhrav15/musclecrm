const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const GymStaff = require('../models/GymStaff');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const bcrypt = require('bcryptjs');

// Apply both auth and gymAuth middleware to all routes
router.use(auth);
router.use(gymAuth);

// Get all trainers for the gym
router.get('/', async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    // Find all trainers for this gym
    const trainers = await Trainer.find({ gymId: req.user.gymId }).sort({ createdAt: -1 });

    res.json({ success: true, data: trainers });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Get a single trainer
router.get('/:id', async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    // Find the trainer for this gym
    const trainer = await Trainer.findOne({ 
      _id: req.params.id,
      gymId: req.user.gymId
    });

    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    res.json({ success: true, trainer });
  } catch (error) {
    console.error('Error fetching trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new trainer
router.post('/', async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const {
      name,
      email,
      phone,
      dateOfBirth,
      specialization,
      experience,
      status,
      bio,
    } = req.body;

    // Check if trainer with email already exists
    const existingTrainer = await Trainer.findOne({ 
      email,
      gymId: req.user.gymId 
    });
    if (existingTrainer) {
      return res.status(400).json({ success: false, message: 'Trainer with this email already exists' });
    }

    // Create the trainer record
    const trainer = await Trainer.create({
      name,
      email,
      phone,
      dateOfBirth,
      specialization,
      experience,
      status: status || 'active',
      bio,
      gymId: req.user.gymId
    });

    // Create the staff record with position as 'Personal Trainer'
    const staff = await GymStaff.create({
      gymId: req.user.gymId,
      name,
      email,
      phone,
      dateOfBirth,
      position: 'Personal Trainer',
      status: status === 'active' ? 'Active' : 'Inactive',
      trainerId: trainer._id,
      userId: req.user._id,
      experience: experience || 0
    });

    console.log('Created new trainer and staff:', {
      trainerId: trainer._id,
      staffId: staff._id
    });

    res.status(201).json({ 
      success: true, 
      data: trainer,
      message: 'Trainer created successfully'
    });
  } catch (error) {
    console.error('Error creating trainer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
      details: error.stack
    });
  }
});

// Update a trainer
router.put('/:id', async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const {
      name,
      email,
      phone,
      specialization,
      experience,
      status,
      bio,
    } = req.body;

    // Find the trainer for this gym
    const trainer = await Trainer.findOne({ 
      _id: req.params.id,
      gymId: req.user.gymId
    });

    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email !== trainer.email) {
      const existingTrainer = await Trainer.findOne({ 
        email,
        gymId: req.user.gymId,
        _id: { $ne: req.params.id }
      });
      if (existingTrainer) {
        return res.status(400).json({ success: false, message: 'Trainer with this email already exists' });
      }
    }

    // Update trainer
    const updatedTrainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        specialization,
        experience,
        status,
        bio,
        gymId: req.user.gymId
      },
      { new: true, runValidators: true }
    );

    if (!updatedTrainer) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update trainer record' 
      });
    }

    // Find existing staff record for this trainer in this gym
    const existingStaff = await GymStaff.findOne({
      gymId: req.user.gymId,
      trainerId: trainer._id
    });

    if (existingStaff) {
      // Update existing staff record
      existingStaff.name = name;
      existingStaff.email = email;
      existingStaff.phone = phone;
      existingStaff.status = status === 'active' ? 'Active' : 'Inactive';
      existingStaff.experience = experience || 0;
      await existingStaff.save();
    } else {
      // Create new staff record if none exists
      await GymStaff.create({
        gymId: req.user.gymId,
        name,
        email,
        phone,
        position: 'Personal Trainer',
        status: status === 'active' ? 'Active' : 'Inactive',
        trainerId: trainer._id,
        userId: req.user._id,
        experience: experience || 0
      });
    }

    res.json({ 
      success: true, 
      data: updatedTrainer,
      message: 'Trainer updated successfully'
    });
  } catch (error) {
    console.error('Error updating trainer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Delete a trainer
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    // Find the trainer
    const trainer = await Trainer.findOne({ 
      _id: req.params.id,
      gymId: req.user.gymId
    });
    
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Find and delete the corresponding staff record
    const staff = await GymStaff.findOne({ 
      gymId: req.user.gymId,
      trainerId: trainer._id
    });

    if (staff) {
      await staff.deleteOne();
    }

    // Delete the trainer
    await trainer.deleteOne();

    res.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (error) {
    console.error('Error deleting trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 