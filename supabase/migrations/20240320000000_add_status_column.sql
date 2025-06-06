-- Add status column to saves table
ALTER TABLE saves ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread';

-- Add time_added column if it doesn't exist
ALTER TABLE saves ADD COLUMN IF NOT EXISTS time_added BIGINT DEFAULT EXTRACT(EPOCH FROM NOW());

-- Create an index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_saves_status ON saves(status);

-- Create an index on time_added for faster sorting
CREATE INDEX IF NOT EXISTS idx_saves_time_added ON saves(time_added); 