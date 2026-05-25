import express from 'express';
import NotificationService from '../services/notificationService.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Send notification
router.post('/send', async (req, res) => {
  try {
    const { userId, type, channel, data } = req.body;
    if (!userId || !type || !channel) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'userId, type, and channel are required'
      });
    }

    const notification = await NotificationService.sendNotification(userId, type, channel, data);
    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Notification sent',
      data: notification
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get user notifications
router.get('/users/:userId', async (req, res) => {
  try {
    const notifications = await Notification.findByUserId(req.params.userId);
    res.json({
      status: 'success',
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get notification stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await NotificationService.getNotificationStats();
    res.json({
      status: 'success',
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.updateStatus(req.params.id, 'read');
    res.json({
      status: 'success',
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Initialize default templates
router.post('/init-templates', async (req, res) => {
  try {
    const count = await NotificationService.createDefaultTemplates();
    res.json({
      status: 'success',
      success: true,
      message: `${count} templates initialized`
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

export default router;
