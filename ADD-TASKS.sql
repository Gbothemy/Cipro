-- Add comprehensive tasks to the database
-- Run this SQL to add 30+ tasks across different categories

INSERT INTO tasks (task_name, description, task_type, required_count, reward_points, icon, is_active) VALUES
-- Daily Tasks (10)
('Daily Login', 'Log in to your account today', 'daily', 1, 50, '🔑', true),
('Play 3 Games', 'Play any 3 games today', 'daily', 3, 100, '🎮', true),
('Play 5 Games', 'Play any 5 games today', 'daily', 5, 200, '🕹️', true),
('Complete Mining Session', 'Start and complete a mining session', 'daily', 1, 150, '⛏️', true),
('Earn 500 Points', 'Earn 500 points today', 'daily', 500, 150, '💎', true),
('Win 3 Games', 'Win any 3 games today', 'daily', 3, 200, '🏆', true),
('Check Leaderboard', 'Visit the leaderboard page', 'daily', 1, 25, '📊', true),
('Claim Daily Reward', 'Claim your daily login reward', 'daily', 1, 75, '🎁', true),
('Visit Profile', 'Check your profile page', 'daily', 1, 25, '👤', true),
('Play Trivia', 'Play a trivia game', 'daily', 1, 50, '🧠', true),

-- Weekly Tasks (8)
('Play 20 Games', 'Play 20 games this week', 'weekly', 20, 500, '🎯', true),
('Play 50 Games', 'Play 50 games this week', 'weekly', 50, 1500, '🎪', true),
('Win 10 Games', 'Win 10 games this week', 'weekly', 10, 750, '🏅', true),
('Earn 5000 Points', 'Earn 5,000 points this week', 'weekly', 5000, 1000, '💰', true),
('Complete 5 Mining Sessions', 'Complete 5 mining sessions this week', 'weekly', 5, 800, '⛏️', true),
('7-Day Streak', 'Maintain a 7-day login streak', 'weekly', 7, 500, '🔥', true),
('Complete 10 Daily Tasks', 'Complete 10 daily tasks this week', 'weekly', 10, 600, '✅', true),
('Play All Game Types', 'Play trivia, memory, puzzle, and spin games', 'weekly', 4, 400, '🎨', true),

-- Monthly Tasks (7)
('Play 100 Games', 'Play 100 games this month', 'monthly', 100, 3000, '🎬', true),
('Earn 25000 Points', 'Earn 25,000 points this month', 'monthly', 25000, 5000, '🌟', true),
('Win 50 Games', 'Win 50 games this month', 'monthly', 50, 4000, '👑', true),
('30-Day Streak', 'Maintain a 30-day login streak', 'monthly', 30, 2500, '⚡', true),
('Complete 20 Mining Sessions', 'Complete 20 mining sessions this month', 'monthly', 20, 3500, '💎', true),
('Reach VIP Level 2', 'Upgrade to VIP Level 2 or higher', 'monthly', 1, 1000, '🥈', true),
('Complete 50 Tasks', 'Complete 50 tasks this month', 'monthly', 50, 3000, '📋', true),

-- Social Tasks (5)
('Refer 1 Friend', 'Invite your first friend', 'social', 1, 500, '👥', true),
('Refer 3 Friends', 'Invite 3 friends to join', 'social', 3, 1500, '🤝', true),
('Refer 5 Friends', 'Invite 5 friends to join', 'social', 5, 3000, '🦋', true),
('Refer 10 Friends', 'Invite 10 friends to join', 'social', 10, 7500, '⭐', true),
('Share on Social Media', 'Share CiproHub on social media', 'social', 1, 200, '📢', true),

-- VIP Tasks (5)
('Upgrade to Silver', 'Reach VIP Level 2 (Silver)', 'vip', 1, 500, '🥈', true),
('Upgrade to Gold', 'Reach VIP Level 3 (Gold)', 'vip', 1, 1000, '🥇', true),
('Upgrade to Platinum', 'Reach VIP Level 4 (Platinum)', 'vip', 1, 2500, '💎', true),
('Upgrade to Diamond', 'Reach VIP Level 5 (Diamond)', 'vip', 1, 5000, '💠', true),
('Stay VIP for 30 Days', 'Maintain VIP status for 30 days', 'vip', 30, 3000, '👑', true),

-- Financial Tasks (5)
('First Deposit', 'Make your first crypto deposit', 'financial', 1, 300, '💰', true),
('Deposit $50', 'Deposit $50 or more total', 'financial', 50, 1000, '💵', true),
('Deposit $100', 'Deposit $100 or more total', 'financial', 100, 2500, '💸', true),
('Buy Lucky Draw Ticket', 'Purchase a lucky draw ticket', 'financial', 1, 200, '🎫', true),
('Convert Points', 'Convert points to crypto', 'financial', 1, 150, '🔄', true),

-- Achievement Tasks (3)
('Unlock 5 Achievements', 'Unlock 5 achievements', 'achievement', 5, 500, '🏅', true),
('Unlock 10 Achievements', 'Unlock 10 achievements', 'achievement', 10, 1500, '🎖️', true),
('Unlock 20 Achievements', 'Unlock 20 achievements', 'achievement', 20, 4000, '🌟', true);

-- Verify tasks were added
SELECT COUNT(*) as total_tasks FROM tasks WHERE is_active = true;
SELECT task_type, COUNT(*) as count FROM tasks WHERE is_active = true GROUP BY task_type ORDER BY task_type;
