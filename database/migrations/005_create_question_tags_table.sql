-- Create question_tags junction table
CREATE TABLE IF NOT EXISTS question_tags (
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (question_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_tags_question_id ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag_id ON question_tags(tag_id);

-- Create function to limit tags per question
CREATE OR REPLACE FUNCTION check_question_tag_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM question_tags WHERE question_id = NEW.question_id) >= 5 THEN
        RAISE EXCEPTION 'A question cannot have more than 5 tags';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to enforce tag limit
CREATE TRIGGER check_question_tag_limit_trigger
    BEFORE INSERT ON question_tags
    FOR EACH ROW
    EXECUTE FUNCTION check_question_tag_limit();

COMMIT;
