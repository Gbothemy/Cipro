const { query } = require('./_db');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, ...params } = req.method === 'GET' ? req.query : req.body;

  try {
    const result = await handleAction(action, params);
    return res.status(200).json({ data: result, error: null });
  } catch (err) {
    console.error(`DB API error [${action}]:`, err.message);
    return res.status(500).json({ data: null, error: err.message });
  }
};

async function handleAction(action, p) {
  switch (action) {
    // ===== USERS =====
    case 'createUser': {
      const { user_id, username, email, avatar, is_admin, referred_by } = p;
      const r = await query(
        `INSERT INTO users (user_id,username,email,avatar,is_admin,referred_by,points,vip_level,exp,max_exp,gift_points,completed_tasks,day_streak)
         VALUES ($1,$2,$3,$4,$5,$6,0,1,0,1000,0,0,0) RETURNING *`,
        [user_id, username, email || '', avatar, is_admin || false, referred_by || null]
      );
      await query(`INSERT INTO balances (user_id,sol,eth,usdt,usdc) VALUES ($1,0,0,0,0) ON CONFLICT DO NOTHING`, [user_id]);
      return formatUser(r.rows[0]);
    }
    case 'getUser': {
      const r = await query(
        `SELECT u.*, b.sol, b.eth, b.usdt, b.usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.user_id=$1`,
        [p.user_id]
      );
      return r.rows[0] ? formatUser(r.rows[0]) : null;
    }
    case 'updateUser': {
      const { user_id, updates } = p;
      const fields = [];
      const vals = [];
      let i = 1;
      const map = {
        points:'points', vipLevel:'vip_level', exp:'exp', completedTasks:'completed_tasks',
        dayStreak:'day_streak', lastClaim:'last_claim', username:'username', email:'email',
        avatar:'avatar', last_mine_time:'last_mine_time', total_mined:'total_mined',
        mining_sessions:'mining_sessions', last_game_reset:'last_game_reset'
      };
      for (const [k, col] of Object.entries(map)) {
        if (updates[k] !== undefined) { fields.push(`${col}=$${i++}`); vals.push(updates[k]); }
      }
      if (!fields.length) return null;
      vals.push(user_id);
      const r = await query(`UPDATE users SET ${fields.join(',')} WHERE user_id=$${i} RETURNING *`, vals);
      return formatUser(r.rows[0]);
    }
    case 'getAllUsers': {
      const r = await query(
        `SELECT u.*, b.sol, b.eth, b.usdt, b.usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.is_admin=false ORDER BY u.points DESC`
      );
      return r.rows.map(formatUser);
    }
    case 'updateBalance': {
      const r = await query(
        `UPDATE balances SET ${p.currency}=$1 WHERE user_id=$2 RETURNING *`,
        [p.amount, p.user_id]
      );
      return r.rows[0];
    }
    case 'addPoints': {
      const r = await query(
        `UPDATE users SET points=points+$1 WHERE user_id=$2 RETURNING *`,
        [p.points, p.user_id]
      );
      return formatUser(r.rows[0]);
    }

    // ===== WITHDRAWALS =====
    case 'createWithdrawalRequest': {
      const d = p;
      const r = await query(
        `INSERT INTO withdrawal_requests (id,user_id,username,currency,amount,wallet_address,network,memo,network_fee,net_amount,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [d.id,d.user_id,d.username,d.currency,d.amount,d.wallet_address,d.network||null,d.memo||null,d.network_fee||0,d.net_amount||d.amount,d.status||'pending']
      );
      return r.rows[0];
    }
    case 'getWithdrawalRequests': {
      const sql = p.status
        ? `SELECT * FROM withdrawal_requests WHERE status=$1 ORDER BY request_date DESC`
        : `SELECT * FROM withdrawal_requests ORDER BY request_date DESC`;
      const r = await query(sql, p.status ? [p.status] : []);
      return r.rows;
    }
    case 'updateWithdrawalStatus': {
      const r = await query(
        `UPDATE withdrawal_requests SET status=$1,processed_date=NOW(),processed_by=$2,transaction_hash=$3 WHERE id=$4 RETURNING *`,
        [p.status, p.processed_by, p.txHash||null, p.id]
      );
      return r.rows[0];
    }

    // ===== GAME PLAYS =====
    case 'recordGamePlay': {
      const today = new Date().toISOString().split('T')[0];
      const ex = await query(`SELECT * FROM game_plays WHERE user_id=$1 AND game_type=$2 AND play_date=$3`, [p.user_id, p.game_type, today]);
      if (ex.rows[0]) {
        const r = await query(`UPDATE game_plays SET plays_count=plays_count+1 WHERE id=$1 RETURNING *`, [ex.rows[0].id]);
        return r.rows[0];
      }
      const r = await query(`INSERT INTO game_plays (user_id,game_type,play_date,plays_count) VALUES ($1,$2,$3,1) RETURNING *`, [p.user_id, p.game_type, today]);
      return r.rows[0];
    }
    case 'getGamePlays': {
      const r = await query(`SELECT * FROM game_plays WHERE user_id=$1 AND game_type=$2 AND play_date=$3`, [p.user_id, p.game_type, p.date]);
      return r.rows[0] || { plays_count: 0 };
    }

    // ===== LEADERBOARD =====
    case 'getLeaderboard': {
      const limit = p.limit || 10;
      if (p.type === 'earnings') {
        const r = await query(`SELECT u.user_id,u.username,u.avatar,b.sol,b.eth,b.usdt,b.usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.is_admin=false`, []);
        return r.rows.map(u => ({
          ...u,
          total_earnings: (u.sol||0)*100 + (u.eth||0)*2000 + (u.usdt||0) + (u.usdc||0)
        })).sort((a,b) => b.total_earnings - a.total_earnings).slice(0, limit);
      }
      if (p.type === 'streak') {
        const r = await query(`SELECT user_id,username,avatar,day_streak,points FROM users WHERE is_admin=false ORDER BY day_streak DESC LIMIT $1`, [limit]);
        return r.rows;
      }
      const r = await query(`SELECT user_id,username,avatar,points,vip_level FROM users WHERE is_admin=false ORDER BY points DESC LIMIT $1`, [limit]);
      return r.rows;
    }

    // ===== TASKS =====
    case 'getTasks': {
      const r = p.taskType
        ? await query(`SELECT * FROM tasks WHERE is_active=true AND task_type=$1`, [p.taskType])
        : await query(`SELECT * FROM tasks WHERE is_active=true`);
      return r.rows;
    }
    case 'getUserTasks': {
      const r = await query(`SELECT ut.*, t.* FROM user_tasks ut JOIN tasks t ON t.id=ut.task_id WHERE ut.user_id=$1`, [p.user_id]);
      return r.rows;
    }
    case 'updateTaskProgress': {
      const today = new Date().toISOString().split('T')[0];
      const ex = await query(`SELECT * FROM user_tasks WHERE user_id=$1 AND task_id=$2 AND reset_date=$3`, [p.user_id, p.task_id, today]);
      if (ex.rows[0]) {
        const r = await query(`UPDATE user_tasks SET progress=$1 WHERE id=$2 RETURNING *`, [p.progress, ex.rows[0].id]);
        return r.rows[0];
      }
      const r = await query(`INSERT INTO user_tasks (user_id,task_id,progress,reset_date) VALUES ($1,$2,$3,$4) RETURNING *`, [p.user_id, p.task_id, p.progress, today]);
      return r.rows[0];
    }
    case 'claimTask': {
      const today = new Date().toISOString().split('T')[0];
      const r = await query(`UPDATE user_tasks SET is_claimed=true,claimed_at=NOW() WHERE user_id=$1 AND task_id=$2 AND reset_date=$3 RETURNING *`, [p.user_id, p.task_id, today]);
      return r.rows[0];
    }
    case 'getGamesPlayedToday': {
      const today = new Date().toISOString().split('T')[0];
      const r = await query(`SELECT COUNT(*) FROM game_attempts WHERE user_id=$1 AND created_at>=$2 AND created_at<$3`, [p.user_id, today+'T00:00:00', today+'T23:59:59']);
      return parseInt(r.rows[0].count) || 0;
    }
    case 'getMiningSessionsToday': {
      const today = new Date().toISOString().split('T')[0];
      const r = await query(`SELECT last_mine_time FROM users WHERE user_id=$1`, [p.user_id]);
      if (!r.rows[0]?.last_mine_time) return 0;
      return new Date(r.rows[0].last_mine_time).toISOString().split('T')[0] === today ? 1 : 0;
    }
    case 'getPointsEarnedThisMonth': {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const r = await query(`SELECT COALESCE(SUM(points_change),0) as total FROM user_activity_log WHERE user_id=$1 AND created_at>=$2 AND points_change>0`, [p.user_id, startOfMonth]);
      return parseInt(r.rows[0].total) || 0;
    }

    // ===== NOTIFICATIONS =====
    case 'createNotification': {
      const r = await query(
        `INSERT INTO notifications (user_id,notification_type,title,message,icon) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [p.user_id, p.notificationData.type, p.notificationData.title, p.notificationData.message, p.notificationData.icon]
      );
      return r.rows[0];
    }
    case 'getNotifications': {
      const sql = p.isRead !== null && p.isRead !== undefined
        ? `SELECT * FROM notifications WHERE user_id=$1 AND is_read=$2 ORDER BY created_at DESC`
        : `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC`;
      const r = await query(sql, p.isRead !== null && p.isRead !== undefined ? [p.user_id, p.isRead] : [p.user_id]);
      return r.rows;
    }
    case 'markNotificationAsRead': {
      const r = await query(`UPDATE notifications SET is_read=true WHERE id=$1 RETURNING *`, [p.id]);
      return r.rows[0];
    }
    case 'deleteNotification': {
      await query(`DELETE FROM notifications WHERE id=$1`, [p.id]);
      return true;
    }

    // ===== ACHIEVEMENTS =====
    case 'getAchievements': {
      const r = await query(`SELECT * FROM achievements WHERE is_active=true`);
      return r.rows;
    }
    case 'getUserAchievements': {
      const r = await query(`SELECT ua.*, a.* FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=$1`, [p.user_id]);
      return r.rows;
    }
    case 'unlockAchievement': {
      const r = await query(`INSERT INTO user_achievements (user_id,achievement_id) VALUES ($1,$2) RETURNING *`, [p.user_id, p.achievement_id]);
      return r.rows[0];
    }

    // ===== ACTIVITY LOG =====
    case 'logActivity': {
      const r = await query(
        `INSERT INTO user_activity_log (user_id,activity_type,activity_description,points_change) VALUES ($1,$2,$3,$4) RETURNING *`,
        [p.user_id, p.activityData.type, p.activityData.description, p.activityData.pointsChange||0]
      );
      return r.rows[0];
    }
    case 'getUserActivity': {
      const r = await query(`SELECT * FROM user_activity_log WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`, [p.user_id, p.limit||10]);
      return r.rows;
    }

    // ===== VIP TIERS =====
    case 'getVIPTiers': {
      const r = await query(`SELECT * FROM vip_tiers ORDER BY min_level ASC`);
      return r.rows;
    }
    case 'getUserTier': {
      const r = await query(`SELECT * FROM vip_tiers WHERE min_level<=$1 AND max_level>=$1`, [p.vipLevel]);
      return r.rows[0] || null;
    }

    // ===== DAILY REWARDS =====
    case 'recordDailyReward': {
      const today = new Date().toISOString().split('T')[0];
      const r = await query(
        `INSERT INTO daily_rewards (user_id,claim_date,points_earned,sol_earned,eth_earned,usdt_earned,usdc_earned,streak_day) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [p.user_id, today, p.rewardData.points, p.rewardData.sol||0, p.rewardData.eth||0, p.rewardData.usdt||0, p.rewardData.usdc||0, p.rewardData.streakDay]
      );
      return r.rows[0];
    }
    case 'getDailyRewards': {
      const r = await query(`SELECT * FROM daily_rewards WHERE user_id=$1 ORDER BY claim_date DESC LIMIT $2`, [p.user_id, p.limit||30]);
      return r.rows;
    }

    // ===== CONVERSION =====
    case 'recordConversion': {
      const r = await query(
        `INSERT INTO conversion_history (user_id,points_converted,currency,amount_received,conversion_rate) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [p.user_id, p.conversionData.points, p.conversionData.currency, p.conversionData.amount, p.conversionData.rate]
      );
      return r.rows[0];
    }
    case 'getConversionHistory': {
      const r = await query(`SELECT * FROM conversion_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`, [p.user_id, p.limit||20]);
      return r.rows;
    }

    // ===== REVENUE =====
    case 'recordRevenue': {
      const r = await query(
        `INSERT INTO revenue_transactions (user_id,transaction_type,revenue_source,amount,fee_percentage,original_amount,description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [p.revenueData.user_id, p.revenueData.type, p.revenueData.source, p.revenueData.amount, p.revenueData.feePercentage, p.revenueData.originalAmount, p.revenueData.description]
      );
      return r.rows[0];
    }
    case 'getCompanyWallet': {
      const r = await query(`SELECT * FROM company_wallet LIMIT 1`);
      return r.rows[0] || null;
    }
    case 'updateCompanyWallet': {
      const w = await query(`SELECT * FROM company_wallet LIMIT 1`);
      if (!w.rows[0]) {
        await query(`INSERT INTO company_wallet (sol_balance,eth_balance,usdt_balance,usdc_balance,total_points_collected) VALUES ($1,$2,$3,$4,$5)`,
          [p.currency==='sol'?p.amount:0, p.currency==='eth'?p.amount:0, p.currency==='usdt'?p.amount:0, p.currency==='usdc'?p.amount:0, p.currency==='points'?p.amount:0]);
      } else {
        const col = {sol:'sol_balance',eth:'eth_balance',usdt:'usdt_balance',usdc:'usdc_balance',points:'total_points_collected'}[p.currency];
        if (col) await query(`UPDATE company_wallet SET ${col}=${col}+$1 WHERE id=$2`, [p.amount, w.rows[0].id]);
      }
      return true;
    }
    case 'getRevenueStats': {
      let sql = `SELECT * FROM revenue_transactions WHERE 1=1`;
      const vals = [];
      if (p.startDate) { vals.push(p.startDate); sql += ` AND created_at>=$${vals.length}`; }
      if (p.endDate) { vals.push(p.endDate); sql += ` AND created_at<=$${vals.length}`; }
      sql += ` ORDER BY created_at DESC`;
      const r = await query(sql, vals);
      return r.rows;
    }
    case 'recordTrafficRevenue': {
      const today = new Date().toISOString().split('T')[0];
      const ex = await query(`SELECT * FROM traffic_revenue WHERE date=$1`, [today]);
      if (ex.rows[0]) {
        const r = await query(
          `UPDATE traffic_revenue SET page_views=page_views+$1,unique_visitors=unique_visitors+$2,ad_impressions=ad_impressions+$3,ad_clicks=ad_clicks+$4,estimated_revenue=estimated_revenue+$5 WHERE id=$6 RETURNING *`,
          [p.trafficData.pageViews||0, p.trafficData.uniqueVisitors||0, p.trafficData.adImpressions||0, p.trafficData.adClicks||0, p.trafficData.revenue||0, ex.rows[0].id]
        );
        return r.rows[0];
      }
      const r = await query(
        `INSERT INTO traffic_revenue (date,page_views,unique_visitors,ad_impressions,ad_clicks,estimated_revenue) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [today, p.trafficData.pageViews||0, p.trafficData.uniqueVisitors||0, p.trafficData.adImpressions||0, p.trafficData.adClicks||0, p.trafficData.revenue||0]
      );
      return r.rows[0];
    }
    case 'getTrafficRevenue': {
      let sql = `SELECT * FROM traffic_revenue WHERE 1=1`;
      const vals = [];
      if (p.startDate) { vals.push(p.startDate.split('T')[0]); sql += ` AND date>=$${vals.length}`; }
      if (p.endDate) { vals.push(p.endDate.split('T')[0]); sql += ` AND date<=$${vals.length}`; }
      sql += ` ORDER BY date DESC`;
      const r = await query(sql, vals);
      return r.rows;
    }
    case 'recordUserSession': {
      const r = await query(
        `INSERT INTO user_sessions (user_id,session_id,ip_address,user_agent,page_views,duration_seconds,ad_impressions,ad_clicks,revenue_generated) VALUES ($1,$2,$3,$4,1,0,0,0,0) RETURNING *`,
        [p.sessionData.userId, p.sessionData.sessionId, p.sessionData.ipAddress, p.sessionData.userAgent]
      );
      return r.rows[0] || null;
    }
    case 'updateUserSession': {
      const r = await query(
        `UPDATE user_sessions SET page_views=$1,duration_seconds=$2,ad_impressions=$3,ad_clicks=$4,revenue_generated=$5,last_activity=NOW() WHERE session_id=$6 RETURNING *`,
        [p.sessionData.pageViews, p.sessionData.duration, p.sessionData.adImpressions, p.sessionData.adClicks, p.sessionData.revenueGenerated, p.sessionId]
      );
      return r.rows[0] || null;
    }

    // ===== REFERRALS =====
    case 'getUserReferrals': {
      const r = await query(
        `SELECT u.user_id,u.username,u.avatar,u.created_at,u.last_login,u.points,b.sol,b.eth,b.usdt,b.usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.referred_by=$1 ORDER BY u.created_at DESC`,
        [p.user_id]
      );
      return r.rows.map(u => ({
        id: u.user_id, userId: u.user_id, name: u.username, avatar: u.avatar,
        joined: u.created_at, lastActive: u.last_login,
        active: u.last_login ? new Date(u.last_login) > new Date(Date.now() - 7*24*60*60*1000) : false,
        points: u.points||0, sol: u.sol||0, eth: u.eth||0, usdt: u.usdt||0, usdc: u.usdc||0
      }));
    }
    case 'getReferrer': {
      const ur = await query(`SELECT referred_by FROM users WHERE user_id=$1`, [p.user_id]);
      if (!ur.rows[0]?.referred_by) return null;
      const r = await query(`SELECT user_id,username,avatar,created_at,vip_level FROM users WHERE user_id=$1`, [ur.rows[0].referred_by]);
      if (!r.rows[0]) return null;
      return { userId: r.rows[0].user_id, username: r.rows[0].username, avatar: r.rows[0].avatar, joinedDate: r.rows[0].created_at, vipLevel: r.rows[0].vip_level||1 };
    }
    case 'getReferralStats': {
      const refs = await query(`SELECT u.user_id,b.sol,b.eth,b.usdt,b.usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.referred_by=$1`, [p.user_id]);
      const totalReferrals = refs.rows.length;
      const totalEarnings = refs.rows.reduce((acc, r) => ({
        sol: acc.sol + (r.sol||0)*0.1, eth: acc.eth + (r.eth||0)*0.1,
        usdt: acc.usdt + (r.usdt||0)*0.1, usdc: acc.usdc + (r.usdc||0)*0.1
      }), { sol:0, eth:0, usdt:0, usdc:0 });
      const active = await query(`SELECT user_id FROM users WHERE referred_by=$1 AND last_login>=$2`, [p.user_id, new Date(Date.now()-7*24*60*60*1000).toISOString()]);
      return { totalReferrals, activeReferrals: active.rows.length, totalEarnings };
    }
    case 'getRecentActivities': return [];

    // ===== SUBSCRIPTIONS =====
    case 'createSubscription': {
      const r = await query(
        `INSERT INTO subscriptions (user_id,vip_tier,billing_cycle,price,payment_method,payment_id,status,start_date,end_date) VALUES ($1,$2,$3,$4,$5,$6,'active',NOW(),NOW()+INTERVAL '1 month') RETURNING id`,
        [p.subscriptionData.user_id, p.subscriptionData.vip_tier, p.subscriptionData.billing_cycle, p.subscriptionData.price, p.subscriptionData.payment_method, p.subscriptionData.payment_id]
      );
      return { success: true, subscription_id: r.rows[0]?.id };
    }
    case 'getUserSubscription': {
      const r = await query(`SELECT * FROM subscriptions WHERE user_id=$1 AND status='active' LIMIT 1`, [p.user_id]);
      return r.rows[0] || null;
    }
    case 'hasActiveSubscription': {
      const r = await query(`SELECT 1 FROM subscriptions WHERE user_id=$1 AND status='active' LIMIT 1`, [p.user_id]);
      return r.rows.length > 0;
    }
    case 'getSubscriptionTier': {
      const r = await query(`SELECT vip_tier FROM subscriptions WHERE user_id=$1 AND status='active' LIMIT 1`, [p.user_id]);
      return r.rows[0]?.vip_tier || 1;
    }
    case 'cancelSubscription': {
      await query(`UPDATE subscriptions SET status='cancelled',cancelled_at=NOW(),cancel_reason=$1 WHERE user_id=$2 AND status='active'`, [p.reason||null, p.user_id]);
      return { success: true };
    }
    case 'getSubscriptionHistory': {
      const r = await query(`SELECT * FROM subscription_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`, [p.user_id, p.limit||10]);
      return r.rows;
    }
    case 'recordPaymentTransaction': {
      const d = p.transactionData;
      const r = await query(
        `INSERT INTO payment_transactions (user_id,subscription_id,transaction_type,amount,currency,payment_method,payment_id,payment_status,payment_date,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [d.user_id,d.subscription_id,d.transaction_type,d.amount,d.currency||'USD',d.payment_method,d.payment_id,d.payment_status||'pending',d.payment_date||new Date().toISOString(),JSON.stringify(d.metadata||{})]
      );
      return { success: true, data: r.rows[0] };
    }
    case 'getActiveSubscriptions': {
      const r = await query(`SELECT * FROM subscriptions WHERE status='active' ORDER BY created_at DESC`);
      return r.rows;
    }
    case 'getSubscriptionRevenue': {
      let sql = `SELECT * FROM subscription_revenue WHERE 1=1`;
      const vals = [];
      if (p.startDate) { vals.push(p.startDate); sql += ` AND date>=$${vals.length}`; }
      if (p.endDate) { vals.push(p.endDate); sql += ` AND date<=$${vals.length}`; }
      sql += ` ORDER BY date DESC`;
      const r = await query(sql, vals);
      return r.rows;
    }

    // ===== DEPOSITS =====
    case 'createDepositRequest': {
      const d = p;
      const r = await query(
        `INSERT INTO deposit_requests (id,user_id,username,currency,amount,wallet_address,status,deposit_type,subscription_tier,billing_cycle,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *`,
        [d.id,d.user_id,d.username,d.currency,d.amount,d.wallet_address,d.status||'pending',d.deposit_type||'balance',d.subscription_tier||null,d.billing_cycle||null]
      );
      return { success: true, data: r.rows[0] };
    }
    case 'getDepositRequests': {
      const sql = p.status
        ? `SELECT * FROM deposit_requests WHERE status=$1 ORDER BY created_at DESC`
        : `SELECT * FROM deposit_requests ORDER BY created_at DESC`;
      const r = await query(sql, p.status ? [p.status] : []);
      return r.rows;
    }
    case 'updateDepositStatus': {
      const r = await query(
        `UPDATE deposit_requests SET status=$1,processed_date=NOW(),processed_by=$2 WHERE id=$3 RETURNING *`,
        [p.status, p.processed_by||null, p.id]
      );
      return { success: true, data: r.rows[0] };
    }

    // ===== GAME ATTEMPTS =====
    case 'recordGameAttempt': {
      const r = await query(
        `INSERT INTO game_attempts (user_id,game_type,won,score,difficulty,created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
        [p.user_id, p.game_type, p.result?.won||false, p.result?.score||0, p.result?.difficulty||'normal']
      );
      return { success: true, data: r.rows[0] };
    }
    case 'getGameAttempts': {
      const timeAgo = new Date(Date.now() - (p.hoursAgo||24)*60*60*1000).toISOString();
      const sql = p.game_type
        ? `SELECT * FROM game_attempts WHERE user_id=$1 AND created_at>=$2 AND game_type=$3 ORDER BY created_at ASC`
        : `SELECT * FROM game_attempts WHERE user_id=$1 AND created_at>=$2 ORDER BY created_at ASC`;
      const r = await query(sql, p.game_type ? [p.user_id, timeAgo, p.game_type] : [p.user_id, timeAgo]);
      return r.rows;
    }
    case 'getGameStats': {
      const sql = p.game_type
        ? `SELECT * FROM game_attempts WHERE user_id=$1 AND game_type=$2`
        : `SELECT * FROM game_attempts WHERE user_id=$1`;
      const r = await query(sql, p.game_type ? [p.user_id, p.game_type] : [p.user_id]);
      const total = r.rows.length;
      const won = r.rows.filter(g => g.won).length;
      const score = r.rows.reduce((s, g) => s + (g.score||0), 0);
      return { totalGames: total, gamesWon: won, gamesLost: total-won, totalScore: score, winRate: total>0?((won/total)*100).toFixed(1):0, averageScore: total>0?Math.round(score/total):0 };
    }

    // ===== LUCKY DRAW =====
    case 'getUserLuckyDrawTickets': {
      const r = await query(`SELECT COUNT(*) FROM lucky_draw_tickets WHERE user_id=$1 AND is_used=false`, [p.user_id]);
      return parseInt(r.rows[0].count) || 0;
    }
    case 'getCurrentPrizePool': {
      const r = await query(`SELECT * FROM lucky_draw_prize_pool ORDER BY created_at DESC LIMIT 1`);
      if (!r.rows[0]) {
        const ins = await query(`INSERT INTO lucky_draw_prize_pool (cipro,usdt,vip_upgrade) VALUES (50000,20,true) RETURNING *`);
        const pool = ins.rows[0];
        return { cipro: pool.cipro||50000, usdt: pool.usdt||20, vipUpgrade: pool.vip_upgrade||true, totalTickets: 0 };
      }
      const tickets = await query(`SELECT COUNT(*) FROM lucky_draw_tickets WHERE is_used=false`);
      return { cipro: r.rows[0].cipro||50000, usdt: r.rows[0].usdt||20, vipUpgrade: r.rows[0].vip_upgrade||true, totalTickets: parseInt(tickets.rows[0].count)||0 };
    }
    case 'updatePrizePool': {
      const pool = await query(`SELECT * FROM lucky_draw_prize_pool ORDER BY created_at DESC LIMIT 1`);
      const ciproInc = Math.floor((p.usdtContribution||0) * 1000);
      const usdtInc = (p.usdtContribution||0) * 0.1;
      if (!pool.rows[0]) {
        await query(`INSERT INTO lucky_draw_prize_pool (cipro,usdt,vip_upgrade) VALUES ($1,$2,true)`, [50000+ciproInc, 20+usdtInc]);
      } else {
        await query(`UPDATE lucky_draw_prize_pool SET cipro=cipro+$1,usdt=usdt+$2 WHERE id=$3`, [ciproInc, usdtInc, pool.rows[0].id]);
      }
      return true;
    }
    case 'getRecentLuckyDrawWinners': {
      const r = await query(
        `SELECT w.*,u.username,u.avatar FROM lucky_draw_winners w LEFT JOIN users u ON u.user_id=w.user_id ORDER BY w.created_at DESC LIMIT $1`,
        [p.limit||10]
      );
      return r.rows.map(w => ({ user_id: w.user_id, username: w.username||'Anonymous', avatar: w.avatar||'👤', draw_date: w.draw_date, sol_won: w.sol_won||0, eth_won: w.eth_won||0, usdt_won: w.usdt_won||0, usdc_won: w.usdc_won||0, points_won: w.points_won||0 }));
    }
    case 'createLuckyDrawPayment': {
      const d = p.paymentData;
      const r = await query(
        `INSERT INTO lucky_draw_payments (id,user_id,username,payment_type,currency,amount,ticket_quantity,wallet_address,transaction_hash,network,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
        [d.id,d.user_id,d.username,d.payment_type,d.currency,d.amount,d.ticket_quantity,d.wallet_address,d.transaction_hash,d.network,d.status||'pending']
      );
      return { success: true, data: r.rows[0] };
    }
    case 'getUserLuckyDrawPayments': {
      const r = await query(`SELECT * FROM lucky_draw_payments WHERE user_id=$1 ORDER BY created_at DESC`, [p.user_id]);
      return r.rows;
    }
    case 'getAllLuckyDrawPayments': {
      const sql = p.status
        ? `SELECT * FROM lucky_draw_payments WHERE status=$1 ORDER BY created_at DESC LIMIT $2`
        : `SELECT * FROM lucky_draw_payments ORDER BY created_at DESC LIMIT $1`;
      const r = await query(sql, p.status ? [p.status, p.limit||50] : [p.limit||50]);
      return r.rows;
    }
    case 'participateInLuckyDraw': {
      const tickets = await query(`SELECT * FROM lucky_draw_tickets WHERE user_id=$1 AND is_used=false`, [p.user_id]);
      if (!tickets.rows.length) throw new Error('No tickets available');
      const allTickets = await query(`SELECT COUNT(*) FROM lucky_draw_tickets WHERE is_used=false`);
      const totalTickets = parseInt(allTickets.rows[0].count) || 0;
      const userTickets = tickets.rows.length;
      const winProbability = userTickets / totalTickets;
      const won = Math.random() < winProbability;
      await query(`UPDATE lucky_draw_tickets SET is_used=true WHERE user_id=$1 AND is_used=false`, [p.user_id]);
      if (won) {
        const pool = await query(`SELECT * FROM lucky_draw_prize_pool ORDER BY created_at DESC LIMIT 1`);
        const pr = pool.rows[0] || { usdt: 20, cipro: 50000 };
        const winPct = Math.min(winProbability * 2, 0.5);
        const winnings = { usdt: (pr.usdt||0) * winPct, cipro: Math.floor((pr.cipro||0) * winPct) };
        await query(`UPDATE balances SET usdt=usdt+$1 WHERE user_id=$2`, [winnings.usdt, p.user_id]);
        await query(`UPDATE users SET points=points+$1 WHERE user_id=$2`, [winnings.cipro, p.user_id]);
        if (pool.rows[0]) await query(`UPDATE lucky_draw_prize_pool SET usdt=usdt-$1,cipro=cipro-$2 WHERE id=$3`, [winnings.usdt, winnings.cipro, pool.rows[0].id]);
        await query(`INSERT INTO lucky_draw_winners (user_id,draw_date,usdt_won,points_won,tickets_used,total_tickets) VALUES ($1,NOW(),$2,$3,$4,$5)`, [p.user_id, winnings.usdt, winnings.cipro, userTickets, totalTickets]);
        return { won: true, winnings };
      }
      return { won: false, winnings: null };
    }
    case 'updateLuckyDrawPaymentStatus': {
      const r = await query(
        `UPDATE lucky_draw_payments SET status=$1,processed_date=NOW(),processed_by=$2 WHERE id=$3 RETURNING *`,
        [p.status, p.processedBy||null, p.paymentId]
      );
      if (p.status === 'approved' && r.rows[0]) {
        const pmt = r.rows[0];
        const tickets = Array.from({ length: pmt.ticket_quantity }, () => ({ user_id: pmt.user_id }));
        for (const t of tickets) {
          await query(`INSERT INTO lucky_draw_tickets (user_id,is_used) VALUES ($1,false)`, [t.user_id]);
        }
      }
      return { success: true, data: r.rows[0] };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function formatUser(u) {
  if (!u) return null;
  return {
    userId: u.user_id, username: u.username, email: u.email, avatar: u.avatar,
    isAdmin: u.is_admin, points: u.points||0, vipLevel: u.vip_level||1,
    exp: u.exp||0, maxExp: u.max_exp||1000, giftPoints: u.gift_points||0,
    completedTasks: u.completed_tasks||0, dayStreak: u.day_streak||0,
    lastClaim: u.last_claim, last_mine_time: u.last_mine_time,
    last_game_reset: u.last_game_reset, total_mined: u.total_mined||0,
    mining_sessions: u.mining_sessions||0,
    balance: { sol: u.sol||0, eth: u.eth||0, usdt: u.usdt||0, usdc: u.usdc||0 },
    totalEarnings: { sol: u.sol||0, eth: u.eth||0, usdt: u.usdt||0, usdc: u.usdc||0 },
  };
}
