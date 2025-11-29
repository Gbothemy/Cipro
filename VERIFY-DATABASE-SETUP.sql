-- Comprehensive database verification script
-- Run this to check if all tables and columns exist

-- 1. Check if game_attempts table exists with correct schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'game_attempts'
ORDER BY ordinal_position;

-- 2. Check if users table has mining columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('last_mine_time', 'total_mined', 'mining_sessions', 'user_id', 'vip_level')
ORDER BY column_name;

-- 3. Check if user_id in game_attempts is TEXT (not BIGINT)
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'game_attempts' 
  AND column_name = 'user_id';

-- 4. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('game_attempts', 'users')
  AND (indexname LIKE '%game_attempts%' OR indexname LIKE '%mine%')
ORDER BY tablename, indexname;

-- 5. Sample data check - count game attempts
SELECT 
    COUNT(*) as total_attempts,
    COUNT(DISTINCT user_id) as unique_users
FROM game_attempts;

-- 6. Check if any users have mining data
SELECT 
    COUNT(*) as users_with_mining_data
FROM users
WHERE last_mine_time IS NOT NULL;
