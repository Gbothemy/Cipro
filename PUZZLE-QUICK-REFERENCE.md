# 🧩 Puzzle System - Quick Reference

## VIP Tier Limits

| Tier | Level | Daily Attempts |
|------|-------|----------------|
| 🥉 Bronze | 1-5 | 5 |
| 🥈 Silver | 6-15 | 10 |
| 🥇 Gold | 16-30 | 20 |
| 💎 Platinum | 31-50 | 50 |
| 💠 Diamond | 51+ | 100 |

## Quick Usage

### Check if User Can Play
```javascript
import { canPlayGame } from '../utils/gameAttemptManager';

const info = await canPlayGame(userId, 'puzzle');
if (info.canPlay) {
  // Start game
} else {
  // Show no attempts message
}
```

### Record Game Attempt
```javascript
import { recordGameAttempt } from '../utils/gameAttemptManager';

await recordGameAttempt(userId, 'puzzle', {
  won: true,
  score: 50,
  difficulty: 'easy'
});
```

### Get Random Puzzle
```javascript
import { getRandomPuzzle } from '../data/puzzleBank';

const puzzle = getRandomPuzzle('easy');
// Returns: { type, question, answer, options }
```

## Puzzle Categories

1. **Math** - 25,000+ puzzles
2. **Logic** - 20,000+ puzzles
3. **Pattern** - 15,000+ puzzles
4. **Word** - 12,000+ puzzles
5. **Riddle** - 10,000+ puzzles
6. **Visual** - 8,000+ puzzles
7. **Memory** - 5,000+ puzzles
8. **Crypto** - 5,000+ puzzles

## Database Setup

```sql
-- Run this SQL to create the table
CREATE TABLE game_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  game_type VARCHAR(50) NOT NULL DEFAULT 'puzzle',
  won BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  difficulty VARCHAR(20) DEFAULT 'easy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX idx_game_attempts_date ON game_attempts(created_at);
CREATE INDEX idx_game_attempts_user_date ON game_attempts(user_id, created_at);
```

## Common Functions

### Get Daily Limit
```javascript
import { getDailyAttemptLimit } from '../utils/gameAttemptManager';

const limit = getDailyAttemptLimit(vipLevel);
```

### Get Time Until Reset
```javascript
import { getTimeUntilReset } from '../utils/gameAttemptManager';

const time = getTimeUntilReset();
console.log(time.formatted); // "5h 30m"
```

### Get Game Statistics
```javascript
import { getGameStats } from '../utils/gameAttemptManager';

const stats = await getGameStats(userId, 'puzzle');
// Returns: { totalGames, gamesWon, winRate, etc. }
```

## Testing

### Test in Browser Console
```javascript
// Check attempts
const info = await canPlayGame(user.id, 'puzzle');
console.log('Can play:', info.canPlay);
console.log('Remaining:', info.attemptsRemaining);

// Get puzzle
const puzzle = getRandomPuzzle('easy');
console.log('Puzzle:', puzzle);

// Record attempt
await recordGameAttempt(user.id, 'puzzle', {
  won: true,
  score: 50,
  difficulty: 'easy'
});
```

## Troubleshooting

**No attempts showing?**
- Check user is logged in
- Verify VIP level in database
- Check database connection

**Attempts not resetting?**
- Verify server timezone (should be UTC)
- Check database timestamps
- Ensure cron job is running

**Wrong tier limits?**
- Update user.vip_level in database
- Clear cache
- Refresh page

## Support

For issues:
1. Check PUZZLE-SYSTEM-COMPLETE.md
2. Review GAME-ATTEMPTS-SCHEMA.sql
3. Test with browser console
4. Check database logs
