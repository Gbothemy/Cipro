-- ============================================
-- LUCKY DRAW SIMPLE SETUP
-- ============================================
-- Use this script if you already have some lucky draw tables
-- and just want to add the payment system
-- ============================================

-- ============================================
-- 1. DISABLE RLS ON EXISTING TABLES
-- ============================================

-- Disable RLS for all lucky draw tables (if they exist)
DO $$
BEGIN
  -- Disable RLS on existing tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lucky_draw_tickets') THEN
    ALTER TABLE lucky_draw_tickets DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lucky_draw_prize_pool') THEN
    ALTER TABLE lucky_draw_prize_pool DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lucky_draw_winners') THEN
    ALTER TABLE lucky_draw_winners DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- 2. ADD PAYMENT_ID COLUMN IF NEEDED
-- ============================================

-- Add payment_id column to existing lucky_draw_tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lucky_draw_tickets' 
    AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE lucky_draw_tickets ADD COLUMN payment_id VARCHAR(50);
    RAISE NOTICE 'Added payment_id column to lucky_draw_tickets';
  END IF;
END $$;

-- ============================================
-- 3. CREATE PAYMENTS TABLE
-- ============================================

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

-- Disable RLS on payments table
ALTER TABLE lucky_draw_payments DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_lucky_draw_payments_user_id ON lucky_draw_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_payments_status ON lucky_draw_payments(status);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_payments_created_at ON lucky_draw_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_payments_currency ON lucky_draw_payments(currency);

-- Tickets table payment_id index
CREATE INDEX IF NOT EXISTS idx_lucky_draw_tickets_payment_id ON lucky_draw_tickets(payment_id);

-- ============================================
-- 5. CREATE FUNCTIONS
-- ============================================

-- Function to automatically update payment timestamp
CREATE OR REPLACE FUNCTION update_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE TRIGGERS
-- ============================================

-- Trigger for updating payment timestamp
DROP TRIGGER IF EXISTS update_payment_timestamp_trigger ON lucky_draw_payments;
CREATE TRIGGER update_payment_timestamp_trigger
  BEFORE UPDATE ON lucky_draw_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

-- ============================================
-- 7. CREATE VIEWS
-- ============================================

-- View for payment summary
CREATE OR REPLACE VIEW lucky_draw_payment_summary AS
SELECT 
  p.*,
  u.username as user_username,
  u.avatar as user_avatar,
  CASE 
    WHEN p.status = 'approved' THEN 'Approved ✅'
    WHEN p.status = 'rejected' THEN 'Rejected ❌'
    ELSE 'Pending ⏳'
  END as status_display
FROM lucky_draw_payments p
LEFT JOIN users u ON p.user_id = u.user_id
ORDER BY p.created_at DESC;

-- ============================================
-- SETUP COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'LUCKY DRAW SIMPLE SETUP COMPLETED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Payment system is now ready to use';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '- lucky_draw_payments (created)';
  RAISE NOTICE '- lucky_draw_tickets (payment_id column added)';
  RAISE NOTICE 'RLS disabled for development';
  RAISE NOTICE '============================================';
END $$;