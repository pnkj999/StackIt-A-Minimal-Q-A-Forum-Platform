const express = require('express');
const router = express.Router();
const { 
    createAnswer, 
    updateAnswer, 
    deleteAnswer, 
    voteAnswer, 
    acceptAnswer 
} = require('../controllers/answerController');
const { authenticateToken } = require('../middleware/auth');
const { validateInput, schemas } = require('../middleware/validation');

// Create new answer
router.post('/', authenticateToken, validateInput(schemas.answer), createAnswer);

// Update answer
router.put('/:id', authenticateToken, validateInput(schemas.answer), updateAnswer);

// Delete answer
router.delete('/:id', authenticateToken, deleteAnswer);

// Vote on answer
router.post('/:id/vote', authenticateToken, validateInput(schemas.vote), voteAnswer);

// Accept answer
router.post('/:id/accept', authenticateToken, acceptAnswer);

module.exports = router;
