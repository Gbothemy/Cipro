// Neon PostgreSQL client - calls /api/db serverless endpoint
const API_URL = '/api/db';

async function call(action, params = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export const db = {
  // ===== USERS =====
  createUser: (userData) => call('createUser', userData),
  getUser: (user_id) => call('getUser', { user_id }),
  updateUser: (user_id, updates) => call('updateUser', { user_id, updates }),
  getAllUsers: () => call('getAllUsers'),
  updateBalance: (user_id, currency, amount) => call('updateBalance', { user_id, currency, amount }),
  addPoints: (user_id, points) => call('addPoints', { user_id, points }),

  // ===== WITHDRAWALS =====
  createWithdrawalRequest: (d) => call('createWithdrawalRequest', d),
  getWithdrawalRequests: (status = null) => call('getWithdrawalRequests', { status }),
  updateWithdrawalStatus: (id, status, processed_by, txHash = null) => call('updateWithdrawalStatus', { id, status, processed_by, txHash }),

  // ===== GAME PLAYS =====
  recordGamePlay: (user_id, game_type) => call('recordGamePlay', { user_id, game_type }),
  getGamePlays: (user_id, game_type, date) => call('getGamePlays', { user_id, game_type, date }),

  // ===== LEADERBOARD =====
  getLeaderboard: (type = 'points', limit = 10) => call('getLeaderboard', { type, limit }),

  // ===== TASKS =====
  getTasks: (taskType = null) => call('getTasks', { taskType }),
  getUserTasks: (user_id, taskType = null) => call('getUserTasks', { user_id, taskType }),
  updateTaskProgress: (user_id, task_id, progress) => call('updateTaskProgress', { user_id, task_id, progress }),
  claimTask: (user_id, task_id) => call('claimTask', { user_id, task_id }),
  getGamesPlayedToday: (user_id) => call('getGamesPlayedToday', { user_id }),
  getMiningSessionsToday: (user_id) => call('getMiningSessionsToday', { user_id }),
  getPointsEarnedThisMonth: (user_id) => call('getPointsEarnedThisMonth', { user_id }),

  // ===== NOTIFICATIONS =====
  createNotification: (user_id, notificationData) => call('createNotification', { user_id, notificationData }),
  getNotifications: (user_id, isRead = null) => call('getNotifications', { user_id, isRead }),
  markNotificationAsRead: (id) => call('markNotificationAsRead', { id }),
  deleteNotification: (id) => call('deleteNotification', { id }),

  // ===== ACHIEVEMENTS =====
  getAchievements: () => call('getAchievements'),
  getUserAchievements: (user_id) => call('getUserAchievements', { user_id }),
  unlockAchievement: (user_id, achievement_id) => call('unlockAchievement', { user_id, achievement_id }),

  // ===== ACTIVITY LOG =====
  logActivity: (user_id, activityData) => call('logActivity', { user_id, activityData }),
  getUserActivity: (user_id, limit = 10) => call('getUserActivity', { user_id, limit }),

  // ===== VIP TIERS =====
  getVIPTiers: () => call('getVIPTiers'),
  getUserTier: (vipLevel) => call('getUserTier', { vipLevel }),

  // ===== DAILY REWARDS =====
  recordDailyReward: (user_id, rewardData) => call('recordDailyReward', { user_id, rewardData }),
  getDailyRewards: (user_id, limit = 30) => call('getDailyRewards', { user_id, limit }),

  // ===== CONVERSION =====
  recordConversion: (user_id, conversionData) => call('recordConversion', { user_id, conversionData }),
  getConversionHistory: (user_id, limit = 20) => call('getConversionHistory', { user_id, limit }),

  // ===== REVENUE =====
  recordRevenue: (revenueData) => call('recordRevenue', { revenueData }),
  getCompanyWallet: () => call('getCompanyWallet'),
  updateCompanyWallet: (currency, amount) => call('updateCompanyWallet', { currency, amount }),
  getRevenueStats: (startDate = null, endDate = null) => call('getRevenueStats', { startDate, endDate }),
  recordTrafficRevenue: (trafficData) => call('recordTrafficRevenue', { trafficData }),
  getTrafficRevenue: (startDate = null, endDate = null) => call('getTrafficRevenue', { startDate, endDate }),
  recordUserSession: (sessionData) => call('recordUserSession', { sessionData }),
  updateUserSession: (sessionId, sessionData) => call('updateUserSession', { sessionId, sessionData }),

  // ===== REFERRALS =====
  getUserReferrals: (user_id) => call('getUserReferrals', { user_id }),
  getReferrer: (user_id) => call('getReferrer', { user_id }),
  getReferralStats: (user_id) => call('getReferralStats', { user_id }),
  getRecentActivities: (limit = 20, filter = 'all') => call('getRecentActivities', { limit, filter }),

  // ===== SUBSCRIPTIONS =====
  createSubscription: (subscriptionData) => call('createSubscription', { subscriptionData }),
  getUserSubscription: (user_id) => call('getUserSubscription', { user_id }),
  hasActiveSubscription: (user_id) => call('hasActiveSubscription', { user_id }),
  getSubscriptionTier: (user_id) => call('getSubscriptionTier', { user_id }),
  cancelSubscription: (user_id, reason = null) => call('cancelSubscription', { user_id, reason }),
  getSubscriptionHistory: (user_id, limit = 10) => call('getSubscriptionHistory', { user_id, limit }),
  recordPaymentTransaction: (transactionData) => call('recordPaymentTransaction', { transactionData }),
  getActiveSubscriptions: () => call('getActiveSubscriptions'),
  getSubscriptionRevenue: (startDate = null, endDate = null) => call('getSubscriptionRevenue', { startDate, endDate }),

  // ===== DEPOSITS =====
  createDepositRequest: (depositData) => call('createDepositRequest', depositData),
  getDepositRequests: (status = null) => call('getDepositRequests', { status }),
  updateDepositStatus: (id, status, processed_by = null) => call('updateDepositStatus', { id, status, processed_by }),
  activateSubscriptionFromDeposit: async (depositData) => {
    const tierMap = { Silver: 5, Gold: 9, Platinum: 13, Diamond: 17 };
    return call('createSubscription', {
      subscriptionData: {
        user_id: depositData.user_id,
        vip_tier: tierMap[depositData.subscription_tier] || 5,
        billing_cycle: depositData.billing_cycle,
        price: depositData.amount,
        payment_method: 'crypto',
        payment_id: depositData.id,
      }
    });
  },

  // ===== GAME ATTEMPTS =====
  recordGameAttempt: (user_id, game_type, result = {}) => call('recordGameAttempt', { user_id, game_type, result }),
  getGameAttempts: (user_id, game_type = null, hoursAgo = 24) => call('getGameAttempts', { user_id, game_type, hoursAgo }),
  getGameStats: (user_id, game_type = null) => call('getGameStats', { user_id, game_type }),

  // ===== LUCKY DRAW =====
  getUserLuckyDrawTickets: (user_id) => call('getUserLuckyDrawTickets', { user_id }),
  getCurrentPrizePool: () => call('getCurrentPrizePool'),
  updatePrizePool: (usdtContribution) => call('updatePrizePool', { usdtContribution }),
  getRecentLuckyDrawWinners: (limit = 10) => call('getRecentLuckyDrawWinners', { limit }),
  createLuckyDrawPayment: (paymentData) => call('createLuckyDrawPayment', { paymentData }),
  getUserLuckyDrawPayments: (user_id) => call('getUserLuckyDrawPayments', { user_id }),
  getAllLuckyDrawPayments: (status = null, limit = 50) => call('getAllLuckyDrawPayments', { status, limit }),
  updateLuckyDrawPaymentStatus: (paymentId, status, processedBy = null) => call('updateLuckyDrawPaymentStatus', { paymentId, status, processedBy }),

  // participateInLuckyDraw is complex - handled server-side
  participateInLuckyDraw: (user_id) => call('participateInLuckyDraw', { user_id }),

  // formatUser is only needed server-side now
  formatUser: (u) => u,
};

// Keep supabase export as null for any legacy imports
export const supabase = null;
