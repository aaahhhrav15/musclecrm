const express = require('express');
const GymStaff = require('../models/GymStaff');
const Trainer = require('../models/Trainer');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all staff
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const staff = await GymStaff.find({ gymId: req.user.gymId })
      .populate('trainerId', 'experience specialization bio')
      .lean();

    // If staff member is a trainer, use the trainer's experience
    const staffWithTrainerInfo = staff.map(member => {
      if (member.trainerId) {
        return {
          ...member,
          experience: member.trainerId.experience || member.experience
        };
      }
      return member;
    });

    res.json({ success: true, data: staffWithTrainerInfo });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ success: false, message: 'Error fetching staff' });
  }
});

// Get single staff member
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const staff = await GymStaff.findOne({ 
      _id: req.params.id,
      gymId: req.user.gymId 
    })
    .populate('trainerId', 'experience specialization bio')
    .lean();
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // If staff member is a trainer, use the trainer's experience
    if (staff.trainerId) {
      staff.experience = staff.trainerId.experience || staff.experience;
    }
    
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({ success: false, message: 'Error fetching staff member' });
  }
});

// Create new staff member
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const { name, email, phone, position, hireDate, status, dateOfBirth, experience } = req.body;
    
    let trainerId = null;
    
    // If position is Personal Trainer, create a trainer record
    if (position === 'Personal Trainer') {
      const trainer = await Trainer.create({
        name,
        email,
        phone,
        dateOfBirth,
        specialization: 'Personal Training',
        experience: experience !== undefined ? experience : 0,
        status: status === 'Active' ? 'active' : 'inactive',
        bio: 'Personal Trainer',
        gymId: req.user.gymId
      });
      trainerId = trainer._id;
    }
    
    const newStaff = await GymStaff.create({
      gymId: req.user.gymId,
      userId: req.user._id,
      name,
      email,
      phone,
      dateOfBirth,
      position,
      hireDate,
      status,
      trainerId,
      experience: experience !== undefined ? experience : 0
    });
    
    res.status(201).json({ success: true, data: newStaff });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: 'Error creating staff member' });
  }
});

// Update staff member
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const { name, email, phone, position, hireDate, status, dateOfBirth, experience } = req.body;
    
    const staff = await GymStaff.findOne({ 
      _id: req.params.id, 
      gymId: req.user.gymId 
    });
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Handle trainer synchronization
    if (position === 'Personal Trainer' && !staff.trainerId) {
      // Create new trainer if staff becomes a trainer
      const trainer = await Trainer.create({
        name,
        email,
        phone,
        dateOfBirth,
        specialization: 'Personal Training',
        experience: experience !== undefined ? experience : 0,
        status: status === 'Active' ? 'active' : 'inactive',
        bio: 'Personal Trainer',
        gymId: req.user.gymId
      });
      staff.trainerId = trainer._id;
    } else if (position !== 'Personal Trainer' && staff.trainerId) {
      // Remove trainer if staff is no longer a trainer
      await Trainer.findByIdAndDelete(staff.trainerId);
      staff.trainerId = null;
    } else if (staff.trainerId) {
      // Update existing trainer
      await Trainer.findByIdAndUpdate(staff.trainerId, {
        name,
        email,
        phone,
        dateOfBirth,
        experience: experience !== undefined ? experience : 0,
        status: status === 'Active' ? 'active' : 'inactive'
      });
    }
    
    // Update staff
    staff.name = name;
    staff.email = email;
    staff.phone = phone;
    staff.dateOfBirth = dateOfBirth;
    staff.position = position;
    staff.hireDate = hireDate;
    staff.status = status;
    staff.experience = experience !== undefined ? experience : 0;
    
    await staff.save();
    
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ success: false, message: 'Error updating staff member' });
  }
});

// Delete staff member
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.gymId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No gym associated with this account' 
      });
    }

    const staff = await GymStaff.findOne({ 
      _id: req.params.id,
      gymId: req.user.gymId 
    });
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Delete associated trainer if exists
    if (staff.trainerId) {
      await Trainer.findByIdAndDelete(staff.trainerId);
    }
    
    await staff.deleteOne();
    
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ success: false, message: 'Error deleting staff member' });
  }
});

module.exports = router;
