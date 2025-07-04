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

// Renew an assignment
router.post('/:id/renew', auth, personalTrainingController.renewAssignment);

// Delete an assignment
router.delete('/:id', auth, personalTrainingController.deleteAssignment);

// Get assignments expiring today or in the next 7 days
router.get('/expiring', auth, personalTrainingController.getExpiringAssignments);

module.exports = router; 