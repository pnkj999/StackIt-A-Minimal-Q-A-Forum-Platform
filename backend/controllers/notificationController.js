const pool = require('../config/database');

const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT id, type, title, message, is_read, related_id, related_type, created_at
             FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
            [userId]
        );

        const total = parseInt(countResult.rows[0].total);

        res.json({
            notifications: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { notificationIds } = req.body;

        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({ 
                error: 'Notification IDs array is required',
                code: 'INVALID_INPUT'
            });
        }

        const placeholders = notificationIds.map((_, index) => `$${index + 2}`).join(',');
        
        await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE user_id = $1 AND id IN (${placeholders})`,
            [userId, ...notificationIds]
        );

        res.json({ message: 'Notifications marked as read' });

    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1',
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });

    } catch (error) {
        next(error);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Notification not found',
                code: 'NOTIFICATION_NOT_FOUND'
            });
        }

        res.json({ message: 'Notification deleted successfully' });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
