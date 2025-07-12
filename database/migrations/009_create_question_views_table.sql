-- Create question_views table to track user views for questions
CREATE TABLE IF NOT EXISTS question_views (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_question_views_user_id ON question_views(user_id);
CREATE INDEX IF NOT EXISTS idx_question_views_question_id ON question_views(question_id);

COMMIT; 