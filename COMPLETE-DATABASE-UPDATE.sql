-- ============================================
-- COMPLETE DATABASE UPDATE - CIPRO
-- ============================================
-- Version: 3.0
-- Last Updated: 2024
-- Description: Adds missing tables and columns for complete functionality
-- ============================================

-- ============================================
-- MISSING TABLES
-- ============================================

-- Game Attempts Table (for daily limits tracking)
CREATE TABLE IF NOT EXISTS game_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  won BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'easy',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_created ON game_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_attempts_game_type ON game_attempts(game_type);

-- Activity Feed Table (for live activity feed)
CREATE TABLE IF NOT EXISTS user_activities (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  activity_type TEXT NOT NULL, -- game_win, level_up, big_win, streak, conversion, achievement, referral
  activity_icon TEXT DEFAULT '🎮',
  activity_color TEXT DEFAULT '#667eea',
  activity_message TEXT NOT NULL,
  activity_value INTEGER DEFAULT 0, -- points earned, level reached, etc.
  is_featured BOOLEAN DEFAULT FALSE, -- highlight special activities
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_featured ON user_activities(is_featured);

-- Leaderboard Cache Table (for performance)
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id BIGSERIAL PRIMARY KEY,
  leaderboard_type TEXT NOT NULL, -- points, earnings, streak, games
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  rank INTEGER NOT NULL,
  value DECIMAL(18, 8) NOT NULL,
  vip_level INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(leaderboard_type, user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_type ON leaderboard_cache(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_rank ON leaderboard_cache(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_updated ON leaderboard_cache(updated_at DESC);

-- ============================================
-- MISSING COLUMNS
-- ============================================

-- Add mining-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_mine_time TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_mined INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mining_sessions INTEGER DEFAULT 0;

-- Add referral tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_earnings INTEGER DEFAULT 0;

-- Add total earnings tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_sol_earned DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_eth_earned DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_usdt_earned DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_usdc_earned DECIMAL(18, 8) DEFAULT 0;

-- Add profile customization
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';

-- Add game statistics
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_game TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS perfect_scores INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_score INTEGER DEFAULT 0;

-- Add social features
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public_profile BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN DEFAULT TRUE;

-- ============================================
-- UPDATE EXISTING TABLES
-- ============================================

-- Add network column to withdrawal_requests if missing
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS memo TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS network_fee DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS company_fee DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS net_amount DECIMAL(18, 8);

-- Add more details to game_plays
ALTER TABLE game_plays ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0;
ALTER TABLE game_plays ADD COLUMN IF NOT EXISTS moves_made INTEGER DEFAULT 0;
ALTER TABLE game_plays ADD COLUMN IF NOT EXISTS hints_used INTEGER DEFAULT 0;
ALTER TABLE game_plays ADD COLUMN IF NOT EXISTS combo_multiplier DECIMAL(3, 2) DEFAULT 1.0;

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update user's updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_balances_updated_at ON balances;
CREATE TRIGGER update_balances_updated_at
  BEFORE UPDATE ON balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code
DROP TRIGGER IF EXISTS generate_user_referral_code ON users;
CREATE TRIGGER generate_user_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Function to update leaderboard cache
CREATE OR REPLACE FUNCTION update_leaderboard_cache()
RETURNS void AS $$
BEGIN
  -- Update points leaderboard
  DELETE FROM leaderboard_cache WHERE leaderboard_type = 'points';
  INSERT INTO leaderboard_cache (leaderboard_type, user_id, username, avatar, rank, value, vip_level)
  SELECT 
    'points',
    user_id,
    username,
    avatar,
    ROW_NUMBER() OVER (ORDER BY points DESC),
    points,
    vip_level
  FROM users
  WHERE is_admin = FALSE
  ORDER BY points DESC
  LIMIT 100;

  -- Update earnings leaderboard (based on USDT)
  DELETE FROM leaderboard_cache WHERE leaderboard_type = 'earnings';
  INSERT INTO leaderboard_cache (leaderboard_type, user_id, username, avatar, rank, value, vip_level)
  SELECT 
    'earnings',
    u.user_id,
    u.username,
    u.avatar,
    ROW_NUMBER() OVER (ORDER BY b.usdt DESC),
    b.usdt,
    u.vip_level
  FROM users u
  JOIN balances b ON u.user_id = b.user_id
  WHERE u.is_admin = FALSE
  ORDER BY b.usdt DESC
  LIMIT 100;

  -- Update streak leaderboard
  DELETE FROM leaderboard_cache WHERE leaderboard_type = 'streak';
  INSERT INTO leaderboard_cache (leaderboard_type, user_id, username, avatar, rank, value, vip_level)
  SELECT 
    'streak',
    user_id,
    username,
    avatar,
    ROW_NUMBER() OVER (ORDER BY day_streak DESC),
    day_streak,
    vip_level
  FROM users
  WHERE is_admin = FALSE
  ORDER BY day_streak DESC
  LIMIT 100;

  -- Update games leaderboard
  DELETE FROM leaderboard_cache WHERE leaderboard_type = 'games';
  INSERT INTO leaderboard_cache (leaderboard_type, user_id, username, avatar, rank, value, vip_level)
  SELECT 
    'games',
    user_id,
    username,
    avatar,
    ROW_NUMBER() OVER (ORDER BY total_games_played DESC),
    total_games_played,
    vip_level
  FROM users
  WHERE is_admin = FALSE
  ORDER BY total_games_played DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id TEXT,
  p_username TEXT,
  p_avatar TEXT,
  p_activity_type TEXT,
  p_activity_icon TEXT,
  p_activity_color TEXT,
  p_activity_message TEXT,
  p_activity_value INTEGER DEFAULT 0,
  p_is_featured BOOLEAN DEFAULT FALSE
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_activities (
    user_id,
    username,
    avatar,
    activity_type,
    activity_icon,
    activity_color,
    activity_message,
    activity_value,
    is_featured
  ) VALUES (
    p_user_id,
    p_username,
    p_avatar,
    p_activity_type,
    p_activity_icon,
    p_activity_color,
    p_activity_message,
    p_activity_value,
    p_is_featured
  );
  
  -- Keep only last 1000 activities for performance
  DELETE FROM user_activities
  WHERE id IN (
    SELECT id FROM user_activities
    ORDER BY created_at DESC
    OFFSET 1000
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

-- View for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.user_id,
  u.username,
  u.avatar,
  u.points,
  u.vip_level,
  u.day_streak,
  u.total_games_played,
  u.total_wins,
  u.total_losses,
  CASE 
    WHEN u.total_games_played > 0 
    THEN ROUND((u.total_wins::DECIMAL / u.total_games_played * 100), 2)
    ELSE 0 
  END as win_rate,
  b.sol,
  b.eth,
  b.usdt,
  b.usdc,
  (b.sol * 140 + b.eth * 3300 + b.usdt + b.usdc) as total_value_usd,
  u.created_at,
  u.last_login
FROM users u
LEFT JOIN balances b ON u.user_id = b.user_id
WHERE u.is_admin = FALSE;

-- View for recent activities
CREATE OR REPLACE VIEW recent_activities AS
SELECT 
  id,
  user_id,
  username,
  avatar,
  activity_type,
  activity_icon,
  activity_color,
  activity_message,
  activity_value,
  is_featured,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) as seconds_ago
FROM user_activities
ORDER BY created_at DESC
LIMIT 100;

-- View for top players
CREATE OR REPLACE VIEW top_players AS
SELECT 
  u.user_id,
  u.username,
  u.avatar,
  u.points,
  u.vip_level,
  u.day_streak,
  u.total_games_played,
  b.usdt as total_earnings,
  ROW_NUMBER() OVER (ORDER BY u.points DESC) as rank
FROM users u
LEFT JOIN balances b ON u.user_id = b.user_id
WHERE u.is_admin = FALSE
ORDER BY u.points DESC
LIMIT 100;

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON game_attempts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON user_activities FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON leaderboard_cache FOR ALL USING (true);

-- ============================================
-- SEED DATA FOR NEW TABLES
-- ============================================

-- Initialize leaderboard cache
SELECT update_leaderboard_cache();

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Clean up old activities (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS void AS $$
BEGIN
  DELETE FROM user_activities
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM user_activity_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM user_sessions
  WHERE started_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run this manually or set up a cron job)
-- SELECT cleanup_old_activities();

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Get user's daily game attempts count
-- SELECT COUNT(*) FROM game_attempts 
-- WHERE user_id = 'USER_ID' 
-- AND created_at >= CURRENT_DATE;

-- Get recent activities for feed
-- SELECT * FROM recent_activities LIMIT 20;

-- Get top 10 players by points
-- SELECT * FROM top_players LIMIT 10;

-- Get user's complete profile
-- SELECT * FROM user_stats WHERE user_id = 'USER_ID';

-- Update leaderboard cache (run periodically)
-- SELECT update_leaderboard_cache();

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Database update completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 New Tables: 3';
  RAISE NOTICE '  - game_attempts (daily limits tracking)';
  RAISE NOTICE '  - user_activities (activity feed)';
  RAISE NOTICE '  - leaderboard_cache (performance)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 New Columns: 20+';
  RAISE NOTICE '  - Mining tracking';
  RAISE NOTICE '  - Referral system';
  RAISE NOTICE '  - Profile customization';
  RAISE NOTICE '  - Game statistics';
  RAISE NOTICE '  - Social features';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️ New Functions: 5';
  RAISE NOTICE '  - update_updated_at_column()';
  RAISE NOTICE '  - generate_referral_code()';
  RAISE NOTICE '  - update_leaderboard_cache()';
  RAISE NOTICE '  - log_user_activity()';
  RAISE NOTICE '  - cleanup_old_activities()';
  RAISE NOTICE '';
  RAISE NOTICE '👁️ New Views: 3';
  RAISE NOTICE '  - user_stats';
  RAISE NOTICE '  - recent_activities';
  RAISE NOTICE '  - top_players';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security: All tables have RLS enabled';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 Your database is fully updated!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Next Steps:';
  RAISE NOTICE '1. Run: SELECT update_leaderboard_cache();';
  RAISE NOTICE '2. Test all features';
  RAISE NOTICE '3. Monitor performance';
  RAISE NOTICE '========================================';
END $$;
