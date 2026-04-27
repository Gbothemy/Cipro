-- Add comprehensive achievements to the database
-- Run this SQL to add 50+ achievements

INSERT INTO achievements (achievement_name, description, category, requirement_text, reward_points, icon, is_active) VALUES
-- Points Achievements (10)
('Point Starter', 'Earn your first 100 points', 'points', 'Earn 100 points', 50, '🌟', true),
('Point Collector', 'Earn 1,000 points', 'points', 'Earn 1,000 points', 100, '💎', true),
('Point Hoarder', 'Earn 5,000 points', 'points', 'Earn 5,000 points', 250, '💰', true),
('Point Master', 'Earn 10,000 points', 'points', 'Earn 10,000 points', 500, '👑', true),
('Point Champion', 'Earn 25,000 points', 'points', 'Earn 25,000 points', 1000, '🏆', true),
('Point Legend', 'Earn 50,000 points', 'points', 'Earn 50,000 points', 2000, '⚡', true),
('Point God', 'Earn 100,000 points', 'points', 'Earn 100,000 points', 5000, '🔥', true),
('Point Millionaire', 'Earn 250,000 points', 'points', 'Earn 250,000 points', 10000, '💸', true),
('Point Billionaire', 'Earn 500,000 points', 'points', 'Earn 500,000 points', 25000, '🌈', true),
('Point Trillionaire', 'Earn 1,000,000 points', 'points', 'Earn 1,000,000 points', 50000, '🚀', true),

-- Game Achievements (15)
('First Game', 'Play your first game', 'games', 'Play 1 game', 25, '🎮', true),
('Game Beginner', 'Play 5 games', 'games', 'Play 5 games', 50, '🎯', true),
('Game Enthusiast', 'Play 10 games', 'games', 'Play 10 games', 100, '🎪', true),
('Game Regular', 'Play 25 games', 'games', 'Play 25 games', 200, '🎨', true),
('Game Addict', 'Play 50 games', 'games', 'Play 50 games', 300, '🎭', true),
('Game Master', 'Play 100 games', 'games', 'Play 100 games', 750, '🎬', true),
('Game Legend', 'Play 250 games', 'games', 'Play 250 games', 1500, '🎸', true),
('Game God', 'Play 500 games', 'games', 'Play 500 games', 3000, '🎺', true),
('Trivia Novice', 'Win 5 trivia games', 'games', 'Win 5 trivia games', 100, '🧠', true),
('Trivia Expert', 'Win 25 trivia games', 'games', 'Win 25 trivia games', 500, '📚', true),
('Memory Champion', 'Win 10 memory games', 'games', 'Win 10 memory games', 200, '🃏', true),
('Puzzle Solver', 'Win 10 puzzle games', 'games', 'Win 10 puzzle games', 200, '🧩', true),
('Lucky Spinner', 'Spin the wheel 20 times', 'games', 'Spin 20 times', 150, '🎡', true),
('Perfect Score', 'Get 100% in a trivia game', 'games', 'Perfect trivia', 300, '💯', true),
('Speed Demon', 'Complete memory game in under 10 moves', 'games', 'Memory < 10 moves', 250, '⚡', true),

-- Streak Achievements (8)
('Day Starter', 'Login 3 days in a row', 'streak', '3 day streak', 50, '🔥', true),
('Week Warrior', 'Login 7 days in a row', 'streak', '7 day streak', 150, '⚡', true),
('Two Week Champion', 'Login 14 days in a row', 'streak', '14 day streak', 350, '💪', true),
('Month Master', 'Login 30 days in a row', 'streak', '30 day streak', 1000, '🌟', true),
('Quarter King', 'Login 90 days in a row', 'streak', '90 day streak', 3000, '👑', true),
('Streak Legend', 'Login 100 days in a row', 'streak', '100 day streak', 5000, '🏆', true),
('Half Year Hero', 'Login 180 days in a row', 'streak', '180 day streak', 10000, '🎖️', true),
('Year Champion', 'Login 365 days in a row', 'streak', '365 day streak', 25000, '🎆', true),

-- Task Achievements (6)
('Task Beginner', 'Complete 5 tasks', 'tasks', 'Complete 5 tasks', 50, '✅', true),
('Task Regular', 'Complete 10 tasks', 'tasks', 'Complete 10 tasks', 100, '📝', true),
('Task Completer', 'Complete 25 tasks', 'tasks', 'Complete 25 tasks', 200, '📋', true),
('Task Expert', 'Complete 50 tasks', 'tasks', 'Complete 50 tasks', 500, '🎯', true),
('Task Master', 'Complete 100 tasks', 'tasks', 'Complete 100 tasks', 1000, '🏅', true),
('Task Legend', 'Complete 250 tasks', 'tasks', 'Complete 250 tasks', 2500, '🌟', true),

-- Social Achievements (6)
('First Referral', 'Refer your first friend', 'social', 'Refer 1 friend', 100, '👥', true),
('Social Starter', 'Refer 3 friends', 'social', 'Refer 3 friends', 250, '🤝', true),
('Social Butterfly', 'Refer 5 friends', 'social', 'Refer 5 friends', 500, '🦋', true),
('Social Star', 'Refer 10 friends', 'social', 'Refer 10 friends', 1000, '⭐', true),
('Influencer', 'Refer 25 friends', 'social', 'Refer 25 friends', 2500, '📢', true),
('Ambassador', 'Refer 50 friends', 'social', 'Refer 50 friends', 5000, '🎖️', true),

-- VIP Achievements (5)
('VIP Silver', 'Reach VIP Level 2', 'vip', 'Reach VIP 2', 200, '🥈', true),
('VIP Gold', 'Reach VIP Level 3', 'vip', 'Reach VIP 3', 500, '🥇', true),
('VIP Platinum', 'Reach VIP Level 4', 'vip', 'Reach VIP 4', 1000, '💎', true),
('VIP Diamond', 'Reach VIP Level 5', 'vip', 'Reach VIP 5', 2500, '💠', true),
('VIP Lifetime', 'Stay VIP for 6 months', 'vip', 'VIP for 180 days', 10000, '👑', true),

-- Financial Achievements (8)
('First Deposit', 'Make your first deposit', 'financial', 'Deposit once', 100, '💰', true),
('Regular Depositor', 'Make 5 deposits', 'financial', 'Deposit 5 times', 300, '💵', true),
('Big Spender', 'Deposit $100 total', 'financial', 'Deposit $100', 500, '💸', true),
('High Roller', 'Deposit $500 total', 'financial', 'Deposit $500', 2000, '🎰', true),
('Whale', 'Deposit $1000 total', 'financial', 'Deposit $1000', 5000, '🐋', true),
('First Withdrawal', 'Make your first withdrawal', 'financial', 'Withdraw once', 50, '🏦', true),
('Profit Taker', 'Withdraw $100 total', 'financial', 'Withdraw $100', 500, '💳', true),
('Crypto Trader', 'Convert points 10 times', 'financial', 'Convert 10 times', 300, '🔄', true),

-- Lucky Draw Achievements (5)
('Lucky Ticket', 'Buy your first lucky draw ticket', 'lucky', 'Buy 1 ticket', 50, '🎫', true),
('Lucky Player', 'Buy 10 lucky draw tickets', 'lucky', 'Buy 10 tickets', 200, '🎰', true),
('Lucky Enthusiast', 'Buy 50 lucky draw tickets', 'lucky', 'Buy 50 tickets', 1000, '🎲', true),
('Lucky Winner', 'Win a lucky draw prize', 'lucky', 'Win once', 500, '🎉', true),
('Lucky Champion', 'Win 3 lucky draw prizes', 'lucky', 'Win 3 times', 2000, '🏆', true),

-- Special Achievements (7)
('Early Adopter', 'Join in the first month', 'special', 'Join early', 1000, '🚀', true),
('Perfect Week', 'Complete all daily tasks for 7 days', 'special', '7 perfect days', 750, '⭐', true),
('Perfect Month', 'Complete all daily tasks for 30 days', 'special', '30 perfect days', 3000, '🌟', true),
('Completionist', 'Unlock 20 achievements', 'special', 'Unlock 20 achievements', 2000, '🏅', true),
('Achievement Hunter', 'Unlock 40 achievements', 'special', 'Unlock 40 achievements', 5000, '🎯', true),
('Night Owl', 'Play games between midnight and 6 AM', 'special', 'Play at night', 200, '🦉', true),
('Weekend Warrior', 'Play 20 games on weekends', 'special', '20 weekend games', 500, '🎮', true);

-- Verify achievements were added
SELECT COUNT(*) as total_achievements FROM achievements WHERE is_active = true;
