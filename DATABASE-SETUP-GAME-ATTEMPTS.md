# 🗄️ Game Attempts Database Setup Guide

## Quick Setup

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the SQL
Copy and paste this SQL into the editor:

```sql
-- Create the game_attempts table
CREATE TABLE IF NOT EXISTS game_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL DEFAULT 'puzzle',
  won BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  difficulty VARCHAR(20) DEFAULT 'easy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_date ON game_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_game_attempts_user_date ON game_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_attempts_type ON game_attempts(game_type);

-- Add table comment
COMMENT ON TABLE game_attempts IS 'Tracks all game attempts with daily limits based on VIP tiers';
```

### Step 3: Click "Run" or press Ctrl+Enter

### Step 4: Verify Table Creation
Run this query to verify:

```sql
SELECT * FROM game_attempts LIMIT 1;
```

You should see an empty result (no errors).

## What This Creates

### Table: game_attempts

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key, auto-increment |
| user_id | BIGINT | Foreign key to users table |
| game_type | VARCHAR(50) | Type of game (puzzle, trivia, memory, spinwheel) |
| won | BOOLEAN | Whether user won the game |
| score | INTEGER | Points earned |
| difficulty | VARCHAR(20) | Game difficulty (easy, medium, hard) |
| created_at | TIMESTAMP | When attempt was made |

### Indexes Created

1. **idx_game_attempts_user** - Fast lookup by user
2. **idx_game_attempts_date** - Fast lookup by date
3. **idx_game_attempts_user_date** - Fast lookup by user and date (most common query)
4. **idx_game_attempts_type** - Fast lookup by game type

## Testing

### Test 1: Insert a Test Record
```sql
INSERT INTO game_attempts (user_id, game_type, won, score, difficulty)
VALUES (1, 'puzzle', true, 50, 'easy');
```

### Test 2: Query Today's Attempts
```sql
SELECT COUNT(*) 
FROM game_attempts 
WHERE user_id = 1 
  AND game_type = 'puzzle'
  AND created_at >= CURRENT_DATE 
  AND created_at < CURRENT_DATE + INTERVAL '1 day';
```

### Test 3: Get User Statistics
```sql
SELECT 
  game_type,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN won THEN 1 ELSE 0 END) as wins,
  AVG(score) as avg_score
FROM game_attempts
WHERE user_id = 1
GROUP BY game_type;
```

## Troubleshooting

### Error: "relation 'users' does not exist"
**Solution**: Make sure your users table exists first. The game_attempts table references it.

### Error: "permission denied"
**Solution**: Make sure you're running the query as a database admin or have proper permissions.

### Error: "table already exists"
**Solution**: The table is already created. You can skip this step or drop it first:
```sql
DROP TABLE IF EXISTS game_attempts CASCADE;
```
Then run the creation script again.

## Row Level Security (RLS)

If you want to enable RLS for security:

```sql
-- Enable RLS
ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own attempts
CREATE POLICY "Users can view own attempts"
  ON game_attempts
  FOR SELECT
  USING (auth.uid()::bigint = user_id);

-- Policy: Users can insert their own attempts
CREATE POLICY "Users can insert own attempts"
  ON game_attempts
  FOR INSERT
  WITH CHECK (auth.uid()::bigint = user_id);

-- Policy: Admins can see all attempts
CREATE POLICY "Admins can view all attempts"
  ON game_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::bigint
      AND is_admin = true
    )
  );
```

## Maintenance

### Clean Old Records (Optional)
If you want to keep only recent data:

```sql
-- Delete attempts older than 90 days
DELETE FROM game_attempts
WHERE created_at < NOW() - INTERVAL '90 days';
```

### View Table Size
```sql
SELECT 
  pg_size_pretty(pg_total_relation_size('game_attempts')) as total_size,
  pg_size_pretty(pg_relation_size('game_attempts')) as table_size,
  pg_size_pretty(pg_indexes_size('game_attempts')) as indexes_size;
```

## Backup

### Export Data
```sql
COPY game_attempts TO '/tmp/game_attempts_backup.csv' CSV HEADER;
```

### Import Data
```sql
COPY game_attempts FROM '/tmp/game_attempts_backup.csv' CSV HEADER;
```

## Next Steps

After creating the table:
1. ✅ Table is ready
2. ✅ Indexes are created
3. ✅ Games will start tracking attempts
4. ✅ VIP limits will be enforced
5. ✅ Statistics will be collected

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify users table exists
3. Check database permissions
4. Review Supabase logs
5. Consult GAME-ATTEMPTS-SCHEMA-FIXED.sql for reference

## Files Reference

- **GAME-ATTEMPTS-SCHEMA-FIXED.sql** - Complete SQL script
- **ALL-GAMES-DAILY-LIMITS-COMPLETE.md** - Full system documentation
- **DAILY-LIMITS-SUMMARY.md** - Quick reference guide
