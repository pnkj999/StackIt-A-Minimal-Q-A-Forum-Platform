-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at DESC);

-- Insert default tags
INSERT INTO tags (name, description, color) VALUES 
('javascript', 'Questions about JavaScript programming language', '#F7DF1E'),
('react', 'Questions about React.js library', '#61DAFB'),
('nodejs', 'Questions about Node.js runtime', '#339933'),
('python', 'Questions about Python programming language', '#3776AB'),
('html', 'Questions about HTML markup language', '#E34F26'),
('css', 'Questions about CSS styling', '#1572B6'),
('sql', 'Questions about SQL databases', '#4479A1'),
('mongodb', 'Questions about MongoDB database', '#47A248'),
('express', 'Questions about Express.js framework', '#000000'),
('typescript', 'Questions about TypeScript', '#3178C6'),
('vue', 'Questions about Vue.js framework', '#4FC08D'),
('angular', 'Questions about Angular framework', '#DD0031'),
('php', 'Questions about PHP programming language', '#777BB4'),
('java', 'Questions about Java programming language', '#ED8B00'),
('csharp', 'Questions about C# programming language', '#239120'),
('cplusplus', 'Questions about C++ programming language', '#00599C'),
('go', 'Questions about Go programming language', '#00ADD8'),
('rust', 'Questions about Rust programming language', '#000000'),
('swift', 'Questions about Swift programming language', '#FA7343'),
('kotlin', 'Questions about Kotlin programming language', '#0095D5')
ON CONFLICT (name) DO NOTHING;

COMMIT;
