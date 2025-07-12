const express = require('express');
const router = express.Router();
const { register, login, getProfile, refreshToken } = require('../controllers/authController');
const { banUser, unbanUser } = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { validateInput, schemas } = require('../middleware/validation');
const { requireAdmin } = require('../middleware/admin');

// Register new user
router.post('/register', validateInput(schemas.register), register);

// Login user
router.post('/login', validateInput(schemas.login), login);

// Get user profile
router.get('/profile', authenticateToken, getProfile);

// Refresh token
router.post('/refresh', authenticateToken, refreshToken);

// Admin: ban a user
router.post('/users/:id/ban', authenticateToken, requireAdmin, banUser);
// Admin: unban a user
router.post('/users/:id/unban', authenticateToken, requireAdmin, unbanUser);

module.exports = router;
