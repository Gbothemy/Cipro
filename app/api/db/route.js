import { NextResponse } from 'next/server';
import { query, healthCheck } from '../../../lib/db';
import cache from '../../../lib/cache';
import { getMockData } from '../../../lib/mockData';

// Force mock data if database is not configured or USE_MOCK_DATA is set
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'health') {
    const health = await healthCheck();
    return NextResponse.json(health);
  }

  return NextResponse.json({ error: 'Use POST for database operations' }, { status: 405 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    if (!action) {
      return NextResponse.json({ data: null, error: 'Action is required' }, { status: 400 });
    }

    // Log environment info for debugging
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not set - using mock data');
    }

    // Try database first, fallback to mock data if unavailable
    let result;
    let usedMockData = false;
    
    try {
      result = await handleAction(action, params);
    } catch (dbError) {
      console.error(`Database error for action ${action}:`, {
        message: dbError.message,
        code: dbError.code,
        hint: dbError.hint
      });
      
      if (USE_MOCK_DATA || shouldUseMockData(dbError)) {
        console.log(`📦 Using mock data for action: ${action}`);
        result = getMockData(action, params);
        usedMockData = true;
        
        if (result === null) {
          // Mock data not available for this action
          throw new Error(`Database unavailable and no mock data for action: ${action}`);
        }
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({ 
      data: result, 
      error: null,
      _meta: usedMockData ? { source: 'mock', warning: 'Using mock data - DATABASE_URL not configured' } : { source: 'database' }
    });
  } catch (err) {
    console.error('❌ API error:', {
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      databaseConfigured: !!process.env.DATABASE_URL
    });
    
    return NextResponse.json(
      { 
        data: null, 
        error: err.message || 'Internal server error',
        hint: !process.env.DATABASE_URL ? 'DATABASE_URL environment variable is not set. Add it in Vercel Dashboard → Settings → Environment Variables' : undefined
      },
      { status: 500 }
    );
  }
}

function shouldUseMockData(error) {
  const mockDataErrors = [
    'relation',
    'does not exist',
    'connect',
    'ECONNREFUSED',
    'ENOTFOUND',
    'timeout',
    'no pg_hba.conf entry',
    'database',
    'connection',
    'ETIMEDOUT',
    'ECONNRESET',
    'password authentication failed',
    'could not connect',
    'server closed the connection',
  ];
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return mockDataErrors.some(err => 
    errorMessage.includes(err.toLowerCase()) || 
    errorCode.includes(err.toLowerCase())
  );
}

async function handleAction(action, p) {
  switch (action) {
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
      const cacheKey = 'all-users';
      const cached = cache.get(cacheKey);
      if (cached) return cached;
      
      const r = await query(
        `SELECT u.*, b.sol, b.eth, b.usdt, b.usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.is_admin=false ORDER BY u.points DESC`
      );
      const users = r.rows.map(formatUser);
      cache.set(cacheKey, users, 300);
      return users;
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
      // Invalidate caches
      cache.delete('all-users');
      cache.delete('leaderboard-points-10');
      cache.delete('leaderboard-points-50');
      return formatUser(r.rows[0]);
    }
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
    case 'getLeaderboard': {
      const limit = p.limit || 10;
      const cacheKey = `leaderboard-${p.type || 'points'}-${limit}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) return cached;
      
      let result;
      if (p.type === 'earnings') {
        const r = await query(`SELECT u.user_id,u.username,u.avatar,b.sol,b.eth,b.usdt,b.usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.is_admin=false`);
        result = r.rows.map(u => ({
          ...u, total_earnings: (u.sol||0)*100 + (u.eth||0)*2000 + (u.usdt||0) + (u.usdc||0)
        })).sort((a,b) => b.total_earnings - a.total_earnings).slice(0, limit);
      } else if (p.type === 'streak') {
        const r = await query(`SELECT user_id,username,avatar,day_streak,points FROM users WHERE is_admin=false ORDER BY day_streak DESC LIMIT $1`, [limit]);
        result = r.rows;
      } else {
        const r = await query(`SELECT user_id,username,avatar,points,vip_level FROM users WHERE is_admin=false ORDER BY points DESC LIMIT $1`, [limit]);
        result = r.rows;
      }
      
      // Cache for 5 minutes
      cache.set(cacheKey, result, 300);
      return result;
    }
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
      // First ensure the task exists in user_tasks
      const ex = await query(`SELECT * FROM user_tasks WHERE user_id=$1 AND task_id=$2 AND reset_date=$3`, [p.user_id, p.task_id, today]);
      if (ex.rows[0]) {
        // Update existing task
        const r = await query(`UPDATE user_tasks SET is_claimed=true,claimed_at=NOW() WHERE id=$1 RETURNING *`, [ex.rows[0].id]);
        return r.rows[0];
      } else {
        // Create and claim in one go
        const r = await query(`INSERT INTO user_tasks (user_id,task_id,progress,is_claimed,claimed_at,reset_date) VALUES ($1,$2,$3,true,NOW(),$4) RETURNING *`, [p.user_id, p.task_id, p.progress || 0, today]);
        return r.rows[0];
      }
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
    case 'getActiveMiningCount': {
      // Check if user has an active mining session (within last 8 hours)
      const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
      const r = await query(`SELECT last_mine_time FROM users WHERE user_id=$1`, [p.user_id]);
      if (!r.rows[0]?.last_mine_time) return 0;
      const lastMineTime = new Date(r.rows[0].last_mine_time);
      return lastMineTime > new Date(eightHoursAgo) ? 1 : 0;
    }
    case 'recordMiningSession': {
      const now = new Date().toISOString();
      await query(`UPDATE users SET last_mine_time=$1 WHERE user_id=$2`, [now, p.user_id]);
      await query(
        `INSERT INTO user_activity_log (user_id, activity_type, points_change, description) VALUES ($1, $2, $3, $4)`,
        [p.user_id, 'mining', p.points_earned, `Completed 8-hour mining session and earned ${p.points_earned} points`]
      );
      return { success: true, timestamp: now };
    }
    case 'getPointsEarnedThisMonth': {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const r = await query(`SELECT COALESCE(SUM(points_change),0) as total FROM user_activity_log WHERE user_id=$1 AND created_at>=$2 AND points_change>0`, [p.user_id, startOfMonth]);
      return parseInt(r.rows[0].total) || 0;
    }
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
    case 'getVIPTiers': {
      const r = await query(`SELECT * FROM vip_tiers ORDER BY min_level ASC`);
      return r.rows;
    }
    case 'getUserTier': {
      const r = await query(`SELECT * FROM vip_tiers WHERE min_level<=$1 AND max_level>=$1`, [p.vipLevel]);
      return r.rows[0] || null;
    }
    case 'validateStreak': {
      // Called on every login - checks if streak is still valid or should be reset
      const r = await query(`SELECT day_streak, last_claim FROM users WHERE user_id=$1`, [p.user_id]);
      if (!r.rows[0]) return { dayStreak: 0, reset: false };

      const { day_streak, last_claim } = r.rows[0];

      if (!last_claim) {
        // Never claimed - streak stays at 0
        return { dayStreak: 0, reset: false };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const lastClaimDate = new Date(last_claim).toISOString().split('T')[0];
      const yesterday = new Date(now - 86400000).toISOString().split('T')[0];

      // Streak is valid if last claim was today or yesterday
      const isValid = lastClaimDate === today || lastClaimDate === yesterday;

      if (!isValid && day_streak > 0) {
        // Streak broken - reset to 0
        await query(`UPDATE users SET day_streak=0 WHERE user_id=$1`, [p.user_id]);
        return { dayStreak: 0, reset: true };
      }

      return { dayStreak: day_streak || 0, reset: false };
    }
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
    case 'getUserReferrals': {
      const r = await query(
        `SELECT u.user_id,u.username,u.avatar,u.created_at,u.last_login,u.points FROM users u WHERE u.referred_by=$1 ORDER BY u.created_at DESC`,
        [p.user_id]
      );
      return r.rows.map(u => ({
        id: u.user_id, userId: u.user_id, name: u.username, avatar: u.avatar,
        joined: u.created_at, lastActive: u.last_login, points: u.points||0,
        active: u.last_login ? new Date(u.last_login) > new Date(Date.now() - 7*24*60*60*1000) : false,
      }));
    }
    case 'getReferralStats': {
      const refs = await query(`SELECT user_id FROM users WHERE referred_by=$1`, [p.user_id]);
      const active = await query(`SELECT user_id FROM users WHERE referred_by=$1 AND last_login>=$2`, [p.user_id, new Date(Date.now()-7*24*60*60*1000).toISOString()]);
      return { totalReferrals: refs.rows.length, activeReferrals: active.rows.length, totalEarnings: { sol:0, eth:0, usdt:0, usdc:0 } };
    }
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
    case 'getUserLuckyDrawTickets': {
      const r = await query(`SELECT COUNT(*) FROM lucky_draw_tickets WHERE user_id=$1 AND is_used=false`, [p.user_id]);
      return parseInt(r.rows[0].count) || 0;
    }
    case 'getCurrentPrizePool': {
      const r = await query(`SELECT * FROM lucky_draw_prize_pool ORDER BY created_at DESC LIMIT 1`);
      if (!r.rows[0]) {
        const ins = await query(`INSERT INTO lucky_draw_prize_pool (cipro,usdt,vip_upgrade) VALUES (50000,20,true) RETURNING *`);
        return { cipro: ins.rows[0].cipro||50000, usdt: ins.rows[0].usdt||20, vipUpgrade: true, totalTickets: 0 };
      }
      const tickets = await query(`SELECT COUNT(*) FROM lucky_draw_tickets WHERE is_used=false`);
      return { cipro: r.rows[0].cipro||50000, usdt: r.rows[0].usdt||20, vipUpgrade: r.rows[0].vip_upgrade||true, totalTickets: parseInt(tickets.rows[0].count)||0 };
    }
    case 'getRecentLuckyDrawWinners': {
      const r = await query(
        `SELECT w.*,u.username,u.avatar FROM lucky_draw_winners w LEFT JOIN users u ON u.user_id=w.user_id ORDER BY w.created_at DESC LIMIT $1`,
        [p.limit||10]
      );
      return r.rows.map(w => ({ user_id: w.user_id, username: w.username||'Anonymous', avatar: w.avatar||'👤', draw_date: w.draw_date, usdt_won: w.usdt_won||0, points_won: w.points_won||0 }));
    }
    case 'getRecentActivities': return [];
    case 'createDepositRequest': {
      const { userId, currency, amount, txHash, walletAddress, status } = p;
      const r = await query(
        `INSERT INTO deposit_requests (user_id, currency, amount, tx_hash, wallet_address, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [userId, currency, amount, txHash, walletAddress, status || 'pending']
      );
      return r.rows[0];
    }
    case 'getDepositRequests': {
      let sql = 'SELECT * FROM deposit_requests';
      const conditions = [];
      const values = [];
      let paramCount = 1;
      
      if (p.user_id) {
        conditions.push(`user_id=$${paramCount++}`);
        values.push(p.user_id);
      }
      if (p.status) {
        conditions.push(`status=$${paramCount++}`);
        values.push(p.status);
      }
      
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY created_at DESC';
      
      const r = await query(sql, values);
      return r.rows;
    }
    case 'updateDepositStatus': {
      const r = await query(
        `UPDATE deposit_requests SET status=$1, processed_by=$2, processed_at=NOW() WHERE id=$3 RETURNING *`,
        [p.status, p.processed_by, p.id]
      );
      
      // If approved, add to user's balance
      if (p.status === 'approved' && r.rows[0]) {
        const deposit = r.rows[0];
        const currency = deposit.currency.toLowerCase();
        
        // Validate currency
        const validCurrencies = ['sol', 'eth', 'usdt', 'usdc'];
        if (!validCurrencies.includes(currency)) {
          throw new Error(`Invalid currency: ${currency}`);
        }
        
        // Update balance in balances table using CASE statement for safety
        if (currency === 'sol') {
          await query(
            `INSERT INTO balances (user_id, sol) VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET sol = balances.sol + $2, updated_at = NOW()`,
            [deposit.user_id, deposit.amount]
          );
        } else if (currency === 'eth') {
          await query(
            `INSERT INTO balances (user_id, eth) VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET eth = balances.eth + $2, updated_at = NOW()`,
            [deposit.user_id, deposit.amount]
          );
        } else if (currency === 'usdt') {
          await query(
            `INSERT INTO balances (user_id, usdt) VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET usdt = balances.usdt + $2, updated_at = NOW()`,
            [deposit.user_id, deposit.amount]
          );
        } else if (currency === 'usdc') {
          await query(
            `INSERT INTO balances (user_id, usdc) VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET usdc = balances.usdc + $2, updated_at = NOW()`,
            [deposit.user_id, deposit.amount]
          );
        }
      }
      
      return r.rows[0];
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
