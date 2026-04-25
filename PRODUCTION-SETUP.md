# Production Database Setup Guide

## Issue
The production site (https://www.ciprohub.site) is showing 500 errors because the database tables haven't been created yet.

## Solution

### Step 1: Access Your Neon Database Console
1. Go to https://console.neon.tech
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Database Setup SQL
Copy and paste the contents of `DATABASE-SETUP.sql` into the SQL Editor and execute it.

Alternatively, you can run it section by section:

#### 1. Create Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100),
  avatar VARCHAR(10) DEFAULT '👤',
  is_admin BOOLEAN DEFAULT false,
  referred_by VARCHAR(50),
  points INTEGER DEFAULT 0,
  vip_level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  max_exp INTEGER DEFAULT 1000,
  gift_points INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  day_streak INTEGER DEFAULT 0,
  last_claim TIMESTAMP,
  last_mine_time TIMESTAMP,
  last_game_reset TIMESTAMP,
  total_mined INTEGER DEFAULT 0,
  mining_sessions INTEGER DEFAULT 0,
  last_login TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Create Balances Table
```sql
CREATE TABLE IF NOT EXISTS balances (
  user_id VARCHAR(50) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  sol DECIMAL(18,8) DEFAULT 0,
  eth DECIMAL(18,8) DEFAULT 0,
  usdt DECIMAL(18,8) DEFAULT 0,
  usdc DECIMAL(18,8) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Create Other Tables
Run the remaining tables from `DATABASE-SETUP.sql`:
- withdrawal_requests
- game_plays
- tasks
- user_tasks
- notifications
- achievements
- user_achievements
- user_activity_log
- vip_tiers
- daily_rewards
- conversion_history
- game_attempts
- lucky_draw_tickets
- lucky_draw_prize_pool
- lucky_draw_winners

### Step 3: Verify Tables Were Created
Run this query to check:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see all the tables listed.

### Step 4: Insert Sample VIP Tiers (Optional)
```sql
INSERT INTO vip_tiers (tier_name, min_level, max_level, daily_game_limit, conversion_bonus, perks) VALUES
('Bronze', 1, 1, 5, 0, ARRAY['5 game attempts/day', 'Standard conversion rate']),
('Silver', 2, 2, 7, 5, ARRAY['7 game attempts/day', '5% better conversion']),
('Gold', 3, 3, 10, 10, ARRAY['10 game attempts/day', '10% better conversion']),
('Platinum', 4, 4, 15, 15, ARRAY['15 game attempts/day', '15% better conversion']),
('Diamond', 5, 5, 20, 20, ARRAY['20 game attempts/day', '20% better conversion'])
ON CONFLICT DO NOTHING;
```

### Step 5: Test the API
After running the SQL, visit your production site and try to:
1. Sign up for a new account
2. Login
3. Check the leaderboard (should show 50 default users)

## Environment Variables
Make sure your Vercel project has the `DATABASE_URL` environment variable set:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add `DATABASE_URL` with your Neon connection string

Format: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

## Troubleshooting

### Still Getting 500 Errors?
1. Check Vercel logs: `vercel logs [deployment-url]`
2. Verify DATABASE_URL is set correctly
3. Make sure SSL is enabled in Neon
4. Check that all tables were created successfully

### Database Connection Issues?
- Ensure your Neon database is not paused (free tier pauses after inactivity)
- Check that the connection string includes `?sslmode=require`
- Verify the database user has proper permissions

## Quick Test Query
Run this to verify the database is working:
```sql
SELECT COUNT(*) FROM users;
```

If this returns a number (even 0), your database is set up correctly!
