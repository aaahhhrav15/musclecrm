const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const axios = require('axios');
const Gym = require('../models/Gym');

const router = express.Router();

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const notifications = await Notification.find({ 
      userId: req.user._id, 
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);
    // Also fetch broadcast notifications (global or gym-specific)
    const broadcastNotifications = await Notification.find({
      broadcast: true,
      $or: [
        { gymId: req.user.gymId },
        { gymId: null }
      ],
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 }).limit(50);
    // Merge and sort by createdAt
    const allNotifications = [...notifications, ...broadcastNotifications].sort((a, b) => b.createdAt - a.createdAt);
    res.json({
      success: true,
      notifications: allNotifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// Mark a notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read'
    });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { broadcast: true }
      ]
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
});

// Create notification (for testing only - would typically be created by system events)
router.post('/', auth, async (req, res) => {
  try {
    const { title, message, type, link } = req.body;
    
    const newNotification = await Notification.create({
      userId: req.user._id,
      title,
      message,
      type,
      link
    });
    
    res.status(201).json({
      success: true,
      notification: {
        id: newNotification._id,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        read: newNotification.read,
        createdAt: newNotification.createdAt,
        link: newNotification.link
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Error creating notification' });
  }
});

// Get all notifications for a gym
router.get('/gym', auth, async (req, res) => {
  try {
    const { gymId } = req.query;
    if (!gymId) {
      return res.status(400).json({ success: false, message: 'gymId is required' });
    }
    const notifications = await Notification.find({ gymId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Get gym notifications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching gym notifications' });
  }
});

// Create a notification for all members of a gym or broadcast
router.post('/gym', auth, async (req, res) => {
  try {
    const { gymId, title, message, type, data, expiresAt, broadcast } = req.body;
    if (!title || !message || !type) {
      return res.status(400).json({ success: false, message: 'title, message, and type are required' });
    }
    // Fetch gymCode from Gym model if gymId is present
    let gymCode = undefined;
    if (gymId) {
      const gym = await Gym.findById(gymId).lean();
      gymCode = gym?.gymCode;
    }
    // If broadcast, create a single broadcast notification
    if (broadcast) {
      const newNotification = await Notification.create({
        gymId: gymId || null,
        title,
        message,
        type: 'broadcast',
        data: data || {},
        expiresAt: expiresAt
          ? (typeof expiresAt === 'string' && !expiresAt.match(/Z|[+-]\d{2}:\d{2}$/)
              ? new Date(expiresAt + ':00')
              : new Date(expiresAt))
          : undefined,
        broadcast: true
      });
      // Send to external notification endpoint if gymCode and type are present
      if (gymCode && type) {
        axios.post('https://web-production-0271d.up.railway.app/send-gym-notification', {
          gym_code: gymCode,
          title,
          body: message,
          type
        }).catch(err => console.error('External notification error:', err?.response?.data || err.message));
      }
      return res.status(201).json({ success: true, notification: newNotification });
    }
    // Otherwise, create for all gym members (legacy)
    const newNotification = await Notification.create({
      gymId,
      title,
      message,
      type,
      data: data || {},
      expiresAt: expiresAt
        ? (typeof expiresAt === 'string' && !expiresAt.match(/Z|[+-]\d{2}:\d{2}$/)
            ? new Date(expiresAt + ':00')
            : new Date(expiresAt))
        : undefined,
      broadcast: false
    });
    // Send to external notification endpoint if gymCode and type are present
    if (gymCode && type) {
      axios.post('http://13.233.43.147/send-gym-notification', {
        gym_code: gymCode,
        title,
        body: message,
        type
      })
      .then(() => {
        console.log('Gym notification sent to app');
      })
      .catch(err => console.error('External notification error:', err?.response?.data || err.message));
    }
    res.status(201).json({ success: true, notification: newNotification });
  } catch (error) {
    console.error('Create gym notification error:', error);
    res.status(500).json({ success: false, message: 'Error creating gym notification' });
  }
});

// Update a notification
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, message, expiresAt } = req.body;
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { userId: req.user._id },
          { broadcast: true }
        ]
      },
      {
        title,
        message,
        expiresAt: expiresAt
          ? (typeof expiresAt === 'string' && !expiresAt.match(/Z|[+-]\d{2}:\d{2}$/)
              ? new Date(expiresAt + ':00')
              : new Date(expiresAt))
          : undefined
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      notification,
      message: 'Notification updated successfully'
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification'
    });
  }
});

module.exports = router;
