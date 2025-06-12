const express = require('express');
const router = express.Router();
const HealthAssessment = require('../models/HealthAssessment');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET /api/health-assessments
// @desc    Get all health assessments for a gym
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const assessments = await HealthAssessment.find({ gymId: req.user.gymId })
      .sort({ date: -1 });
    res.json({ success: true, data: assessments });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/health-assessments/:id
// @desc    Get health assessment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const assessment = await HealthAssessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }
    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/health-assessments
// @desc    Create a health assessment
// @access  Private
router.post('/', [
  auth,
  [
    check('memberId', 'Member ID is required').not().isEmpty(),
    check('memberName', 'Member name is required').not().isEmpty(),
    check('age', 'Age is required').isNumeric(),
    check('gender', 'Gender is required').isIn(['male', 'female', 'other']),
    check('height', 'Height is required').isNumeric(),
    check('weight', 'Weight is required').isNumeric(),
    check('activityLevel', 'Activity level is required').isIn([
      'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
    ]),
    check('smokingStatus', 'Smoking status is required').isIn(['never', 'former', 'current']),
    check('alcoholConsumption', 'Alcohol consumption is required').isIn([
      'none', 'occasional', 'moderate', 'heavy'
    ])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const newAssessment = new HealthAssessment({
      ...req.body,
      gymId: req.user.gymId
    });

    const assessment = await newAssessment.save();
    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/health-assessments/:id
// @desc    Update a health assessment
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let assessment = await HealthAssessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Update assessment
    assessment = await HealthAssessment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/health-assessments/:id
// @desc    Delete a health assessment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const assessment = await HealthAssessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    await assessment.remove();
    res.json({ success: true, message: 'Assessment removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 