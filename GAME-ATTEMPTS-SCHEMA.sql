-- Game Attempts Table Schema
-- Tracks daily game attempts for each user with VIP tier limits

-- Create the table
CREATE TABLE IF NOT EXISTS game_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL DEFAULT 'puzzle',
  won BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  difficulty VARCHAR(20) DEFAULT 'easy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_date ON game_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_game_attempts_user_date ON game_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_attempts_type ON game_attempts(game_type);

-- Add comment
COMMENT ON TABLE game_attempts IS 'Tracks all game attempts with daily limits based on VIP tiers';

-- Sample query to get today's attempts
-- SELECT COUNT(*) FROM game_attempts 
-- WHERE user_id = $1 
-- AND game_type = 'puzzle'
-- AND created_at >= CURRENT_DATE 
-- AND created_at < CURRENT_DATE + INTERVAL '1 day';

-- VIP Tier Limits:
-- Bronze (Level 1-5): 5 attempts/day
-- Silver (Level 6-15): 10 attempts/day
-- Gold (Level 16-30): 20 attempts/day
-- Platinum (Level 31-50): 50 attempts/day
-- Diamond (Level 51+): 100 attempts/day
