-- Game Attempts Table Schema - CORRECTED VERSION
-- Tracks daily game attempts for each user with VIP tier limits
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS game_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL DEFAULT 'puzzle',
  won BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  difficulty VARCHAR(20) DEFAULT 'easy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_date ON game_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_game_attempts_user_date ON game_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_attempts_type ON game_attempts(game_type);

-- Step 3: Add table comment
COMMENT ON TABLE game_attempts IS 'Tracks all game attempts with daily limits based on VIP tiers';

-- Step 4: Add column comments
COMMENT ON COLUMN game_attempts.user_id IS 'Reference to users table';
COMMENT ON COLUMN game_attempts.game_type IS 'Type of game: puzzle, trivia, memory, spinwheel';
COMMENT ON COLUMN game_attempts.won IS 'Whether the user won the game';
COMMENT ON COLUMN game_attempts.score IS 'Points earned in the game';
COMMENT ON COLUMN game_attempts.difficulty IS 'Game difficulty: easy, medium, hard';
COMMENT ON COLUMN game_attempts.created_at IS 'Timestamp when attempt was made';

-- Verification queries:

-- Check if table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_name = 'game_attempts'
-- );

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'game_attempts';

-- Sample query to get today's attempts for a user
-- SELECT COUNT(*) FROM game_attempts 
-- WHERE user_id = 1
-- AND game_type = 'puzzle'
-- AND created_at >= CURRENT_DATE 
-- AND created_at < CURRENT_DATE + INTERVAL '1 day';

-- Get all attempts for a user
-- SELECT * FROM game_attempts 
-- WHERE user_id = 1 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- Get statistics by game type
-- SELECT 
--   game_type,
--   COUNT(*) as total_attempts,
--   SUM(CASE WHEN won THEN 1 ELSE 0 END) as wins,
--   AVG(score) as avg_score
-- FROM game_attempts
-- WHERE user_id = 1
-- GROUP BY game_type;

/*
VIP Tier Limits (per game type):
- Bronze (Level 1-5): 5 attempts/day
- Silver (Level 6-15): 10 attempts/day
- Gold (Level 16-30): 20 attempts/day
- Platinum (Level 31-50): 50 attempts/day
- Diamond (Level 51+): 100 attempts/day

Game Types:
- puzzle: Puzzle game with 100,000+ puzzles
- trivia: Trivia game with 100,000+ questions
- memory: Memory match game
- spinwheel: Spin wheel prize game
*/
