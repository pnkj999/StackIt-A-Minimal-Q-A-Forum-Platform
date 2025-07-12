const express = require('express');
const router = express.Router();
const { 
    getQuestions, 
    getQuestionById, 
    createQuestion, 
    updateQuestion, 
    deleteQuestion, 
    getTags, 
    createTag, 
    updateTag, 
    deleteTag,
    voteQuestion
} = require('../controllers/questionController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const { validateInput, schemas } = require('../middleware/validation');

// Get all questions (with optional auth for personalization)
router.get('/', optionalAuth, getQuestions);

// Get tags
router.get('/tags', getTags);

// Admin-only tag management
router.post('/tags', authenticateToken, requireAdmin, createTag);
router.put('/tags/:id', authenticateToken, requireAdmin, updateTag);
router.delete('/tags/:id', authenticateToken, requireAdmin, deleteTag);

// Get single question
router.get('/:id', optionalAuth, getQuestionById);

// Create new question
router.post('/', authenticateToken, validateInput(schemas.question), createQuestion);

// Update question
router.put('/:id', authenticateToken, validateInput(schemas.question), updateQuestion);

// Delete question
router.delete('/:id', authenticateToken, deleteQuestion);

// Vote on a question
router.post('/:id/vote', authenticateToken, validateInput(schemas.vote), voteQuestion);

module.exports = router;
