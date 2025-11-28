-- ============================================
-- GAME ATTEMPTS TABLE - COPY AND RUN THIS
-- ============================================
-- Just copy this entire file and paste it into
-- Supabase SQL Editor, then click RUN
-- ============================================

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_date ON game_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_game_attempts_user_date ON game_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_attempts_type ON game_attempts(game_type);

-- Add comment
COMMENT ON TABLE game_attempts IS 'Tracks all game attempts with daily limits based on VIP tiers';

-- Done! Your table is ready.
-- The games will now track daily attempts automatically.
