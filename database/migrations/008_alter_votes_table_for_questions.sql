-- Migration: Support voting for both questions and answers

-- 1. Add question_id column, make answer_id nullable
ALTER TABLE votes
    ADD COLUMN question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    ALTER COLUMN answer_id DROP NOT NULL;

-- 2. Add check constraint: either question_id or answer_id must be set, but not both
ALTER TABLE votes
    ADD CONSTRAINT votes_question_or_answer_chk
    CHECK (
        (question_id IS NOT NULL AND answer_id IS NULL)
        OR (question_id IS NULL AND answer_id IS NOT NULL)
    );

-- 3. Update unique constraint: user can only vote once per question or answer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'votes_user_id_answer_id_key'
    ) THEN
        ALTER TABLE votes DROP CONSTRAINT votes_user_id_answer_id_key;
    END IF;
END$$;

ALTER TABLE votes
    ADD CONSTRAINT votes_user_unique_vote UNIQUE (user_id, question_id, answer_id);

-- 4. Add foreign key for question_id (already done above)

-- 5. Add votes column to questions table if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='questions' AND column_name='votes'
    ) THEN
        ALTER TABLE questions ADD COLUMN votes INTEGER DEFAULT 0;
    END IF;
END$$;

-- 6. Update triggers/functions for vote count
-- Remove old triggers if present
DROP TRIGGER IF EXISTS update_answer_vote_count_insert ON votes;
DROP TRIGGER IF EXISTS update_answer_vote_count_update ON votes;
DROP TRIGGER IF EXISTS update_answer_vote_count_delete ON votes;
DROP FUNCTION IF EXISTS update_answer_vote_count();

-- Create new function to update vote counts for questions and answers
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.answer_id IS NOT NULL THEN
            UPDATE answers SET votes = votes + NEW.vote_type WHERE id = NEW.answer_id;
        ELSIF NEW.question_id IS NOT NULL THEN
            UPDATE questions SET votes = votes + NEW.vote_type WHERE id = NEW.question_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.answer_id IS NOT NULL THEN
            UPDATE answers SET votes = votes - OLD.vote_type + NEW.vote_type WHERE id = NEW.answer_id;
        ELSIF NEW.question_id IS NOT NULL THEN
            UPDATE questions SET votes = votes - OLD.vote_type + NEW.vote_type WHERE id = NEW.question_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.answer_id IS NOT NULL THEN
            UPDATE answers SET votes = votes - OLD.vote_type WHERE id = OLD.answer_id;
        ELSIF OLD.question_id IS NOT NULL THEN
            UPDATE questions SET votes = votes - OLD.vote_type WHERE id = OLD.question_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create new triggers
CREATE TRIGGER update_vote_count_insert
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_count();

CREATE TRIGGER update_vote_count_update
    AFTER UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_count();

CREATE TRIGGER update_vote_count_delete
    AFTER DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_count();

COMMIT; 