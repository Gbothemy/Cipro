-- Lucky Draw Database Tables - Updated for $2 USDT Tickets

-- Table for storing lucky draw tickets
CREATE TABLE IF NOT EXISTS lucky_draw_tickets (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cost DECIMAL(10, 2) NOT NULL DEFAULT 2.00, -- Cost in USDT ($2 per ticket)
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing prize pool information
CREATE TABLE IF NOT EXISTS lucky_draw_prize_pool (
  id SERIAL PRIMARY KEY,
  cipro INTEGER DEFAULT 50000,
  usdt DECIMAL(18, 4) DEFAULT 20.00,
  vip_upgrade BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing lucky draw winners
CREATE TABLE IF NOT EXISTS lucky_draw_winners (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  draw_date DATE NOT NULL,
  cipro_won INTEGER DEFAULT 50000,
  usdt_won DECIMAL(18, 4) DEFAULT 20.00,
  vip_upgrade_won BOOLEAN DEFAULT TRUE,
  tickets_used INTEGER NOT NULL,
  total_tickets INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lucky_draw_tickets_user_id ON lucky_draw_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_tickets_is_used ON lucky_draw_tickets(is_used);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_winners_user_id ON lucky_draw_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draw_winners_draw_date ON lucky_draw_winners(draw_date);

-- Insert initial prize pool
INSERT INTO lucky_draw_prize_pool (cipro, usdt, vip_upgrade)
VALUES (50000, 20.00, TRUE)
ON CONFLICT DO NOTHING;

-- Add RLS (Row Level Security) policies
ALTER TABLE lucky_draw_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_prize_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_draw_winners ENABLE ROW LEVEL SECURITY;

-- Policies for lucky_draw_tickets
CREATE POLICY "Users can view their own tickets" ON lucky_draw_tickets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own tickets" ON lucky_draw_tickets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "System can update tickets" ON lucky_draw_tickets
  FOR UPDATE USING (true);

-- Policies for lucky_draw_prize_pool
CREATE POLICY "Anyone can view prize pool" ON lucky_draw_prize_pool
  FOR SELECT USING (true);

CREATE POLICY "System can update prize pool" ON lucky_draw_prize_pool
  FOR ALL USING (true);

-- Policies for lucky_draw_winners
CREATE POLICY "Anyone can view winners" ON lucky_draw_winners
  FOR SELECT USING (true);

CREATE POLICY "System can insert winners" ON lucky_draw_winners
  FOR INSERT WITH CHECK (true);

-- Function to automatically update prize pool timestamp
CREATE OR REPLACE FUNCTION update_prize_pool_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating prize pool timestamp
CREATE TRIGGER update_prize_pool_timestamp_trigger
  BEFORE UPDATE ON lucky_draw_prize_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_prize_pool_timestamp();