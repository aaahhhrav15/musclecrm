const express = require('express');
const router = express.Router();
const WorkoutPlan = require('../models/WorkoutPlan');
const auth = require('../middleware/auth');
const AssignedWorkoutPlan = require('../models/AssignedWorkoutPlan');

// Get assigned workout plans - This must come BEFORE the /:id route
router.get('/assigned', auth, async (req, res) => {
  try {
    console.log('Fetching assigned workout plans...');
    
    const assignedPlans = await AssignedWorkoutPlan.find()
      .populate({
        path: 'planId',
        select: 'name goal level duration',
        model: 'WorkoutPlan'
      })
      .sort({ startDate: -1 });

    // Transform the data
    const transformedPlans = assignedPlans.map(plan => ({
      _id: plan._id,
      memberId: plan.memberId,
      memberName: plan.memberName,
      startDate: plan.startDate,
      notes: plan.notes,
      status: plan.status,
      plan: plan.planId,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));

    res.json({ assignedPlans: transformedPlans });
  } catch (error) {
    console.error('Detailed error in /assigned route:', error);
    res.status(500).json({ 
      message: 'Error fetching assigned plans',
      error: error.message 
    });
  }
});

// Get all workout plans
router.get('/', auth, async (req, res) => {
  try {
    const plans = await WorkoutPlan.find().lean();
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching workout plans:', error);
    res.status(500).json({ error: 'Failed to fetch workout plans' });
  }
});

// Get a single workout plan
router.get('/:id', auth, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id).lean();
    if (!plan) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }
    res.json({ plan });
  } catch (error) {
    console.error('Error fetching workout plan:', error);
    res.status(500).json({ error: 'Failed to fetch workout plan' });
  }
});

// Create a new workout plan
router.post('/', auth, async (req, res) => {
  try {
    const plan = new WorkoutPlan(req.body);
    await plan.save();
    res.status(201).json({ plan });
  } catch (error) {
    console.error('Error creating workout plan:', error);
    res.status(500).json({ error: 'Failed to create workout plan' });
  }
});

// Update a workout plan
router.put('/:id', auth, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!plan) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }
    res.json({ plan });
  } catch (error) {
    console.error('Error updating workout plan:', error);
    res.status(500).json({ error: 'Failed to update workout plan' });
  }
});

// Delete a workout plan
router.delete('/:id', auth, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }
    res.json({ message: 'Workout plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    res.status(500).json({ error: 'Failed to delete workout plan' });
  }
});

// Assign workout plan to a member
router.post('/assign', auth, async (req, res) => {
  try {
    const { memberId, memberName, planId, startDate, notes } = req.body;

    // Validate required fields
    if (!memberId || !memberName || !planId || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if plan exists
    const plan = await WorkoutPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Workout plan not found' });
    }

    // Create assigned workout plan
    const assignedPlan = new AssignedWorkoutPlan({
      memberId,
      memberName,
      planId,
      startDate,
      notes,
      status: 'active'
    });

    await assignedPlan.save();

    res.status(201).json({
      message: 'Workout plan assigned successfully',
      assignedPlan
    });
  } catch (error) {
    console.error('Error assigning workout plan:', error);
    res.status(500).json({ message: 'Error assigning workout plan' });
  }
});

// Delete an assigned workout plan
router.delete('/assigned/:id', auth, async (req, res) => {
  try {
    const assignedPlan = await AssignedWorkoutPlan.findByIdAndDelete(req.params.id);
    if (!assignedPlan) {
      return res.status(404).json({ message: 'Assigned workout plan not found' });
    }
    res.json({ message: 'Assigned workout plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting assigned workout plan:', error);
    res.status(500).json({ message: 'Error deleting assigned workout plan' });
  }
});

module.exports = router; 