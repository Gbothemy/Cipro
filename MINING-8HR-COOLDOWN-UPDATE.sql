-- ============================================
-- MINING 8-HOUR COOLDOWN UPDATE
-- ============================================
-- Add mining tracking columns to users table
-- Remove localStorage dependency

-- Add mining columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_mine_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS total_mined INTEGER DEFAULT 0;

-- Create index for faster mining queries
CREATE INDEX IF NOT EXISTS idx_users_last_mine_time ON users(last_mine_time);

-- Update existing users to have null last_mine_time (allows immediate first mine)
UPDATE users 
SET last_mine_time = NULL 
WHERE last_mine_time IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.last_mine_time IS 'Last time user completed mining (8-hour cooldown)';
COMMENT ON COLUMN users.total_mined IS 'Total Cipro mined by user across all sessions';
