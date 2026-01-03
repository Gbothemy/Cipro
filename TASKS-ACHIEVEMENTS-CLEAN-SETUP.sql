-- Enhanced Tasks and Achievements System Setup (Clean Version)
-- This script adds comprehensive tasks and achievements to the existing database

-- ==================== ENSURE TABLE STRUCTURE ====================

-- Ensure tasks table exists with correct structure
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  task_name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  icon TEXT DEFAULT 'TASK',
  required_count INTEGER DEFAULT 1,
  reward_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure achievements table exists with correct structure
CREATE TABLE IF NOT EXISTS achievements (
  id BIGSERIAL PRIMARY KEY,
  achievement_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  requirement_text TEXT,
  reward_points INTEGER DEFAULT 0,
  icon TEXT DEFAULT 'TROPHY',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure user_tasks table exists
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

-- Ensure user_achievements table exists
CREATE TABLE IF NOT EXISTS user_achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id BIGINT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ==================== ENHANCED TASKS ====================

-- Clear existing tasks and add comprehensive new ones
DELETE FROM tasks WHERE id > 0;

-- Reset the sequence
SELECT setval('tasks_id_seq', 1, false);

-- Daily Tasks
INSERT INTO tasks (task_name, description, task_type, required_count, reward_points, icon, is_active) VALUES
('Daily Login', 'Log in to your account', 'daily', 1, 50, 'KEY', true),
('Play 3 Games', 'Complete 3 mining games', 'daily', 3, 100, 'GAME', true),
('Mining Session', 'Complete a mining session', 'daily', 1, 75, 'MINE', true),
('Lucky Draw Entry', 'Enter the lucky draw', 'daily', 1, 25, 'DICE', true),
('Share Achievement', 'Share an achievement on social media', 'daily', 1, 30, 'SHARE', true),
('Visit Leaderboard', 'Check the leaderboard', 'daily', 1, 20, 'TROPHY', true),
('Complete Profile', 'Update your profile information', 'daily', 1, 40, 'USER', true),
('Claim Daily Reward', 'Claim your daily login reward', 'daily', 1, 60, 'GIFT', true);

-- Weekly Tasks
INSERT INTO tasks (task_name, description, task_type, required_count, reward_points, icon, is_active) VALUES
('Weekly Streak', 'Maintain a 7-day login streak', 'weekly', 7, 500, 'FIRE', true),
('Game Master', 'Play 20 games this week', 'weekly', 20, 300, 'TARGET', true),
('Mining Expert', 'Complete 10 mining sessions', 'weekly', 10, 400, 'DIAMOND', true),
('Social Butterfly', 'Refer 3 new friends', 'weekly', 3, 600, 'PEOPLE', true),
('Lucky Player', 'Participate in lucky draw 5 times', 'weekly', 5, 250, 'CLOVER', true),
('Point Collector', 'Earn 5,000 Cipro points', 'weekly', 5000, 350, 'MONEY', true),
('Achievement Hunter', 'Unlock 3 new achievements', 'weekly', 3, 450, 'MEDAL', true),
('VIP Explorer', 'Explore VIP tier benefits', 'weekly', 1, 200, 'STAR', true);

-- Monthly Tasks
INSERT INTO tasks (task_name, description, task_type, required_count, reward_points, icon, is_active) VALUES
('Monthly Champion', 'Earn 50,000 Cipro points this month', 'monthly', 50000, 2000, 'CROWN', true),
('Dedication Master', 'Maintain a 30-day login streak', 'monthly', 30, 1500, 'TROPHY', true),
('Gaming Legend', 'Play 100 games this month', 'monthly', 100, 1200, 'GAME', true),
('Mining Tycoon', 'Complete 50 mining sessions', 'monthly', 50, 1800, 'MINE', true),
('Referral King', 'Refer 10 new active users', 'monthly', 10, 2500, 'CROWN', true),
('Lucky Fortune', 'Win the lucky draw 3 times', 'monthly', 3, 3000, 'DICE', true),
('Social Media Star', 'Share 20 achievements', 'monthly', 20, 800, 'SHARE', true),
('VIP Subscriber', 'Maintain VIP status for full month', 'monthly', 1, 1000, 'DIAMOND', true);

-- Special Event Tasks
INSERT INTO tasks (task_name, description, task_type, required_count, reward_points, icon, is_active) VALUES
('First Steps', 'Complete your first game', 'special', 1, 100, 'ROCKET', true),
('Welcome Bonus', 'Claim your welcome bonus', 'special', 1, 200, 'PARTY', true),
('Profile Master', 'Complete 100% of your profile', 'special', 1, 150, 'SPARKLE', true),
('Early Bird', 'Log in before 8 AM', 'special', 1, 80, 'SUNRISE', true),
('Night Owl', 'Log in after 10 PM', 'special', 1, 80, 'MOON', true),
('Weekend Warrior', 'Play games on weekend', 'special', 1, 120, 'SWORD', true);

-- ==================== ENHANCED ACHIEVEMENTS ====================

-- Clear existing achievements and add comprehensive new ones
DELETE FROM achievements WHERE id > 0;

-- Reset the sequence
SELECT setval('achievements_id_seq', 1, false);

-- Starter Achievements
INSERT INTO achievements (achievement_name, description, category, requirement_text, reward_points, icon, is_active) VALUES
('Welcome Aboard', 'Join the Cipro community', 'starter', 'Create your account', 100, 'PARTY', true),
('First Steps', 'Play your first game', 'starter', 'Complete 1 game', 150, 'BABY', true),
('Getting Started', 'Earn your first 100 Cipro', 'starter', 'Earn 100 Cipro points', 200, 'PLANT', true),
('Profile Complete', 'Complete your profile', 'starter', 'Fill out all profile fields', 250, 'CHECK', true),
('Daily Visitor', 'Log in for 3 consecutive days', 'starter', 'Maintain 3-day streak', 300, 'CALENDAR', true);

-- Cipro Master Achievements
INSERT INTO achievements (achievement_name, description, category, requirement_text, reward_points, icon, is_active) VALUES
('Cipro Collector', 'Accumulate 1,000 Cipro points', 'cipro', 'Earn 1,000 total Cipro', 500, 'MONEY', true),
('Cipro Enthusiast', 'Accumulate 10,000 Cipro points', 'cipro', 'Earn 10,000 total Cipro', 1000, 'DIAMOND', true),
('Cipro Master', 'Accumulate 50,000 Cipro points', 'cipro', 'Earn 50,000 total Cipro', 2500, 'CROWN', true),
('Cipro Legend', 'Accumulate 100,000 Cipro points', 'cipro', 'Earn 100,000 total Cipro', 5000, 'TROPHY', true),
('Cipro Millionaire', 'Accumulate 1,000,000 Cipro points', 'cipro', 'Earn 1,000,000 total Cipro', 25000, 'CASH', true),
('Point Streak', 'Earn points for 7 consecutive days', 'cipro', 'Daily point earning streak', 750, 'FIRE', true),
('Big Spender', 'Convert 10,000 Cipro to crypto', 'cipro', 'Convert 10,000 Cipro', 1200, 'CARD', true);

-- Game Champion Achievements
INSERT INTO achievements (achievement_name, description, category, requirement_text, reward_points, icon, is_active) VALUES
('Game Rookie', 'Play 10 games', 'games', 'Complete 10 games', 300, 'GAME', true),
('Game Enthusiast', 'Play 50 games', 'games', 'Complete 50 games', 800, 'JOYSTICK', true),
('Game Master', 'Play 100 games', 'games', 'Complete 100 games', 1500, 'TARGET', true),
('Game Legend', 'Play 500 games', 'games', 'Complete 500 games', 4000, 'TROPHY', true),
('Game God', 'Play 1,000 games', 'games', 'Complete 1,000 games', 10000, 'LIGHTNING', true),
('Perfect Score', 'Achieve maximum score in any game', 'games', 'Get perfect score', 2000, 'HUNDRED', true),
('Winning Streak', 'Win 10 games in a row', 'games', 'Win 10 consecutive games', 1800, 'FIRE', true),
('Speed Demon', 'Complete a game in under 30 seconds', 'games', 'Fast completion time', 600, 'LIGHTNING', true),
('Mining Expert', 'Complete 100 mining sessions', 'games', 'Complete 100 mining sessions', 2200, 'MINE', true);

-- Streak Legend Achievements
INSERT INTO achievements (achievement_name, description, category, requirement_text, reward_points, icon, is_active) VALUES
('Consistent Player', 'Maintain 7-day login streak', 'streak', '7 consecutive days', 400, 'CALENDAR', true),
('Dedicated User', 'Maintain 14-day login streak', 'streak', '14 consecutive days', 800, 'FIRE', true),
('Loyal Member', 'Maintain 30-day login streak', 'streak', '30 consecutive days', 2000, 'DIAMOND', true),
('Streak Master', 'Maintain 60-day login streak', 'streak', '60 consecutive days', 4500, 'CROWN', true),
('Streak Legend', 'Maintain 100-day login streak', 'streak', '100 consecutive days', 8000, 'TROPHY', true),
('Streak God', 'Maintain 365-day login streak', 'streak', '365 consecutive days', 25000, 'LIGHTNING', true),
('Never Miss', 'No missed days in 6 months', 'streak', '180 days perfect attendance', 15000, 'HUNDRED', true);

-- VIP Elite Achievements
INSERT INTO achievements (achievement_name, description, category, requirement_text, reward_points, icon, is_active) VALUES
('VIP Bronze', 'Reach VIP Level 5', 'vip', 'Achieve VIP Level 5', 1000, 'BRONZE', true),
('VIP Silver', 'Reach VIP Level 10', 'vip', 'Achieve VIP Level 10', 2500, 'SILVER', true),
('VIP Gold', 'Reach VIP Level 15', 'vip', 'Achieve VIP Level 15', 5000, 'GOLD', true),
('VIP Platinum', 'Reach VIP Level 20', 'vip', 'Achieve VIP Level 20', 10000, 'DIAMOND', true),
('VIP Elite', 'Reach maximum VIP Level', 'vip', 'Achieve highest VIP tier', 20000, 'CROWN', true),
('VIP Subscriber', 'Subscribe to VIP for 1 month', 'vip', 'Maintain VIP subscription', 3000, 'STAR', true),
('VIP Loyalty', 'Subscribe to VIP for 6 months', 'vip', 'Long-term VIP member', 12000, 'DIAMOND', true);

-- Social & Community Achievements
INSERT INTO achievements (achievement_name, description, category, requirement_text, reward_points, icon, is_active) VALUES
('Social Starter', 'Refer your first friend', 'social', 'Refer 1 friend', 500, 'PEOPLE', true),
('Social Butterfly', 'Refer 5 friends', 'social', 'Refer 5 friends', 1500, 'BUTTERFLY', true),
('Social Master', 'Refer 10 friends', 'social', 'Refer 10 friends', 3500, 'CROWN', true),
('Influencer', 'Refer 25 friends', 'social', 'Refer 25 friends', 8000, 'PHONE', true),
('Community Leader', 'Refer 50 friends', 'social', 'Refer 50 friends', 20000, 'TROPHY', true),
('Share Master', 'Share 50 achievements', 'social', 'Share 50 times', 2000, 'SHARE', true),
('Top Referrer', 'Be in top 10 referrers', 'social', 'Leaderboard position', 5000, 'GOLD', true);

-- Special & Rare Achievements
INSERT INTO achievements (achievement_name, description, category, requirement_text, reward_points, icon, is_active) VALUES
('Lucky Winner', 'Win the lucky draw', 'special', 'Win lucky draw once', 2500, 'CLOVER', true),
('Lucky Legend', 'Win lucky draw 5 times', 'special', 'Win lucky draw 5 times', 12500, 'DICE', true),
('Early Adopter', 'Join in the first month', 'special', 'Early platform member', 5000, 'ROCKET', true),
('Beta Tester', 'Test new features', 'special', 'Participate in beta testing', 3000, 'LAB', true),
('Bug Hunter', 'Report a valid bug', 'special', 'Help improve platform', 1000, 'BUG', true),
('Feedback Hero', 'Provide valuable feedback', 'special', 'Submit helpful feedback', 800, 'BULB', true),
('Anniversary', 'Celebrate 1 year membership', 'special', '365 days as member', 10000, 'CAKE', true),
('Crypto Convert', 'Make first crypto conversion', 'special', 'Convert Cipro to crypto', 1500, 'EXCHANGE', true),
('Withdrawal Master', 'Complete first withdrawal', 'special', 'Successful withdrawal', 2000, 'CASH', true),
('Perfect Month', 'Complete all daily tasks for a month', 'special', '30 days perfect completion', 15000, 'HUNDRED', true);

-- ==================== CREATE INDEXES ====================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_date ON user_tasks(user_id, reset_date);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_type ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);

-- Create index for game_attempts if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_attempts') THEN
        CREATE INDEX IF NOT EXISTS idx_game_attempts_user_date ON game_attempts(user_id, created_at);
    END IF;
END $$;

-- Success message
SELECT 'Enhanced Tasks and Achievements system setup completed successfully!' as status;