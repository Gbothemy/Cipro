-- Add mining-related columns to users table
-- Run this in your Supabase SQL Editor

-- Add columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_mine_time TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_mined INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mining_sessions INTEGER DEFAULT 0;

-- Create index for faster mining queries
CREATE INDEX IF NOT EXISTS idx_users_last_mine_time ON users(last_mine_time);

-- Update existing users to have null last_mine_time (allows immediate first mine)
UPDATE users 
SET last_mine_time = NULL 
WHERE last_mine_time IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.last_mine_time IS 'Last time user completed mining (8-hour cooldown)';
COMMENT ON COLUMN users.total_mined IS 'Total Cipro mined by user across all sessions';
COMMENT ON COLUMN users.mining_sessions IS 'Number of mining sessions completed';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('last_mine_time', 'total_mined', 'mining_sessions')
ORDER BY column_name;
