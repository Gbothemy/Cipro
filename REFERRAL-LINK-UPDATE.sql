-- ============================================
-- REFERRAL LINK UPDATE
-- ============================================
-- Add referred_by field to users table to track who referred them
-- Update: Use production domain cipro1.vercel.app
-- ============================================

-- Add referred_by column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Update referrals table to ensure proper tracking
-- This will help track referral earnings

-- Sample query to get user's referrals:
-- SELECT u.* FROM users u WHERE u.referred_by = 'USR-123456';

-- Sample query to count referrals:
-- SELECT COUNT(*) FROM users WHERE referred_by = 'USR-123456';

-- Sample query to get referral earnings:
-- SELECT r.* FROM referrals r WHERE r.referrer_id = 'USR-123456';

-- ============================================
-- REFERRAL LINK FORMAT
-- ============================================
-- Production: https://cipro1.vercel.app/login?ref=USER_ID
-- Example: https://cipro1.vercel.app/login?ref=USR-123456
-- ============================================

-- ============================================
-- NOTES
-- ============================================
-- 1. When a user signs up with ?ref=USER_ID, store USER_ID in referred_by
-- 2. Create a referral record in the referrals table
-- 3. Award bonus points to both referrer and referred user
-- 4. Track commission earnings in the referrals table
-- ============================================
