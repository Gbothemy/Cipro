-- ============================================
-- LUCKY DRAW COMPLETE DATABASE SETUP
-- ============================================
-- Complete setup for Lucky Draw system with manual payments
-- Run this script to set up the entire Lucky Draw functionality
-- ============================================

-- ============================================
-- 1. DISABLE RLS ON EXISTING TABLES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tickets" ON lucky_draw_tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON lucky_draw_tickets;
DROP POLICY IF EXISTS "System can update tickets" ON lucky_draw_tickets;
DROP POLICY IF EXISTS "Anyone can view prize pool" ON lucky_draw_prize_pool;
DROP POLICY IF EXISTS "System can update prize pool" ON lucky_draw_prize_pool;
DROP POLICY IF EXISTS "Anyone can view winners" ON lucky_draw_winners;
DROP POLICY IF EXISTS "System can insert winners" ON lucky_draw_winners;

-- Disable RLS for all lucky draw tables
ALTER TABLE IF EXISTS lucky_draw_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lucky_draw_prize_pool DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lucky_draw_winners DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE CORE LUCKY DRAW TABLES
-- ============================================

-- Lucky Draw Tickets Table
CREATE TABLE IF NOT EXISTS lucky_draw_tickets (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cost DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment_id column if it doesn't exist
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

-- Lucky Draw Prize Pool Table
CREATE TABLE IF NOT EXISTS lucky_draw_prize_pool (
  id SERIAL PRIMARY KEY,
  cipro INTEGER DEFAULT 50000,
  usdt DECIMAL(18, 4) DEFAULT 20.00,
  vip_upgrade BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lucky Draw Winners Table
CREATE TABLE IF NOT EXISTS lucky_draw_winners (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  draw_date DATE NOT NULL,
  sol_won DECIMAL(18, 8) DEFAULT 0,
  eth_won DECIMAL(18, 8) DEFAULT 0,
  usdt_won DECIMAL(18, 4) DEFAULT 0,
  usdc_won DECIMAL(18, 4) DEFAULT 0,
  points_won INTEGER DEFAULT 0,
  tickets_used INTEGER NOT NULL,
  total_tickets INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lucky Draw Payments Table (Manual Payment System)
CREATE TABLE IF NOT EXISTS lucky_draw_payments (
  id VARCHAR(50) PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'lucky_draw_tickets',
  currency VARCHAR(10) NOT NULL,
  amount DECIMAL(18, 4) NOT NULL,
  ticket_quantity INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  network TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  processed_date TIMESTAMP WITH TIME ZONE,
  processed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Lucky Draw Tickets Indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_tickets_user_id ON lucky_draw_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_tickets_is_used ON lucky_draw_tickets(is_used);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_tickets_payment_id ON lucky_draw_tickets(payment_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_tickets_created_at ON lucky_draw_tickets(created_at);

-- Lucky Draw Winners Indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_winners_user_id ON lucky_draw_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_winners_draw_date ON lucky_draw_winners(draw_date);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_winners_created_at ON lucky_draw_winners(created_at);

-- Lucky Draw Payments Indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_payments_user_id ON lucky_draw_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_payments_status ON lucky_draw_payments(status);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_payments_created_at ON lucky_draw_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_payments_currency ON lucky_draw_payments(currency);

-- ============================================
-- 4. CREATE FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to automatically update prize pool timestamp
CREATE OR REPLACE FUNCTION update_prize_pool_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update payment timestamp
CREATE OR REPLACE FUNCTION update_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number(p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  ticket_num TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    ticket_num := UPPER(
      SUBSTRING(p_user_id FROM LENGTH(p_user_id) - 3) || 
      '-' || 
      TO_CHAR(NOW(), 'YYYYMMDD') || 
      '-' || 
      LPAD(counter::TEXT, 3, '0')
    );
    
    -- Check if ticket number already exists
    IF NOT EXISTS (SELECT 1 FROM lucky_draw_tickets WHERE ticket_number = ticket_num) THEN
      RETURN ticket_num;
    END IF;
    
    counter := counter + 1;
    
    -- Prevent infinite loop
    IF counter > 999 THEN
      ticket_num := UPPER(
        SUBSTRING(p_user_id FROM LENGTH(p_user_id) - 3) || 
        '-' || 
        EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT
      );
      RETURN ticket_num;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get lucky draw statistics
CREATE OR REPLACE FUNCTION get_lucky_draw_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_tickets_sold', (
      SELECT COUNT(*) FROM lucky_draw_tickets
    ),
    'active_tickets', (
      SELECT COUNT(*) FROM lucky_draw_tickets WHERE is_used = FALSE
    ),
    'total_payments', (
      SELECT COUNT(*) FROM lucky_draw_payments
    ),
    'pending_payments', (
      SELECT COUNT(*) FROM lucky_draw_payments WHERE status = 'pending'
    ),
    'approved_payments', (
      SELECT COUNT(*) FROM lucky_draw_payments WHERE status = 'approved'
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(amount), 0) FROM lucky_draw_payments WHERE status = 'approved'
    ),
    'total_winners', (
      SELECT COUNT(*) FROM lucky_draw_winners
    ),
    'current_prize_pool', (
      SELECT json_build_object(
        'cipro', cipro,
        'usdt', usdt,
        'vip_upgrade', vip_upgrade
      ) FROM lucky_draw_prize_pool ORDER BY created_at DESC LIMIT 1
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Trigger for updating prize pool timestamp
DROP TRIGGER IF EXISTS update_prize_pool_timestamp_trigger ON lucky_draw_prize_pool;
CREATE TRIGGER update_prize_pool_timestamp_trigger
  BEFORE UPDATE ON lucky_draw_prize_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_prize_pool_timestamp();

-- Trigger for updating payment timestamp
DROP TRIGGER IF EXISTS update_payment_timestamp_trigger ON lucky_draw_payments;
CREATE TRIGGER update_payment_timestamp_trigger
  BEFORE UPDATE ON lucky_draw_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

-- ============================================
-- 6. DISABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE lucky_draw_payments DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. INSERT INITIAL DATA
-- ============================================

-- Insert initial prize pool if it doesn't exist
INSERT INTO lucky_draw_prize_pool (cipro, usdt, vip_upgrade)
VALUES (50000, 20.00, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. CREATE VIEWS FOR EASY DATA ACCESS
-- ============================================

-- View for active tickets with user information
CREATE OR REPLACE VIEW active_lucky_draw_tickets AS
SELECT 
  t.*,
  u.username,
  u.avatar
FROM lucky_draw_tickets t
LEFT JOIN users u ON t.user_id = u.user_id
WHERE t.is_used = FALSE;

-- View for payment summary
CREATE OR REPLACE VIEW lucky_draw_payment_summary AS
SELECT 
  p.*,
  u.username,
  u.avatar,
  CASE 
    WHEN p.status = 'approved' THEN 'Approved ✅'
    WHEN p.status = 'rejected' THEN 'Rejected ❌'
    ELSE 'Pending ⏳'
  END as status_display
FROM lucky_draw_payments p
LEFT JOIN users u ON p.user_id = u.user_id
ORDER BY p.created_at DESC;

-- View for winner history with user information
CREATE OR REPLACE VIEW lucky_draw_winner_history AS
SELECT 
  w.*,
  u.username,
  u.avatar
FROM lucky_draw_winners w
LEFT JOIN users u ON w.user_id = u.user_id
ORDER BY w.created_at DESC;

-- ============================================
-- 9. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Uncomment the following lines to insert sample data for testing

-- Sample payments (for testing)
/*
INSERT INTO lucky_draw_payments (
  id, user_id, username, currency, amount, ticket_quantity, 
  wallet_address, transaction_hash, network, status
) VALUES 
(
  'LD-TEST-001', 'USR-12345', 'TestUser1', 'USDT', 10.00, 5,
  'TQn9Y2khEsLJW1ChVWFMSMeRDow5oNDMnt', 'abc123def456', 'Tron (TRC-20)', 'approved'
),
(
  'LD-TEST-002', 'USR-67890', 'TestUser2', 'USDC', 4.00, 2,
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4', 'def456ghi789', 'Ethereum (ERC-20)', 'pending'
);
*/

-- Sample tickets (for testing)
/*
INSERT INTO lucky_draw_tickets (
  user_id, ticket_number, cost, payment_id
) VALUES 
('USR-12345', 'TEST-001', 2.00, 'LD-TEST-001'),
('USR-12345', 'TEST-002', 2.00, 'LD-TEST-001'),
('USR-12345', 'TEST-003', 2.00, 'LD-TEST-001'),
('USR-12345', 'TEST-004', 2.00, 'LD-TEST-001'),
('USR-12345', 'TEST-005', 2.00, 'LD-TEST-001');
*/

-- ============================================
-- 10. GRANT PERMISSIONS (IF NEEDED)
-- ============================================

-- Grant permissions to authenticated users (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON lucky_draw_tickets TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON lucky_draw_payments TO authenticated;
-- GRANT SELECT ON lucky_draw_prize_pool TO authenticated;
-- GRANT SELECT ON lucky_draw_winners TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Display setup completion message
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'LUCKY DRAW SETUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '- lucky_draw_tickets';
  RAISE NOTICE '- lucky_draw_prize_pool';  
  RAISE NOTICE '- lucky_draw_winners';
  RAISE NOTICE '- lucky_draw_payments';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '- active_lucky_draw_tickets';
  RAISE NOTICE '- lucky_draw_payment_summary';
  RAISE NOTICE '- lucky_draw_winner_history';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '- update_prize_pool_timestamp()';
  RAISE NOTICE '- update_payment_timestamp()';
  RAISE NOTICE '- generate_ticket_number()';
  RAISE NOTICE '- get_lucky_draw_stats()';
  RAISE NOTICE '';
  RAISE NOTICE 'Initial prize pool: 50,000 Cipro + $20 USDT + VIP Upgrade';
  RAISE NOTICE 'RLS disabled for development use';
  RAISE NOTICE '============================================';
END $$;