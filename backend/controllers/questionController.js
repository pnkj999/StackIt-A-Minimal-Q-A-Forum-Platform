// backend/controllers/questionController.js
const pool = require('../config/database');

const getQuestions = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const tag = req.query.tag || '';
        const sortBy = req.query.sortBy || 'newest'; // newest, oldest, most_answers, most_views
        
        let orderClause = 'q.created_at DESC';
        switch (sortBy) {
            case 'oldest':
                orderClause = 'q.created_at ASC';
                break;
            case 'most_answers':
                orderClause = 'answer_count DESC, q.created_at DESC';
                break;
            case 'most_views':
                orderClause = 'q.view_count DESC, q.created_at DESC';
                break;
            default:
                orderClause = 'q.created_at DESC';
        }
        
        const userId = req.user?.id;
        
        let query = `
            SELECT 
                q.id, q.title, q.description, q.view_count, q.votes, q.created_at, q.updated_at,
                u.username as author, u.id as author_id,
                COUNT(DISTINCT a.id) as answer_count,
                CASE WHEN q.accepted_answer_id IS NOT NULL THEN true ELSE false END as has_accepted_answer,
                ${userId ? `(SELECT vote_type FROM votes WHERE user_id = $${paramCount + 3} AND question_id = q.id) as user_vote` : 'NULL as user_vote'}
            FROM questions q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN answers a ON q.id = a.question_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (search) {
            paramCount++;
            query += ` AND (q.title ILIKE $${paramCount} OR q.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }
        
        if (tag) {
            paramCount++;
            query += ` AND EXISTS (
                SELECT 1 FROM question_tags qt2 
                JOIN tags t2 ON qt2.tag_id = t2.id 
                WHERE qt2.question_id = q.id AND t2.name = $${paramCount}
            )`;
            params.push(tag);
        }
        
        query += `
            GROUP BY q.id, u.username, u.id
            ORDER BY ${orderClause}
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;
        
        if (userId) {
            params.push(userId);
        }
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        // Get tags for each question
        const questionsWithTags = await Promise.all(
            result.rows.map(async (question) => {
                const tagsResult = await pool.query(
                    `SELECT t.id, t.name, t.color 
                     FROM question_tags qt 
                     JOIN tags t ON qt.tag_id = t.id 
                     WHERE qt.question_id = $1`,
                    [question.id]
                );
                return {
                    ...question,
                    tags: tagsResult.rows
                };
            })
        );
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(DISTINCT q.id) as total
            FROM questions q
            WHERE 1=1
        `;
        
        const countParams = [];
        let countParamCount = 0;
        
        if (search) {
            countParamCount++;
            countQuery += ` AND (q.title ILIKE $${countParamCount} OR q.description ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }
        
        if (tag) {
            countParamCount++;
            countQuery += ` AND t.name = $${countParamCount}`;
            countParams.push(tag);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);
        
        res.json({
            questions: questionsWithTags,
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

const getQuestionById = async (req, res, next) => {
    try {
        const questionId = req.params.id;
        const userId = req.user?.id;
        // Simple anti-refresh spam: only increment if not viewed in last minute (per user)
        let shouldIncrement = true;
        if (userId) {
            const recentView = await pool.query(
                `SELECT viewed_at FROM question_views WHERE user_id = $1 AND question_id = $2 AND viewed_at > NOW() - INTERVAL '1 minute'`,
                [userId, questionId]
            );
            if (recentView.rows.length > 0) shouldIncrement = false;
        }
        if (shouldIncrement) {
            if (userId) {
                await pool.query(
                    `UPDATE questions SET view_count = view_count + 1 
                     WHERE id = $1 AND user_id != $2`,
                    [questionId, userId]
                );
                // Track view
                await pool.query(
                    `INSERT INTO question_views (user_id, question_id, viewed_at) VALUES ($1, $2, NOW())
                     ON CONFLICT (user_id, question_id) DO UPDATE SET viewed_at = NOW()`,
                    [userId, questionId]
                );
            } else {
                await pool.query(
                    'UPDATE questions SET view_count = view_count + 1 WHERE id = $1',
                    [questionId]
                );
            }
        }
        
        // Get question details with vote information
        const questionQuery = `
            SELECT 
                q.id, q.title, q.description, q.view_count, q.votes, q.created_at, q.updated_at, q.accepted_answer_id,
                u.username as author, u.id as author_id,
                ${userId ? `(SELECT vote_type FROM votes WHERE user_id = $2 AND question_id = $1) as user_vote` : 'NULL as user_vote'}
            FROM questions q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = $1
        `;
        
        const questionResult = await pool.query(
            questionQuery, 
            userId ? [questionId, userId] : [questionId]
        );
        
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Question not found',
                code: 'QUESTION_NOT_FOUND'
            });
        }
        
        // Get tags for the question
        const tagsResult = await pool.query(
            `SELECT t.id, t.name, t.color 
             FROM question_tags qt 
             JOIN tags t ON qt.tag_id = t.id 
             WHERE qt.question_id = $1`,
            [questionId]
        );
        
        // Get answers with vote information for current user
        const answersQuery = `
            SELECT 
                a.id, a.content, a.votes, a.is_accepted, a.created_at, a.updated_at,
                u.username as author, u.id as author_id,
                ${userId ? `(SELECT vote_type FROM votes WHERE user_id = $2 AND answer_id = a.id) as user_vote` : 'NULL as user_vote'}
            FROM answers a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.question_id = $1
            ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC
        `;
        
        const answersResult = await pool.query(
            answersQuery, 
            userId ? [questionId, userId] : [questionId]
        );
        
        const question = questionResult.rows[0];
        question.tags = tagsResult.rows;
        question.answers = answersResult.rows;
        question.canEdit = userId && (userId === question.author_id || req.user?.role === 'admin');
        
        res.json(question);
        
    } catch (error) {
        next(error);
    }
};

const createQuestion = async (req, res, next) => {
    try {
        const { title, description, tags } = req.validatedData;
        const userId = req.user.id;
        
        // Start transaction
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Create question
            const questionResult = await client.query(
                `INSERT INTO questions (title, description, user_id) 
                 VALUES ($1, $2, $3) 
                 RETURNING *`,
                [title, description, userId]
            );
            
            const question = questionResult.rows[0];
            
            // Handle tags
            const questionTags = [];
            for (const tagName of tags) {
                const normalizedTagName = tagName.toLowerCase().trim();
                
                // Insert tag if it doesn't exist
                const tagResult = await client.query(
                    `INSERT INTO tags (name) 
                     VALUES ($1) 
                     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
                     RETURNING id, name, color`,
                    [normalizedTagName]
                );
                
                const tag = tagResult.rows[0];
                questionTags.push(tag);
                
                // Link question to tag
                await client.query(
                    'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2)',
                    [question.id, tag.id]
                );
            }
            
            await client.query('COMMIT');
            
            res.status(201).json({
                message: 'Question created successfully',
                question: {
                    id: question.id,
                    title: question.title,
                    description: question.description,
                    tags: questionTags,
                    author: req.user.username,
                    createdAt: question.created_at
                }
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

const updateQuestion = async (req, res, next) => {
    try {
        const questionId = req.params.id;
        const { title, description, tags } = req.validatedData;
        const userId = req.user.id;
        
        // Check if user owns the question or is admin
        const questionResult = await pool.query(
            'SELECT user_id FROM questions WHERE id = $1',
            [questionId]
        );
        
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Question not found',
                code: 'QUESTION_NOT_FOUND'
            });
        }
        
        const questionOwnerId = questionResult.rows[0].user_id;
        
        if (userId !== questionOwnerId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'You can only edit your own questions',
                code: 'UNAUTHORIZED_EDIT'
            });
        }
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Update question
            await client.query(
                `UPDATE questions 
                 SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $3`,
                [title, description, questionId]
            );
            
            // Remove existing tags
            await client.query(
                'DELETE FROM question_tags WHERE question_id = $1',
                [questionId]
            );
            
            // Add new tags
            const questionTags = [];
            for (const tagName of tags) {
                const normalizedTagName = tagName.toLowerCase().trim();
                
                const tagResult = await client.query(
                    `INSERT INTO tags (name) 
                     VALUES ($1) 
                     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
                     RETURNING id, name, color`,
                    [normalizedTagName]
                );
                
                const tag = tagResult.rows[0];
                questionTags.push(tag);
                
                await client.query(
                    'INSERT INTO question_tags (question_id, tag_id) VALUES ($1, $2)',
                    [questionId, tag.id]
                );
            }
            
            await client.query('COMMIT');
            
            res.json({
                message: 'Question updated successfully',
                question: {
                    id: questionId,
                    title,
                    description,
                    tags: questionTags
                }
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

const deleteQuestion = async (req, res, next) => {
    try {
        const questionId = req.params.id;
        const userId = req.user.id;
        
        // Check if user owns the question or is admin
        const questionResult = await pool.query(
            'SELECT user_id FROM questions WHERE id = $1',
            [questionId]
        );
        
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Question not found',
                code: 'QUESTION_NOT_FOUND'
            });
        }
        
        const questionOwnerId = questionResult.rows[0].user_id;
        
        if (userId !== questionOwnerId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'You can only delete your own questions',
                code: 'UNAUTHORIZED_DELETE'
            });
        }
        
        // Delete question (cascade will handle related records)
        await pool.query('DELETE FROM questions WHERE id = $1', [questionId]);
        
        res.json({ message: 'Question deleted successfully' });
        
    } catch (error) {
        next(error);
    }
};

const getTags = async (req, res, next) => {
    try {
        const search = req.query.search || '';
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        
        let query = `
            SELECT t.id, t.name, t.color, COUNT(qt.question_id) as question_count
            FROM tags t
            LEFT JOIN question_tags qt ON t.id = qt.tag_id
        `;
        
        const params = [];
        
        if (search) {
            query += ' WHERE t.name ILIKE $1';
            params.push(`%${search}%`);
        }
        
        query += `
            GROUP BY t.id, t.name, t.color
            ORDER BY question_count DESC, t.name ASC
            LIMIT $${params.length + 1}
        `;
        
        params.push(limit);
        
        const result = await pool.query(query, params);
        
        res.json({
            tags: result.rows.map(tag => ({
                ...tag,
                question_count: parseInt(tag.question_count)
            }))
        });
        
    } catch (error) {
        next(error);
    }
};

// Admin-only tag management endpoints
const createTag = async (req, res, next) => {
    try {
        const { name, color } = req.body;
        if (!name || !color) {
            return res.status(400).json({ error: 'Name and color are required' });
        }
        const normalizedTagName = name.toLowerCase().trim();
        const result = await pool.query(
            `INSERT INTO tags (name, color)
             VALUES ($1, $2)
             ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
             RETURNING id, name, color`,
            [normalizedTagName, color]
        );
        res.status(201).json({ tag: result.rows[0], message: 'Tag created/updated successfully' });
    } catch (error) {
        next(error);
    }
};
const updateTag = async (req, res, next) => {
    try {
        const tagId = req.params.id;
        const { name, color } = req.body;
        if (!name || !color) {
            return res.status(400).json({ error: 'Name and color are required' });
        }
        const normalizedTagName = name.toLowerCase().trim();
        const result = await pool.query(
            `UPDATE tags SET name = $1, color = $2 WHERE id = $3 RETURNING id, name, color`,
            [normalizedTagName, color, tagId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.json({ tag: result.rows[0], message: 'Tag updated successfully' });
    } catch (error) {
        next(error);
    }
};
const deleteTag = async (req, res, next) => {
    try {
        const tagId = req.params.id;
        // Remove tag from question_tags first (if any)
        await pool.query('DELETE FROM question_tags WHERE tag_id = $1', [tagId]);
        // Delete tag
        const result = await pool.query('DELETE FROM tags WHERE id = $1 RETURNING id, name', [tagId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }
        res.json({ tag: result.rows[0], message: 'Tag deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const voteQuestion = async (req, res, next) => {
    try {
        const questionId = req.params.id;
        const { voteType } = req.validatedData;
        const userId = req.user.id;
        // Check if question exists
        const questionResult = await pool.query(
            'SELECT id, user_id FROM questions WHERE id = $1',
            [questionId]
        );
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Question not found',
                code: 'QUESTION_NOT_FOUND'
            });
        }
        // Prevent self-voting
        if (questionResult.rows[0].user_id === userId) {
            return res.status(400).json({ 
                error: 'You cannot vote on your own question',
                code: 'SELF_VOTE_NOT_ALLOWED'
            });
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Check existing vote
            const existingVoteResult = await client.query(
                'SELECT vote_type FROM votes WHERE user_id = $1 AND question_id = $2',
                [userId, questionId]
            );
            if (existingVoteResult.rows.length > 0) {
                const existingVoteType = existingVoteResult.rows[0].vote_type;
                if (existingVoteType === voteType) {
                    // Remove vote if same type (toggle)
                    await client.query(
                        'DELETE FROM votes WHERE user_id = $1 AND question_id = $2',
                        [userId, questionId]
                    );
                } else {
                    // Update vote type
                    await client.query(
                        'UPDATE votes SET vote_type = $1 WHERE user_id = $2 AND question_id = $3',
                        [voteType, userId, questionId]
                    );
                }
            } else {
                // Create new vote
                await client.query(
                    'INSERT INTO votes (user_id, question_id, vote_type) VALUES ($1, $2, $3)',
                    [userId, questionId, voteType]
                );
            }
            // Recalculate votes
            const votesSumResult = await client.query(
                'SELECT COALESCE(SUM(vote_type), 0) AS votes FROM votes WHERE question_id = $1',
                [questionId]
            );
            const newVotes = votesSumResult.rows[0].votes;
            await client.query(
                'UPDATE questions SET votes = $1 WHERE id = $2',
                [newVotes, questionId]
            );
            await client.query('COMMIT');
            // Get updated vote count and user's current vote
            const updatedQuestionResult = await pool.query(
                `SELECT q.votes,
                        (SELECT vote_type FROM votes WHERE user_id = $2 AND question_id = $1) as user_vote
                 FROM questions q WHERE q.id = $1`,
                [questionId, userId]
            );
            res.json({
                message: 'Vote recorded successfully',
                votes: updatedQuestionResult.rows[0].votes,
                userVote: updatedQuestionResult.rows[0].user_vote
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

module.exports = {
    getQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getTags,
    createTag,
    updateTag,
    deleteTag,
    voteQuestion // Export the new function
};
