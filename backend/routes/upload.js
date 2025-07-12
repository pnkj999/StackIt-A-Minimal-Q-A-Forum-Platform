const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Upload image
router.post('/', authenticateToken, uploadImage);

module.exports = router;
