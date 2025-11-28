# 🔄 Cipro Rebranding Implementation Guide

## Overview
This document outlines the changes needed to:
1. Replace "points" with "Cipro" throughout the platform
2. Implement VIP-based game limits
3. Update all UI references

---

## 1. VIP System Updates

### VIP Configuration (✅ Created)
**File:** `src/utils/vipConfig.js`

**VIP Levels:**
- VIP 1 (Bronze 🥉): 5 games/day, 1.0x rewards
- VIP 2 (Silver 🥈): 10 games/day, 1.2x rewards
- VIP 3 (Gold 🥇): 15 games/day, 1.5x rewards
- VIP 4 (Platinum 💎): 25 games/day, 2.0x rewards
- VIP 5 (Diamond 💠): 50 games/day, 2.5x rewards

### Game Attempt Manager (✅ Updated)
**File:** `src/utils/gameAttemptManager.js`
- Now uses VIP config for daily limits
- Removed old tier system
- Uses VIP levels 1-5

---

## 2. Points → Cipro Rebranding

### Global Replacements Needed

#### Display Text Changes:
```
"points" → "Cipro"
"Points" → "Cipro"
"pts" → "CIPRO"
"Total Points" → "Total Cipro"
"Earn points" → "Earn Cipro"
"+50 pts" → "+50 CIPRO"
```

#### Variable Names (Keep as is):
```javascript
// These stay as "points" in code:
user.points
task.reward_points
pointsChange
```

#### Database Fields (Keep as is):
```sql
-- These stay as "points" in database:
users.points
users.gift_points
```

---

## 3. Files to Update

### High Priority (User-Facing)

#### src/components/Layout.js
```javascript
// Line: user-points display
<span className="user-points">{user.points.toLocaleString()} Cipro</span>
```

#### src/components/DailyMining.js
```javascript
// All reward displays
`+${reward} CIPRO`
"Cipro" instead of "points"
```

#### src/pages/GamePage.js
```javascript
// Stats display
<div className="stat-label">Total Cipro</div>

// Mining rewards
<p className="reward">+{mode.reward} CIPRO</p>
```

#### src/pages/TasksPage.js
```javascript
// Task rewards
<span className="reward-amount">+{task.reward_points} CIPRO</span>

// Notifications
`Earned ${task.reward_points} Cipro`

// Stats
<div className="overview-label">Cipro Earned</div>
```

#### src/pages/ProfilePage.js
```javascript
// Stats
{ label: 'Total Cipro', value: user.points.toLocaleString(), icon: '💎' }
{ label: 'Gift Cipro', value: user.giftPoints || 0, icon: '🎁' }

// Activity
{ action: 'Played Puzzle Game', cipro: '+50 CIPRO', time: '2 hours ago' }

// Actions
<span className="action-label">Convert Cipro</span>

// Gaming stats
<span className="gaming-stat-label">Average Cipro/Game</span>
```

#### src/pages/ConversionPage.js
```javascript
// Conversion display
"Convert Cipro to Crypto"
"Your Cipro Balance"
```

#### src/pages/LeaderboardPage.js
```javascript
// Tab name
'cipro' instead of 'points'

// Display
<div className="leaderboard-stat">{user.cipro} CIPRO</div>
```

#### src/pages/VIPTiersPage.js
```javascript
// Benefits
"Complete mining tasks to earn Cipro"
"Required Cipro: {amount}"
```

#### src/pages/AirdropPage.js
```javascript
// Rewards
"Earn Cipro daily"
```

#### src/pages/ReferralPage.js
```javascript
// Commission display
"Earn 10% Cipro commission"
```

---

## 4. CSS Updates

### Class Names (Optional - for clarity)
```css
/* Keep existing classes, just update labels */
.user-points → Can stay as is (internal class name)
.activity-points → Can stay as is
.reward-amount → Can stay as is
```

### Display Text in CSS
```css
/* Update any content: properties */
.stat-label::after {
  content: "Cipro";
}
```

---

## 5. Game-Specific Updates

### All Game Files
- TriviaGame.js
- PuzzleGame.js
- MemoryGame.js
- SpinWheelGame.js

**Changes:**
```javascript
// Reward displays
`Earned ${points} CIPRO!`
`+${score} CIPRO`

// Notifications
addNotification(`Won ${points} Cipro!`, 'success');
```

---

## 6. Implementation Priority

### Phase 1: Core Display (Immediate)
1. ✅ Create VIP config
2. ✅ Update game attempt manager
3. Layout header (user Cipro display)
4. GamePage stats and rewards
5. DailyMining component

### Phase 2: Pages (High Priority)
6. TasksPage
7. ProfilePage
8. ConversionPage
9. LeaderboardPage
10. VIPTiersPage

### Phase 3: Games (Medium Priority)
11. TriviaGame
12. PuzzleGame
13. MemoryGame
14. SpinWheelGame

### Phase 4: Secondary Pages (Low Priority)
15. AirdropPage
16. ReferralPage
17. AchievementsPage
18. NotificationsPage

---

## 7. Testing Checklist

### Functionality
- [ ] VIP limits work correctly
- [ ] Game attempts respect VIP level
- [ ] Cipro displays correctly everywhere
- [ ] Rewards calculate properly
- [ ] Conversions work
- [ ] Database updates work

### Display
- [ ] All "points" changed to "Cipro"
- [ ] Consistent capitalization
- [ ] Icons display correctly
- [ ] Mobile responsive
- [ ] Dark mode works

### VIP System
- [ ] Daily limits per VIP level
- [ ] Mining multipliers work
- [ ] Withdrawal fees correct
- [ ] Upgrade requirements clear

---

## 8. Database Considerations

### No Changes Needed
The database schema stays the same:
- `users.points` (stores Cipro amount)
- `users.gift_points` (stores gift Cipro)
- `tasks.reward_points` (stores Cipro rewards)

### Why?
- Changing database fields is risky
- "points" is a valid internal name
- Only display text changes to "Cipro"
- Maintains backward compatibility

---

## 9. Quick Reference

### Display Patterns

```javascript
// ✅ Correct
{user.points.toLocaleString()} Cipro
+{reward} CIPRO
Earned {amount} Cipro

// ❌ Incorrect
{user.points} points
+{reward} pts
Earned {amount} points
```

### VIP Usage

```javascript
import { getDailyGameLimit, getVIPConfig } from './utils/vipConfig';

// Get daily limit
const limit = getDailyGameLimit(user.vipLevel);

// Get VIP info
const vipInfo = getVIPConfig(user.vipLevel);
console.log(vipInfo.name); // "Gold"
console.log(vipInfo.icon); // "🥇"
```

---

## 10. Rollout Plan

### Step 1: Backend (Completed)
- ✅ VIP config created
- ✅ Game attempt manager updated

### Step 2: Core UI (Next)
- Update Layout header
- Update GamePage
- Update DailyMining

### Step 3: All Pages
- Systematic update of each page
- Test after each update
- Commit incrementally

### Step 4: Testing
- Full platform test
- Mobile testing
- Dark mode testing
- VIP level testing

### Step 5: Deployment
- Git commit
- Push to production
- Monitor for issues

---

## 11. Notes

### Branding Consistency
- Use "Cipro" for display (user-facing)
- Use "CIPRO" for amounts (+50 CIPRO)
- Keep "points" in code/database (internal)

### VIP Benefits
- Clearly show VIP advantages
- Encourage upgrades
- Display progress to next level

### User Communication
- Announce rebranding
- Explain VIP benefits
- Provide upgrade path

---

## Status: 🚧 IN PROGRESS

**Completed:**
- ✅ VIP configuration system
- ✅ Game attempt manager update

**Next Steps:**
1. Update Layout header
2. Update GamePage
3. Update DailyMining
4. Continue with other pages

---

**This is a comprehensive rebranding that will make the platform more professional and aligned with the Cipro brand!**
