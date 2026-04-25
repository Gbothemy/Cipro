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
  createUser: (d) => call('createUser', d),
  getUser: (user_id) => call('getUser', { user_id }),
  updateUser: (user_id, updates) => call('updateUser', { user_id, updates }),
  getAllUsers: () => call('getAllUsers'),
  updateBalance: (user_id, currency, amount) => call('updateBalance', { user_id, currency, amount }),
  addPoints: (user_id, points) => call('addPoints', { user_id, points }),
  createWithdrawalRequest: (d) => call('createWithdrawalRequest', d),
  getWithdrawalRequests: (status = null) => call('getWithdrawalRequests', { status }),
  updateWithdrawalStatus: (id, status, processed_by, txHash = null) => call('updateWithdrawalStatus', { id, status, processed_by, txHash }),
  recordGamePlay: (user_id, game_type) => call('recordGamePlay', { user_id, game_type }),
  getGamePlays: (user_id, game_type, date) => call('getGamePlays', { user_id, game_type, date }),
  getLeaderboard: (type = 'points', limit = 10) => call('getLeaderboard', { type, limit }),
  getTasks: (taskType = null) => call('getTasks', { taskType }),
  getUserTasks: (user_id, taskType = null) => call('getUserTasks', { user_id, taskType }),
  updateTaskProgress: (user_id, task_id, progress) => call('updateTaskProgress', { user_id, task_id, progress }),
  claimTask: (user_id, task_id) => call('claimTask', { user_id, task_id }),
  getGamesPlayedToday: (user_id) => call('getGamesPlayedToday', { user_id }),
  getMiningSessionsToday: (user_id) => call('getMiningSessionsToday', { user_id }),
  getPointsEarnedThisMonth: (user_id) => call('getPointsEarnedThisMonth', { user_id }),
  createNotification: (user_id, notificationData) => call('createNotification', { user_id, notificationData }),
  getNotifications: (user_id, isRead = null) => call('getNotifications', { user_id, isRead }),
  markNotificationAsRead: (id) => call('markNotificationAsRead', { id }),
  deleteNotification: (id) => call('deleteNotification', { id }),
  getAchievements: () => call('getAchievements'),
  getUserAchievements: (user_id) => call('getUserAchievements', { user_id }),
  unlockAchievement: (user_id, achievement_id) => call('unlockAchievement', { user_id, achievement_id }),
  logActivity: (user_id, activityData) => call('logActivity', { user_id, activityData }),
  getUserActivity: (user_id, limit = 10) => call('getUserActivity', { user_id, limit }),
  getVIPTiers: () => call('getVIPTiers'),
  getUserTier: (vipLevel) => call('getUserTier', { vipLevel }),
  recordDailyReward: (user_id, rewardData) => call('recordDailyReward', { user_id, rewardData }),
  getDailyRewards: (user_id, limit = 30) => call('getDailyRewards', { user_id, limit }),
  recordConversion: (user_id, conversionData) => call('recordConversion', { user_id, conversionData }),
  getConversionHistory: (user_id, limit = 20) => call('getConversionHistory', { user_id, limit }),
  getUserReferrals: (user_id) => call('getUserReferrals', { user_id }),
  getReferralStats: (user_id) => call('getReferralStats', { user_id }),
  recordGameAttempt: (user_id, game_type, result) => call('recordGameAttempt', { user_id, game_type, result }),
  getGameAttempts: (user_id, game_type = null, hoursAgo = 24) => call('getGameAttempts', { user_id, game_type, hoursAgo }),
  getGameStats: (user_id, game_type = null) => call('getGameStats', { user_id, game_type }),
  getUserLuckyDrawTickets: (user_id) => call('getUserLuckyDrawTickets', { user_id }),
  getCurrentPrizePool: () => call('getCurrentPrizePool'),
  getRecentLuckyDrawWinners: (limit = 10) => call('getRecentLuckyDrawWinners', { limit }),
  getRecentActivities: () => call('getRecentActivities'),
};
