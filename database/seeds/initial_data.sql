-- Insert sample tags
INSERT INTO tags (name, description, color) VALUES
('javascript', 'Questions about JavaScript programming language', '#F7DF1E'),
('react', 'Questions about React.js library', '#61DAFB'),
('node.js', 'Questions about Node.js runtime', '#339933'),
('python', 'Questions about Python programming language', '#3776AB'),
('html', 'Questions about HTML markup language', '#E34F26'),
('css', 'Questions about CSS styling', '#1572B6'),
('sql', 'Questions about SQL databases', '#4479A1'),
('mongodb', 'Questions about MongoDB database', '#47A248'),
('express', 'Questions about Express.js framework', '#000000'),
('typescript', 'Questions about TypeScript', '#3178C6');

-- Insert sample admin user (password: Admin123!)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@stackit.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2/Nh5Ej.Ky', 'admin');

-- Insert sample regular user (password: User123!)
INSERT INTO users (username, email, password_hash, role) VALUES
('johndoe', 'john@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2/Nh5Ej.Ky', 'user');

-- Insert sample question
INSERT INTO questions (title, description, user_id) VALUES
('How to handle async/await in JavaScript?', 
'<p>I''m having trouble understanding how to properly use async/await in JavaScript. Can someone explain the best practices?</p><p>Here''s what I''ve tried:</p><pre><code>async function fetchData() {
  const response = await fetch(''/api/data'');
  const data = await response.json();
  return data;
}</code></pre><p>Is this the correct way to handle it?</p>', 
2);

-- Link question to tags
INSERT INTO question_tags (question_id, tag_id) VALUES
(1, 1), -- javascript
(1, 9); -- express

-- Insert sample answer
INSERT INTO answers (content, question_id, user_id, votes) VALUES
('<p>Yes, your approach is correct! Here are some additional best practices:</p><ol><li><strong>Error Handling:</strong> Always wrap your async/await in try-catch blocks</li><li><strong>Promise.all:</strong> Use it for concurrent operations</li><li><strong>Avoid blocking:</strong> Don''t use await in loops unless necessary</li></ol><p>Here''s an improved version:</p><pre><code>async function fetchData() {
  try {
    const response = await fetch(''/api/data'');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(''Error fetching data:'', error);
    throw error;
  }
}</code></pre>', 
1, 1, 5);

-- Accept the answer
UPDATE questions SET accepted_answer_id = 1 WHERE id = 1;
UPDATE answers SET is_accepted = true WHERE id = 1;
