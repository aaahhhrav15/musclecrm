const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const GymStaff = require('../models/GymStaff');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get all trainers for the gym
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    // Find all staff members who are trainers for this gym
    const staff = await GymStaff.find({ 
      gymId: req.user.gymId,
      position: 'Personal Trainer'
    }).populate('trainerId');

    // Extract trainer data and ensure we have valid trainers
    const trainers = staff
      .filter(s => s.trainerId)
      .map(s => ({
        _id: s.trainerId._id,
        name: s.trainerId.name,
        email: s.trainerId.email,
        phone: s.trainerId.phone,
        specialization: s.trainerId.specialization,
        experience: s.trainerId.experience,
        status: s.trainerId.status,
        bio: s.trainerId.bio
      }));

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
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    // Find the staff member who is a trainer for this gym
    const staff = await GymStaff.findOne({ 
      gymId: req.user.gymId,
      trainerId: req.params.id,
      position: 'Personal Trainer'
    }).populate('trainerId');

    if (!staff || !staff.trainerId) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    res.json({ success: true, trainer: staff.trainerId });
  } catch (error) {
    console.error('Error fetching trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new trainer
router.post('/', auth, async (req, res) => {
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

    // Check if trainer with email already exists
    const existingTrainer = await Trainer.findOne({ email });
    if (existingTrainer) {
      return res.status(400).json({ success: false, message: 'Trainer with this email already exists' });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create a user account for the trainer
    const password = Math.random().toString(36).slice(-8); // Generate a random password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      industry: 'gym',
      role: 'staff',
      gymId: req.user.gymId,
      permissions: ['manage_workouts']
    });

    const trainer = new Trainer({
      name,
      email,
      phone,
      specialization,
      experience,
      status,
      bio,
    });

    await trainer.save();

    // Create corresponding staff record
    const staff = await GymStaff.create({
      gymId: req.user.gymId,
      userId: user._id,
      name,
      email,
      phone,
      position: 'Personal Trainer',
      status: status === 'active' ? 'Active' : 'Inactive',
      trainerId: trainer._id
    });

    res.status(201).json({ 
      success: true, 
      data: trainer,
      message: 'Trainer created successfully. A temporary password has been generated for their account.'
    });
  } catch (error) {
    console.error('Error creating trainer:', error);
    // Send more detailed error message
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
      details: error.stack
    });
  }
});

// Update a trainer
router.put('/:id', auth, async (req, res) => {
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

    // Find the staff member who is a trainer for this gym
    const staff = await GymStaff.findOne({ 
      gymId: req.user.gymId,
      trainerId: req.params.id,
      position: 'Personal Trainer'
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Check if trainer exists
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email !== trainer.email) {
      const existingTrainer = await Trainer.findOne({ email });
      if (existingTrainer) {
        return res.status(400).json({ success: false, message: 'Trainer with this email already exists' });
      }
    }

    // Update trainer
    trainer.name = name || trainer.name;
    trainer.email = email || trainer.email;
    trainer.phone = phone || trainer.phone;
    trainer.specialization = specialization || trainer.specialization;
    trainer.experience = experience || trainer.experience;
    trainer.status = status || trainer.status;
    trainer.bio = bio || trainer.bio;

    await trainer.save();

    // Update corresponding staff record
    staff.name = trainer.name;
    staff.email = trainer.email;
    staff.phone = trainer.phone;
    staff.status = trainer.status === 'active' ? 'Active' : 'Inactive';
    await staff.save();

    res.json({ success: true, data: trainer });
  } catch (error) {
    console.error('Error updating trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a trainer
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    // Find the staff member who is a trainer for this gym
    const staff = await GymStaff.findOne({ 
      gymId: req.user.gymId,
      trainerId: req.params.id,
      position: 'Personal Trainer'
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Delete the trainer
    await Trainer.findByIdAndDelete(req.params.id);

    // Delete the staff record
    await staff.deleteOne();

    res.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (error) {
    console.error('Error deleting trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 