// backend/controllers/answerController.js
const pool = require('../config/database');

const createAnswer = async (req, res, next) => {
    try {
        const { content, questionId } = req.validatedData;
        const userId = req.user.id;
        
        // Check if question exists
        const questionResult = await pool.query(
            'SELECT id, user_id, title FROM questions WHERE id = $1',
            [questionId]
        );
        
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Question not found',
                code: 'QUESTION_NOT_FOUND'
            });
        }
        
        const question = questionResult.rows[0];
        
        // Create answer
        const answerResult = await pool.query(
            `INSERT INTO answers (content, question_id, user_id) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [content, questionId, userId]
        );
        
        const answer = answerResult.rows[0];
        
        // Create notification for question owner
        if (question.user_id !== userId) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    question.user_id,
                    'new_answer',
                    'New Answer',
                    `${req.user.username} answered your question: "${question.title}"`,
                    answer.id,
                    'answer'
                ]
            );
            
            // Send real-time notification
            req.io.to(`user_${question.user_id}`).emit('notification', {
                id: Date.now(),
                type: 'new_answer',
                title: 'New Answer',
                message: `${req.user.username} answered your question`,
                questionId: questionId,
                answerId: answer.id,
                createdAt: new Date().toISOString()
            });
        }
        
        res.status(201).json({
            message: 'Answer created successfully',
            answer: {
                id: answer.id,
                content: answer.content,
                questionId: answer.question_id,
                author: req.user.username,
                votes: 0,
                isAccepted: false,
                createdAt: answer.created_at
            }
        });
        
    } catch (error) {
        next(error);
    }
};

const updateAnswer = async (req, res, next) => {
    try {
        const answerId = req.params.id;
        const { content } = req.validatedData;
        const userId = req.user.id;
        
        // Check if user owns the answer or is admin
        const answerResult = await pool.query(
            'SELECT user_id FROM answers WHERE id = $1',
            [answerId]
        );
        
        if (answerResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Answer not found',
                code: 'ANSWER_NOT_FOUND'
            });
        }
        
        const answerOwnerId = answerResult.rows[0].user_id;
        
        if (userId !== answerOwnerId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'You can only edit your own answers',
                code: 'UNAUTHORIZED_EDIT'
            });
        }
        
        // Update answer
        const updatedAnswer = await pool.query(
            `UPDATE answers 
             SET content = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [content, answerId]
        );
        
        res.json({
            message: 'Answer updated successfully',
            answer: updatedAnswer.rows[0]
        });
        
    } catch (error) {
        next(error);
    }
};

const deleteAnswer = async (req, res, next) => {
    try {
        const answerId = req.params.id;
        const userId = req.user.id;
        
        // Check if user owns the answer or is admin
        const answerResult = await pool.query(
            'SELECT user_id FROM answers WHERE id = $1',
            [answerId]
        );
        
        if (answerResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Answer not found',
                code: 'ANSWER_NOT_FOUND'
            });
        }
        
        const answerOwnerId = answerResult.rows[0].user_id;
        
        if (userId !== answerOwnerId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'You can only delete your own answers',
                code: 'UNAUTHORIZED_DELETE'
            });
        }
        
        // Delete answer
        await pool.query('DELETE FROM answers WHERE id = $1', [answerId]);
        
        res.json({ message: 'Answer deleted successfully' });
        
    } catch (error) {
        next(error);
    }
};

const voteAnswer = async (req, res, next) => {
    try {
        const answerId = req.params.id;
        const { voteType } = req.validatedData;
        const userId = req.user.id;
        // Check if answer exists
        const answerResult = await pool.query(
            'SELECT id, user_id FROM answers WHERE id = $1',
            [answerId]
        );
        if (answerResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Answer not found',
                code: 'ANSWER_NOT_FOUND'
            });
        }
        // Prevent self-voting
        if (answerResult.rows[0].user_id === userId) {
            return res.status(400).json({ 
                error: 'You cannot vote on your own answer',
                code: 'SELF_VOTE_NOT_ALLOWED'
            });
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Check existing vote
            const existingVoteResult = await client.query(
                'SELECT vote_type FROM votes WHERE user_id = $1 AND answer_id = $2',
                [userId, answerId]
            );
            if (existingVoteResult.rows.length > 0) {
                const existingVoteType = existingVoteResult.rows[0].vote_type;
                if (existingVoteType === voteType) {
                    // Remove vote if same type (toggle)
                    await client.query(
                        'DELETE FROM votes WHERE user_id = $1 AND answer_id = $2',
                        [userId, answerId]
                    );
                } else {
                    // Update vote type
                    await client.query(
                        'UPDATE votes SET vote_type = $1 WHERE user_id = $2 AND answer_id = $3',
                        [voteType, userId, answerId]
                    );
                }
            } else {
                // Create new vote
                await client.query(
                    'INSERT INTO votes (user_id, answer_id, vote_type) VALUES ($1, $2, $3)',
                    [userId, answerId, voteType]
                );
            }
            // Recalculate votes
            const votesSumResult = await client.query(
                'SELECT COALESCE(SUM(vote_type), 0) AS votes FROM votes WHERE answer_id = $1',
                [answerId]
            );
            const newVotes = votesSumResult.rows[0].votes;
            await client.query(
                'UPDATE answers SET votes = $1 WHERE id = $2',
                [newVotes, answerId]
            );
            await client.query('COMMIT');
            // Get updated vote count and user's current vote
            const updatedAnswerResult = await pool.query(
                `SELECT a.votes,
                        (SELECT vote_type FROM votes WHERE user_id = $2 AND answer_id = $1) as user_vote
                 FROM answers a WHERE a.id = $1`,
                [answerId, userId]
            );
            res.json({
                message: 'Vote recorded successfully',
                votes: updatedAnswerResult.rows[0].votes,
                userVote: updatedAnswerResult.rows[0].user_vote
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        next(error);
    }
};

const acceptAnswer = async (req, res, next) => {
    try {
        const answerId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        // Get answer and question details
        const result = await pool.query(`
            SELECT a.id, a.question_id, a.user_id as answer_author_id, 
                   q.user_id as question_owner_id, q.title
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE a.id = $1
        `, [answerId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Answer not found',
                code: 'ANSWER_NOT_FOUND'
            });
        }
        const { question_id, question_owner_id, answer_author_id, title } = result.rows[0];
        // Allow question owner or admin to accept answers
        if (question_owner_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ 
                error: 'Only the question owner or an admin can accept answers',
                code: 'UNAUTHORIZED_ACCEPT'
            });
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Unaccept any previously accepted answer
            await client.query(
                'UPDATE answers SET is_accepted = FALSE WHERE question_id = $1',
                [question_id]
            );
            // Accept the selected answer
            await client.query(
                'UPDATE answers SET is_accepted = TRUE WHERE id = $1',
                [answerId]
            );
            // Update question's accepted_answer_id
            await client.query(
                'UPDATE questions SET accepted_answer_id = $1 WHERE id = $2',
                [answerId, question_id]
            );
            await client.query('COMMIT');
            // Create notification for answer author
            if (answer_author_id !== userId) {
                await pool.query(
                    `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        answer_author_id,
                        'answer_accepted',
                        'Answer Accepted',
                        `Your answer to "${title}" was accepted!`,
                        answerId,
                        'answer'
                    ]
                );
                // Send real-time notification
                req.io.to(`user_${answer_author_id}`).emit('notification', {
                    id: Date.now(),
                    type: 'answer_accepted',
                    title: 'Answer Accepted',
                    message: 'Your answer was accepted!',
                    questionId: question_id,
                    answerId: answerId,
                    createdAt: new Date().toISOString()
                });
            }
            res.json({ message: 'Answer accepted successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createAnswer,
    updateAnswer,
    deleteAnswer,
    voteAnswer,
    acceptAnswer
};
