// Game Attempt Manager - Handles daily limits based on VIP levels

import { db } from '../db/neon';
import { getDailyGameLimit, getVIPConfig } from './vipConfig';

export const getDailyAttemptLimit = (vipLevel) => getDailyGameLimit(vipLevel);

export const getVIPTierName = (vipLevel) => {
  const config = getVIPConfig(vipLevel);
  return config.name;
};

const getNextDailyReset = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

export const canPlayGame = async (userId, gameType = 'puzzle') => {
  try {
    const user = await db.getUser(userId);
    const vipLevel = user?.vipLevel || 1;
    const dailyLimit = getDailyAttemptLimit(vipLevel);
    const lastReset = user?.last_game_reset;
    const now = new Date();
    const shouldReset = !lastReset || (now - new Date(lastReset)) >= (24 * 60 * 60 * 1000);

    if (shouldReset) {
      const newResetTime = now.toISOString();
      await db.updateUser(userId, { last_game_reset: newResetTime });
      return { canPlay: true, attemptsUsed: 0, attemptsRemaining: dailyLimit, dailyLimit, vipTier: getVIPTierName(vipLevel), resetTime: getNextDailyReset(), lastResetTime: newResetTime };
    }

    const hoursAgo = (now - new Date(lastReset)) / (1000 * 60 * 60);
    const attempts = await db.getGameAttempts(userId, null, hoursAgo);
    const attemptsUsed = attempts?.length || 0;
    const attemptsRemaining = dailyLimit - attemptsUsed;
    const nextResetTime = new Date(new Date(lastReset).getTime() + 24 * 60 * 60 * 1000).toISOString();

    return { canPlay: attemptsRemaining > 0, attemptsUsed, attemptsRemaining, dailyLimit, vipTier: getVIPTierName(vipLevel), resetTime: nextResetTime, lastResetTime: lastReset };
  } catch (error) {
    console.error('Error checking game attempts:', error);
    return { canPlay: true, attemptsUsed: 0, attemptsRemaining: 5, dailyLimit: 5, vipTier: 'Bronze', resetTime: getNextDailyReset() };
  }
};

export const recordGameAttempt = async (userId, gameType = 'puzzle', result = {}) => {
  try {
    return await db.recordGameAttempt(userId, gameType, result);
  } catch (error) {
    console.error('Error recording game attempt:', error);
    return { success: false, error: error.message || 'Failed to record game attempt' };
  }
};

export const getGameStats = async (userId, gameType = 'puzzle') => {
  try {
    return await db.getGameStats(userId, gameType);
  } catch (error) {
    console.error('Error getting game stats:', error);
    return { totalGames: 0, gamesWon: 0, gamesLost: 0, totalScore: 0, winRate: 0, averageScore: 0 };
  }
};

export const getResetTime = (oldestAttemptTime = null) => {
  if (oldestAttemptTime) return new Date(new Date(oldestAttemptTime).getTime() + 24 * 60 * 60 * 1000).toISOString();
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
};

export const getTimeUntilReset = (resetTime = null) => {
  const now = new Date();
  const reset = resetTime ? new Date(resetTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const diff = reset - now;
  if (diff <= 0) return { hours: 0, minutes: 0, formatted: 'Now' };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes, formatted: `${hours}h ${minutes}m` };
};

export const getTodayAttempts = async (userId, gameType = 'puzzle') => {
  try {
    return await db.getGameAttempts(userId, gameType, 24);
  } catch (error) {
    console.error('Error getting recent attempts:', error);
    return [];
  }
};

export const shouldShowVIPUpgrade = (attemptsRemaining, vipTier) => attemptsRemaining === 0 && vipTier !== 'diamond';

export const getNextTierBenefits = (currentVipLevel) => {
  if (currentVipLevel >= 20) return null;
  const nextLevel = currentVipLevel + 1;
  const currentLimit = getDailyGameLimit(currentVipLevel);
  const nextLimit = getDailyGameLimit(nextLevel);
  const increase = nextLimit - currentLimit;
  const nextConfig = getVIPConfig(nextLevel);
  return {
    tier: nextConfig.name, level: nextLevel, limit: nextLimit, increase,
    message: increase > 0 ? `Upgrade to ${nextConfig.name} ${nextConfig.icon} for ${increase} more daily attempts!` : `Level up to ${nextConfig.name} Level ${nextLevel}!`
  };
};

export default { getDailyAttemptLimit, getVIPTierName, canPlayGame, recordGameAttempt, getGameStats, getResetTime, getTimeUntilReset, getTodayAttempts, shouldShowVIPUpgrade, getNextTierBenefits };
