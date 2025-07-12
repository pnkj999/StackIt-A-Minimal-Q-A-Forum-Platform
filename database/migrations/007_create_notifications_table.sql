-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER,
    related_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_id, related_type);

-- Create function to clean up old read notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE is_read = TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Create function to limit notifications per user
CREATE OR REPLACE FUNCTION limit_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep only the latest 100 notifications per user
    DELETE FROM notifications 
    WHERE user_id = NEW.user_id 
    AND id NOT IN (
        SELECT id FROM notifications 
        WHERE user_id = NEW.user_id 
        ORDER BY created_at DESC 
        LIMIT 100
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to limit notifications
CREATE TRIGGER limit_user_notifications_trigger
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION limit_user_notifications();

COMMIT;
