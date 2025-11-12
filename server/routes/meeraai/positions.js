const express = require('express');
const router = express.Router();
const MeeraAIPosition = require('../../models/MeeraAIPosition');

// Get all positions
router.get('/', async (req, res) => {
  try {
    const positions = await MeeraAIPosition.find().sort({ createdAt: -1 });
    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new position
router.post('/', async (req, res) => {
  try {
    const position = new MeeraAIPosition({
      title: req.body.title,
      department: req.body.department,
      location: req.body.location,
      type: req.body.type,
      description: req.body.description,
      detailedDescription: req.body.detailedDescription,
      requirements: req.body.requirements || []
    });

    const newPosition = await position.save();
    res.status(201).json(newPosition);
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a position
router.put('/:id', async (req, res) => {
  try {
    const position = await MeeraAIPosition.findById(req.params.id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    Object.assign(position, {
      title: req.body.title,
      department: req.body.department,
      location: req.body.location,
      type: req.body.type,
      description: req.body.description,
      detailedDescription: req.body.detailedDescription,
      requirements: req.body.requirements || position.requirements
    });

    const updatedPosition = await position.save();
    res.json(updatedPosition);
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a position
router.delete('/:id', async (req, res) => {
  try {
    const position = await MeeraAIPosition.findById(req.params.id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    await position.deleteOne();
    res.json({ message: 'Position deleted' });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

