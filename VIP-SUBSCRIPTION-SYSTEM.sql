-- ============================================
-- VIP SUBSCRIPTION SYSTEM
-- ============================================
-- Adds subscription management for VIP tiers
-- Bronze is FREE, other tiers require subscription
-- ============================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  vip_tier INTEGER NOT NULL CHECK (vip_tier BETWEEN 1 AND 5),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  payment_method TEXT, -- stripe, paypal, crypto, etc.
  payment_id TEXT, -- External payment ID
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  next_billing_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id) -- One active subscription per user
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Subscription history (for tracking changes)
CREATE TABLE IF NOT EXISTS subscription_history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- created, upgraded, downgraded, cancelled, renewed, expired
  from_tier INTEGER,
  to_tier INTEGER,
  from_billing_cycle TEXT,
  to_billing_cycle TEXT,
  amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created ON subscription_history(created_at DESC);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL, -- subscription, upgrade, renewal
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_id TEXT, -- External payment ID
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMP,
  refund_date TIMESTAMP,
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- Update users table to track subscription
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_active_subscription BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_subscription BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND (end_date IS NULL OR end_date > NOW())
  ) INTO v_has_subscription;
  
  RETURN v_has_subscription;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current subscription tier
CREATE OR REPLACE FUNCTION get_subscription_tier(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_tier INTEGER;
BEGIN
  SELECT vip_tier INTO v_tier
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND (end_date IS NULL OR end_date > NOW())
  LIMIT 1;
  
  RETURN COALESCE(v_tier, 1); -- Default to Bronze (1)
END;
$$ LANGUAGE plpgsql;

-- Function to create subscription
CREATE OR REPLACE FUNCTION create_subscription(
  p_user_id TEXT,
  p_vip_tier INTEGER,
  p_billing_cycle TEXT,
  p_price DECIMAL,
  p_payment_method TEXT,
  p_payment_id TEXT
)
RETURNS BIGINT AS $$
DECLARE
  v_subscription_id BIGINT;
  v_end_date TIMESTAMP;
  v_next_billing TIMESTAMP;
BEGIN
  -- Calculate dates
  IF p_billing_cycle = 'yearly' THEN
    v_end_date := NOW() + INTERVAL '1 year';
    v_next_billing := NOW() + INTERVAL '1 year';
  ELSE
    v_end_date := NOW() + INTERVAL '1 month';
    v_next_billing := NOW() + INTERVAL '1 month';
  END IF;

  -- Cancel any existing subscriptions
  UPDATE subscriptions
  SET status = 'cancelled',
      cancelled_at = NOW(),
      auto_renew = FALSE
  WHERE user_id = p_user_id
  AND status = 'active';

  -- Create new subscription
  INSERT INTO subscriptions (
    user_id,
    vip_tier,
    billing_cycle,
    price,
    status,
    payment_method,
    payment_id,
    end_date,
    next_billing_date
  ) VALUES (
    p_user_id,
    p_vip_tier,
    p_billing_cycle,
    p_price,
    'active',
    p_payment_method,
    p_payment_id,
    v_end_date,
    v_next_billing
  ) RETURNING id INTO v_subscription_id;

  -- Update user
  UPDATE users
  SET has_active_subscription = TRUE,
      subscription_tier = p_vip_tier,
      subscription_expires_at = v_end_date,
      vip_level = p_vip_tier
  WHERE user_id = p_user_id;

  -- Log history
  INSERT INTO subscription_history (
    user_id,
    subscription_id,
    action,
    to_tier,
    to_billing_cycle,
    amount
  ) VALUES (
    p_user_id,
    v_subscription_id,
    'created',
    p_vip_tier,
    p_billing_cycle,
    p_price
  );

  -- Record payment
  INSERT INTO payment_transactions (
    user_id,
    subscription_id,
    transaction_type,
    amount,
    payment_method,
    payment_id,
    payment_status,
    payment_date
  ) VALUES (
    p_user_id,
    v_subscription_id,
    'subscription',
    p_price,
    p_payment_method,
    p_payment_id,
    'completed',
    NOW()
  );

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel subscription
CREATE OR REPLACE FUNCTION cancel_subscription(
  p_user_id TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_id BIGINT;
  v_tier INTEGER;
BEGIN
  -- Get current subscription
  SELECT id, vip_tier INTO v_subscription_id, v_tier
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Cancel subscription (keep active until end date)
  UPDATE subscriptions
  SET auto_renew = FALSE,
      cancelled_at = NOW(),
      cancellation_reason = p_reason
  WHERE id = v_subscription_id;

  -- Log history
  INSERT INTO subscription_history (
    user_id,
    subscription_id,
    action,
    from_tier,
    notes
  ) VALUES (
    p_user_id,
    v_subscription_id,
    'cancelled',
    v_tier,
    p_reason
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to expire subscriptions (run daily)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_subscription RECORD;
BEGIN
  FOR v_subscription IN
    SELECT id, user_id, vip_tier
    FROM subscriptions
    WHERE status = 'active'
    AND end_date < NOW()
    AND auto_renew = FALSE
  LOOP
    -- Expire subscription
    UPDATE subscriptions
    SET status = 'expired'
    WHERE id = v_subscription.id;

    -- Downgrade user to Bronze
    UPDATE users
    SET has_active_subscription = FALSE,
        subscription_tier = 1,
        vip_level = 1,
        subscription_expires_at = NULL
    WHERE user_id = v_subscription.user_id;

    -- Log history
    INSERT INTO subscription_history (
      user_id,
      subscription_id,
      action,
      from_tier,
      to_tier
    ) VALUES (
      v_subscription.user_id,
      v_subscription.id,
      'expired',
      v_subscription.vip_tier,
      1
    );

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update subscription updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON subscription_history FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON payment_transactions FOR ALL USING (true);

-- ============================================
-- VIEWS
-- ============================================

-- View for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  u.username,
  s.vip_tier,
  s.billing_cycle,
  s.price,
  s.start_date,
  s.end_date,
  s.next_billing_date,
  s.auto_renew,
  EXTRACT(EPOCH FROM (s.end_date - NOW())) / 86400 as days_remaining
FROM subscriptions s
JOIN users u ON s.user_id = u.user_id
WHERE s.status = 'active'
AND (s.end_date IS NULL OR s.end_date > NOW())
ORDER BY s.created_at DESC;

-- View for subscription revenue
CREATE OR REPLACE VIEW subscription_revenue AS
SELECT 
  DATE(payment_date) as date,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue,
  AVG(amount) as average_transaction,
  COUNT(DISTINCT user_id) as unique_customers
FROM payment_transactions
WHERE payment_status = 'completed'
AND transaction_type IN ('subscription', 'renewal')
GROUP BY DATE(payment_date)
ORDER BY date DESC;

-- ============================================
-- SEED DATA
-- ============================================

-- Update VIP tiers with subscription info
UPDATE vip_tiers SET benefits = jsonb_set(
  benefits,
  '{0}',
  '"FREE Forever - No credit card required"'
) WHERE tier_name = 'Bronze';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VIP Subscription System installed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 New Tables: 3';
  RAISE NOTICE '  - subscriptions';
  RAISE NOTICE '  - subscription_history';
  RAISE NOTICE '  - payment_transactions';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️ New Functions: 5';
  RAISE NOTICE '  - has_active_subscription()';
  RAISE NOTICE '  - get_subscription_tier()';
  RAISE NOTICE '  - create_subscription()';
  RAISE NOTICE '  - cancel_subscription()';
  RAISE NOTICE '  - expire_subscriptions()';
  RAISE NOTICE '';
  RAISE NOTICE '👁️ New Views: 2';
  RAISE NOTICE '  - active_subscriptions';
  RAISE NOTICE '  - subscription_revenue';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Pricing:';
  RAISE NOTICE '  - Bronze: FREE';
  RAISE NOTICE '  - Silver: $9.99/month';
  RAISE NOTICE '  - Gold: $19.99/month';
  RAISE NOTICE '  - Platinum: $49.99/month';
  RAISE NOTICE '  - Diamond: $99.99/month';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security: RLS enabled on all tables';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 Ready for subscription management!';
  RAISE NOTICE '========================================';
END $$;
