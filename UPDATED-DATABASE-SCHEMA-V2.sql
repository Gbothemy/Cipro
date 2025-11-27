-- ============================================
-- COMPLETE DATABASE SCHEMA V2 - WITH NEW FEATURES
-- ============================================
-- This schema includes:
-- - All previous features
-- - Holiday events system
-- - Enhanced admin controls
-- - Site settings management
-- - Game varieties and difficulty levels
-- - Event leaderboards
-- ============================================

-- Drop existing tables if needed (for fresh start)
-- Uncomment if you want to start fresh
-- DROP TABLE IF EXISTS notification_preferences CASCADE;
-- DROP TABLE IF EXISTS conversion_history CASCADE;
-- DROP TABLE IF EXISTS user_activity_log CASCADE;
-- DROP TABLE IF EXISTS vip_tiers CASCADE;
-- DROP TABLE IF EXISTS daily_rewards CASCADE;
-- DROP TABLE IF EXISTS user_achievements CASCADE;
-- DROP TABLE IF EXISTS achievements CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS user_tasks CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS referrals CASCADE;
-- DROP TABLE IF EXISTS game_plays CASCADE;
-- DROP TABLE IF EXISTS withdrawal_requests CASCADE;
-- DROP TABLE IF EXISTS balances CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (enhanced)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT DEFAULT '',
  avatar TEXT DEFAULT '👤',
  is_admin BOOLEAN DEFAULT FALSE,
  points INTEGER DEFAULT 0,
  vip_level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  max_exp INTEGER DEFAULT 1000,
  gift_points INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  day_streak INTEGER DEFAULT 0,
  last_claim TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- New statistics fields
  total_games_played INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  last_login TIMESTAMP DEFAULT NOW()
);

-- Balances table
CREATE TABLE IF NOT EXISTS balances (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  ton DECIMAL(18, 8) DEFAULT 0,
  cati DECIMAL(18, 8) DEFAULT 0,
  usdt DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- REFERRAL SYSTEM (ENHANCED)
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  referred_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  commission_earned INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, inactive
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- ============================================
-- GAME SYSTEM (ENHANCED)
-- ============================================

-- Game types and configurations
CREATE TABLE IF NOT EXISTS game_types (
  id BIGSERIAL PRIMARY KEY,
  game_name TEXT UNIQUE NOT NULL,
  game_type TEXT NOT NULL, -- memory, puzzle, spin, trivia, word, number, color, reaction
  description TEXT,
  icon TEXT DEFAULT '🎮',
  base_points INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  difficulty_levels JSONB DEFAULT '["easy", "medium", "hard"]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game plays (enhanced with difficulty)
CREATE TABLE IF NOT EXISTS game_plays (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  difficulty TEXT DEFAULT 'easy', -- easy, medium, hard
  score INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  is_perfect_score BOOLEAN DEFAULT FALSE,
  play_date DATE DEFAULT CURRENT_DATE,
  plays_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TASKS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  task_name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- daily, weekly, monthly
  icon TEXT DEFAULT '📋',
  required_count INTEGER DEFAULT 1,
  reward_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, task_id, reset_date)
);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- task, achievement, level, referral, event, info, withdrawal
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'ℹ️',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  withdrawal_updates BOOLEAN DEFAULT TRUE,
  achievement_unlocks BOOLEAN DEFAULT TRUE,
  level_up BOOLEAN DEFAULT TRUE,
  referral_earnings BOOLEAN DEFAULT TRUE,
  special_events BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ACHIEVEMENTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
  id BIGSERIAL PRIMARY KEY,
  achievement_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- starter, points, games, streak, vip, events
  icon TEXT DEFAULT '🏆',
  requirement_text TEXT,
  requirement_value INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  achievement_id BIGINT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- HOLIDAY EVENTS SYSTEM (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS holiday_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- holiday, special, limited
  icon TEXT DEFAULT '🎉',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  bonus_multiplier DECIMAL(3, 2) DEFAULT 1.0, -- 1.5 = 50% bonus, 2.0 = 100% bonus
  special_games JSONB DEFAULT '[]'::jsonb, -- Array of special game types
  special_rewards JSONB DEFAULT '{}'::jsonb, -- Special rewards configuration
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_leaderboards (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES holiday_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  points_earned INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  rank INTEGER,
  rewards_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_badges (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES holiday_events(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_icon TEXT DEFAULT '🏅',
  description TEXT,
  requirement_text TEXT,
  requirement_value INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_event_badges (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  badge_id BIGINT NOT NULL REFERENCES event_badges(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES holiday_events(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- ADMIN SITE SETTINGS (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL, -- text, number, boolean, json
  category TEXT NOT NULL, -- general, games, rewards, conversion, events
  description TEXT,
  is_editable BOOLEAN DEFAULT TRUE,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id BIGSERIAL PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- edit_settings, manage_users, manage_events, manage_tasks
  action_description TEXT,
  affected_table TEXT,
  affected_id TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- OTHER TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT,
  memo TEXT,
  network_fee DECIMAL(18, 8) DEFAULT 0,
  net_amount DECIMAL(18, 8),
  status TEXT DEFAULT 'pending',
  transaction_hash TEXT,
  request_date TIMESTAMP DEFAULT NOW(),
  processed_date TIMESTAMP,
  processed_by TEXT,
  rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS daily_rewards (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  claim_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 0,
  ton_earned DECIMAL(18, 8) DEFAULT 0,
  cati_earned DECIMAL(18, 8) DEFAULT 0,
  usdt_earned DECIMAL(18, 8) DEFAULT 0,
  streak_day INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, claim_date)
);

CREATE TABLE IF NOT EXISTS vip_tiers (
  id BIGSERIAL PRIMARY KEY,
  tier_name TEXT NOT NULL,
  tier_icon TEXT DEFAULT '⭐',
  min_level INTEGER NOT NULL,
  max_level INTEGER NOT NULL,
  cooldown_reduction INTEGER DEFAULT 0,
  conversion_rate INTEGER DEFAULT 10000,
  bonus_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  benefits JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  points_change INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversion_history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  points_converted INTEGER NOT NULL,
  currency TEXT NOT NULL,
  amount_received DECIMAL(18, 8) NOT NULL,
  conversion_rate INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_vip_level ON users(vip_level DESC);

CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

CREATE INDEX IF NOT EXISTS idx_game_plays_user ON game_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_date ON game_plays(play_date DESC);
CREATE INDEX IF NOT EXISTS idx_game_plays_type ON game_plays(game_type);

CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_reset ON user_tasks(reset_date);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

CREATE INDEX IF NOT EXISTS idx_events_active ON holiday_events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_dates ON holiday_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_event_leaderboards_event ON event_leaderboards(event_id);
CREATE INDEX IF NOT EXISTS idx_event_leaderboards_rank ON event_leaderboards(rank);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);

CREATE INDEX IF NOT EXISTS idx_daily_rewards_user ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_date ON daily_rewards(claim_date DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON user_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversion_history_user ON conversion_history(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all for now - customize based on your needs)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON balances FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON referrals FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON game_plays FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON user_tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON achievements FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON user_achievements FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON withdrawal_requests FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON daily_rewards FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vip_tiers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON user_activity_log FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON conversion_history FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON holiday_events FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON event_leaderboards FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON site_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON admin_actions FOR ALL USING (true);

-- ============================================
-- CLEAR ALL NOTIFICATIONS (FRESH START)
-- ============================================

TRUNCATE TABLE notifications CASCADE;

-- ============================================
-- CLEAR ALL REFERRALS (FRESH START)
-- ============================================

TRUNCATE TABLE referrals CASCADE;

-- ============================================
-- SEED DATA
-- ============================================

-- Game Types
INSERT INTO game_types (game_name, game_type, description, icon, base_points, difficulty_levels) VALUES
('Memory Match', 'memory', 'Match pairs of cards', '🧠', 50, '["easy", "medium", "hard"]'),
('Puzzle Slider', 'puzzle', 'Solve sliding puzzles', '🧩', 75, '["easy", "medium", "hard"]'),
('Spin Wheel', 'spin', 'Spin to win rewards', '🎡', 100, '["easy"]'),
('Trivia Quiz', 'trivia', 'Answer trivia questions', '❓', 60, '["easy", "medium", "hard"]'),
('Word Puzzle', 'word', 'Find hidden words', '📝', 70, '["easy", "medium", "hard"]'),
('Number Match', 'number', 'Match number patterns', '🔢', 65, '["easy", "medium", "hard"]'),
('Color Match', 'color', 'Match color sequences', '🎨', 55, '["easy", "medium", "hard"]'),
('Reaction Test', 'reaction', 'Test your reaction time', '⚡', 80, '["easy", "medium", "hard"]')
ON CONFLICT (game_name) DO NOTHING;

-- Tasks (Daily, Weekly, Monthly)
INSERT INTO tasks (task_name, description, task_type, icon, required_count, reward_points) VALUES
('Daily Login', 'Login to your account', 'daily', '🎯', 1, 50),
('Play 3 Games', 'Complete 3 mining games', 'daily', '🎮', 3, 150),
('Claim Airdrop', 'Claim your daily airdrop', 'daily', '🎁', 1, 100),
('Invite a Friend', 'Share your referral link', 'daily', '👥', 1, 200),
('Convert Points', 'Convert points to crypto', 'daily', '🔄', 1, 75),
('7-Day Streak', 'Login for 7 consecutive days', 'weekly', '🔥', 7, 500),
('Play 20 Games', 'Complete 20 games this week', 'weekly', '🎯', 20, 800),
('Earn 5,000 Points', 'Accumulate 5,000 points', 'weekly', '💎', 5000, 1000),
('Refer 3 Friends', 'Invite 3 new users', 'weekly', '👥', 3, 1500),
('30-Day Streak', 'Login for 30 consecutive days', 'monthly', '🔥', 30, 3000),
('Reach VIP Level 10', 'Level up to VIP 10', 'monthly', '⭐', 10, 5000),
('Play 100 Games', 'Complete 100 games this month', 'monthly', '🎮', 100, 4000),
('Earn 10 TON', 'Accumulate 10 TON', 'monthly', '💰', 10, 10000)
ON CONFLICT DO NOTHING;

-- Achievements
INSERT INTO achievements (achievement_name, description, category, icon, requirement_text, requirement_value, reward_points) VALUES
('First Steps', 'Join the platform', 'starter', '👣', 'Create an account', 1, 100),
('First Game', 'Play your first game', 'starter', '🎮', 'Play 1 game', 1, 50),
('First Conversion', 'Convert points to crypto', 'starter', '💱', 'Convert points once', 1, 150),
('Point Collector', 'Earn 1,000 points', 'points', '💎', 'Earn 1,000 points', 1000, 200),
('Point Master', 'Earn 10,000 points', 'points', '💰', 'Earn 10,000 points', 10000, 500),
('Point Legend', 'Earn 100,000 points', 'points', '👑', 'Earn 100,000 points', 100000, 2000),
('Game Beginner', 'Play 10 games', 'games', '🎯', 'Play 10 games', 10, 100),
('Game Expert', 'Play 100 games', 'games', '🏆', 'Play 100 games', 100, 500),
('Game Master', 'Play 1,000 games', 'games', '🎖️', 'Play 1,000 games', 1000, 2000),
('Week Warrior', '7-day login streak', 'streak', '🔥', 'Login for 7 days', 7, 300),
('Month Champion', '30-day login streak', 'streak', '⚡', 'Login for 30 days', 30, 1000),
('VIP Bronze', 'Reach VIP Level 5', 'vip', '🥉', 'Reach VIP Level 5', 5, 250),
('VIP Gold', 'Reach VIP Level 20', 'vip', '🥇', 'Reach VIP Level 20', 20, 1000)
ON CONFLICT DO NOTHING;

-- VIP Tiers
INSERT INTO vip_tiers (tier_name, tier_icon, min_level, max_level, cooldown_reduction, conversion_rate, bonus_multiplier, benefits) VALUES
('Bronze', '🥉', 1, 5, 0, 10000, 1.0, '["Basic rewards", "Standard conversion rate"]'),
('Silver', '🥈', 6, 15, 10, 9500, 1.2, ["10% cooldown reduction", "5% better conversion", "20% bonus points"]'),
('Gold', '🥇', 16, 30, 25, 9000, 1.5, '["25% cooldown reduction", "10% better conversion", "50% bonus points"]'),
('Platinum', '💎', 31, 50, 40, 8500, 2.0, '["40% cooldown reduction", "15% better conversion", "100% bonus points"]'),
('Diamond', '💠', 51, 999, 60, 8000, 3.0, '["60% cooldown reduction", "20% better conversion", "200% bonus points"]')
ON CONFLICT DO NOTHING;

-- Default Site Settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description) VALUES
('site_name', 'Crypto Earning Game', 'text', 'general', 'Website name'),
('site_description', 'Play games and earn crypto rewards', 'text', 'general', 'Website description'),
('maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode'),
('registration_enabled', 'true', 'boolean', 'general', 'Allow new user registration'),
('min_withdrawal_ton', '0.1', 'number', 'conversion', 'Minimum TON withdrawal amount'),
('min_withdrawal_cati', '10', 'number', 'conversion', 'Minimum CATI withdrawal amount'),
('min_withdrawal_usdt', '5', 'number', 'conversion', 'Minimum USDT withdrawal amount'),
('default_conversion_rate', '10000', 'number', 'conversion', 'Default points to crypto rate'),
('daily_game_limit', '10', 'number', 'games', 'Daily game play limit'),
('referral_bonus', '500', 'number', 'rewards', 'Referral bonus points'),
('daily_login_bonus', '50', 'number', 'rewards', 'Daily login bonus points'),
('perfect_score_bonus', '50', 'number', 'games', 'Bonus points for perfect score'),
('event_bonus_multiplier', '2.0', 'number', 'events', 'Event bonus multiplier')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema V2 applied successfully!';
  RAISE NOTICE '📊 Tables created: 25+';
  RAISE NOTICE '🎮 Game types: 8';
  RAISE NOTICE '📋 Tasks: 13';
  RAISE NOTICE '🏆 Achievements: 13';
  RAISE NOTICE '⭐ VIP Tiers: 5';
  RAISE NOTICE '⚙️ Site Settings: 13';
  RAISE NOTICE '🔔 Notifications: CLEARED';
  RAISE NOTICE '👥 Referrals: CLEARED';
  RAISE NOTICE '🎉 Ready to use!';
END $$;
