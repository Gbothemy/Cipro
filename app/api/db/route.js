import { NextResponse } from 'next/server';
import { query, healthCheck, transaction } from '../../../lib/db';
import cache from '../../../lib/cache';
import { getMockData } from '../../../lib/mockData';
import { hashPassword, verifyPassword } from '../../../lib/password';
import { createSessionToken, verifySessionToken } from '../../../lib/session';
import { randomInt, randomUUID } from 'node:crypto';

const CURRENCIES = ['sol', 'eth', 'usdt', 'usdc'];
const CONVERSION_RATES = { sol: 1400000, eth: 33000000, usdt: 10000, usdc: 10000 };
const MIN_WITHDRAWALS = { sol: 0.1, eth: 0.005, usdt: 5, usdc: 5 };
const GAME_LIMITS = { trivia: 5, memory: 5, puzzle: 5, spin: 3 };
const GAME_REWARDS = { trivia: [0, 60], memory: [30, 100], puzzle: [20, 80], spin: [5, 200] };

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

    const publicActions = new Set(['createUser', 'authenticateUser', 'authenticateDemo', 'resetPassword', 'getLeaderboard', 'getTasks', 'getVIPTiers', 'getCurrentPrizePool', 'getRecentLuckyDrawWinners']);
    const adminActions = new Set(['getAllUsers', 'updateWithdrawalStatus', 'updateDepositStatus']);
    const restrictedActions = new Set(['addPoints', 'updateBalance', 'recordGameAttempt', 'recordMiningSession', 'updateTaskProgress', 'recordDailyReward', 'recordConversion', 'unlockAchievement']);
    let session = null;
    if (!publicActions.has(action)) {
      session = await verifySessionToken(request.cookies.get('cipro-auth')?.value);
      if (!session) return NextResponse.json({ data: null, error: 'Authentication required' }, { status: 401 });
      if (adminActions.has(action) && !session.isAdmin) {
        return NextResponse.json({ data: null, error: 'Administrator access required' }, { status: 403 });
      }
      if (!session.isAdmin) {
        if (restrictedActions.has(action)) return NextResponse.json({ data: null, error: 'This operation must be performed by a verified server action' }, { status: 403 });
        if (params.user_id && params.user_id !== session.userId) return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
        if (params.userId && params.userId !== session.userId) return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
        params.user_id = session.userId;
        if (action === 'createDepositRequest') params.userId = session.userId;
      }
      params._isAdmin = Boolean(session.isAdmin);
      if (session.isAdmin && (action === 'updateWithdrawalStatus' || action === 'updateDepositStatus')) params.processed_by = session.userId;
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
      
      const readOnlyActions = new Set(['getLeaderboard', 'getTasks', 'getVIPTiers', 'getCurrentPrizePool', 'getRecentLuckyDrawWinners']);
      if (readOnlyActions.has(action) && (USE_MOCK_DATA || shouldUseMockData(dbError))) {
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

    const response = NextResponse.json({
      data: result, 
      error: null,
      _meta: usedMockData ? { source: 'mock', warning: 'Using mock data - DATABASE_URL not configured' } : { source: 'database' }
    });
    if (action === 'authenticateUser' || action === 'authenticateDemo' || action === 'createUser') {
      response.cookies.set('cipro-auth', await createSessionToken(result), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }
    if (action === 'logout') response.cookies.set('cipro-auth', '', { httpOnly: true, path: '/', maxAge: 0 });
    return response;
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

function requireCurrency(currency) {
  const value = String(currency || '').toLowerCase();
  if (!CURRENCIES.includes(value)) throw new Error('Unsupported currency');
  return value;
}

async function awardPoints(client, userId, points, type, description) {
  const amount = Math.floor(Number(points));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid points reward');
  const user = await client.query('UPDATE users SET points=points+$1 WHERE user_id=$2 RETURNING referred_by', [amount, userId]);
  if (!user.rows[0]) throw new Error('User not found');
  await client.query(
    'INSERT INTO user_activity_log (user_id,activity_type,activity_description,points_change) VALUES ($1,$2,$3,$4)',
    [userId, type, description, amount]
  );
  if (user.rows[0].referred_by) {
    const bonus = Math.floor(amount * 0.1);
    if (bonus > 0) {
      await client.query('UPDATE users SET points=points+$1 WHERE user_id=$2', [bonus, user.rows[0].referred_by]);
      await client.query(
        'INSERT INTO user_activity_log (user_id,activity_type,activity_description,points_change) VALUES ($1,$2,$3,$4)',
        [user.rows[0].referred_by, 'referral', `10% referral reward from ${userId}`, bonus]
      );
    }
  }
  return amount;
}

async function loadFormattedUser(client, userId) {
  const result = await client.query(
    'SELECT u.*,b.sol,b.eth,b.usdt,b.usdc,b.earned_sol,b.earned_eth,b.earned_usdt,b.earned_usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.user_id=$1',
    [userId]
  );
  return formatUser(result.rows[0]);
}

async function handleAction(action, p) {
  switch (action) {
    case 'createUser': {
      const { username, email, password, avatar, referred_by } = p;
      const user_id = `USR-${randomUUID()}`;
      if (!password || password.length < 8) throw new Error('Password must be at least 8 characters');
      const passwordHash = hashPassword(password);
      const r = await query(
        `INSERT INTO users (user_id,username,email,password_hash,avatar,is_admin,referred_by,points,vip_level,exp,max_exp,gift_points,completed_tasks,day_streak)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,1,0,1000,0,0,0) RETURNING *`,
        [user_id, username, email || '', passwordHash, avatar, false, referred_by || null]
      );
      await query(`INSERT INTO balances (user_id,sol,eth,usdt,usdc) VALUES ($1,0,0,0,0) ON CONFLICT DO NOTHING`, [user_id]);
      return formatUser(r.rows[0]);
    }
    case 'authenticateDemo': {
      if (process.env.NODE_ENV === 'production') throw new Error('Demo login is disabled in production');
      let demo = await query(`SELECT user_id FROM users WHERE LOWER(username)='demoplayer' LIMIT 1`);
      let userId = demo.rows[0]?.user_id;
      if (!userId) {
        userId = 'USR-DEMO123';
        await query(`INSERT INTO users (user_id,username,email,avatar,is_admin,points,vip_level) VALUES ($1,'DemoPlayer','demo@cipro.local','🎮',false,5000,1)`,[userId]);
        await query(`INSERT INTO balances (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,[userId]);
      }
      const r = await query(`SELECT u.*,b.sol,b.eth,b.usdt,b.usdc,b.earned_sol,b.earned_eth,b.earned_usdt,b.earned_usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.user_id=$1`,[userId]);
      return formatUser(r.rows[0]);
    }
    case 'logout': return { success: true };
    case 'authenticateUser': {
      const r = await query(
        `SELECT u.*, b.sol, b.eth, b.usdt, b.usdc,b.earned_sol,b.earned_eth,b.earned_usdt,b.earned_usdc
         FROM users u LEFT JOIN balances b ON b.user_id=u.user_id
         WHERE LOWER(u.username)=LOWER($1) LIMIT 1`,
        [p.username]
      );
      const user = r.rows[0];
      if (!user || !verifyPassword(p.password || '', user.password_hash)) {
        throw new Error(user && !user.password_hash
          ? 'This account needs a password reset before signing in.'
          : 'Invalid username or password.');
      }
      return formatUser(user);
    }
    case 'resetPassword': {
      if (!p.password || p.password.length < 8) throw new Error('Password must be at least 8 characters');
      const passwordHash = hashPassword(p.password);
      const r = await query(
        `UPDATE users SET password_hash=$1
         WHERE LOWER(username)=LOWER($2) AND LOWER(email)=LOWER($3)
         RETURNING user_id`,
        [passwordHash, p.username, p.email]
      );
      if (!r.rows[0]) throw new Error('Username and email do not match an account.');
      return { success: true };
    }
    case 'getUser': {
      const r = await query(
        `SELECT u.*, b.sol, b.eth, b.usdt, b.usdc,b.earned_sol,b.earned_eth,b.earned_usdt,b.earned_usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.user_id=$1`,
        [p.user_id]
      );
      return r.rows[0] ? formatUser(r.rows[0]) : null;
    }
    case 'updateUser': {
      const { user_id, updates } = p;
      const fields = [];
      const vals = [];
      let i = 1;
      const map = p._isAdmin
        ? { points:'points',vipLevel:'vip_level',exp:'exp',completedTasks:'completed_tasks',dayStreak:'day_streak',username:'username',email:'email',avatar:'avatar' }
        : { username:'username',email:'email',avatar:'avatar' };
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
        `SELECT u.*, b.sol, b.eth, b.usdt, b.usdc,b.earned_sol,b.earned_eth,b.earned_usdt,b.earned_usdc FROM users u LEFT JOIN balances b ON b.user_id=u.user_id WHERE u.is_admin=false ORDER BY u.points DESC`
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
      const currency = requireCurrency(p.currency);
      const amount = Number(p.amount);
      if (!Number.isFinite(amount) || amount < MIN_WITHDRAWALS[currency]) throw new Error(`Minimum withdrawal is ${MIN_WITHDRAWALS[currency]} ${currency.toUpperCase()}`);
      if (!String(p.wallet_address || '').trim()) throw new Error('Wallet address is required');
      return transaction(async (client) => {
        const eligibility = await client.query(
          `SELECT u.username,u.vip_level,u.vip_subscription_end,
             (SELECT COUNT(*)::int FROM users r
              WHERE r.referred_by=u.user_id
                AND r.last_login >= NOW()-INTERVAL '7 days') active_referral_count
           FROM users u WHERE u.user_id=$1 FOR UPDATE`, [p.user_id]
        );
        const account = eligibility.rows[0];
        if (!account) throw new Error('User not found');
        const hasActiveVip = Number(account.vip_level) >= 2
          && account.vip_subscription_end
          && new Date(account.vip_subscription_end) > new Date();
        if (!hasActiveVip || Number(account.active_referral_count) < 5) {
          throw new Error('Withdrawals require an active VIP subscription and at least 5 active invited users');
        }
        const earnedColumn = `earned_${currency}`;
        const balance = await client.query(`UPDATE balances SET ${earnedColumn}=${earnedColumn}-$1,updated_at=NOW() WHERE user_id=$2 AND ${earnedColumn}>=$1 RETURNING *`, [amount, p.user_id]);
        if (!balance.rows[0]) throw new Error('Insufficient balance');
        const id = `WD-${randomUUID()}`;
        const r = await client.query(
          `INSERT INTO withdrawal_requests (id,user_id,username,currency,amount,wallet_address,network,memo,network_fee,net_amount,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$5,'pending') RETURNING *`,
          [id,p.user_id,account.username,currency,amount,String(p.wallet_address).trim(),p.network||null,p.memo||null]
        );
        return r.rows[0];
      });
    }
    case 'getWithdrawalRequests': {
      const values = [];
      const conditions = [];
      if (p.user_id) { values.push(p.user_id); conditions.push(`user_id=$${values.length}`); }
      if (p.status) { values.push(p.status); conditions.push(`status=$${values.length}`); }
      const r = await query(`SELECT * FROM withdrawal_requests${conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''} ORDER BY request_date DESC`, values);
      return r.rows;
    }
    case 'updateWithdrawalStatus': {
      if (!['approved', 'rejected'].includes(p.status)) throw new Error('Invalid withdrawal status');
      const r = await transaction(async (client) => {
        const updated = await client.query(
          `UPDATE withdrawal_requests SET status=$1,processed_date=NOW(),processed_by=$2,transaction_hash=$3
           WHERE id=$4 AND status='pending' RETURNING *`,
          [p.status, p.processed_by, p.txHash||null, p.id]
        );
        if (!updated.rows[0]) throw new Error('Withdrawal is not pending');
        if (p.status === 'rejected') {
          const w = updated.rows[0];
          const currency = requireCurrency(w.currency);
          await client.query(`UPDATE balances SET earned_${currency}=earned_${currency}+$1,updated_at=NOW() WHERE user_id=$2`, [w.amount, w.user_id]);
        }
        return updated.rows[0];
      });
      cache.clear();
      return r;
    }
    case 'completeGame': {
      const gameType = String(p.game_type || '');
      if (!GAME_LIMITS[gameType]) throw new Error('Invalid game');
      const submitted = Math.floor(Number(p.result?.points));
      const [minReward, maxReward] = GAME_REWARDS[gameType];
      if (!Number.isFinite(submitted) || submitted < minReward || submitted > maxReward) throw new Error('Invalid game reward');
      const result = await transaction(async (client) => {
        const count = await client.query(`SELECT COUNT(*)::int count FROM game_attempts WHERE user_id=$1 AND game_type=$2 AND created_at>=CURRENT_DATE`, [p.user_id, gameType]);
        if (Number(count.rows[0].count) >= GAME_LIMITS[gameType]) throw new Error('Daily game limit reached');
        await client.query(`INSERT INTO game_attempts (user_id,game_type,won,score,difficulty) VALUES ($1,$2,$3,$4,$5)`, [p.user_id,gameType,Boolean(p.result?.won),Number(p.result?.score)||0,p.result?.difficulty||'normal']);
        if (submitted > 0) await awardPoints(client,p.user_id,submitted,'game',`${gameType} reward`);
        return loadFormattedUser(client,p.user_id);
      });
      cache.clear();
      return result;
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
      const type = ['points', 'earnings', 'streak'].includes(p.type) ? p.type : 'points';
      const requestedLimit = Number.parseInt(p.limit, 10);
      const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 10;
      const cacheKey = `leaderboard-v3-${type}-${limit}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) return cached;
      
      let result;
      if (type === 'earnings') {
        const r = await query(
          `SELECT u.user_id, u.username, u.avatar, u.vip_level,
                  COALESCE(SUM(
                    CASE LOWER(w.currency)
                      WHEN 'sol' THEN COALESCE(w.net_amount, w.amount) * 100
                      WHEN 'eth' THEN COALESCE(w.net_amount, w.amount) * 2000
                      WHEN 'usdt' THEN COALESCE(w.net_amount, w.amount)
                      WHEN 'usdc' THEN COALESCE(w.net_amount, w.amount)
                      ELSE 0
                    END
                  ), 0)::double precision AS total_earnings
           FROM users u
           LEFT JOIN withdrawal_requests w
             ON w.user_id=u.user_id AND w.status='approved'
           WHERE u.is_admin=false
           GROUP BY u.user_id, u.username, u.avatar, u.vip_level, u.points
           ORDER BY total_earnings DESC, u.points DESC, u.user_id ASC
           LIMIT $1`,
          [limit]
        );
        result = r.rows;
      } else if (type === 'streak') {
        const r = await query(`SELECT user_id,username,avatar,day_streak,points,vip_level FROM users WHERE is_admin=false ORDER BY day_streak DESC, points DESC, user_id ASC LIMIT $1`, [limit]);
        result = r.rows;
      } else {
        const r = await query(`SELECT user_id,username,avatar,points,vip_level FROM users WHERE is_admin=false ORDER BY points DESC, user_id ASC LIMIT $1`, [limit]);
        result = r.rows;
      }
      
      // Keep requests efficient while allowing the UI's 30-second refresh to show changes.
      cache.set(cacheKey, result, 25);
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
      const result = await transaction(async (client) => {
        const taskResult = await client.query('SELECT * FROM tasks WHERE id=$1 AND is_active=true', [p.task_id]);
        const task = taskResult.rows[0];
        if (!task) throw new Error('Task not found');
        const name = task.task_name.toLowerCase();
        let progress = 0;
        if (name.includes('login')) progress = 1;
        else if (name.includes('game')) progress = Number((await client.query(`SELECT COUNT(*) count FROM game_attempts WHERE user_id=$1 AND created_at>=CASE WHEN $2='weekly' THEN CURRENT_DATE-INTERVAL '7 days' ELSE CURRENT_DATE END`, [p.user_id,task.task_type])).rows[0].count);
        else if (name.includes('mining')) progress = Number((await client.query(`SELECT COUNT(*) count FROM user_activity_log WHERE user_id=$1 AND activity_type='mining' AND created_at>=CURRENT_DATE`, [p.user_id])).rows[0].count);
        else if (name.includes('point')) progress = Number((await client.query(`SELECT COALESCE(SUM(points_change),0) total FROM user_activity_log WHERE user_id=$1 AND points_change>0 AND created_at>=CASE WHEN $2='monthly' THEN date_trunc('month',NOW()) ELSE CURRENT_DATE END`, [p.user_id,task.task_type])).rows[0].total);
        else if (name.includes('deposit')) progress = Number((await client.query(`SELECT COUNT(*) count FROM deposit_requests WHERE user_id=$1 AND status='approved'`, [p.user_id])).rows[0].count);
        else if (name.includes('vip')) progress = Number((await client.query('SELECT vip_level FROM users WHERE user_id=$1',[p.user_id])).rows[0]?.vip_level || 0);
        if (progress < Number(task.required_count)) throw new Error('Task requirements are not complete');
        const claimed = await client.query(
          `INSERT INTO user_tasks (user_id,task_id,progress,is_claimed,claimed_at,reset_date)
           VALUES ($1,$2,$3,true,NOW(),CURRENT_DATE)
           ON CONFLICT (user_id,task_id,reset_date) DO UPDATE SET progress=EXCLUDED.progress,is_claimed=true,claimed_at=NOW()
           WHERE user_tasks.is_claimed=false RETURNING *`, [p.user_id,p.task_id,progress]
        );
        if (!claimed.rows[0]) throw new Error('Task reward already claimed');
        await awardPoints(client,p.user_id,task.reward_points,'task',task.task_name);
        return { task: claimed.rows[0], user: await loadFormattedUser(client,p.user_id) };
      });
      cache.clear();
      return result;
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
      const r = await query(`SELECT mining_started_at FROM users WHERE user_id=$1`, [p.user_id]);
      if (!r.rows[0]?.mining_started_at) return 0;
      return new Date(r.rows[0].mining_started_at) > new Date(eightHoursAgo) ? 1 : 0;
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
    case 'startMiningSession': {
      const r = await query(`UPDATE users SET mining_started_at=NOW() WHERE user_id=$1 AND (mining_started_at IS NULL OR mining_started_at<NOW()-INTERVAL '8 hours') RETURNING mining_started_at`, [p.user_id]);
      if (!r.rows[0]) throw new Error('A mining session is already active');
      return r.rows[0];
    }
    case 'cancelMiningSession': {
      await query('UPDATE users SET mining_started_at=NULL WHERE user_id=$1',[p.user_id]);
      return { success: true };
    }
    case 'completeMiningSession': {
      const result = await transaction(async (client) => {
        const userResult = await client.query(`SELECT vip_level,mining_started_at FROM users WHERE user_id=$1 FOR UPDATE`, [p.user_id]);
        const account = userResult.rows[0];
        if (!account?.mining_started_at) throw new Error('No active mining session');
        if (new Date(account.mining_started_at).getTime() > Date.now() - 8*60*60*1000) throw new Error('Mining session is not complete');
        const rates = { 1:100,2:150,3:200,4:300,5:500 };
        const reward = (rates[account.vip_level] || 100) * 8;
        await client.query(`UPDATE users SET mining_started_at=NULL,last_mine_time=NOW(),mining_sessions=mining_sessions+1,total_mined=total_mined+$1 WHERE user_id=$2`, [reward,p.user_id]);
        await awardPoints(client,p.user_id,reward,'mining','Completed 8-hour mining session');
        return { reward, user: await loadFormattedUser(client,p.user_id) };
      });
      cache.clear();
      return result;
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
      const r = await query(`UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2 RETURNING *`, [p.id,p.user_id]);
      return r.rows[0];
    }
    case 'deleteNotification': {
      await query(`DELETE FROM notifications WHERE id=$1 AND user_id=$2`, [p.id,p.user_id]);
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
    case 'checkAchievements': {
      const result = await transaction(async (client) => {
        const [userR,gamesR,tasksR,refsR,convR,depsR,wdsR] = await Promise.all([
          client.query('SELECT * FROM users WHERE user_id=$1',[p.user_id]),
          client.query('SELECT COUNT(*)::int count,COUNT(*) FILTER (WHERE won)::int wins FROM game_attempts WHERE user_id=$1',[p.user_id]),
          client.query('SELECT COUNT(*)::int count FROM user_tasks WHERE user_id=$1 AND is_claimed=true',[p.user_id]),
          client.query('SELECT COUNT(*)::int count FROM users WHERE referred_by=$1',[p.user_id]),
          client.query('SELECT COUNT(*)::int count FROM conversion_history WHERE user_id=$1',[p.user_id]),
          client.query(`SELECT COUNT(*)::int count FROM deposit_requests WHERE user_id=$1 AND status='approved'`,[p.user_id]),
          client.query(`SELECT COUNT(*)::int count FROM withdrawal_requests WHERE user_id=$1 AND status='approved'`,[p.user_id]),
        ]);
        const user = userR.rows[0];
        const stats = { points:Number(user.points),games:Number(gamesR.rows[0].count),wins:Number(gamesR.rows[0].wins),tasks:Number(tasksR.rows[0].count),refs:Number(refsR.rows[0].count),conversions:Number(convR.rows[0].count),deposits:Number(depsR.rows[0].count),withdrawals:Number(wdsR.rows[0].count),streak:Number(user.day_streak),vip:Number(user.vip_level) };
        const achievements = await client.query(`SELECT a.* FROM achievements a WHERE a.is_active=true AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id=$1 AND ua.achievement_id=a.id)`,[p.user_id]);
        const unlocked = [];
        for (const achievement of achievements.rows) {
          const req = String(achievement.requirement_text || '').toLowerCase();
          const required = Number(req.match(/\d+/)?.[0] || 1);
          let met = false;
          if (req.includes('point')) met = stats.points >= required;
          else if (req.includes('win') && req.includes('game')) met = stats.wins >= required;
          else if (req.includes('game')) met = stats.games >= required;
          else if (req.includes('streak') || req.includes('login')) met = stats.streak >= required;
          else if (req.includes('task')) met = stats.tasks >= required;
          else if (req.includes('refer') || req.includes('friend')) met = stats.refs >= required;
          else if (req.includes('convert')) met = stats.conversions >= required;
          else if (req.includes('deposit')) met = stats.deposits >= required;
          else if (req.includes('withdraw')) met = stats.withdrawals >= required;
          else if (req.includes('vip')) met = stats.vip >= required;
          if (met) {
            await client.query('INSERT INTO user_achievements (user_id,achievement_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[p.user_id,achievement.id]);
            await awardPoints(client,p.user_id,achievement.reward_points,'achievement',achievement.achievement_name);
            unlocked.push(achievement);
          }
        }
        return { unlocked, user: await loadFormattedUser(client,p.user_id) };
      });
      cache.clear();
      return result;
    }
    case 'claimDailyReward': {
      const rewards = [50,75,100,125,150,200,300];
      const result = await transaction(async (client) => {
        const userResult = await client.query('SELECT day_streak,last_claim FROM users WHERE user_id=$1 FOR UPDATE',[p.user_id]);
        const account = userResult.rows[0];
        if (!account) throw new Error('User not found');
        const last = account.last_claim ? new Date(account.last_claim).toISOString().slice(0,10) : null;
        const today = new Date().toISOString().slice(0,10);
        const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
        if (last === today) throw new Error('Daily reward already claimed');
        const streak = last === yesterday ? Number(account.day_streak)+1 : 1;
        const points = rewards[(streak-1)%7];
        await client.query(`INSERT INTO daily_rewards (user_id,claim_date,points_earned,streak_day) VALUES ($1,CURRENT_DATE,$2,$3)`,[p.user_id,points,streak]);
        await client.query('UPDATE users SET day_streak=$1,last_claim=NOW() WHERE user_id=$2',[streak,p.user_id]);
        await awardPoints(client,p.user_id,points,'daily_reward',`Day ${streak} reward`);
        return { points, streak, user: await loadFormattedUser(client,p.user_id) };
      });
      cache.clear();
      return result;
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
    case 'convertPoints': {
      const currency = requireCurrency(p.currency);
      const points = Math.floor(Number(p.points));
      const rate = CONVERSION_RATES[currency];
      const minimum = Math.ceil(rate * MIN_WITHDRAWALS[currency]);
      if (!Number.isFinite(points) || points < minimum) throw new Error(`Minimum conversion is ${minimum.toLocaleString()} points`);
      const result = await transaction(async (client) => {
        const deducted = await client.query('UPDATE users SET points=points-$1 WHERE user_id=$2 AND points>=$1 RETURNING *',[points,p.user_id]);
        if (!deducted.rows[0]) throw new Error('Insufficient points');
        const amount = points/rate;
        await client.query(`UPDATE balances SET earned_${currency}=earned_${currency}+$1,updated_at=NOW() WHERE user_id=$2`,[amount,p.user_id]);
        await client.query(`INSERT INTO conversion_history (user_id,points_converted,currency,amount_received,conversion_rate) VALUES ($1,$2,$3,$4,$5)`,[p.user_id,points,currency,amount,rate]);
        return { amount, user: await loadFormattedUser(client,p.user_id) };
      });
      cache.clear();
      return result;
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
    case 'purchaseLuckyDrawTickets': {
      const currency = requireCurrency(p.currency);
      const quantity = Math.floor(Number(p.quantity));
      if (![1,5,10].includes(quantity)) throw new Error('Invalid ticket quantity');
      const usdRates = { sol:100,eth:2000,usdt:1,usdc:1 };
      const cost = quantity / usdRates[currency];
      return transaction(async (client) => {
        const deducted = await client.query(`UPDATE balances SET ${currency}=${currency}-$1,updated_at=NOW() WHERE user_id=$2 AND ${currency}>=$1 RETURNING *`,[cost,p.user_id]);
        if (!deducted.rows[0]) throw new Error('Insufficient balance');
        await client.query(`INSERT INTO lucky_draw_tickets (user_id) SELECT $1 FROM generate_series(1,$2)`,[p.user_id,quantity]);
        return { tickets: Number((await client.query(`SELECT COUNT(*) count FROM lucky_draw_tickets WHERE user_id=$1 AND is_used=false`,[p.user_id])).rows[0].count), user: await loadFormattedUser(client,p.user_id) };
      });
    }
    case 'useLuckyDrawTicket': {
      return transaction(async (client) => {
        const ticket = await client.query(`UPDATE lucky_draw_tickets SET is_used=true,used_at=NOW() WHERE id=(SELECT id FROM lucky_draw_tickets WHERE user_id=$1 AND is_used=false ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING id`,[p.user_id]);
        if (!ticket.rows[0]) throw new Error('No tickets available');
        const roll = randomInt(100);
        let winnings = null;
        if (roll < 5) {
          await client.query('UPDATE balances SET usdt=usdt+1,updated_at=NOW() WHERE user_id=$1',[p.user_id]);
          await client.query(`INSERT INTO lucky_draw_winners (user_id,draw_date,usdt_won) VALUES ($1,CURRENT_DATE,1)`,[p.user_id]);
          winnings = { usdt: 1 };
        } else if (roll < 20) {
          await awardPoints(client,p.user_id,100,'lucky_draw','Lucky Draw prize');
          await client.query(`INSERT INTO lucky_draw_winners (user_id,draw_date,points_won) VALUES ($1,CURRENT_DATE,100)`,[p.user_id]);
          winnings = { points: 100 };
        }
        return { won: Boolean(winnings), winnings, tickets: Number((await client.query(`SELECT COUNT(*) count FROM lucky_draw_tickets WHERE user_id=$1 AND is_used=false`,[p.user_id])).rows[0].count), user: await loadFormattedUser(client,p.user_id) };
      });
    }
    case 'purchaseVip': {
      const level = Math.floor(Number(p.level));
      const prices = { 2:5,3:15,4:40,5:100 };
      if (!prices[level]) throw new Error('Invalid VIP level');
      const currency = requireCurrency(p.currency);
      const usdRates = { sol:100,eth:2000,usdt:1,usdc:1 };
      const cost = prices[level]/usdRates[currency];
      return transaction(async (client) => {
        const current = await client.query('SELECT vip_level FROM users WHERE user_id=$1 FOR UPDATE',[p.user_id]);
        if (!current.rows[0] || Number(current.rows[0].vip_level) >= level) throw new Error('VIP level must be an upgrade');
        const deducted = await client.query(`UPDATE balances SET ${currency}=${currency}-$1,updated_at=NOW() WHERE user_id=$2 AND ${currency}>=$1 RETURNING *`,[cost,p.user_id]);
        if (!deducted.rows[0]) throw new Error('Insufficient balance');
        await client.query(`UPDATE users SET vip_level=$1,vip_subscription_end=NOW()+INTERVAL '30 days' WHERE user_id=$2`,[level,p.user_id]);
        return { user: await loadFormattedUser(client,p.user_id), cost };
      });
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
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error('Deposit amount must be positive');
      if (!String(txHash || '').trim() || !String(walletAddress || '').trim()) throw new Error('Transaction hash and wallet address are required');
      const r = await query(
        `INSERT INTO deposit_requests (user_id, currency, amount, tx_hash, wallet_address, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) RETURNING *`,
        [userId, requireCurrency(currency), Number(amount), txHash, walletAddress]
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
      if (!['approved','rejected'].includes(p.status)) throw new Error('Invalid deposit status');
      return transaction(async (client) => {
        const r = await client.query(`UPDATE deposit_requests SET status=$1,processed_by=$2,processed_at=NOW() WHERE id=$3 AND status='pending' RETURNING *`,[p.status,p.processed_by,p.id]);
        if (!r.rows[0]) throw new Error('Deposit is not pending');
        if (p.status === 'approved') {
          const deposit = r.rows[0];
          const currency = requireCurrency(deposit.currency);
          await client.query(`UPDATE balances SET ${currency}=${currency}+$1,updated_at=NOW() WHERE user_id=$2`,[deposit.amount,deposit.user_id]);
        }
        return r.rows[0];
      });
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
    miningStartedAt: u.mining_started_at, vipSubscriptionEnd: u.vip_subscription_end,
    last_game_reset: u.last_game_reset, total_mined: u.total_mined||0,
    mining_sessions: u.mining_sessions||0,
    balance: { sol: u.sol||0, eth: u.eth||0, usdt: u.usdt||0, usdc: u.usdc||0 },
    earnedBalance: { sol: u.earned_sol||0, eth: u.earned_eth||0, usdt: u.earned_usdt||0, usdc: u.earned_usdc||0 },
    totalEarnings: { sol: u.sol||0, eth: u.eth||0, usdt: u.usdt||0, usdc: u.usdc||0 },
  };
}
