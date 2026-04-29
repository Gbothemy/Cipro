// Achievement checker - automatically unlocks achievements based on user progress
import { db } from './apiClient';

// Parse requirement text to extract numeric values
function parseRequirement(text) {
  const lowerText = text.toLowerCase();
  
  // Extract numbers from text
  const numbers = text.match(/\d+/g);
  const firstNumber = numbers ? parseInt(numbers[0]) : 0;
  
  return {
    text: lowerText,
    value: firstNumber,
    hasNumber: numbers !== null,
  };
}

export async function checkAndUnlockAchievements(userId, userStats) {
  try {
    // Get all achievements and user's unlocked achievements
    const [allAchievements, userAchievements] = await Promise.all([
      db.getAchievements().catch(() => []),
      db.getUserAchievements(userId).catch(() => []),
    ]);

    const unlockedIds = new Set(userAchievements.map(a => a.achievement_id));
    const newlyUnlocked = [];

    // Check each achievement
    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) continue;

      const name = achievement.achievement_name.toLowerCase();
      const req = parseRequirement(achievement.requirement_text);
      let shouldUnlock = false;

      // POINTS ACHIEVEMENTS - Check exact point thresholds
      if (req.text.includes('point') && req.hasNumber) {
        if (userStats.points >= req.value) {
          shouldUnlock = true;
        }
      }

      // GAME ACHIEVEMENTS - Check games played count
      else if (req.text.includes('play') && req.text.includes('game') && req.hasNumber) {
        if (userStats.gamesPlayed >= req.value) {
          shouldUnlock = true;
        }
      }

      // WIN ACHIEVEMENTS - Check games won
      else if (req.text.includes('win') && req.text.includes('game') && req.hasNumber) {
        if (userStats.gamesWon >= req.value) {
          shouldUnlock = true;
        }
      }

      // TRIVIA ACHIEVEMENTS
      else if (req.text.includes('trivia') && req.text.includes('win') && req.hasNumber) {
        if (userStats.triviaWins >= req.value) {
          shouldUnlock = true;
        }
      }

      // MEMORY ACHIEVEMENTS
      else if (req.text.includes('memory') && req.text.includes('win') && req.hasNumber) {
        if (userStats.memoryWins >= req.value) {
          shouldUnlock = true;
        }
      }

      // STREAK ACHIEVEMENTS - Check day streak
      else if ((req.text.includes('day') && req.text.includes('streak')) || 
               (req.text.includes('login') && req.hasNumber)) {
        if (userStats.dayStreak >= req.value) {
          shouldUnlock = true;
        }
      }

      // TASK ACHIEVEMENTS - Check completed tasks
      else if (req.text.includes('task') && req.text.includes('complete') && req.hasNumber) {
        if (userStats.completedTasks >= req.value) {
          shouldUnlock = true;
        }
      }

      // REFERRAL ACHIEVEMENTS - Check referral count
      else if ((req.text.includes('refer') || req.text.includes('friend')) && req.hasNumber) {
        if (userStats.referrals >= req.value) {
          shouldUnlock = true;
        }
      }

      // VIP ACHIEVEMENTS - Check VIP level
      else if (req.text.includes('vip')) {
        if (req.text.includes('2') || req.text.includes('silver')) {
          if (userStats.vipLevel >= 2) shouldUnlock = true;
        } else if (req.text.includes('3') || req.text.includes('gold')) {
          if (userStats.vipLevel >= 3) shouldUnlock = true;
        } else if (req.text.includes('4') || req.text.includes('platinum')) {
          if (userStats.vipLevel >= 4) shouldUnlock = true;
        } else if (req.text.includes('5') || req.text.includes('diamond')) {
          if (userStats.vipLevel >= 5) shouldUnlock = true;
        } else if (req.text.includes('180') || req.text.includes('6 month')) {
          // VIP for 180 days - would need additional tracking
          if (userStats.vipDays >= 180) shouldUnlock = true;
        }
      }

      // DEPOSIT ACHIEVEMENTS
      else if (req.text.includes('deposit')) {
        if (req.text.includes('first') || req.text.includes('once')) {
          if (userStats.deposits >= 1) shouldUnlock = true;
        } else if (req.text.includes('5 times') || req.text.includes('5 deposit')) {
          if (userStats.deposits >= 5) shouldUnlock = true;
        } else if (req.text.includes('$') && req.hasNumber) {
          // Check total deposited amount
          if (userStats.totalDeposited >= req.value) shouldUnlock = true;
        }
      }

      // WITHDRAWAL ACHIEVEMENTS
      else if (req.text.includes('withdraw')) {
        if (req.text.includes('first') || req.text.includes('once')) {
          if (userStats.withdrawals >= 1) shouldUnlock = true;
        } else if (req.text.includes('$') && req.hasNumber) {
          if (userStats.totalWithdrawn >= req.value) shouldUnlock = true;
        }
      }

      // CONVERSION ACHIEVEMENTS
      else if (req.text.includes('convert') && req.hasNumber) {
        if (userStats.conversions >= req.value) shouldUnlock = true;
      }

      // LUCKY DRAW ACHIEVEMENTS
      else if (req.text.includes('ticket') || req.text.includes('lucky')) {
        if (req.text.includes('buy') && req.hasNumber) {
          if (userStats.ticketsPurchased >= req.value) shouldUnlock = true;
        } else if (req.text.includes('win') && req.hasNumber) {
          if (userStats.luckyDrawWins >= req.value) shouldUnlock = true;
        }
      }

      // ACHIEVEMENT UNLOCKING ACHIEVEMENTS
      else if (req.text.includes('unlock') && req.text.includes('achievement') && req.hasNumber) {
        // Current unlocked count (not including this one)
        if (userAchievements.length >= req.value) shouldUnlock = true;
      }

      // SPECIAL ACHIEVEMENTS
      else if (req.text.includes('early') || req.text.includes('join early')) {
        // Would need account creation date check
        if (userStats.isEarlyAdopter) shouldUnlock = true;
      }

      // Unlock if criteria met
      if (shouldUnlock) {
        try {
          await db.unlockAchievement(userId, achievement.id);
          await db.addPoints(userId, achievement.reward_points);
          newlyUnlocked.push(achievement);
        } catch (e) {
          console.error(`Failed to unlock achievement ${achievement.id}:`, e);
        }
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

// Get user stats for achievement checking
export async function getUserStatsForAchievements(userId) {
  try {
    const [user, gameAttempts, userTasks, deposits, withdrawals, referrals, conversions] = await Promise.all([
      db.getUser(userId).catch(() => null),
      db.getGameAttempts(userId, null, 24 * 365 * 10).catch(() => []), // All time
      db.getUserTasks(userId).catch(() => []),
      db.getDepositRequests(userId, 'approved').catch(() => []),
      db.getWithdrawalRequests('approved').then(all => all.filter(w => w.user_id === userId)).catch(() => []),
      db.getUserReferrals(userId).catch(() => []),
      db.getConversionHistory(userId, 1000).catch(() => []),
    ]);

    // Calculate totals
    const totalDeposited = deposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
    const completedTasks = userTasks.filter(t => t.is_claimed).length;

    // Count game types
    const gamesWon = gameAttempts.filter(g => g.result === 'win' || g.won === true).length;
    const triviaWins = gameAttempts.filter(g => (g.game_type === 'trivia' || g.game_type === 'quiz') && (g.result === 'win' || g.won === true)).length;
    const memoryWins = gameAttempts.filter(g => g.game_type === 'memory' && (g.result === 'win' || g.won === true)).length;

    // Check if early adopter (account created in first month of platform)
    const accountCreated = user?.created_at ? new Date(user.created_at) : new Date();
    const platformLaunch = new Date('2024-01-01'); // Adjust to actual launch date
    const oneMonthAfterLaunch = new Date(platformLaunch);
    oneMonthAfterLaunch.setMonth(oneMonthAfterLaunch.getMonth() + 1);
    const isEarlyAdopter = accountCreated <= oneMonthAfterLaunch;

    return {
      points: user?.points || 0,
      gamesPlayed: gameAttempts.length,
      gamesWon,
      triviaWins,
      memoryWins,
      dayStreak: user?.dayStreak || 0,
      completedTasks,
      referrals: referrals.length,
      vipLevel: user?.vipLevel || 1,
      vipDays: 0, // Would need additional tracking
      deposits: deposits.length,
      totalDeposited,
      withdrawals: withdrawals.length,
      totalWithdrawn,
      conversions: conversions.length,
      ticketsPurchased: 0, // Would need lucky draw ticket tracking
      luckyDrawWins: 0, // Would need lucky draw win tracking
      isEarlyAdopter,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      points: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      triviaWins: 0,
      memoryWins: 0,
      dayStreak: 0,
      completedTasks: 0,
      referrals: 0,
      vipLevel: 1,
      vipDays: 0,
      deposits: 0,
      totalDeposited: 0,
      withdrawals: 0,
      totalWithdrawn: 0,
      conversions: 0,
      ticketsPurchased: 0,
      luckyDrawWins: 0,
      isEarlyAdopter: false,
    };
  }
}
