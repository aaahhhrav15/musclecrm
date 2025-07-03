const express = require('express');
const router = express.Router();
const personalTrainingController = require('../controllers/personalTrainingController');
const auth = require('../middleware/auth');

// Get all assignments (optionally filter by gymId)
router.get('/', auth, personalTrainingController.getAssignments);

// Create a new assignment
router.post('/', auth, personalTrainingController.createAssignment);

// Update an assignment
router.put('/:id', auth, personalTrainingController.updateAssignment);

// Delete an assignment
router.delete('/:id', auth, personalTrainingController.deleteAssignment);

module.exports = router; 