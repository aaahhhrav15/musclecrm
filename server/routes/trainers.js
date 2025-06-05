const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const auth = require('../middleware/auth');

// Get all trainers
router.get('/', auth, async (req, res) => {
  try {
    const trainers = await Trainer.find().sort({ createdAt: -1 });
    res.json({ trainers });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single trainer
router.get('/:id', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    res.json({ trainer });
  } catch (error) {
    console.error('Error fetching trainer:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(400).json({ message: 'Trainer with this email already exists' });
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
    res.status(201).json({ trainer });
  } catch (error) {
    console.error('Error creating trainer:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Trainer not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email !== trainer.email) {
      const existingTrainer = await Trainer.findOne({ email });
      if (existingTrainer) {
        return res.status(400).json({ message: 'Trainer with this email already exists' });
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
    res.json({ trainer });
  } catch (error) {
    console.error('Error updating trainer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a trainer
router.delete('/:id', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    await trainer.deleteOne();
    res.json({ message: 'Trainer deleted successfully' });
  } catch (error) {
    console.error('Error deleting trainer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 