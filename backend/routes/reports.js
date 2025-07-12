const express = require('express');
const router = express.Router();
const { submitReport, listReports, moderateReport } = require('../controllers/reportController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// User: submit a report
router.post('/', authenticateToken, submitReport);

// Admin: list all reports
router.get('/admin', authenticateToken, requireAdmin, listReports);

// Admin: moderate a report
router.post('/admin/:id/moderate', authenticateToken, requireAdmin, moderateReport);

module.exports = router; 