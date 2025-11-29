-- ============================================
-- REFERRAL SYSTEM DATABASE UPDATE
-- ============================================
-- Add referred_by field to users table to track who referred them
-- Update: Use production domain cipro1.vercel.app
-- ============================================

-- Step 1: Add referred_by column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Step 2: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Step 3: Add comment to column for documentation
COMMENT ON COLUMN users.referred_by IS 'User ID of the person who referred this user';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'referred_by';

-- Check if index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_referred_by';

-- ============================================
-- TEST QUERIES
-- ============================================

-- Get user's referrals (people they referred)
-- SELECT u.* FROM users u WHERE u.referred_by = 'USR-123456';

-- Count total referrals
-- SELECT COUNT(*) FROM users WHERE referred_by = 'USR-123456';

-- Get referrer info (who referred this user)
-- SELECT u.* FROM users u 
-- WHERE u.user_id = (SELECT referred_by FROM users WHERE user_id = 'USR-789');

-- Get referral stats with earnings
-- SELECT 
--   u.user_id,
--   u.username,
--   COUNT(r.user_id) as total_referrals,
--   SUM(CASE WHEN r.last_login > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as active_referrals
-- FROM users u
-- LEFT JOIN users r ON r.referred_by = u.user_id
-- WHERE u.user_id = 'USR-123456'
-- GROUP BY u.user_id, u.username;

-- ============================================
-- REFERRAL LINK FORMAT
-- ============================================
-- Production: https://cipro1.vercel.app/login?ref=USER_ID
-- Example: https://cipro1.vercel.app/login?ref=USR-123456
-- ============================================

-- ============================================
-- HOW IT WORKS
-- ============================================
-- 1. User A shares link: https://cipro1.vercel.app/login?ref=USR-A123
-- 2. User B clicks link and signs up
-- 3. User B's referred_by field is set to 'USR-A123'
-- 4. User A can now see User B in their referrals list
-- 5. User A earns 10% commission on User B's earnings
-- ============================================

-- ============================================
-- IMPORTANT NOTES
-- ============================================
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. The column will be added if it doesn't exist
-- 3. Existing users will have NULL in referred_by (not referred by anyone)
-- 4. New signups with referral code will have the referrer's user_id
-- 5. The index improves query performance for referral lookups
-- ============================================