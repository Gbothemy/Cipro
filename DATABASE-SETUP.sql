-- Complete Cipro Database Setup
-- Run this script to create all necessary tables

-- ==================== CORE TABLES ====================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  avatar TEXT DEFAULT '👤',
  is_admin BOOLEAN DEFAULT FALSE,
  referred_by TEXT,
  points INTEGER DEFAULT 0,
  vip_level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  max_exp INTEGER DEFAULT 1000,
  gift_points INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  day_streak INTEGER DEFAULT 0,
  last_claim TIMESTAMP,
  last_mine_time TIMESTAMP,
  total_mined INTEGER DEFAULT 0,
  mining_sessions INTEGER DEFAULT 0,
  last_game_reset TIMESTAMP,
  last_login TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Balances table
CREATE TABLE IF NOT EXISTS balances (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  sol DECIMAL(18,8) DEFAULT 0,
  eth DECIMAL(18,8) DEFAULT 0,
  usdt DECIMAL(18,8) DEFAULT 0,
  usdc DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== GAME TABLES ====================

-- Game plays tracking
CREATE TABLE IF NOT EXISTS game_plays (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  play_date DATE NOT NULL,
  plays_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, game_type, play_date)
);

-- Game attempts tracking
CREATE TABLE IF NOT EXISTS game_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  won BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== TASKS & ACHIEVEMENTS ====================

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  task_name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  required_count INTEGER DEFAULT 1,
  reward_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User tasks progress
CREATE TABLE IF NOT EXISTS user_tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, task_id, reset_date)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id BIGSERIAL PRIMARY KEY,
  achievement_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  requirement_text TEXT,
  reward_points INTEGER DEFAULT 0,
  icon TEXT DEFAULT '🏆',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id BIGINT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ==================== FINANCIAL TABLES ====================

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT,
  memo TEXT,
  network_fee DECIMAL(18,8) DEFAULT 0,
  net_amount DECIMAL(18,8) NOT NULL,
  status TEXT DEFAULT 'pending',
  request_date TIMESTAMP DEFAULT NOW(),
  processed_date TIMESTAMP,
  processed_by TEXT,
  transaction_hash TEXT
);

-- Deposit requests
CREATE TABLE IF NOT EXISTS deposit_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  tx_hash TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by TEXT
);

-- Conversion history
CREATE TABLE IF NOT EXISTS conversion_history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  points_converted INTEGER NOT NULL,
  currency TEXT NOT NULL,
  amount_received DECIMAL(18,8) NOT NULL,
  conversion_rate DECIMAL(18,8) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily rewards
CREATE TABLE IF NOT EXISTS daily_rewards (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  claim_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 0,
  sol_earned DECIMAL(18,8) DEFAULT 0,
  eth_earned DECIMAL(18,8) DEFAULT 0,
  usdt_earned DECIMAL(18,8) DEFAULT 0,
  usdc_earned DECIMAL(18,8) DEFAULT 0,
  streak_day INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, claim_date)
);

-- ==================== LUCKY DRAW TABLES ====================

-- Lucky draw tickets
CREATE TABLE IF NOT EXISTS lucky_draw_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lucky draw prize pool
CREATE TABLE IF NOT EXISTS lucky_draw_prize_pool (
  id BIGSERIAL PRIMARY KEY,
  cipro INTEGER DEFAULT 50000,
  usdt DECIMAL(18,8) DEFAULT 20,
  vip_upgrade BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lucky draw winners
CREATE TABLE IF NOT EXISTS lucky_draw_winners (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  draw_date DATE NOT NULL,
  usdt_won DECIMAL(18,8) DEFAULT 0,
  points_won INTEGER DEFAULT 0,
  vip_upgrade_won BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== SYSTEM TABLES ====================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT '🔔',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  points_change INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- VIP tiers
CREATE TABLE IF NOT EXISTS vip_tiers (
  id BIGSERIAL PRIMARY KEY,
  tier_name TEXT NOT NULL,
  min_level INTEGER NOT NULL,
  max_level INTEGER NOT NULL,
  daily_games INTEGER DEFAULT 5,
  conversion_bonus DECIMAL(5,2) DEFAULT 0,
  perks TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_game_attempts_user ON game_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user ON user_tasks(user_id, reset_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON deposit_requests(status, user_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_tickets_user ON lucky_draw_tickets(user_id, is_used);

-- ==================== INITIAL DATA ====================

-- Insert default VIP tiers
INSERT INTO vip_tiers (tier_name, min_level, max_level, daily_games, conversion_bonus, perks) VALUES
('Bronze', 1, 1, 5, 0, ARRAY['5 game attempts/day', 'Standard conversion rate', 'Daily rewards']),
('Silver', 2, 2, 7, 5, ARRAY['7 game attempts/day', '5% better conversion', 'Priority support']),
('Gold', 3, 3, 10, 10, ARRAY['10 game attempts/day', '10% better conversion', 'Exclusive tasks']),
('Platinum', 4, 4, 15, 15, ARRAY['15 game attempts/day', '15% better conversion', 'Lucky draw tickets']),
('Diamond', 5, 5, 20, 20, ARRAY['20 game attempts/day', '20% better conversion', 'VIP-only events'])
ON CONFLICT DO NOTHING;

-- Insert initial prize pool
INSERT INTO lucky_draw_prize_pool (cipro, usdt, vip_upgrade) VALUES (50000, 20, true)
ON CONFLICT DO NOTHING;

-- ==================== COMPLETE ====================
-- Database setup complete!
-- You can now run the application.
