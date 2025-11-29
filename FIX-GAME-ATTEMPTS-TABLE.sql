-- Fix game_attempts table to use TEXT for user_id instead of BIGINT
-- This matches the users table which uses TEXT for user_id

-- Drop the existing table if it exists (this will delete any existing data)
DROP TABLE IF EXISTS game_attempts CASCADE;

-- Recreate the table with correct schema
CREATE TABLE game_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  won BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX idx_game_attempts_created ON game_attempts(created_at DESC);
CREATE INDEX idx_game_attempts_game_type ON game_attempts(game_type);
CREATE INDEX idx_game_attempts_user_game ON game_attempts(user_id, game_type);

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'game_attempts'
ORDER BY ordinal_position;
