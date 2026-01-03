-- ============================================
-- LUCKY DRAW TEST DATA
-- ============================================
-- This script inserts sample data for testing the Lucky Draw system
-- Run this AFTER the main setup script
-- ============================================

-- ============================================
-- 1. SAMPLE USERS (if not exists)
-- ============================================

-- Insert sample users for testing (only if they don't exist)
INSERT INTO users (user_id, username, email, avatar, points, vip_level)
VALUES 
('USR-TEST-001', 'TestPlayer1', 'test1@example.com', '🎮', 15000, 2),
('USR-TEST-002', 'TestPlayer2', 'test2@example.com', '🎯', 25000, 3),
('USR-TEST-003', 'TestPlayer3', 'test3@example.com', '🎲', 8000, 1),
('USR-TEST-004', 'TestPlayer4', 'test4@example.com', '🎪', 35000, 4),
('USR-TEST-005', 'TestPlayer5', 'test5@example.com', '🎨', 12000, 2)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample balances for test users
INSERT INTO balances (user_id, sol, eth, usdt, usdc)
VALUES 
('USR-TEST-001', 0.5, 0.01, 50.00, 25.00),
('USR-TEST-002', 1.2, 0.02, 100.00, 75.00),
('USR-TEST-003', 0.3, 0.005, 20.00, 15.00),
('USR-TEST-004', 2.1, 0.05, 200.00, 150.00),
('USR-TEST-005', 0.8, 0.015, 75.00, 50.00)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 2. SAMPLE LUCKY DRAW PAYMENTS
-- ============================================

-- Sample payments with different statuses
INSERT INTO lucky_draw_payments (
  id, user_id, username, currency, amount, ticket_quantity, 
  wallet_address, transaction_hash, network, status, processed_date, processed_by
) VALUES 
-- Approved payments
(
  'LD-20241201-001', 'USR-TEST-001', 'TestPlayer1', 'USDT', 10.00, 5,
  'TQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMnt', 'a1b2c3d4e5f6789012345678901234567890abcdef', 
  'Tron (TRC-20)', 'approved', NOW() - INTERVAL '2 hours', 'admin'
),
(
  'LD-20241201-002', 'USR-TEST-002', 'TestPlayer2', 'USDC', 4.00, 2,
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4', 'b2c3d4e5f6789012345678901234567890abcdef01', 
  'Ethereum (ERC-20)', 'approved', NOW() - INTERVAL '1 hour', 'admin'
),
(
  'LD-20241201-003', 'USR-TEST-003', 'TestPlayer3', 'SOL', 2.00, 1,
  'DQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMnt123456789', 'c3d4e5f6789012345678901234567890abcdef0123', 
  'Solana Network', 'approved', NOW() - INTERVAL '30 minutes', 'admin'
),

-- Pending payments
(
  'LD-20241201-004', 'USR-TEST-004', 'TestPlayer4', 'USDT', 20.00, 10,
  'TQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMnt', 'd4e5f6789012345678901234567890abcdef012345', 
  'Tron (TRC-20)', 'pending', NULL, NULL
),
(
  'LD-20241201-005', 'USR-TEST-005', 'TestPlayer5', 'USDC', 6.00, 3,
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4', 'e5f6789012345678901234567890abcdef01234567', 
  'Ethereum (ERC-20)', 'pending', NULL, NULL
),

-- Rejected payment
(
  'LD-20241201-006', 'USR-TEST-001', 'TestPlayer1', 'SOL', 4.00, 2,
  'DQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMnt123456789', 'f6789012345678901234567890abcdef0123456789', 
  'Solana Network', 'rejected', NOW() - INTERVAL '3 hours', 'admin'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. SAMPLE LUCKY DRAW TICKETS
-- ============================================

-- Ensure payment_id column exists before inserting tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lucky_draw_tickets' 
    AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE lucky_draw_tickets ADD COLUMN payment_id VARCHAR(50);
  END IF;
END $$;

-- Create tickets for approved payments
INSERT INTO lucky_draw_tickets (
  user_id, ticket_number, cost, payment_id, is_used
) VALUES 
-- Tickets for TestPlayer1 (5 tickets from approved payment)
('USR-TEST-001', 'T001-20241201-001', 2.00, 'LD-20241201-001', FALSE),
('USR-TEST-001', 'T001-20241201-002', 2.00, 'LD-20241201-001', FALSE),
('USR-TEST-001', 'T001-20241201-003', 2.00, 'LD-20241201-001', FALSE),
('USR-TEST-001', 'T001-20241201-004', 2.00, 'LD-20241201-001', FALSE),
('USR-TEST-001', 'T001-20241201-005', 2.00, 'LD-20241201-001', FALSE),

-- Tickets for TestPlayer2 (2 tickets from approved payment)
('USR-TEST-002', 'T002-20241201-001', 2.00, 'LD-20241201-002', FALSE),
('USR-TEST-002', 'T002-20241201-002', 2.00, 'LD-20241201-002', FALSE),

-- Tickets for TestPlayer3 (1 ticket from approved payment)
('USR-TEST-003', 'T003-20241201-001', 2.00, 'LD-20241201-003', FALSE),

-- Some used tickets from previous draws (without payment_id for legacy tickets)
('USR-TEST-001', 'T001-20241130-001', 2.00, NULL, TRUE),
('USR-TEST-001', 'T001-20241130-002', 2.00, NULL, TRUE),
('USR-TEST-002', 'T002-20241130-001', 2.00, NULL, TRUE)
ON CONFLICT (ticket_number) DO NOTHING;

-- ============================================
-- 4. SAMPLE LUCKY DRAW WINNERS
-- ============================================

-- Sample winners from previous draws
INSERT INTO lucky_draw_winners (
  user_id, draw_date, sol_won, eth_won, usdt_won, usdc_won, points_won, 
  tickets_used, total_tickets
) VALUES 
('USR-TEST-001', '2024-11-30', 0.1, 0.001, 15.00, 10.00, 25000, 2, 50),
('USR-TEST-002', '2024-11-23', 0.05, 0.0005, 8.00, 5.00, 15000, 1, 35),
('USR-TEST-004', '2024-11-16', 0.2, 0.002, 25.00, 20.00, 40000, 3, 75)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. UPDATE PRIZE POOL
-- ============================================

-- Update prize pool with accumulated funds
UPDATE lucky_draw_prize_pool 
SET 
  cipro = 75000,  -- Increased from contributions
  usdt = 35.00,   -- Increased from contributions
  vip_upgrade = TRUE,
  updated_at = NOW()
WHERE id = (SELECT id FROM lucky_draw_prize_pool ORDER BY created_at DESC LIMIT 1);

-- ============================================
-- 6. SAMPLE NOTIFICATIONS
-- ============================================

-- Insert sample notifications for test users
INSERT INTO notifications (
  user_id, notification_type, title, message, icon, is_read
) VALUES 
('USR-TEST-001', 'success', '🎉 Payment Approved!', 'Your payment has been approved! 5 Lucky Draw tickets have been added to your account.', '🎫', FALSE),
('USR-TEST-002', 'success', '🎉 Payment Approved!', 'Your payment has been approved! 2 Lucky Draw tickets have been added to your account.', '🎫', FALSE),
('USR-TEST-003', 'success', '🎉 Payment Approved!', 'Your payment has been approved! 1 Lucky Draw ticket has been added to your account.', '🎫', FALSE),
('USR-TEST-004', 'payment', '💳 Payment Submitted', 'Your payment for 10 Lucky Draw tickets has been submitted for verification.', '🎫', FALSE),
('USR-TEST-005', 'payment', '💳 Payment Submitted', 'Your payment for 3 Lucky Draw tickets has been submitted for verification.', '🎫', FALSE),
('USR-TEST-001', 'error', '❌ Payment Rejected', 'Your payment for Lucky Draw tickets has been rejected. Please contact support for details.', '💳', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. SAMPLE ACTIVITY LOG
-- ============================================

-- Insert sample activity logs
INSERT INTO user_activity_log (
  user_id, activity_type, activity_description, points_change
) VALUES 
('USR-TEST-001', 'lucky_draw_payment_submitted', 'Submitted payment for 5 Lucky Draw tickets', 0),
('USR-TEST-001', 'lucky_draw_tickets_received', 'Received 5 Lucky Draw tickets from approved payment', 0),
('USR-TEST-002', 'lucky_draw_payment_submitted', 'Submitted payment for 2 Lucky Draw tickets', 0),
('USR-TEST-002', 'lucky_draw_tickets_received', 'Received 2 Lucky Draw tickets from approved payment', 0),
('USR-TEST-003', 'lucky_draw_payment_submitted', 'Submitted payment for 1 Lucky Draw ticket', 0),
('USR-TEST-003', 'lucky_draw_tickets_received', 'Received 1 Lucky Draw ticket from approved payment', 0),
('USR-TEST-004', 'lucky_draw_payment_submitted', 'Submitted payment for 10 Lucky Draw tickets', 0),
('USR-TEST-005', 'lucky_draw_payment_submitted', 'Submitted payment for 3 Lucky Draw tickets', 0),
('USR-TEST-001', 'lucky_draw_win', 'Won Lucky Draw with 2 tickets!', 25000)
ON CONFLICT DO NOTHING;

-- ============================================
-- DISPLAY TEST DATA SUMMARY
-- ============================================

DO $$
DECLARE
  total_payments INTEGER;
  pending_payments INTEGER;
  approved_payments INTEGER;
  total_tickets INTEGER;
  active_tickets INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_payments FROM lucky_draw_payments;
  SELECT COUNT(*) INTO pending_payments FROM lucky_draw_payments WHERE status = 'pending';
  SELECT COUNT(*) INTO approved_payments FROM lucky_draw_payments WHERE status = 'approved';
  SELECT COUNT(*) INTO total_tickets FROM lucky_draw_tickets;
  SELECT COUNT(*) INTO active_tickets FROM lucky_draw_tickets WHERE is_used = FALSE;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'LUCKY DRAW TEST DATA INSERTED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Test Users: 5';
  RAISE NOTICE 'Total Payments: %', total_payments;
  RAISE NOTICE 'Pending Payments: %', pending_payments;
  RAISE NOTICE 'Approved Payments: %', approved_payments;
  RAISE NOTICE 'Total Tickets: %', total_tickets;
  RAISE NOTICE 'Active Tickets: %', active_tickets;
  RAISE NOTICE 'Sample Winners: 3';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Users Created:';
  RAISE NOTICE '- TestPlayer1 (USR-TEST-001) - 5 active tickets';
  RAISE NOTICE '- TestPlayer2 (USR-TEST-002) - 2 active tickets';
  RAISE NOTICE '- TestPlayer3 (USR-TEST-003) - 1 active ticket';
  RAISE NOTICE '- TestPlayer4 (USR-TEST-004) - pending payment';
  RAISE NOTICE '- TestPlayer5 (USR-TEST-005) - pending payment';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the Lucky Draw system!';
  RAISE NOTICE '============================================';
END $$;