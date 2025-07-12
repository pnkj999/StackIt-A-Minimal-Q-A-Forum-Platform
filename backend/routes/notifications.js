const express = require('express');
const router = express.Router();
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Get user notifications
router.get('/', authenticateToken, getNotifications);

// Mark notifications as read
router.post('/mark-read', authenticateToken, markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', authenticateToken, markAllAsRead);

// Delete notification
router.delete('/:id', authenticateToken, deleteNotification);

module.exports = router;
