import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ppeucykbvevlfzfwsgyn.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZXVjeWtidmV2bGZ6ZndzZ3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjQyOTgsImV4cCI6MjA3OTYwMDI5OH0.yaIs6RjKr6FY0EBFM72y6xXAhDc-H_JMgenPPtLHZpg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations using Supabase
export const db = {
  // ==================== USER OPERATIONS ====================
  
  async createUser(userData) {
    try {
      const { user_id, username, email, avatar, is_admin } = userData;
      
      // Insert into users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert([{
          user_id,
          username,
          email: email || '',
          avatar,
          is_admin: is_admin || false,
          points: 0,
          vip_level: 1,
          exp: 0,
          max_exp: 1000,
          gift_points: 0,
          completed_tasks: 0,
          day_streak: 0
        }])
        .select()
        .single();

      if (userError) throw userError;

      // Create initial balance
      const { error: balanceError } = await supabase
        .from('balances')
        .insert([{
          user_id,
          ton: 0,
          cati: 0,
          usdt: 0
        }]);

      if (balanceError) throw balanceError;

      return this.formatUser(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async getUser(user_id) {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          balances (ton, cati, usdt)
        `)
        .eq('user_id', user_id)
        .single();

      if (userError) throw userError;
      return this.formatUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async updateUser(user_id, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          points: updates.points,
          vip_level: updates.vipLevel,
          exp: updates.exp,
          completed_tasks: updates.completedTasks,
          day_streak: updates.dayStreak,
          last_claim: updates.lastClaim
        })
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) throw error;
      return this.formatUser(data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          balances (ton, cati, usdt)
        `)
        .eq('is_admin', false)
        .order('points', { ascending: false });

      if (error) throw error;
      return data.map(user => this.formatUser(user));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },

  // ==================== BALANCE OPERATIONS ====================
  
  async updateBalance(user_id, currency, amount) {
    try {
      const { data, error } = await supabase
        .from('balances')
        .update({ [currency]: amount })
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  },

  async addPoints(user_id, points) {
    try {
      // Get current points
      const { data: user } = await supabase
        .from('users')
        .select('points')
        .eq('user_id', user_id)
        .single();

      const newPoints = (user?.points || 0) + points;

      // Update points
      const { data, error } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) throw error;
      return this.formatUser(data);
    } catch (error) {
      console.error('Error adding points:', error);
      throw error;
    }
  },

  // ==================== WITHDRAWAL OPERATIONS ====================
  
  async createWithdrawalRequest(requestData) {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert([{
          id: requestData.id,
          user_id: requestData.user_id,
          username: requestData.username,
          currency: requestData.currency,
          amount: requestData.amount,
          wallet_address: requestData.wallet_address,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      throw error;
    }
  },

  async getWithdrawalRequests(status = null) {
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select('*')
        .order('request_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting withdrawal requests:', error);
      return [];
    }
  },

  async updateWithdrawalStatus(id, status, processed_by) {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .update({
          status,
          processed_date: new Date().toISOString(),
          processed_by
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      throw error;
    }
  },

  // ==================== GAME PLAYS OPERATIONS ====================
  
  async recordGamePlay(user_id, game_type) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if record exists
      const { data: existing } = await supabase
        .from('game_plays')
        .select('*')
        .eq('user_id', user_id)
        .eq('game_type', game_type)
        .eq('play_date', today)
        .single();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('game_plays')
          .update({ plays_count: existing.plays_count + 1 })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('game_plays')
          .insert([{
            user_id,
            game_type,
            play_date: today,
            plays_count: 1
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error recording game play:', error);
      throw error;
    }
  },

  async getGamePlays(user_id, game_type, date) {
    try {
      const { data, error } = await supabase
        .from('game_plays')
        .select('*')
        .eq('user_id', user_id)
        .eq('game_type', game_type)
        .eq('play_date', date)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || { plays_count: 0 };
    } catch (error) {
      console.error('Error getting game plays:', error);
      return { plays_count: 0 };
    }
  },

  // ==================== LEADERBOARD OPERATIONS ====================
  
  async getLeaderboard(type = 'points', limit = 10) {
    try {
      if (type === 'points') {
        const { data, error } = await supabase
          .from('users')
          .select('user_id, username, avatar, points, vip_level')
          .eq('is_admin', false)
          .order('points', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } else if (type === 'earnings') {
        const { data, error } = await supabase
          .from('users')
          .select(`
            user_id,
            username,
            avatar,
            balances (ton)
          `)
          .eq('is_admin', false)
          .order('balances.ton', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } else if (type === 'streak') {
        const { data, error } = await supabase
          .from('users')
          .select('user_id, username, avatar, day_streak, points')
          .eq('is_admin', false)
          .order('day_streak', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      }
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  },

  // ==================== HELPER FUNCTIONS ====================
  
  formatUser(dbUser) {
    if (!dbUser) return null;

    return {
      userId: dbUser.user_id,
      username: dbUser.username,
      email: dbUser.email,
      avatar: dbUser.avatar,
      isAdmin: dbUser.is_admin,
      points: dbUser.points || 0,
      vipLevel: dbUser.vip_level || 1,
      exp: dbUser.exp || 0,
      maxExp: dbUser.max_exp || 1000,
      giftPoints: dbUser.gift_points || 0,
      completedTasks: dbUser.completed_tasks || 0,
      dayStreak: dbUser.day_streak || 0,
      lastClaim: dbUser.last_claim,
      balance: {
        ton: dbUser.balances?.[0]?.ton || dbUser.balances?.ton || 0,
        cati: dbUser.balances?.[0]?.cati || dbUser.balances?.cati || 0,
        usdt: dbUser.balances?.[0]?.usdt || dbUser.balances?.usdt || 0
      },
      totalEarnings: {
        ton: dbUser.balances?.[0]?.ton || dbUser.balances?.ton || 0,
        cati: dbUser.balances?.[0]?.cati || dbUser.balances?.cati || 0,
        usdt: dbUser.balances?.[0]?.usdt || dbUser.balances?.usdt || 0
      }
    };
  }
};
