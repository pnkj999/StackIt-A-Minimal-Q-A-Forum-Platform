// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                error: 'Access token required',
                code: 'TOKEN_REQUIRED'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user still exists
        const userResult = await pool.query(
            'SELECT id, username, email, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        req.user = {
            ...decoded,
            ...userResult.rows[0]
        };
        
        // Add check for banned users in authenticate middleware
        const user = req.user;
        // Check if user is banned
        const pool = require('../config/database');
        const result = await pool.query('SELECT banned FROM users WHERE id = $1', [user.id]);
        if (result.rows.length > 0 && result.rows[0].banned) {
            return res.status(403).json({ error: 'Your account has been banned.' });
        }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        return res.status(403).json({ 
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userResult = await pool.query(
                'SELECT id, username, email, role FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (userResult.rows.length > 0) {
                req.user = {
                    ...decoded,
                    ...userResult.rows[0]
                };
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    next();
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireRole,
    requireAdmin
};
