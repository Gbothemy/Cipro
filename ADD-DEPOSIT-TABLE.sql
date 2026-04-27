-- Add deposit_requests table
-- Run this SQL in your database to enable deposit functionality

CREATE TABLE IF NOT EXISTS deposit_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  tx_hash TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by TEXT
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON deposit_requests(status, user_id);

-- Verify table was created
SELECT 'deposit_requests table created successfully!' as message;
