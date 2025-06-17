const express = require('express');
const router = express.Router();
const WorkoutPlan = require('../models/WorkoutPlan');
const auth = require('../middleware/auth');
const { gymAuth } = require('../middleware/gymAuth');
const AssignedWorkoutPlan = require('../models/AssignedWorkoutPlan');

// Apply both auth and gymAuth middleware to all routes
router.use(auth);
router.use(gymAuth);

// Get all workout plans for the gym
router.get('/', async (req, res) => {
  try {
    const workoutPlans = await WorkoutPlan.find({ gymId: req.gymId })
      .sort({ createdAt: -1 });
    res.json({ success: true, workoutPlans });
  } catch (error) {
    console.error('Error fetching workout plans:', error);
    res.status(500).json({ success: false, message: 'Error fetching workout plans' });
  }
});

// Get assigned workout plans
router.get('/assigned', async (req, res) => {
  try {
    console.log('Fetching assigned workout plans...');
    
    const assignedPlans = await AssignedWorkoutPlan.find()
      .populate({
        path: 'planId',
        select: 'name goal level duration weeks',
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

// Assign workout plan to a member
router.post('/assign', async (req, res) => {
  try {
    const { memberId, memberName, planId, startDate, notes } = req.body;

    // Validate required fields
    if (!memberId || !memberName || !planId || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if plan exists and get its details
    const plan = await WorkoutPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Workout plan not found' });
    }

    // Create assigned workout plan with complete plan details
    const assignedPlan = new AssignedWorkoutPlan({
      memberId,
      memberName,
      planId,
      plan: {
        name: plan.name,
        goal: plan.goal,
        duration: plan.duration,
        level: plan.level,
        weeks: plan.weeks
      },
      startDate,
      notes,
      status: 'active',
      gymId: req.gymId
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
router.delete('/assigned/:id', async (req, res) => {
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

// Get a specific workout plan
router.get('/:id', async (req, res) => {
  try {
    const workoutPlan = await WorkoutPlan.findOne({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!workoutPlan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }
    
    res.json({ success: true, workoutPlan });
  } catch (error) {
    console.error('Error fetching workout plan:', error);
    res.status(500).json({ success: false, message: 'Error fetching workout plan' });
  }
});

// Create a new workout plan
router.post('/', async (req, res) => {
  try {
    const workoutPlan = new WorkoutPlan({
      ...req.body,
      gymId: req.gymId
    });
    await workoutPlan.save();
    res.status(201).json({ success: true, workoutPlan });
  } catch (error) {
    console.error('Error creating workout plan:', error);
    res.status(500).json({ success: false, message: 'Error creating workout plan' });
  }
});

// Update a workout plan
router.put('/:id', async (req, res) => {
  try {
    const workoutPlan = await WorkoutPlan.findOneAndUpdate(
      { _id: req.params.id, gymId: req.gymId },
      req.body,
      { new: true }
    );
    
    if (!workoutPlan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }
    
    res.json({ success: true, workoutPlan });
  } catch (error) {
    console.error('Error updating workout plan:', error);
    res.status(500).json({ success: false, message: 'Error updating workout plan' });
  }
});

// Delete a workout plan
router.delete('/:id', async (req, res) => {
  try {
    const workoutPlan = await WorkoutPlan.findOneAndDelete({
      _id: req.params.id,
      gymId: req.gymId
    });
    
    if (!workoutPlan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }
    
    res.json({ success: true, message: 'Workout plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    res.status(500).json({ success: false, message: 'Error deleting workout plan' });
  }
});

module.exports = router; 