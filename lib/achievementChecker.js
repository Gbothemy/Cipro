// Achievement checker - automatically unlocks achievements based on user progress
import { db } from './apiClient';

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
      const requirement = achievement.requirement_text.toLowerCase();
      let shouldUnlock = false;

      // Points achievements
      if (name.includes('point') || requirement.includes('point')) {
        const requiredPoints = parseInt(requirement.match(/(\d+)/)?.[0] || '0');
        if (userStats.points >= requiredPoints) shouldUnlock = true;
      }

      // Game achievements
      if (name.includes('game') && (name.includes('play') || requirement.includes('play'))) {
        const requiredGames = parseInt(requirement.match(/(\d+)/)?.[0] || '1');
        if (userStats.gamesPlayed >= requiredGames) shouldUnlock = true;
      }

      // Streak achievements
      if (name.includes('streak') || requirement.includes('streak') || requirement.includes('day')) {
        const requiredDays = parseInt(requirement.match(/(\d+)/)?.[0] || '1');
        if (userStats.dayStreak >= requiredDays) shouldUnlock = true;
      }

      // Task achievements
      if (name.includes('task') || requirement.includes('task')) {
        const requiredTasks = parseInt(requirement.match(/(\d+)/)?.[0] || '1');
        if (userStats.completedTasks >= requiredTasks) shouldUnlock = true;
      }

      // Social/Referral achievements
      if (name.includes('refer') || requirement.includes('refer') || requirement.includes('friend')) {
        const requiredReferrals = parseInt(requirement.match(/(\d+)/)?.[0] || '1');
        if (userStats.referrals >= requiredReferrals) shouldUnlock = true;
      }

      // VIP achievements
      if (name.includes('vip') || requirement.includes('vip')) {
        if (name.includes('silver') || name.includes('level 2')) {
          if (userStats.vipLevel >= 2) shouldUnlock = true;
        }
        if (name.includes('gold') || name.includes('level 3')) {
          if (userStats.vipLevel >= 3) shouldUnlock = true;
        }
        if (name.includes('platinum') || name.includes('level 4')) {
          if (userStats.vipLevel >= 4) shouldUnlock = true;
        }
        if (name.includes('diamond') || name.includes('level 5')) {
          if (userStats.vipLevel >= 5) shouldUnlock = true;
        }
      }

      // Financial achievements
      if (name.includes('deposit') && requirement.includes('first')) {
        if (userStats.deposits > 0) shouldUnlock = true;
      }
      if (name.includes('deposit') && requirement.includes('$')) {
        const requiredAmount = parseInt(requirement.match(/\$(\d+)/)?.[1] || '0');
        if (userStats.totalDeposited >= requiredAmount) shouldUnlock = true;
      }

      // Achievement unlocking achievements
      if (name.includes('unlock') && name.includes('achievement')) {
        const requiredCount = parseInt(requirement.match(/(\d+)/)?.[0] || '1');
        if (userAchievements.length >= requiredCount) shouldUnlock = true;
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
    const [user, gameAttempts, userTasks, deposits, referrals] = await Promise.all([
      db.getUser(userId).catch(() => null),
      db.getGameAttempts(userId, null, 24 * 365).catch(() => []), // All time
      db.getUserTasks(userId).catch(() => []),
      db.getDepositRequests(userId, 'approved').catch(() => []),
      db.getUserReferrals(userId).catch(() => []),
    ]);

    const totalDeposited = deposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const completedTasks = userTasks.filter(t => t.is_claimed).length;

    return {
      points: user?.points || 0,
      gamesPlayed: gameAttempts.length,
      dayStreak: user?.dayStreak || 0,
      completedTasks,
      referrals: referrals.length,
      vipLevel: user?.vipLevel || 1,
      deposits: deposits.length,
      totalDeposited,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      points: 0,
      gamesPlayed: 0,
      dayStreak: 0,
      completedTasks: 0,
      referrals: 0,
      vipLevel: 1,
      deposits: 0,
      totalDeposited: 0,
    };
  }
}
