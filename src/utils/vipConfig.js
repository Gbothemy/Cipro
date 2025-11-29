// VIP Level Configuration
// Defines benefits and limits for each VIP tier
// Bronze is FREE, other tiers require subscription

// Helper function to create tier levels
const createTierLevel = (level, tierName, tierConfig) => ({
  name: tierName,
  tier: tierName,
  level,
  ...tierConfig
});

// Base tier configurations
const TIER_CONFIGS = {
  Bronze: {
    color: '#CD7F32',
    icon: '🥉',
    dailyGameLimit: 5,
    miningMultiplier: 1.0,
    withdrawalFee: 0.05,
    minWithdrawal: 10000,
    price: 0,
    isFree: true,
    benefits: ['✅ 5 games per day', '✅ 1x mining rewards', '✅ 5% withdrawal fee', '✅ Basic support', '✅ Free forever']
  },
  Silver: {
    color: '#C0C0C0',
    icon: '🥈',
    dailyGameLimit: 10,
    miningMultiplier: 1.2,
    withdrawalFee: 0.04,
    minWithdrawal: 8000,
    price: 9.99,
    priceMonthly: 9.99,
    priceYearly: 99.99,
    isFree: false,
    requiresSubscription: true,
    benefits: ['✅ 10 games per day', '✅ 1.2x mining rewards (+20%)', '✅ 4% withdrawal fee', '✅ Priority support', '✅ Exclusive tasks', '💎 Ad-free experience']
  },
  Gold: {
    color: '#FFD700',
    icon: '🥇',
    dailyGameLimit: 15,
    miningMultiplier: 1.5,
    withdrawalFee: 0.03,
    minWithdrawal: 5000,
    price: 19.99,
    priceMonthly: 19.99,
    priceYearly: 199.99,
    isFree: false,
    requiresSubscription: true,
    popular: true,
    benefits: ['✅ 15 games per day', '✅ 1.5x mining rewards (+50%)', '✅ 3% withdrawal fee', '✅ VIP support', '✅ All exclusive tasks', '✅ Bonus airdrops', '💎 Ad-free experience', '🎁 Monthly bonus: 5,000 CIPRO']
  },
  Platinum: {
    color: '#E5E4E2',
    icon: '💎',
    dailyGameLimit: 25,
    miningMultiplier: 2.0,
    withdrawalFee: 0.02,
    minWithdrawal: 3000,
    price: 49.99,
    priceMonthly: 49.99,
    priceYearly: 499.99,
    isFree: false,
    requiresSubscription: true,
    benefits: ['✅ 25 games per day', '✅ 2x mining rewards (+100%)', '✅ 2% withdrawal fee', '✅ Premium support', '✅ All exclusive tasks', '✅ Double airdrops', '✅ Special events access', '💎 Ad-free experience', '🎁 Monthly bonus: 15,000 CIPRO', '⚡ Priority withdrawals']
  },
  Diamond: {
    color: '#B9F2FF',
    icon: '💠',
    dailyGameLimit: 50,
    miningMultiplier: 2.5,
    withdrawalFee: 0.01,
    minWithdrawal: 1000,
    price: 99.99,
    priceMonthly: 99.99,
    priceYearly: 999.99,
    isFree: false,
    requiresSubscription: true,
    premium: true,
    benefits: ['✅ 50 games per day', '✅ 2.5x mining rewards (+150%)', '✅ 1% withdrawal fee', '✅ Dedicated support 24/7', '✅ All exclusive tasks', '✅ Triple airdrops', '✅ All special events', '✅ Early access features', '💎 Ad-free experience', '🎁 Monthly bonus: 50,000 CIPRO', '⚡ Instant withdrawals', '👑 Diamond badge', '🎯 Personal account manager']
  }
};

export const VIP_LEVELS = {
  // Bronze Tier (Levels 1-4) - FREE
  1: createTierLevel(1, 'Bronze', TIER_CONFIGS.Bronze),
  2: createTierLevel(2, 'Bronze', TIER_CONFIGS.Bronze),
  3: createTierLevel(3, 'Bronze', TIER_CONFIGS.Bronze),
  4: createTierLevel(4, 'Bronze', TIER_CONFIGS.Bronze),
  
  // Silver Tier (Levels 5-8) - SUBSCRIPTION
  5: createTierLevel(5, 'Silver', TIER_CONFIGS.Silver),
  6: createTierLevel(6, 'Silver', TIER_CONFIGS.Silver),
  7: createTierLevel(7, 'Silver', TIER_CONFIGS.Silver),
  8: createTierLevel(8, 'Silver', TIER_CONFIGS.Silver),
  
  // Gold Tier (Levels 9-12) - SUBSCRIPTION
  9: createTierLevel(9, 'Gold', TIER_CONFIGS.Gold),
  10: createTierLevel(10, 'Gold', TIER_CONFIGS.Gold),
  11: createTierLevel(11, 'Gold', TIER_CONFIGS.Gold),
  12: createTierLevel(12, 'Gold', TIER_CONFIGS.Gold),
  
  // Platinum Tier (Levels 13-16) - SUBSCRIPTION
  13: createTierLevel(13, 'Platinum', TIER_CONFIGS.Platinum),
  14: createTierLevel(14, 'Platinum', TIER_CONFIGS.Platinum),
  15: createTierLevel(15, 'Platinum', TIER_CONFIGS.Platinum),
  16: createTierLevel(16, 'Platinum', TIER_CONFIGS.Platinum),
  
  // Diamond Tier (Levels 17-20) - SUBSCRIPTION
  17: createTierLevel(17, 'Diamond', TIER_CONFIGS.Diamond),
  18: createTierLevel(18, 'Diamond', TIER_CONFIGS.Diamond),
  19: createTierLevel(19, 'Diamond', TIER_CONFIGS.Diamond),
  20: createTierLevel(20, 'Diamond', TIER_CONFIGS.Diamond)
};

// Cache for VIP config lookups (performance optimization)
const vipConfigCache = new Map();

// Get VIP level configuration (with caching)
export const getVIPConfig = (vipLevel) => {
  if (!vipConfigCache.has(vipLevel)) {
    vipConfigCache.set(vipLevel, VIP_LEVELS[vipLevel] || VIP_LEVELS[1]);
  }
  return vipConfigCache.get(vipLevel);
};

// Get daily game limit for VIP level
export const getDailyGameLimit = (vipLevel) => {
  const config = getVIPConfig(vipLevel);
  return config.dailyGameLimit;
};

// Get mining multiplier for VIP level
export const getMiningMultiplier = (vipLevel) => {
  const config = getVIPConfig(vipLevel);
  return config.miningMultiplier;
};

// Get withdrawal fee for VIP level
export const getWithdrawalFee = (vipLevel) => {
  const config = getVIPConfig(vipLevel);
  return config.withdrawalFee;
};

// Get minimum withdrawal amount for VIP level
export const getMinWithdrawal = (vipLevel) => {
  const config = getVIPConfig(vipLevel);
  return config.minWithdrawal;
};

// Check if VIP level requires subscription
export const requiresSubscription = (vipLevel) => {
  const config = getVIPConfig(vipLevel);
  return config.requiresSubscription || false;
};

// Check if user is on free tier (Bronze levels 1-4)
export const isFreeTier = (vipLevel) => {
  return vipLevel >= 1 && vipLevel <= 4;
};

// Get subscription price for VIP level
export const getSubscriptionPrice = (vipLevel, billingCycle = 'monthly') => {
  const config = getVIPConfig(vipLevel);
  if (config.isFree) return 0;
  return billingCycle === 'yearly' ? config.priceYearly : config.priceMonthly;
};

// Get yearly savings
export const getYearlySavings = (vipLevel) => {
  const config = getVIPConfig(vipLevel);
  if (config.isFree) return 0;
  const monthlyTotal = config.priceMonthly * 12;
  const yearlySavings = monthlyTotal - config.priceYearly;
  return yearlySavings;
};

// Get savings percentage
export const getSavingsPercentage = (vipLevel) => {
  const config = getVIPConfig(vipLevel);
  if (config.isFree) return 0;
  const monthlyTotal = config.priceMonthly * 12;
  const savings = monthlyTotal - config.priceYearly;
  return Math.round((savings / monthlyTotal) * 100);
};

// Check if user can access VIP level
export const canAccessVIPLevel = (vipLevel, hasActiveSubscription, currentVipLevel) => {
  // Bronze levels (1-4) are always accessible
  if (vipLevel >= 1 && vipLevel <= 4) return true;
  
  // Other tiers require subscription
  const config = getVIPConfig(vipLevel);
  if (config.requiresSubscription) {
    return hasActiveSubscription && currentVipLevel >= vipLevel;
  }
  
  return true;
};

// Get upgrade benefits comparison
export const getUpgradeBenefits = (currentLevel, targetLevel) => {
  const current = getVIPConfig(currentLevel);
  const target = getVIPConfig(targetLevel);
  
  return {
    gamesIncrease: target.dailyGameLimit - current.dailyGameLimit,
    miningIncrease: ((target.miningMultiplier - current.miningMultiplier) / current.miningMultiplier * 100).toFixed(0),
    feeReduction: ((current.withdrawalFee - target.withdrawalFee) * 100).toFixed(0),
    newBenefits: target.benefits.length - current.benefits.length
  };
};

export default {
  VIP_LEVELS,
  getVIPConfig,
  getDailyGameLimit,
  getMiningMultiplier,
  getWithdrawalFee,
  getMinWithdrawal,
  requiresSubscription,
  isFreeTier,
  getSubscriptionPrice,
  getYearlySavings,
  getSavingsPercentage,
  canAccessVIPLevel,
  getUpgradeBenefits
};
