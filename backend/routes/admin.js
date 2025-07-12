const express = require('express');
const router = express.Router();
const { 
    getStats, 
    getUsers, 
    getFlaggedContent,
    updateUserRole,
    deleteUser,
    moderateContent
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Dashboard stats
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Content moderation
router.get('/flagged', getFlaggedContent);
router.post('/moderate/:id', moderateContent);

module.exports = router; 