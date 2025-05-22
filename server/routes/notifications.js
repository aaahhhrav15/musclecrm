
const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all notifications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, read } = req.query;
    const query = { userId: req.user._id };
    
    // Add read filter if provided
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const notifications = await Notification.find(query, null, options);
    const total = await Notification.countDocuments(query);
    
    res.json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt,
        link: notification.link
      })),
      total
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt,
        link: notification.link
      }
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Error marking notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Error marking all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Error deleting notification' });
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

module.exports = router;
