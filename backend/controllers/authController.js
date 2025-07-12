// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id, 
            username: user.username, 
            email: user.email,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.validatedData;
        
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ 
                error: 'User with this email or username already exists',
                code: 'USER_EXISTS'
            });
        }
        
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create user
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) 
             RETURNING id, username, email, role, created_at`,
            [username, email, passwordHash]
        );
        
        const user = result.rows[0];
        const token = generateToken(user);
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.created_at
            }
        });
        
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.validatedData;
        console.log('LOGIN ATTEMPT:', { email, password });
        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        console.log('USER QUERY RESULT:', result.rows);
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }
        const user = result.rows[0];
        console.log('PASSWORD HASH:', user.password_hash);
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log('BCRYPT COMPARE RESULT:', isValidPassword);
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }
        const token = generateToken(user);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatar_url
            }
        });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        const result = await pool.query(
            `SELECT id, username, email, role, avatar_url, created_at,
                    (SELECT COUNT(*) FROM questions WHERE user_id = $1) as question_count,
                    (SELECT COUNT(*) FROM answers WHERE user_id = $1) as answer_count
             FROM users WHERE id = $1`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = result.rows[0];
        
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatar_url,
                createdAt: user.created_at,
                questionCount: parseInt(user.question_count),
                answerCount: parseInt(user.answer_count)
            }
        });
        
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const user = req.user;
        const newToken = generateToken(user);
        
        res.json({
            message: 'Token refreshed successfully',
            token: newToken
        });
        
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    refreshToken
};
