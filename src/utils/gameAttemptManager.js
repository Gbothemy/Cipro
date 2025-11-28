// Game Attempt Manager - Handles daily limits based on VIP tiers

import { supabase } from '../db/supabase';

// VIP Tier attempt limits
export const VIP_ATTEMPT_LIMITS = {
  bronze: 5,    // Level 1-5
  silver: 10,   // Level 6-15
  gold: 20,     // Level 16-30
  platinum: 50, // Level 31-50
  diamond: 100  // Level 51+
};

// Get VIP tier from level
export const getVIPTier = (vipLevel) => {
  if (vipLevel >= 51) return 'diamond';
  if (vipLevel >= 31) return 'platinum';
  if (vipLevel >= 16) return 'gold';
  if (vipLevel >= 6) return 'silver';
  return 'bronze';
};

// Get daily attempt limit for user
export const getDailyAttemptLimit = (vipLevel) => {
  const tier = getVIPTier(vipLevel);
  return VIP_ATTEMPT_LIMITS[tier];
};

// Check if user can play (has attempts remaining)
export const canPlayGame = async (userId, gameType = 'puzzle') => {
  try {
    // Get user's VIP level
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('vip_level')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const vipLevel = userData?.vip_level || 1;
    const dailyLimit = getDailyAttemptLimit(vipLevel);

    // Get today's attempts
    const today = new Date().toISOString().split('T')[0];
    
    const { data: attempts, error: attemptsError } = await supabase
      .from('game_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', gameType)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (attemptsError) throw attemptsError;

    const attemptsUsed = attempts?.length || 0;
    const attemptsRemaining = dailyLimit - attemptsUsed;

    return {
      canPlay: attemptsRemaining > 0,
      attemptsUsed,
      attemptsRemaining,
      dailyLimit,
      vipTier: getVIPTier(vipLevel),
      resetTime: getResetTime()
    };
  } catch (error) {
    console.error('Error checking game attempts:', error);
    // Allow play on error (fail open)
    return {
      canPlay: true,
      attemptsUsed: 0,
      attemptsRemaining: 5,
      dailyLimit: 5,
      vipTier: 'bronze',
      resetTime: getResetTime()
    };
  }
};

// Record a game attempt
export const recordGameAttempt = async (userId, gameType = 'puzzle', result = {}) => {
  try {
    const { data, error } = await supabase
      .from('game_attempts')
      .insert([
        {
          user_id: userId,
          game_type: gameType,
          won: result.won || false,
          score: result.score || 0,
          difficulty: result.difficulty || 'easy',
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error recording game attempt:', error);
    return { success: false, error };
  }
};

// Get user's game statistics
export const getGameStats = async (userId, gameType = 'puzzle') => {
  try {
    const { data, error } = await supabase
      .from('game_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', gameType);

    if (error) throw error;

    const totalGames = data?.length || 0;
    const gamesWon = data?.filter(g => g.won).length || 0;
    const totalScore = data?.reduce((sum, g) => sum + (g.score || 0), 0) || 0;
    const winRate = totalGames > 0 ? ((gamesWon / totalGames) * 100).toFixed(1) : 0;

    return {
      totalGames,
      gamesWon,
      gamesLost: totalGames - gamesWon,
      totalScore,
      winRate,
      averageScore: totalGames > 0 ? Math.round(totalScore / totalGames) : 0
    };
  } catch (error) {
    console.error('Error getting game stats:', error);
    return {
      totalGames: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalScore: 0,
      winRate: 0,
      averageScore: 0
    };
  }
};

// Get reset time (midnight UTC)
export const getResetTime = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
};

// Get time until reset
export const getTimeUntilReset = () => {
  const now = new Date();
  const resetTime = new Date(getResetTime());
  const diff = resetTime - now;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    hours,
    minutes,
    formatted: `${hours}h ${minutes}m`
  };
};

// Get today's attempts for display
export const getTodayAttempts = async (userId, gameType = 'puzzle') => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('game_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', gameType)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting today attempts:', error);
    return [];
  }
};

// Check if user needs VIP upgrade prompt
export const shouldShowVIPUpgrade = (attemptsRemaining, vipTier) => {
  return attemptsRemaining === 0 && vipTier !== 'diamond';
};

// Get next VIP tier benefits
export const getNextTierBenefits = (currentTier) => {
  const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null;
  }
  
  const nextTier = tiers[currentIndex + 1];
  const nextLimit = VIP_ATTEMPT_LIMITS[nextTier];
  const currentLimit = VIP_ATTEMPT_LIMITS[currentTier];
  const increase = nextLimit - currentLimit;
  
  return {
    tier: nextTier,
    limit: nextLimit,
    increase,
    message: `Upgrade to ${nextTier.toUpperCase()} for ${increase} more daily attempts!`
  };
};

export default {
  VIP_ATTEMPT_LIMITS,
  getVIPTier,
  getDailyAttemptLimit,
  canPlayGame,
  recordGameAttempt,
  getGameStats,
  getResetTime,
  getTimeUntilReset,
  getTodayAttempts,
  shouldShowVIPUpgrade,
  getNextTierBenefits
};
