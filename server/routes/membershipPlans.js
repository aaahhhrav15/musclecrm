const express = require('express');
const router = express.Router();
const MembershipPlan = require('../models/MembershipPlan');
const auth = require('../middleware/auth');
const { validateMembershipPlan } = require('../middleware/validation');

// @desc    Get all membership plans
// @route   GET /api/gym/membership-plans
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const plans = await MembershipPlan.find();
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching membership plans:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Create a new membership plan
// @route   POST /api/gym/membership-plans
// @access  Private
router.post('/', auth, validateMembershipPlan, async (req, res) => {
  try {
    const plan = await MembershipPlan.create(req.body);
    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error creating membership plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// @desc    Update a membership plan
// @route   PUT /api/gym/membership-plans/:id
// @access  Private
router.put('/:id', auth, validateMembershipPlan, async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Membership plan not found'
      });
    }

    const updatedPlan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedPlan
    });
  } catch (error) {
    console.error('Error updating membership plan:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Delete a membership plan
// @route   DELETE /api/gym/membership-plans/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Membership plan not found'
      });
    }

    await plan.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting membership plan:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router; 