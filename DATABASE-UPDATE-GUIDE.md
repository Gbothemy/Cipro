# 📊 Database Update Guide

## 🎯 Overview

This guide helps you update your Supabase database with all missing tables, columns, and functions needed for complete Cipro functionality.

---

## 📁 SQL Files Available

### 1. **src/db/supabase-schema.sql** (Main Schema)
- Complete base schema
- All core tables
- Indexes and RLS
- Seed data
- **Status**: ✅ Already exists

### 2. **COMPLETE-DATABASE-UPDATE.sql** (New Updates)
- Missing tables (game_attempts, user_activities, leaderboard_cache)
- Missing columns (mining, referrals, profile, stats)
- Functions and triggers
- Views for easy querying
- **Status**: ✨ NEW - Run this!

---

## 🚀 Quick Start

### Option 1: Fresh Database (Recommended)
If starting fresh, run in this order:

```sql
-- 1. Run main schema first
\i src/db/supabase-schema.sql

-- 2. Then run updates
\i COMPLETE-DATABASE-UPDATE.sql
```

### Option 2: Existing Database
If you already have the base schema:

```sql
-- Just run the updates
\i COMPLETE-DATABASE-UPDATE.sql
```

---

## 📋 What Gets Added

### New Tables (3)

#### 1. **game_attempts**
Tracks daily game play limits per user
```sql
- user_id
- game_type
- won (boolean)
- score
- difficulty
- created_at
```

#### 2. **user_activities**
Powers the live activity feed
```sql
- user_id
- username
- avatar
- activity_type (game_win, level_up, etc.)
- activity_icon
- activity_color
- activity_message
- activity_value
- is_featured
- created_at
```

#### 3. **leaderboard_cache**
Improves leaderboard performance
```sql
- leaderboard_type (points, earnings, streak, games)
- user_id
- username
- avatar
- rank
- value
- vip_level
- updated_at
```

### New Columns (20+)

#### Users Table Additions
```sql
-- Mining
- last_mine_time
- total_mined
- mining_sessions

-- Referrals
- referral_code (auto-generated)
- referred_by
- referral_earnings

-- Earnings Tracking
- total_sol_earned
- total_eth_earned
- total_usdt_earned
- total_usdc_earned

-- Profile
- bio
- country
- language
- theme

-- Game Stats
- favorite_game
- total_wins
- total_losses
- perfect_scores
- highest_score

-- Social
- is_public_profile
- show_on_leaderboard
- allow_friend_requests
```

#### Withdrawal Requests Additions
```sql
- network (Solana, Ethereum, etc.)
- memo (for exchanges)
- network_fee
- company_fee
- net_amount
```

#### Game Plays Additions
```sql
- time_taken_seconds
- moves_made
- hints_used
- combo_multiplier
```

### New Functions (5)

#### 1. **update_updated_at_column()**
Auto-updates timestamps on record changes

#### 2. **generate_referral_code()**
Auto-generates unique referral codes for new users

#### 3. **update_leaderboard_cache()**
Refreshes leaderboard rankings
```sql
-- Run manually or schedule
SELECT update_leaderboard_cache();
```

#### 4. **log_user_activity()**
Logs activities to the feed
```sql
SELECT log_user_activity(
  'USER-123',
  'CryptoKing',
  '👑',
  'game_win',
  '🎮',
  '#10b981',
  'won 150 CIPRO playing Puzzle!',
  150,
  false
);
```

#### 5. **cleanup_old_activities()**
Removes old data for performance
```sql
-- Run periodically
SELECT cleanup_old_activities();
```

### New Views (3)

#### 1. **user_stats**
Complete user statistics
```sql
SELECT * FROM user_stats WHERE user_id = 'USER-123';
```

#### 2. **recent_activities**
Latest 100 activities for feed
```sql
SELECT * FROM recent_activities LIMIT 20;
```

#### 3. **top_players**
Top 100 players by points
```sql
SELECT * FROM top_players LIMIT 10;
```

---

## 🔧 Step-by-Step Instructions

### Using Supabase Dashboard

1. **Open SQL Editor**
   - Go to your Supabase project
   - Click "SQL Editor" in sidebar

2. **Run Main Schema** (if fresh database)
   - Copy contents of `src/db/supabase-schema.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion message

3. **Run Updates**
   - Copy contents of `COMPLETE-DATABASE-UPDATE.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion message

4. **Initialize Leaderboard**
   ```sql
   SELECT update_leaderboard_cache();
   ```

5. **Verify Installation**
   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   
   -- Should see:
   -- - game_attempts
   -- - user_activities
   -- - leaderboard_cache
   -- (plus all other tables)
   ```

### Using psql Command Line

```bash
# Connect to your database
psql "postgresql://user:pass@host:port/database"

# Run main schema (if fresh)
\i src/db/supabase-schema.sql

# Run updates
\i COMPLETE-DATABASE-UPDATE.sql

# Initialize leaderboard
SELECT update_leaderboard_cache();

# Exit
\q
```

---

## ✅ Verification Checklist

After running the updates, verify:

### Tables
- [ ] `game_attempts` table exists
- [ ] `user_activities` table exists
- [ ] `leaderboard_cache` table exists

### Columns
- [ ] `users.last_mine_time` exists
- [ ] `users.referral_code` exists
- [ ] `users.total_mined` exists
- [ ] `withdrawal_requests.network` exists

### Functions
- [ ] `update_leaderboard_cache()` works
- [ ] `log_user_activity()` works
- [ ] `cleanup_old_activities()` works

### Views
- [ ] `user_stats` view exists
- [ ] `recent_activities` view exists
- [ ] `top_players` view exists

### Test Queries
```sql
-- Test game attempts
SELECT COUNT(*) FROM game_attempts;

-- Test activities
SELECT COUNT(*) FROM user_activities;

-- Test leaderboard
SELECT COUNT(*) FROM leaderboard_cache;

-- Test user stats view
SELECT * FROM user_stats LIMIT 5;

-- Test recent activities view
SELECT * FROM recent_activities LIMIT 5;

-- Test top players view
SELECT * FROM top_players LIMIT 5;
```

---

## 🔄 Maintenance Tasks

### Daily
```sql
-- Update leaderboard cache
SELECT update_leaderboard_cache();
```

### Weekly
```sql
-- Clean up old activities
SELECT cleanup_old_activities();
```

### Monthly
```sql
-- Analyze tables for performance
ANALYZE users;
ANALYZE game_attempts;
ANALYZE user_activities;
ANALYZE leaderboard_cache;

-- Vacuum to reclaim space
VACUUM ANALYZE;
```

---

## 🐛 Troubleshooting

### Issue: "relation already exists"
**Solution**: Table already exists, safe to ignore or use `IF NOT EXISTS`

### Issue: "column already exists"
**Solution**: Column already exists, safe to ignore or use `IF NOT EXISTS`

### Issue: "function already exists"
**Solution**: Use `CREATE OR REPLACE FUNCTION` (already in script)

### Issue: Slow queries
**Solution**: 
```sql
-- Rebuild indexes
REINDEX TABLE users;
REINDEX TABLE game_attempts;
REINDEX TABLE user_activities;

-- Update statistics
ANALYZE;
```

### Issue: Leaderboard not updating
**Solution**:
```sql
-- Manually refresh
SELECT update_leaderboard_cache();

-- Check for errors
SELECT * FROM leaderboard_cache LIMIT 5;
```

---

## 📊 Performance Tips

### 1. Regular Maintenance
```sql
-- Schedule these queries
SELECT update_leaderboard_cache();  -- Every hour
SELECT cleanup_old_activities();    -- Every week
```

### 2. Index Optimization
All necessary indexes are created automatically

### 3. Query Optimization
Use the provided views for common queries:
- `user_stats` instead of joining tables
- `recent_activities` for activity feed
- `top_players` for leaderboards

---

## 🎯 What Each Feature Enables

### game_attempts Table
- ✅ Daily game limits (5-50 based on VIP)
- ✅ Reset timer display
- ✅ Fair play enforcement

### user_activities Table
- ✅ Live activity feed
- ✅ Social engagement
- ✅ FOMO effect
- ✅ Community feel

### leaderboard_cache Table
- ✅ Fast leaderboard loading
- ✅ Multiple leaderboard types
- ✅ Reduced database load

### New Columns
- ✅ Mining system (8-hour cooldown)
- ✅ Referral system (codes & tracking)
- ✅ Profile customization
- ✅ Game statistics
- ✅ Social features

### Functions & Views
- ✅ Automated tasks
- ✅ Easy querying
- ✅ Better performance

---

## 🚀 Post-Update Steps

1. **Test All Features**
   - Play games (check daily limits)
   - Check activity feed
   - View leaderboards
   - Test mining system
   - Try referrals

2. **Monitor Performance**
   ```sql
   -- Check table sizes
   SELECT 
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

3. **Set Up Scheduled Tasks**
   - Leaderboard updates (hourly)
   - Activity cleanup (weekly)
   - Database maintenance (monthly)

4. **Update Application Code**
   - All database methods already added
   - ActivityFeed component ready
   - No code changes needed!

---

## 📝 Summary

### What You Get
- ✅ 3 new tables
- ✅ 20+ new columns
- ✅ 5 utility functions
- ✅ 3 helpful views
- ✅ Complete functionality

### Time Required
- Fresh install: ~2 minutes
- Update existing: ~1 minute

### Difficulty
- ⭐ Easy - Just copy & paste SQL

### Result
- 🎉 Fully functional database
- 🚀 All features enabled
- 💯 Production ready

---

## 🎊 You're Done!

Your database now has everything needed for:
- ✅ Game limits and cooldowns
- ✅ Live activity feed
- ✅ Fast leaderboards
- ✅ Mining system
- ✅ Referral system
- ✅ Complete user profiles
- ✅ Detailed statistics

**Happy coding! 🚀**
