-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    votes INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_votes ON answers(votes DESC);
CREATE INDEX IF NOT EXISTS idx_answers_is_accepted ON answers(is_accepted);
CREATE INDEX IF NOT EXISTS idx_answers_created_at ON answers(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_answers_content ON answers USING gin(to_tsvector('english', content));

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_answers_updated_at 
    BEFORE UPDATE ON answers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update question's accepted_answer_id when answer is accepted
CREATE OR REPLACE FUNCTION update_question_accepted_answer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_accepted = TRUE AND OLD.is_accepted = FALSE THEN
        -- Unaccept any other answers for this question
        UPDATE answers SET is_accepted = FALSE 
        WHERE question_id = NEW.question_id AND id != NEW.id;
        
        -- Update the question's accepted_answer_id
        UPDATE questions SET accepted_answer_id = NEW.id 
        WHERE id = NEW.question_id;
    ELSIF NEW.is_accepted = FALSE AND OLD.is_accepted = TRUE THEN
        -- Remove accepted_answer_id from question
        UPDATE questions SET accepted_answer_id = NULL 
        WHERE id = NEW.question_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for accepted answer updates
CREATE TRIGGER update_question_accepted_answer_trigger
    AFTER UPDATE OF is_accepted ON answers
    FOR EACH ROW
    EXECUTE FUNCTION update_question_accepted_answer();

COMMIT;
