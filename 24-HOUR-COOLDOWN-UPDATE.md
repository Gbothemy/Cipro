# 24-Hour Cooldown System - Complete ✅

## Overview
Updated the daily limits system to use a **24-hour rolling cooldown** instead of daily reset at midnight UTC.

## What Changed

### Before (Midnight Reset)
- All attempts reset at midnight UTC
- Everyone gets fresh attempts at the same time
- Example: Use 5 attempts at 11:59 PM, get 5 more at 12:00 AM

### After (24-Hour Cooldown)
- Each attempt resets exactly 24 hours after it was used
- Rolling window based on first attempt
- Example: Use 5 attempts at 3:00 PM, get them back at 3:00 PM next day

## How It Works

### Attempt Tracking
```
User plays at 2:00 PM Monday
├─ Attempt 1: 2:00 PM Monday → Resets 2:00 PM Tuesday
├─ Attempt 2: 2:05 PM Monday → Resets 2:05 PM Tuesday
├─ Attempt 3: 2:10 PM Monday → Resets 2:10 PM Tuesday
├─ Attempt 4: 2:15 PM Monday → Resets 2:15 PM Tuesday
└─ Attempt 5: 2:20 PM Monday → Resets 2:20 PM Tuesday

At 2:00 PM Tuesday:
└─ Attempt 1 resets → User has 1 attempt available
```

### Reset Calculation
The system tracks the **oldest attempt** in the last 24 hours:
- If oldest attempt is 20 hours old → Reset in 4 hours
- If oldest attempt is 23 hours old → Reset in 1 hour
- If oldest attempt is 25 hours old → Already reset, can play

## Code Changes

### 1. Updated `canPlayGame()` Function
```javascript
// Before: Check today's attempts (midnight to midnight)
const today = new Date().toISOString().split('T')[0];
const attempts = await supabase
  .from('game_attempts')
  .gte('created_at', `${today}T00:00:00`)
  .lte('created_at', `${today}T23:59:59`);

// After: Check last 24 hours
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const attempts = await supabase
  .from('game_attempts')
  .gte('created_at', twentyFourHoursAgo);
```

### 2. Updated `getResetTime()` Function
```javascript
// Before: Next midnight UTC
export const getResetTime = () => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
};

// After: 24 hours from oldest attempt
export const getResetTime = (oldestAttemptTime = null) => {
  if (oldestAttemptTime) {
    return new Date(new Date(oldestAttemptTime).getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
};
```

### 3. Updated `getTimeUntilReset()` Function
```javascript
// Now accepts resetTime parameter
export const getTimeUntilReset = (resetTime = null) => {
  const now = new Date();
  const reset = resetTime ? new Date(resetTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const diff = reset - now;
  
  if (diff <= 0) {
    return { hours: 0, minutes: 0, formatted: 'Now' };
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, formatted: `${hours}h ${minutes}m` };
};
```

## Files Modified

### 1. src/utils/gameAttemptManager.js ✅
- Updated `canPlayGame()` to check last 24 hours
- Updated `getResetTime()` to calculate from oldest attempt
- Updated `getTimeUntilReset()` to accept resetTime parameter
- Updated `getTodayAttempts()` to get last 24 hours

### 2. src/games/TriviaGame.js ✅
- Pass `attemptInfo?.resetTime` to `getTimeUntilReset()`

### 3. src/games/MemoryGame.js ✅
- Pass `attemptInfo?.resetTime` to `getTimeUntilReset()`

### 4. src/games/SpinWheelGame.js ✅
- Pass `attemptInfo?.resetTime` to `getTimeUntilReset()`

### 5. src/games/PuzzleGame.js ✅
- Pass `attemptInfo?.resetTime` to `getTimeUntilReset()`

## Benefits

### For Users
✅ **More Fair** - Can't game the system by waiting for midnight
✅ **More Flexible** - Play at any time, get attempts back 24 hours later
✅ **More Predictable** - Know exactly when attempts reset
✅ **Better UX** - Clear countdown to next available attempt

### For Platform
✅ **Prevents Abuse** - Can't spam attempts at midnight
✅ **Spreads Load** - Users play at different times
✅ **Better Engagement** - Encourages regular play patterns
✅ **Fair Competition** - Everyone has same cooldown period

## Examples

### Example 1: Regular Player
```
Monday 3:00 PM - Uses all 5 attempts
Monday 3:00 PM - 11:59 PM: 0 attempts available
Tuesday 12:00 AM - 2:59 PM: 0 attempts available
Tuesday 3:00 PM: First attempt resets (1 available)
Tuesday 3:05 PM: Second attempt resets (2 available)
...and so on
```

### Example 2: Spread Out Usage
```
Monday 10:00 AM - Uses 2 attempts
Monday 2:00 PM - Uses 2 attempts
Monday 6:00 PM - Uses 1 attempt

Tuesday 10:00 AM: First 2 attempts reset (2 available)
Tuesday 2:00 PM: Next 2 attempts reset (4 available)
Tuesday 6:00 PM: Last attempt resets (5 available)
```

### Example 3: VIP User (10 attempts)
```
Monday 1:00 PM - Uses all 10 attempts over 30 minutes
Monday 1:00 PM - 1:30 PM: All attempts used

Tuesday 1:00 PM: First attempt resets
Tuesday 1:05 PM: Second attempt resets
Tuesday 1:10 PM: Third attempt resets
...
Tuesday 1:30 PM: All 10 attempts available again
```

## UI Display

### Before
```
Attempts Today: 3/5
Remaining: 2
Resets in: 8h 30m (at midnight)
```

### After
```
Attempts Today: 3/5
Remaining: 2
Next reset in: 4h 15m (rolling 24h)
```

## Database Queries

### Get Available Attempts
```sql
-- Get attempts from last 24 hours
SELECT * FROM game_attempts
WHERE user_id = $1
  AND game_type = $2
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at ASC;
```

### Check Oldest Attempt
```sql
-- Get oldest attempt to calculate reset time
SELECT created_at FROM game_attempts
WHERE user_id = $1
  AND game_type = $2
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at ASC
LIMIT 1;
```

## Testing

### Test Scenarios

1. **New User (No Attempts)**
   - Should show all attempts available
   - Reset time should be "24h 0m"

2. **User with Some Attempts**
   - Should show correct remaining count
   - Reset time based on oldest attempt

3. **User at Limit**
   - Should show 0 remaining
   - Reset time shows when first attempt returns

4. **Attempts Expiring**
   - Old attempts (>24h) should not count
   - User should regain those attempts

### Test Commands
```javascript
// In browser console

// Check current status
const info = await canPlayGame(userId, 'puzzle');
console.log('Can play:', info.canPlay);
console.log('Remaining:', info.attemptsRemaining);
console.log('Reset time:', info.resetTime);

// Calculate time until reset
const timeUntil = getTimeUntilReset(info.resetTime);
console.log('Resets in:', timeUntil.formatted);
```

## Migration Notes

### No Database Changes Required
- Existing `game_attempts` table works as-is
- No schema changes needed
- Backward compatible

### Automatic Transition
- System automatically uses new logic
- Old attempts still count if within 24 hours
- Seamless for users

## Performance

### Query Optimization
```sql
-- Efficient query with index
CREATE INDEX idx_game_attempts_user_date 
ON game_attempts(user_id, created_at);

-- Fast lookup
SELECT * FROM game_attempts
WHERE user_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours';
```

### Caching Strategy
- Cache attempt info for 1 minute
- Refresh on game completion
- Reduces database queries

## Troubleshooting

### Issue: Reset time shows negative
**Solution**: Check if attempts are older than 24 hours, they should be excluded

### Issue: User can't play but should have attempts
**Solution**: Verify oldest attempt is being calculated correctly

### Issue: Reset time not updating
**Solution**: Ensure `attemptInfo.resetTime` is being passed to `getTimeUntilReset()`

## Summary

✅ **Changed from**: Daily reset at midnight UTC
✅ **Changed to**: 24-hour rolling cooldown per attempt
✅ **Benefits**: More fair, flexible, and prevents abuse
✅ **Files Updated**: 5 files (1 utility, 4 games)
✅ **Database**: No changes required
✅ **Status**: Complete and tested

The system now provides a true 24-hour cooldown that's fair for all users regardless of timezone! 🎉
