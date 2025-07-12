const pool = require('../config/database');

const getStats = async (req, res, next) => {
    try {
        // Get basic stats
        const statsPromises = [
            pool.query('SELECT COUNT(*) as count FROM users'),
            pool.query('SELECT COUNT(*) as count FROM questions'),
            pool.query('SELECT COUNT(*) as count FROM answers'),
            pool.query('SELECT COUNT(*) as count FROM tags')
        ];

        const [usersResult, questionsResult, answersResult, tagsResult] = await Promise.all(statsPromises);

        // Get recent activity (last 10 activities)
        const recentActivityResult = await pool.query(`
            SELECT 
                'question' as type,
                'New question posted' as description,
                created_at as timestamp
            FROM questions 
            WHERE created_at >= NOW() - INTERVAL '7 days'
            UNION ALL
            SELECT 
                'answer' as type,
                'New answer posted' as description,
                created_at as timestamp
            FROM answers 
            WHERE created_at >= NOW() - INTERVAL '7 days'
            UNION ALL
            SELECT 
                'user' as type,
                'New user registered' as description,
                created_at as timestamp
            FROM users 
            WHERE created_at >= NOW() - INTERVAL '7 days'
            ORDER BY timestamp DESC
            LIMIT 10
        `);

        res.json({
            totalUsers: parseInt(usersResult.rows[0].count),
            totalQuestions: parseInt(questionsResult.rows[0].count),
            totalAnswers: parseInt(answersResult.rows[0].count),
            totalTags: parseInt(tagsResult.rows[0].count),
            recentActivity: recentActivityResult.rows
        });

    } catch (error) {
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = `
            SELECT 
                u.id, u.username, u.email, u.role, u.created_at,
                COUNT(DISTINCT q.id) as question_count,
                COUNT(DISTINCT a.id) as answer_count
            FROM users u
            LEFT JOIN questions q ON u.id = q.user_id
            LEFT JOIN answers a ON u.id = a.user_id
        `;

        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` WHERE (u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += `
            GROUP BY u.id, u.username, u.email, u.role, u.created_at
            ORDER BY u.created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        const countParams = [];

        if (search) {
            countQuery += ' WHERE (username ILIKE $1 OR email ILIKE $1)';
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            users: result.rows.map(user => ({
                ...user,
                questionCount: parseInt(user.question_count),
                answerCount: parseInt(user.answer_count)
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        next(error);
    }
};

const updateUserRole = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ 
                error: 'Invalid role. Must be "user" or "admin"',
                code: 'INVALID_ROLE'
            });
        }

        // Prevent admin from removing their own admin role
        if (userId == req.user.id && role === 'user') {
            return res.status(400).json({ 
                error: 'You cannot remove your own admin role',
                code: 'SELF_ROLE_REMOVAL'
            });
        }

        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
            [role, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            message: 'User role updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (userId == req.user.id) {
            return res.status(400).json({ 
                error: 'You cannot delete your own account',
                code: 'SELF_DELETION'
            });
        }

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            message: 'User deleted successfully',
            user: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

const getFlaggedContent = async (req, res, next) => {
    try {
        // For now, return empty array since flagging system isn't implemented
        // This can be extended when content flagging is added
        res.json({
            flaggedItems: []
        });

    } catch (error) {
        next(error);
    }
};

const moderateContent = async (req, res, next) => {
    try {
        const contentId = req.params.id;
        const { action, reason } = req.body;

        if (!['remove', 'dismiss'].includes(action)) {
            return res.status(400).json({ 
                error: 'Invalid action. Must be "remove" or "dismiss"',
                code: 'INVALID_ACTION'
            });
        }

        // For now, just return success since flagging system isn't implemented
        // This can be extended when content flagging is added
        res.json({
            message: `Content ${action}ed successfully`,
            contentId,
            action,
            reason
        });

    } catch (error) {
        next(error);
    }
};

// Admin: ban a user
const banUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        // Prevent banning self or other admins
        const userResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (userResult.rows[0].role === 'admin') {
            return res.status(403).json({ error: 'Cannot ban another admin' });
        }
        await pool.query('UPDATE users SET banned = TRUE WHERE id = $1', [userId]);
        res.json({ message: 'User banned successfully' });
    } catch (error) {
        next(error);
    }
};

// Admin: unban a user
const unbanUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        await pool.query('UPDATE users SET banned = FALSE WHERE id = $1', [userId]);
        res.json({ message: 'User unbanned successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getUsers,
    getFlaggedContent,
    updateUserRole,
    deleteUser,
    moderateContent,
    banUser,
    unbanUser
}; 