const pool = require('../config/database');

// User submits a report
const submitReport = async (req, res, next) => {
    try {
        const { targetType, targetId, reason, details } = req.body;
        const reporterId = req.user.id;
        if (!['question', 'answer'].includes(targetType)) {
            return res.status(400).json({ error: 'Invalid target type' });
        }
        await pool.query(
            `INSERT INTO reports (reporter_id, target_type, target_id, reason, details) VALUES ($1, $2, $3, $4, $5)`,
            [reporterId, targetType, targetId, reason, details || null]
        );
        res.status(201).json({ message: 'Report submitted successfully' });
    } catch (error) {
        next(error);
    }
};

// Admin: list all reports
const listReports = async (req, res, next) => {
    try {
        const { status, targetType } = req.query;
        let query = 'SELECT r.*, u.username as reporter FROM reports r LEFT JOIN users u ON r.reporter_id = u.id WHERE 1=1';
        const params = [];
        if (status) {
            params.push(status);
            query += ` AND r.status = $${params.length}`;
        }
        if (targetType) {
            params.push(targetType);
            query += ` AND r.target_type = $${params.length}`;
        }
        query += ' ORDER BY r.created_at DESC';
        const result = await pool.query(query, params);
        res.json({ reports: result.rows });
    } catch (error) {
        next(error);
    }
};

// Admin: moderate a report (remove/dismiss)
const moderateReport = async (req, res, next) => {
    try {
        const reportId = req.params.id;
        const { action } = req.body; // 'remove' or 'dismiss'
        const adminId = req.user.id;
        if (!['remove', 'dismiss'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }
        // Get report details
        const reportResult = await pool.query('SELECT * FROM reports WHERE id = $1', [reportId]);
        if (reportResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        const report = reportResult.rows[0];
        // Remove content if action is 'remove'
        if (action === 'remove') {
            if (report.target_type === 'question') {
                await pool.query('DELETE FROM questions WHERE id = $1', [report.target_id]);
            } else if (report.target_type === 'answer') {
                await pool.query('DELETE FROM answers WHERE id = $1', [report.target_id]);
            }
        }
        // Update report status
        await pool.query(
            'UPDATE reports SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3',
            [action === 'remove' ? 'reviewed' : 'dismissed', adminId, reportId]
        );
        res.json({ message: `Report ${action}ed successfully` });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitReport,
    listReports,
    moderateReport
}; 