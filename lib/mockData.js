// Mock data to return when database is unavailable
export const mockUsers = Array.from({ length: 50 }, (_, i) => ({
  userId: `MOCK-USER-${i + 1}`,
  username: ['CryptoKing', 'DiamondHands', 'MoonWalker', 'RocketMan', 'GemHunter', 'PointMaster', 'GameChamp', 'ProPlayer',
    'LuckyWinner', 'TopEarner', 'StreakLord', 'TaskMaster', 'CoinCollector', 'RewardSeeker', 'VIPPlayer', 'EliteGamer',
    'ChainBreaker', 'TokenHunter', 'ProfitMaker', 'WealthBuilder', 'PointChaser', 'GameNinja', 'CryptoWhale', 'MegaMiner',
    'StarPlayer', 'LegendaryUser', 'UltimateGamer', 'PowerPlayer', 'SuperStreak', 'MasterMiner', 'EpicWinner', 'ProMiner',
    'GoldDigger', 'TreasureHunter', 'FortuneSeeker', 'BonusKing', 'RewardHunter', 'PointCollector', 'TaskNinja', 'GameMaster',
    'CryptoLord', 'DiamondMiner', 'MoonShooter', 'StarChaser', 'WinStreak', 'TopGamer', 'ElitePlayer', 'ProChamp', 'MegaWinner', 'UltraPlayer'][i] || `Player${i + 1}`,
  email: `user${i + 1}@ciprohub.site`,
  avatar: ['🎮', '🚀', '⚡', '🔥', '💎', '🌟', '🎯', '🏆', '👑', '💰'][i % 10],
  isAdmin: false,
  points: 50000 - (i * 800),
  vipLevel: i < 10 ? Math.floor(Math.random() * 3) + 2 : 1,
  exp: Math.floor(Math.random() * 1000),
  maxExp: 1000,
  giftPoints: 0,
  completedTasks: Math.floor(Math.random() * 20),
  dayStreak: Math.floor(Math.random() * 30),
  balance: { sol: 0, eth: 0, usdt: 0, usdc: 0 },
  totalEarnings: { sol: 0, eth: 0, usdt: 0, usdc: 0 },
}));

export const mockLeaderboard = Array.from({ length: 50 }, (_, i) => ({
  user_id: `MOCK-${i + 1}`,
  username: `Player${i + 1}`,
  avatar: ['🎮', '🚀', '⚡', '🔥', '💎', '🌟', '🎯', '🏆'][i % 8],
  points: 50000 - (i * 800),
  vip_level: i < 10 ? Math.floor(Math.random() * 3) + 2 : 1,
}));

export const mockTasks = [
  {
    id: 1,
    task_name: 'Daily Login',
    task_type: 'daily',
    description: 'Login to your account',
    points_reward: 50,
    is_active: true,
  },
  {
    id: 2,
    task_name: 'Play 3 Games',
    task_type: 'daily',
    description: 'Complete 3 game sessions',
    points_reward: 100,
    is_active: true,
  },
  {
    id: 3,
    task_name: 'Refer a Friend',
    task_type: 'referral',
    description: 'Invite someone to join',
    points_reward: 500,
    is_active: true,
  },
];

export const mockVIPTiers = [
  { tier_name: 'Bronze', min_level: 1, max_level: 1, daily_game_limit: 5, conversion_bonus: 0 },
  { tier_name: 'Silver', min_level: 2, max_level: 2, daily_game_limit: 7, conversion_bonus: 5 },
  { tier_name: 'Gold', min_level: 3, max_level: 3, daily_game_limit: 10, conversion_bonus: 10 },
  { tier_name: 'Platinum', min_level: 4, max_level: 4, daily_game_limit: 15, conversion_bonus: 15 },
  { tier_name: 'Diamond', min_level: 5, max_level: 5, daily_game_limit: 20, conversion_bonus: 20 },
];

export function getMockData(action) {
  switch (action) {
    case 'getAllUsers':
      return mockUsers;
    case 'getLeaderboard':
      return mockLeaderboard;
    case 'getTasks':
      return mockTasks;
    case 'getVIPTiers':
      return mockVIPTiers;
    case 'getUserLuckyDrawTickets':
      return 0;
    case 'getCurrentPrizePool':
      return { cipro: 50000, usdt: 20, vipUpgrade: true, totalTickets: 0 };
    case 'getRecentLuckyDrawWinners':
      return [];
    case 'getNotifications':
      return [];
    case 'getAchievements':
      return [];
    case 'getUserAchievements':
      return [];
    case 'getUserActivity':
      return [];
    case 'getDailyRewards':
      return [];
    case 'getConversionHistory':
      return [];
    case 'getUserReferrals':
      return [];
    case 'getWithdrawalRequests':
      return [];
    case 'getGameAttempts':
      return [];
    case 'getUserTasks':
      return [];
    case 'updateTaskProgress':
      return { id: Date.now(), user_id: 'MOCK', task_id: 1, progress: 0, is_claimed: false };
    case 'claimTask':
      return { id: Date.now(), user_id: 'MOCK', task_id: 1, progress: 0, is_claimed: true, claimed_at: new Date().toISOString() };
    case 'createDepositRequest':
      return {
        id: Date.now(),
        user_id: 'MOCK-USER',
        currency: 'sol',
        amount: 0,
        tx_hash: 'MOCK-TX-HASH',
        wallet_address: 'MOCK-WALLET',
        status: 'pending',
        created_at: new Date().toISOString(),
      };
    case 'getDepositRequests':
      return [];
    case 'getMiningSessionsToday':
      return 0;
    case 'getActiveMiningCount':
      return 0;
    case 'recordMiningSession':
      return { success: true, timestamp: new Date().toISOString() };
    default:
      return null;
  }
}
