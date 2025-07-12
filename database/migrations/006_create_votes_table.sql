-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer_id INTEGER NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, answer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_answer_id ON votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_votes_vote_type ON votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);

-- Create function to update answer vote count
CREATE OR REPLACE FUNCTION update_answer_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE answers SET votes = votes + NEW.vote_type WHERE id = NEW.answer_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE answers SET votes = votes - OLD.vote_type + NEW.vote_type WHERE id = NEW.answer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE answers SET votes = votes - OLD.vote_type WHERE id = OLD.answer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for vote count updates
CREATE TRIGGER update_answer_vote_count_insert
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_answer_vote_count();

CREATE TRIGGER update_answer_vote_count_update
    AFTER UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_answer_vote_count();

CREATE TRIGGER update_answer_vote_count_delete
    AFTER DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_answer_vote_count();

-- Create function to prevent self-voting
CREATE OR REPLACE FUNCTION prevent_self_vote()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT user_id FROM answers WHERE id = NEW.answer_id) = NEW.user_id THEN
        RAISE EXCEPTION 'Users cannot vote on their own answers';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to prevent self-voting
CREATE TRIGGER prevent_self_vote_trigger
    BEFORE INSERT OR UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_vote();

COMMIT;
