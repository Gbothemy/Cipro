// Game Attempt Manager - Handles daily limits based on VIP levels

import { supabase } from '../db/supabase';
import { getDailyGameLimit, getVIPConfig } from './vipConfig';

// Get daily attempt limit for user (uses VIP config)
export const getDailyAttemptLimit = (vipLevel) => {
  return getDailyGameLimit(vipLevel);
};

// Get VIP tier name for display
export const getVIPTierName = (vipLevel) => {
  const config = getVIPConfig(vipLevel);
  return config.name;
};

// Check if user can play (has attempts remaining)
export const canPlayGame = async (userId, gameType = 'puzzle') => {
  try {
    // Get user's VIP level
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('vip_level')
      .eq('user_id', userId)
      .single();

    if (userError) throw userError;

    const vipLevel = userData?.vip_level || 1;
    const dailyLimit = getDailyAttemptLimit(vipLevel);

    // Get ALL game attempts from last 24 hours (not filtered by game type)
    // Daily limit applies to all games combined
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: attempts, error: attemptsError } = await supabase
      .from('game_attempts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true });

    if (attemptsError) throw attemptsError;

    const attemptsUsed = attempts?.length || 0;
    const attemptsRemaining = dailyLimit - attemptsUsed;

    // Get the oldest attempt time for reset calculation
    const oldestAttempt = attempts && attempts.length > 0 ? attempts[0].created_at : null;
    const resetTime = oldestAttempt 
      ? new Date(new Date(oldestAttempt).getTime() + 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      canPlay: attemptsRemaining > 0,
      attemptsUsed,
      attemptsRemaining,
      dailyLimit,
      vipTier: getVIPTierName(vipLevel),
      resetTime,
      oldestAttemptTime: oldestAttempt
    };
  } catch (error) {
    console.error('Error checking game attempts:', error);
    // Allow play on error (fail open)
    return {
      canPlay: true,
      attemptsUsed: 0,
      attemptsRemaining: 5,
      dailyLimit: 5,
      vipTier: 'Bronze',
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }
};

// Record a game attempt
export const recordGameAttempt = async (userId, gameType = 'puzzle', result = {}) => {
  try {
    console.log('Recording game attempt:', { userId, gameType, result });
    
    const { data, error } = await supabase
      .from('game_attempts')
      .insert([
        {
          user_id: userId,
          game_type: gameType,
          won: result.won || false,
          score: result.score || 0,
          difficulty: result.difficulty || 'normal',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      throw error;
    }

    console.log('Game attempt recorded successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error recording game attempt:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error
    });
    return { success: false, error: error.message || 'Failed to record game attempt' };
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

// Get reset time (24 hours from oldest attempt)
export const getResetTime = (oldestAttemptTime = null) => {
  if (oldestAttemptTime) {
    const resetTime = new Date(new Date(oldestAttemptTime).getTime() + 24 * 60 * 60 * 1000);
    return resetTime.toISOString();
  }
  // If no attempts yet, return 24 hours from now
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
};

// Get time until reset
export const getTimeUntilReset = (resetTime = null) => {
  const now = new Date();
  const reset = resetTime ? new Date(resetTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const diff = reset - now;
  
  // If diff is negative, attempts have already reset
  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      formatted: 'Now'
    };
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    hours,
    minutes,
    formatted: `${hours}h ${minutes}m`
  };
};

// Get attempts from last 24 hours for display
export const getTodayAttempts = async (userId, gameType = 'puzzle') => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('game_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', gameType)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting recent attempts:', error);
    return [];
  }
};

// Check if user needs VIP upgrade prompt
export const shouldShowVIPUpgrade = (attemptsRemaining, vipTier) => {
  return attemptsRemaining === 0 && vipTier !== 'diamond';
};

// Get next VIP tier benefits
export const getNextTierBenefits = (currentVipLevel) => {
  if (currentVipLevel >= 20) {
    return null; // Already at max level
  }
  
  const nextLevel = currentVipLevel + 1;
  const currentLimit = getDailyGameLimit(currentVipLevel);
  const nextLimit = getDailyGameLimit(nextLevel);
  const increase = nextLimit - currentLimit;
  const nextConfig = getVIPConfig(nextLevel);
  
  return {
    tier: nextConfig.name,
    level: nextLevel,
    limit: nextLimit,
    increase,
    message: increase > 0 ? `Upgrade to ${nextConfig.name} ${nextConfig.icon} for ${increase} more daily attempts!` : `Level up to ${nextConfig.name} Level ${nextLevel}!`
  };
};

export default {
  getDailyAttemptLimit,
  getVIPTierName,
  canPlayGame,
  recordGameAttempt,
  getGameStats,
  getResetTime,
  getTimeUntilReset,
  getTodayAttempts,
  shouldShowVIPUpgrade,
  getNextTierBenefits
};
