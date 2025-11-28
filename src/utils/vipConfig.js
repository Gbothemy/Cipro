// VIP Level Configuration
// Defines benefits and limits for each VIP tier

export const VIP_LEVELS = {
  1: {
    name: 'Bronze',
    color: '#CD7F32',
    icon: '🥉',
    dailyGameLimit: 5,
    miningMultiplier: 1.0,
    withdrawalFee: 0.05, // 5%
    minWithdrawal: 10000,
    benefits: [
      '5 games per day',
      '1x mining rewards',
      '5% withdrawal fee',
      'Basic support'
    ]
  },
  2: {
    name: 'Silver',
    color: '#C0C0C0',
    icon: '🥈',
    dailyGameLimit: 10,
    miningMultiplier: 1.2,
    withdrawalFee: 0.04, // 4%
    minWithdrawal: 8000,
    benefits: [
      '10 games per day',
      '1.2x mining rewards',
      '4% withdrawal fee',
      'Priority support',
      'Exclusive tasks'
    ]
  },
  3: {
    name: 'Gold',
    color: '#FFD700',
    icon: '🥇',
    dailyGameLimit: 15,
    miningMultiplier: 1.5,
    withdrawalFee: 0.03, // 3%
    minWithdrawal: 5000,
    benefits: [
      '15 games per day',
      '1.5x mining rewards',
      '3% withdrawal fee',
      'VIP support',
      'Exclusive tasks',
      'Bonus airdrops'
    ]
  },
  4: {
    name: 'Platinum',
    color: '#E5E4E2',
    icon: '💎',
    dailyGameLimit: 25,
    miningMultiplier: 2.0,
    withdrawalFee: 0.02, // 2%
    minWithdrawal: 3000,
    benefits: [
      '25 games per day',
      '2x mining rewards',
      '2% withdrawal fee',
      'Premium support',
      'All exclusive tasks',
      'Double airdrops',
      'Special events'
    ]
  },
  5: {
    name: 'Diamond',
    color: '#B9F2FF',
    icon: '💠',
    dailyGameLimit: 50,
    miningMultiplier: 2.5,
    withdrawalFee: 0.01, // 1%
    minWithdrawal: 1000,
    benefits: [
      '50 games per day',
      '2.5x mining rewards',
      '1% withdrawal fee',
      'Dedicated support',
      'All exclusive tasks',
      'Triple airdrops',
      'All special events',
      'Early access features'
    ]
  }
};

// Get VIP level configuration
export const getVIPConfig = (vipLevel) => {
  return VIP_LEVELS[vipLevel] || VIP_LEVELS[1];
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

// Calculate required Cipro for next VIP level
export const getRequiredCiproForNextLevel = (currentLevel) => {
  const requirements = {
    1: 10000,   // Bronze → Silver: 10,000 Cipro
    2: 50000,   // Silver → Gold: 50,000 Cipro
    3: 150000,  // Gold → Platinum: 150,000 Cipro
    4: 500000,  // Platinum → Diamond: 500,000 Cipro
    5: null     // Diamond is max level
  };
  return requirements[currentLevel];
};

// Check if user can upgrade to next VIP level
export const canUpgradeVIP = (currentLevel, totalCipro) => {
  if (currentLevel >= 5) return false;
  const required = getRequiredCiproForNextLevel(currentLevel);
  return totalCipro >= required;
};

// Get progress to next VIP level (0-100)
export const getVIPProgress = (currentLevel, totalCipro) => {
  if (currentLevel >= 5) return 100;
  const required = getRequiredCiproForNextLevel(currentLevel);
  return Math.min((totalCipro / required) * 100, 100);
};

export default {
  VIP_LEVELS,
  getVIPConfig,
  getDailyGameLimit,
  getMiningMultiplier,
  getWithdrawalFee,
  getMinWithdrawal,
  getRequiredCiproForNextLevel,
  canUpgradeVIP,
  getVIPProgress
};
