const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const GymStaff = require('../models/GymStaff');
const auth = require('../middleware/auth');

// Get all trainers
router.get('/', auth, async (req, res) => {
  try {
    const trainers = await Trainer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: trainers });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get a single trainer
router.get('/:id', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }
    res.json({ success: true, data: trainer });
  } catch (error) {
    console.error('Error fetching trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new trainer
router.post('/', auth, async (req, res) => {
  try {
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
      userId: req.user._id,
      name,
      email,
      phone,
      position: 'Personal Trainer',
      status: status === 'active' ? 'Active' : 'Inactive',
      trainerId: trainer._id
    });

    res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    console.error('Error creating trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a trainer
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      experience,
      status,
      bio,
    } = req.body;

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
    const staff = await GymStaff.findOne({ trainerId: trainer._id });
    if (staff) {
      staff.name = trainer.name;
      staff.email = trainer.email;
      staff.phone = trainer.phone;
      staff.status = trainer.status === 'active' ? 'Active' : 'Inactive';
      await staff.save();
    }

    res.json({ success: true, data: trainer });
  } catch (error) {
    console.error('Error updating trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a trainer
router.delete('/:id', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Delete corresponding staff record
    await GymStaff.findOneAndDelete({ trainerId: trainer._id });

    await trainer.deleteOne();
    res.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (error) {
    console.error('Error deleting trainer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 