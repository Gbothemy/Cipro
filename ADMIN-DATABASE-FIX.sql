-- ============================================
-- ADMIN DATABASE FIX & VERIFICATION
-- ============================================
-- Run these queries in your Supabase SQL Editor
-- ============================================

-- 1. CHECK IF ADMIN USER EXISTS
SELECT * FROM users WHERE is_admin = true;

-- 2. CREATE ADMIN USER IF NOT EXISTS (Update with your details)
-- Replace 'ADMIN-12345' with your admin user ID
-- Replace 'admin' with your admin username
INSERT INTO users (user_id, username, email, avatar, is_admin, points, vip_level)
VALUES ('ADMIN-12345', 'admin', 'admin@cipro.com', '👑', true, 0, 99)
ON CONFLICT (user_id) DO UPDATE 
SET is_admin = true;

-- 3. ENSURE ADMIN HAS BALANCE RECORD
INSERT INTO balances (user_id, sol, eth, usdt, usdc)
VALUES ('ADMIN-12345', 0, 0, 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- 4. VERIFY ALL USERS HAVE BALANCE RECORDS
-- This creates balance records for any users missing them
INSERT INTO balances (user_id, sol, eth, usdt, usdc)
SELECT user_id, 0, 0, 0, 0
FROM users
WHERE user_id NOT IN (SELECT user_id FROM balances);

-- 5. CHECK FOR USERS WITHOUT BALANCES (Should return 0 rows)
SELECT u.user_id, u.username 
FROM users u
LEFT JOIN balances b ON u.user_id = b.user_id
WHERE b.user_id IS NULL;

-- 6. VERIFY WITHDRAWAL REQUESTS TABLE
SELECT COUNT(*) as total_requests,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
       COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
       COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM withdrawal_requests;

-- 7. CHECK TASKS ARE LOADED
SELECT task_type, COUNT(*) as count
FROM tasks
GROUP BY task_type
ORDER BY task_type;

-- 8. VERIFY GAME TYPES
SELECT game_name, base_points, is_active
FROM game_types
ORDER BY game_name;

-- 9. CHECK USER STATS
SELECT 
  COUNT(*) as total_users,
  SUM(points) as total_points,
  AVG(vip_level) as avg_level,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_count
FROM users;

-- 10. CHECK BALANCE TOTALS
SELECT 
  SUM(sol) as total_sol,
  SUM(eth) as total_eth,
  SUM(usdt) as total_usdt,
  SUM(usdc) as total_usdc
FROM balances;

-- 11. FIX: Update all users to have last_login if NULL
UPDATE users 
SET last_login = created_at 
WHERE last_login IS NULL;

-- 12. FIX: Ensure all required columns have defaults
UPDATE users 
SET 
  points = COALESCE(points, 0),
  vip_level = COALESCE(vip_level, 1),
  exp = COALESCE(exp, 0),
  max_exp = COALESCE(max_exp, 1000),
  completed_tasks = COALESCE(completed_tasks, 0),
  day_streak = COALESCE(day_streak, 0)
WHERE points IS NULL 
   OR vip_level IS NULL 
   OR exp IS NULL 
   OR max_exp IS NULL 
   OR completed_tasks IS NULL 
   OR day_streak IS NULL;

-- 13. TEST QUERY: Get all users with balances (What AdminPage uses)
SELECT 
  u.*,
  b.sol,
  b.eth,
  b.usdt,
  b.usdc
FROM users u
LEFT JOIN balances b ON u.user_id = b.user_id
WHERE u.is_admin = false
ORDER BY u.points DESC
LIMIT 10;

-- 14. TEST QUERY: Get leaderboard data
-- Points leaderboard
SELECT 
  u.user_id,
  u.username,
  u.avatar,
  u.points,
  u.vip_level
FROM users u
WHERE u.is_admin = false
ORDER BY u.points DESC
LIMIT 10;

-- Earnings leaderboard
SELECT 
  u.user_id,
  u.username,
  u.avatar,
  b.usdt as earnings
FROM users u
LEFT JOIN balances b ON u.user_id = b.user_id
WHERE u.is_admin = false
ORDER BY b.usdt DESC
LIMIT 10;

-- Streak leaderboard
SELECT 
  u.user_id,
  u.username,
  u.avatar,
  u.day_streak,
  u.points
FROM users u
WHERE u.is_admin = false
ORDER BY u.day_streak DESC
LIMIT 10;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
-- If all queries run successfully, your database is ready!
-- ============================================
