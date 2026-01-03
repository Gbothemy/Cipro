import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Database operations using Supabase
export const db = {
  // ==================== USER OPERATIONS ====================

  async createUser(userData) {
    try {
      const { user_id, username, email, avatar, is_admin, referred_by } = userData;

      // Insert into users table
      const { data: user, error: userError } = await supabase
        .from("users")
        .insert([
          {
            user_id,
            username,
            email: email || "",
            avatar,
            is_admin: is_admin || false,
            referred_by: referred_by || null,
            points: 0,
            vip_level: 1,
            exp: 0,
            max_exp: 1000,
            gift_points: 0,
            completed_tasks: 0,
            day_streak: 0,
          },
        ])
        .select()
        .single();

      if (userError) throw userError;

      // Create initial balance
      const { error: balanceError } = await supabase.from("balances").insert([
        {
          user_id,
          sol: 0,
          eth: 0,
          usdt: 0,
          usdc: 0,
        },
      ]);

      if (balanceError) throw balanceError;

      return this.formatUser(user);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async getUser(user_id) {
    try {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select(
          `
          *,
          balances (sol, eth, usdt, usdc)
        `
        )
        .eq("user_id", user_id)
        .single();

      if (userError) throw userError;
      return this.formatUser(user);
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async updateUser(user_id, updates) {
    try {
      const updateData = {
        points: updates.points,
        vip_level: updates.vipLevel,
        exp: updates.exp,
        completed_tasks: updates.completedTasks,
        day_streak: updates.dayStreak,
        last_claim: updates.lastClaim,
      };

      // Add optional profile fields if provided
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
      
      // Add mining fields if provided
      if (updates.last_mine_time !== undefined) updateData.last_mine_time = updates.last_mine_time;
      if (updates.total_mined !== undefined) updateData.total_mined = updates.total_mined;
      if (updates.mining_sessions !== undefined) updateData.mining_sessions = updates.mining_sessions;

      // Add game reset field if provided
      if (updates.last_game_reset !== undefined) updateData.last_game_reset = updates.last_game_reset;

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) throw error;
      return this.formatUser(data);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          balances (sol, eth, usdt, usdc)
        `
        )
        .eq("is_admin", false)
        .order("points", { ascending: false });

      if (error) throw error;
      return data.map((user) => this.formatUser(user));
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  },

  // ==================== BALANCE OPERATIONS ====================

  async updateBalance(user_id, currency, amount) {
    try {
      const { data, error } = await supabase
        .from("balances")
        .update({ [currency]: amount })
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating balance:", error);
      throw error;
    }
  },

  async addPoints(user_id, points) {
    try {
      // Get current points
      const { data: user } = await supabase
        .from("users")
        .select("points")
        .eq("user_id", user_id)
        .single();

      const newPoints = (user?.points || 0) + points;

      // Update points
      const { data, error } = await supabase
        .from("users")
        .update({ points: newPoints })
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) throw error;
      return this.formatUser(data);
    } catch (error) {
      console.error("Error adding points:", error);
      throw error;
    }
  },

  // ==================== WITHDRAWAL OPERATIONS ====================

  async createWithdrawalRequest(requestData) {
    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .insert([
          {
            id: requestData.id,
            user_id: requestData.user_id,
            username: requestData.username,
            currency: requestData.currency,
            amount: requestData.amount,
            wallet_address: requestData.wallet_address,
            network: requestData.network || null,
            memo: requestData.memo || null,
            network_fee: requestData.network_fee || 0,
            net_amount: requestData.net_amount || requestData.amount,
            status: requestData.status || "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      throw error;
    }
  },

  async getWithdrawalRequests(status = null) {
    try {
      let query = supabase
        .from("withdrawal_requests")
        .select("*")
        .order("request_date", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting withdrawal requests:", error);
      return [];
    }
  },

  async updateWithdrawalStatus(id, status, processed_by, txHash = null) {
    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .update({
          status,
          processed_date: new Date().toISOString(),
          processed_by,
          transaction_hash: txHash,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Get user_id from the withdrawal request
      const { data: request } = await supabase
        .from("withdrawal_requests")
        .select("user_id, username, amount, currency")
        .eq("id", id)
        .single();

      if (request) {
        // Create notification for user
        const notificationData = {
          type: status === 'approved' ? 'withdrawal' : 'info',
          title: status === 'approved' ? 'Withdrawal Approved ✅' : 'Withdrawal Rejected ❌',
          message: status === 'approved' 
            ? `Your withdrawal of ${request.amount} ${request.currency.toUpperCase()} has been approved and is being processed.`
            : `Your withdrawal request of ${request.amount} ${request.currency.toUpperCase()} has been rejected. Please contact support for details.`,
          icon: status === 'approved' ? '✅' : '❌'
        };

        await this.createNotification(request.user_id, notificationData);

        // Log activity
        await this.logActivity(request.user_id, {
          type: 'withdrawal_' + status,
          description: `Withdrawal ${status}: ${request.amount} ${request.currency.toUpperCase()}`,
          pointsChange: 0
        });
      }

      return data;
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      throw error;
    }
  },

  // ==================== GAME PLAYS OPERATIONS ====================

  async recordGamePlay(user_id, game_type) {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Check if record exists
      const { data: existing } = await supabase
        .from("game_plays")
        .select("*")
        .eq("user_id", user_id)
        .eq("game_type", game_type)
        .eq("play_date", today)
        .single();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from("game_plays")
          .update({ plays_count: existing.plays_count + 1 })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("game_plays")
          .insert([
            {
              user_id,
              game_type,
              play_date: today,
              plays_count: 1,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Error recording game play:", error);
      throw error;
    }
  },

  async getGamePlays(user_id, game_type, date) {
    try {
      const { data, error } = await supabase
        .from("game_plays")
        .select("*")
        .eq("user_id", user_id)
        .eq("game_type", game_type)
        .eq("play_date", date)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return data || { plays_count: 0 };
    } catch (error) {
      console.error("Error getting game plays:", error);
      return { plays_count: 0 };
    }
  },

  // ==================== LEADERBOARD OPERATIONS ====================

  async getLeaderboard(type = "points", limit = 10) {
    try {
      if (type === "points") {
        const { data, error } = await supabase
          .from("users")
          .select("user_id, username, avatar, points, vip_level")
          .eq("is_admin", false)
          .order("points", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } else if (type === "earnings") {
        // Get users with their balances
        const { data, error } = await supabase
          .from("users")
          .select(`
            user_id,
            username,
            avatar,
            balances (sol, eth, usdt, usdc)
          `)
          .eq("is_admin", false);

        if (error) throw error;

        // Calculate total earnings in USDT equivalent
        const usersWithEarnings = (data || []).map(user => {
          const sol = user.balances?.[0]?.sol || user.balances?.sol || 0;
          const eth = user.balances?.[0]?.eth || user.balances?.eth || 0;
          const usdt = user.balances?.[0]?.usdt || user.balances?.usdt || 0;
          const usdc = user.balances?.[0]?.usdc || user.balances?.usdc || 0;
          
          // Calculate total earnings in USDT (using approximate conversion rates)
          // SOL ~$100, ETH ~$2000, USDT $1, USDC $1
          const totalEarnings = (sol * 100) + (eth * 2000) + usdt + usdc;
          
          return {
            ...user,
            total_earnings: totalEarnings,
            balances: {
              sol,
              eth,
              usdt,
              usdc
            }
          };
        });

        // Sort by total earnings and limit
        const sorted = usersWithEarnings
          .sort((a, b) => b.total_earnings - a.total_earnings)
          .slice(0, limit);

        return sorted;
      } else if (type === "streak") {
        const { data, error } = await supabase
          .from("users")
          .select("user_id, username, avatar, day_streak, points")
          .eq("is_admin", false)
          .order("day_streak", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      }
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  },

  // ==================== TASK OPERATIONS ====================

  async getTasks(taskType = null) {
    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true);

      if (taskType) {
        query = query.eq("task_type", taskType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting tasks:", error);
      return [];
    }
  },

  async getUserTasks(user_id, taskType = null) {
    try {
      let query = supabase
        .from("user_tasks")
        .select(`
          *,
          tasks (*)
        `)
        .eq("user_id", user_id);

      if (taskType) {
        query = query.eq("tasks.task_type", taskType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting user tasks:", error);
      return [];
    }
  },

  async updateTaskProgress(user_id, task_id, progress) {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Check if record exists
      const { data: existing } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", user_id)
        .eq("task_id", task_id)
        .eq("reset_date", today)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("user_tasks")
          .update({ progress })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("user_tasks")
          .insert([{ user_id, task_id, progress, reset_date: today }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Error updating task progress:", error);
      throw error;
    }
  },

  async claimTask(user_id, task_id) {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("user_tasks")
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq("user_id", user_id)
        .eq("task_id", task_id)
        .eq("reset_date", today)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error claiming task:", error);
      throw error;
    }
  },

  // Task progress tracking functions
  async getGamesPlayedToday(user_id) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("game_attempts")
        .select("id")
        .eq("user_id", user_id)
        .gte("created_at", today + "T00:00:00")
        .lt("created_at", today + "T23:59:59");

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Error getting games played today:", error);
      return 0;
    }
  },

  async getMiningSessionsToday(user_id) {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Check if user has mined today by looking at last_mine_time
      const { data: userData, error } = await supabase
        .from("users")
        .select("last_mine_time")
        .eq("user_id", user_id)
        .single();

      if (error) throw error;
      
      if (!userData?.last_mine_time) return 0;
      
      const lastMineDate = new Date(userData.last_mine_time).toISOString().split('T')[0];
      return lastMineDate === today ? 1 : 0;
    } catch (error) {
      console.error("Error getting mining sessions today:", error);
      return 0;
    }
  },

  async getPointsEarnedThisMonth(user_id) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Get points from activities this month
      const { data, error } = await supabase
        .from("user_activity_log")
        .select("points_change")
        .eq("user_id", user_id)
        .gte("created_at", startOfMonth)
        .gt("points_change", 0); // Only positive point changes

      if (error) throw error;
      
      return data?.reduce((sum, activity) => sum + (activity.points_change || 0), 0) || 0;
    } catch (error) {
      console.error("Error getting points earned this month:", error);
      return 0;
    }
  },

  // ==================== NOTIFICATION OPERATIONS ====================

  async createNotification(user_id, notificationData) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert([
          {
            user_id,
            notification_type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            icon: notificationData.icon,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  async getNotifications(user_id, isRead = null) {
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      if (isRead !== null) {
        query = query.eq("is_read", isRead);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  },

  async markNotificationAsRead(id) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  async deleteNotification(id) {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  },

  // ==================== ENHANCED ACHIEVEMENT OPERATIONS ====================

  async getAchievements() {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting achievements:", error);
      return [];
    }
  },

  async getUserAchievements(user_id) {
    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievements (*)
        `)
        .eq("user_id", user_id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting user achievements:", error);
      return [];
    }
  },

  async unlockAchievement(user_id, achievement_id) {
    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .insert([{ user_id, achievement_id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      throw error;
    }
  },



  // ==================== ACTIVITY LOG OPERATIONS ====================

  async logActivity(user_id, activityData) {
    try {
      const { data, error } = await supabase
        .from("user_activity_log")
        .insert([
          {
            user_id,
            activity_type: activityData.type,
            activity_description: activityData.description,
            points_change: activityData.pointsChange || 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error logging activity:", error);
      throw error;
    }
  },

  async getUserActivity(user_id, limit = 10) {
    try {
      const { data, error } = await supabase
        .from("user_activity_log")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting user activity:", error);
      return [];
    }
  },

  // ==================== VIP TIERS OPERATIONS ====================

  async getVIPTiers() {
    try {
      const { data, error } = await supabase
        .from("vip_tiers")
        .select("*")
        .order("min_level", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting VIP tiers:", error);
      return [];
    }
  },

  async getUserTier(vipLevel) {
    try {
      const { data, error } = await supabase
        .from("vip_tiers")
        .select("*")
        .lte("min_level", vipLevel)
        .gte("max_level", vipLevel)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error getting user tier:", error);
      return null;
    }
  },

  // ==================== DAILY REWARDS OPERATIONS ====================

  async recordDailyReward(user_id, rewardData) {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("daily_rewards")
        .insert([
          {
            user_id,
            claim_date: today,
            points_earned: rewardData.points,
            sol_earned: rewardData.sol || 0,
            eth_earned: rewardData.eth || 0,
            usdt_earned: rewardData.usdt || 0,
            usdc_earned: rewardData.usdc || 0,
            streak_day: rewardData.streakDay,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error recording daily reward:", error);
      throw error;
    }
  },

  async getDailyRewards(user_id, limit = 30) {
    try {
      const { data, error } = await supabase
        .from("daily_rewards")
        .select("*")
        .eq("user_id", user_id)
        .order("claim_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting daily rewards:", error);
      return [];
    }
  },

  // ==================== CONVERSION HISTORY OPERATIONS ====================

  async recordConversion(user_id, conversionData) {
    try {
      const { data, error } = await supabase
        .from("conversion_history")
        .insert([
          {
            user_id,
            points_converted: conversionData.points,
            currency: conversionData.currency,
            amount_received: conversionData.amount,
            conversion_rate: conversionData.rate,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error recording conversion:", error);
      throw error;
    }
  },

  async getConversionHistory(user_id, limit = 20) {
    try {
      const { data, error } = await supabase
        .from("conversion_history")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting conversion history:", error);
      return [];
    }
  },

  // ==================== COMPANY REVENUE OPERATIONS ====================

  async recordRevenue(revenueData) {
    try {
      const { data, error } = await supabase
        .from("revenue_transactions")
        .insert([
          {
            user_id: revenueData.user_id,
            transaction_type: revenueData.type,
            revenue_source: revenueData.source,
            amount: revenueData.amount,
            fee_percentage: revenueData.feePercentage,
            original_amount: revenueData.originalAmount,
            description: revenueData.description,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update company wallet
      await this.updateCompanyWallet(revenueData.source, revenueData.amount);

      return data;
    } catch (error) {
      console.error("Error recording revenue:", error);
      throw error;
    }
  },

  async updateCompanyWallet(currency, amount) {
    try {
      // Get current wallet
      const { data: wallet } = await supabase
        .from("company_wallet")
        .select("*")
        .limit(1)
        .single();

      if (!wallet) {
        // Create wallet if doesn't exist
        await supabase.from("company_wallet").insert([
          {
            sol_balance: currency === "sol" ? amount : 0,
            eth_balance: currency === "eth" ? amount : 0,
            usdt_balance: currency === "usdt" ? amount : 0,
            usdc_balance: currency === "usdc" ? amount : 0,
            total_points_collected: currency === "points" ? amount : 0,
          },
        ]);
      } else {
        // Update existing wallet
        const updates = {};
        if (currency === "sol") updates.sol_balance = wallet.sol_balance + amount;
        if (currency === "eth") updates.eth_balance = wallet.eth_balance + amount;
        if (currency === "usdt") updates.usdt_balance = wallet.usdt_balance + amount;
        if (currency === "usdc") updates.usdc_balance = wallet.usdc_balance + amount;
        if (currency === "points") updates.total_points_collected = wallet.total_points_collected + amount;

        await supabase
          .from("company_wallet")
          .update(updates)
          .eq("id", wallet.id);
      }
    } catch (error) {
      console.error("Error updating company wallet:", error);
    }
  },

  async getCompanyWallet() {
    try {
      const { data, error } = await supabase
        .from("company_wallet")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error getting company wallet:", error);
      return null;
    }
  },

  async getRevenueStats(startDate = null, endDate = null) {
    try {
      let query = supabase
        .from("revenue_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting revenue stats:", error);
      return [];
    }
  },

  async recordTrafficRevenue(trafficData) {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data: existing } = await supabase
        .from("traffic_revenue")
        .select("*")
        .eq("date", today)
        .single();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from("traffic_revenue")
          .update({
            page_views: existing.page_views + (trafficData.pageViews || 0),
            unique_visitors: existing.unique_visitors + (trafficData.uniqueVisitors || 0),
            ad_impressions: existing.ad_impressions + (trafficData.adImpressions || 0),
            ad_clicks: existing.ad_clicks + (trafficData.adClicks || 0),
            estimated_revenue: existing.estimated_revenue + (trafficData.revenue || 0),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("traffic_revenue")
          .insert([
            {
              date: today,
              page_views: trafficData.pageViews || 0,
              unique_visitors: trafficData.uniqueVisitors || 0,
              ad_impressions: trafficData.adImpressions || 0,
              ad_clicks: trafficData.adClicks || 0,
              estimated_revenue: trafficData.revenue || 0,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Error recording traffic revenue:", error);
      throw error;
    }
  },

  async getTrafficRevenue(startDate = null, endDate = null) {
    try {
      let query = supabase
        .from("traffic_revenue")
        .select("*")
        .order("date", { ascending: false });

      if (startDate) {
        query = query.gte("date", startDate.split('T')[0]);
      }
      if (endDate) {
        query = query.lte("date", endDate.split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting traffic revenue:", error);
      return [];
    }
  },

  async recordUserSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .insert([
          {
            user_id: sessionData.userId,
            session_id: sessionData.sessionId,
            ip_address: sessionData.ipAddress,
            user_agent: sessionData.userAgent,
            page_views: 1,
            duration_seconds: 0,
            ad_impressions: 0,
            ad_clicks: 0,
            revenue_generated: 0,
          },
        ])
        .select();

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error("Error recording user session:", error);
      return null; // Don't throw, just return null
    }
  },

  async updateUserSession(sessionId, sessionData) {
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .update({
          page_views: sessionData.pageViews,
          duration_seconds: sessionData.duration,
          ad_impressions: sessionData.adImpressions,
          ad_clicks: sessionData.adClicks,
          revenue_generated: sessionData.revenueGenerated,
          last_activity: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .select();

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error("Error updating user session:", error);
      return null; // Don't throw, just return null
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
      last_mine_time: dbUser.last_mine_time,
      last_game_reset: dbUser.last_game_reset,
      total_mined: dbUser.total_mined || 0,
      mining_sessions: dbUser.mining_sessions || 0,
      balance: {
        sol: dbUser.balances?.[0]?.sol || dbUser.balances?.sol || 0,
        eth: dbUser.balances?.[0]?.eth || dbUser.balances?.eth || 0,
        usdt: dbUser.balances?.[0]?.usdt || dbUser.balances?.usdt || 0,
        usdc: dbUser.balances?.[0]?.usdc || dbUser.balances?.usdc || 0,
      },
      totalEarnings: {
        sol: dbUser.balances?.[0]?.sol || dbUser.balances?.sol || 0,
        eth: dbUser.balances?.[0]?.eth || dbUser.balances?.eth || 0,
        usdt: dbUser.balances?.[0]?.usdt || dbUser.balances?.usdt || 0,
        usdc: dbUser.balances?.[0]?.usdc || dbUser.balances?.usdc || 0,
      },
    };
  },

  // ==================== REFERRAL OPERATIONS ====================

  async getUserReferrals(user_id) {
    try {
      // Get all users referred by this user
      const { data, error } = await supabase
        .from("users")
        .select(`
          user_id,
          username,
          avatar,
          created_at,
          last_login,
          points,
          balances (sol, eth, usdt, usdc)
        `)
        .eq("referred_by", user_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map(user => ({
        id: user.user_id,
        userId: user.user_id,
        name: user.username,
        avatar: user.avatar,
        joined: user.created_at,
        lastActive: user.last_login,
        active: user.last_login ? new Date(user.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false,
        points: user.points || 0,
        sol: user.balances?.[0]?.sol || 0,
        eth: user.balances?.[0]?.eth || 0,
        usdt: user.balances?.[0]?.usdt || 0,
        usdc: user.balances?.[0]?.usdc || 0,
      }));
    } catch (error) {
      console.error("Error getting user referrals:", error);
      return [];
    }
  },

  async getReferrer(user_id) {
    try {
      // Get the user's data to find who referred them
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("referred_by")
        .eq("user_id", user_id)
        .single();

      if (userError) throw userError;
      if (!userData?.referred_by) return null;

      // Get the referrer's details
      const { data: referrer, error: referrerError } = await supabase
        .from("users")
        .select(`
          user_id,
          username,
          avatar,
          created_at,
          vip_level
        `)
        .eq("user_id", userData.referred_by)
        .single();

      if (referrerError) throw referrerError;

      return {
        userId: referrer.user_id,
        username: referrer.username,
        avatar: referrer.avatar,
        joinedDate: referrer.created_at,
        vipLevel: referrer.vip_level || 1,
      };
    } catch (error) {
      console.error("Error getting referrer:", error);
      return null;
    }
  },

  async getReferralStats(user_id) {
    try {
      // Get total referrals count
      const { data: referrals, error: countError } = await supabase
        .from("users")
        .select("user_id, balances (sol, eth, usdt, usdc)")
        .eq("referred_by", user_id);

      if (countError) throw countError;

      const totalReferrals = referrals?.length || 0;

      // Calculate total earnings from referrals (10% commission)
      const totalEarnings = (referrals || []).reduce((acc, ref) => {
        const balance = ref.balances?.[0] || {};
        return {
          sol: acc.sol + (balance.sol || 0) * 0.1,
          eth: acc.eth + (balance.eth || 0) * 0.1,
          usdt: acc.usdt + (balance.usdt || 0) * 0.1,
          usdc: acc.usdc + (balance.usdc || 0) * 0.1,
        };
      }, { sol: 0, eth: 0, usdt: 0, usdc: 0 });

      // Get active referrals (logged in within last 7 days)
      const { data: activeRefs, error: activeError } = await supabase
        .from("users")
        .select("user_id")
        .eq("referred_by", user_id)
        .gte("last_login", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (activeError) throw activeError;

      return {
        totalReferrals,
        activeReferrals: activeRefs?.length || 0,
        totalEarnings,
      };
    } catch (error) {
      console.error("Error getting referral stats:", error);
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: { sol: 0, eth: 0, usdt: 0, usdc: 0 },
      };
    }
  },

  // ==================== ACTIVITY FEED ====================
  
  async getRecentActivities(limit = 20, filter = 'all') {
    try {
      // This would query a real activities table in production
      // For now, return empty array to trigger sample data generation
      return [];
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  },

  // ==================== VIP SUBSCRIPTION OPERATIONS ====================

  async createSubscription(subscriptionData) {
    try {
      const { data, error } = await supabase
        .rpc('create_subscription', {
          p_user_id: subscriptionData.user_id,
          p_vip_tier: subscriptionData.vip_tier,
          p_billing_cycle: subscriptionData.billing_cycle,
          p_price: subscriptionData.price,
          p_payment_method: subscriptionData.payment_method,
          p_payment_id: subscriptionData.payment_id
        });

      if (error) throw error;
      return { success: true, subscription_id: data };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error };
    }
  },

  async getUserSubscription(user_id) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  },

  async hasActiveSubscription(user_id) {
    try {
      const { data, error } = await supabase
        .rpc('has_active_subscription', { p_user_id: user_id });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  },

  async getSubscriptionTier(user_id) {
    try {
      const { data, error } = await supabase
        .rpc('get_subscription_tier', { p_user_id: user_id });

      if (error) throw error;
      return data || 1; // Default to Bronze
    } catch (error) {
      console.error('Error getting subscription tier:', error);
      return 1;
    }
  },

  async cancelSubscription(user_id, reason = null) {
    try {
      const { data, error } = await supabase
        .rpc('cancel_subscription', {
          p_user_id: user_id,
          p_reason: reason
        });

      if (error) throw error;
      return { success: data };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error };
    }
  },

  async getSubscriptionHistory(user_id, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting subscription history:', error);
      return [];
    }
  },

  async recordPaymentTransaction(transactionData) {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert([{
          user_id: transactionData.user_id,
          subscription_id: transactionData.subscription_id,
          transaction_type: transactionData.transaction_type,
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          payment_method: transactionData.payment_method,
          payment_id: transactionData.payment_id,
          payment_status: transactionData.payment_status || 'pending',
          payment_date: transactionData.payment_date || new Date().toISOString(),
          metadata: transactionData.metadata || {}
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error recording payment transaction:', error);
      return { success: false, error };
    }
  },

  async getActiveSubscriptions() {
    try {
      const { data, error } = await supabase
        .from('active_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active subscriptions:', error);
      return [];
    }
  },

  async getSubscriptionRevenue(startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('subscription_revenue')
        .select('*')
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting subscription revenue:', error);
      return [];
    }
  },

  // ==================== DEPOSIT OPERATIONS ====================

  async createDepositRequest(depositData) {
    try {
      const { data, error } = await supabase
        .from('deposit_requests')
        .insert([{
          id: depositData.id,
          user_id: depositData.user_id,
          username: depositData.username,
          currency: depositData.currency,
          amount: depositData.amount,
          wallet_address: depositData.wallet_address,
          status: depositData.status || 'pending',
          deposit_type: depositData.deposit_type || 'balance',
          subscription_tier: depositData.subscription_tier,
          billing_cycle: depositData.billing_cycle,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating deposit request:', error);
      return { success: false, error };
    }
  },

  async getDepositRequests(status = null) {
    try {
      let query = supabase
        .from('deposit_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting deposit requests:', error);
      return [];
    }
  },

  async updateDepositStatus(id, status, processed_by = null) {
    try {
      const { data, error } = await supabase
        .from('deposit_requests')
        .update({
          status,
          processed_date: new Date().toISOString(),
          processed_by
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If deposit is approved and it's a subscription, activate the subscription
      if (status === 'approved' && data.deposit_type === 'subscription') {
        await this.activateSubscriptionFromDeposit(data);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating deposit status:', error);
      return { success: false, error };
    }
  },

  async activateSubscriptionFromDeposit(depositData) {
    try {
      // Map tier names to tier numbers
      const tierMap = {
        'Silver': 5,
        'Gold': 9,
        'Platinum': 13,
        'Diamond': 17
      };

      const vipTier = tierMap[depositData.subscription_tier] || 5;

      const subscriptionResult = await this.createSubscription({
        user_id: depositData.user_id,
        vip_tier: vipTier,
        billing_cycle: depositData.billing_cycle,
        price: depositData.amount,
        payment_method: 'crypto',
        payment_id: depositData.id
      });

      if (subscriptionResult.success) {
        // Create notification for user
        await this.createNotification(depositData.user_id, {
          type: 'subscription',
          title: '🎉 VIP Subscription Activated!',
          message: `Your ${depositData.subscription_tier} subscription has been activated. Welcome to VIP!`,
          icon: '💎'
        });

        // Log activity
        await this.logActivity(depositData.user_id, {
          type: 'subscription_activated',
          description: `VIP ${depositData.subscription_tier} subscription activated`,
          pointsChange: 0
        });
      }

      return subscriptionResult;
    } catch (error) {
      console.error('Error activating subscription from deposit:', error);
      return { success: false, error };
    }
  },

  async recordGameAttempt(user_id, game_type, result = {}) {
    try {
      const { data, error } = await supabase
        .from('game_attempts')
        .insert([
          {
            user_id,
            game_type,
            won: result.won || false,
            score: result.score || 0,
            difficulty: result.difficulty || 'normal',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error recording game attempt:', error);
      return { success: false, error };
    }
  },

  async getGameAttempts(user_id, game_type = null, hoursAgo = 24) {
    try {
      const timeAgo = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('game_attempts')
        .select('*')
        .eq('user_id', user_id)
        .gte('created_at', timeAgo)
        .order('created_at', { ascending: true });

      if (game_type) {
        query = query.eq('game_type', game_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting game attempts:', error);
      return [];
    }
  },

  async getGameStats(user_id, game_type = null) {
    try {
      let query = supabase
        .from('game_attempts')
        .select('*')
        .eq('user_id', user_id);

      if (game_type) {
        query = query.eq('game_type', game_type);
      }

      const { data, error } = await query;
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
  },

  // ==================== LUCKY DRAW OPERATIONS ====================

  async getUserLuckyDrawTickets(user_id) {
    try {
      const { data, error } = await supabase
        .from("lucky_draw_tickets")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_used", false);

      if (error) {
        console.error("Error getting user lucky draw tickets:", error);
        return 0; // Return 0 instead of throwing
      }
      
      return data?.length || 0;
    } catch (error) {
      console.error("Error getting user lucky draw tickets:", error);
      return 0;
    }
  },

  async getCurrentPrizePool() {
    try {
      const { data, error } = await supabase
        .from("lucky_draw_prize_pool")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (!data) {
        // Create initial prize pool using existing table structure
        const { data: newPool, error: createError } = await supabase
          .from("lucky_draw_prize_pool")
          .insert([{
            cipro: 50000,
            usdt: 20,
            vip_upgrade: true
          }])
          .select()
          .single();

        if (createError) {
          // If table doesn't exist or has issues, return default values
          console.warn("Could not create prize pool:", createError);
          return {
            cipro: 50000,
            usdt: 20,
            vipUpgrade: true,
            totalTickets: 0
          };
        }
        
        return {
          cipro: newPool.cipro || 50000,
          usdt: newPool.usdt || 20,
          vipUpgrade: newPool.vip_upgrade || true,
          totalTickets: 0
        };
      }

      // Get total tickets sold
      const { data: tickets } = await supabase
        .from("lucky_draw_tickets")
        .select("id")
        .eq("is_used", false);

      return {
        cipro: data.cipro || 50000,
        usdt: data.usdt || 20,
        vipUpgrade: data.vip_upgrade || true,
        totalTickets: tickets?.length || 0
      };
    } catch (error) {
      console.error("Error getting current prize pool:", error);
      return {
        cipro: 50000,
        usdt: 20,
        vipUpgrade: true,
        totalTickets: 0
      };
    }
  },

  async updatePrizePool(pointsContribution) {
    try {
      const currentPool = await this.getCurrentPrizePool();
      
      // Convert points to crypto (simplified conversion)
      const solIncrease = pointsContribution * 0.0000001; // Very small amount
      const ethIncrease = pointsContribution * 0.00000005;
      const usdtIncrease = pointsContribution * 0.0001;
      const usdcIncrease = pointsContribution * 0.0001;
      const pointsIncrease = pointsContribution * 0.1;

      const { data, error } = await supabase
        .from("lucky_draw_prize_pool")
        .update({
          sol: currentPool.sol + solIncrease,
          eth: currentPool.eth + ethIncrease,
          usdt: currentPool.usdt + usdtIncrease,
          usdc: currentPool.usdc + usdcIncrease,
          points: currentPool.points + pointsIncrease
        })
        .eq("id", currentPool.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating prize pool:", error);
      throw error;
    }
  },

  async participateInLuckyDraw(user_id) {
    try {
      // Get user tickets
      const { data: tickets } = await supabase
        .from("lucky_draw_tickets")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_used", false);

      if (!tickets || tickets.length === 0) {
        throw new Error("No tickets available");
      }

      // Get total tickets
      const { data: allTickets } = await supabase
        .from("lucky_draw_tickets")
        .select("id")
        .eq("is_used", false);

      const totalTickets = allTickets?.length || 0;
      const userTickets = tickets.length;
      
      // Calculate win probability (user tickets / total tickets)
      const winProbability = userTickets / totalTickets;
      const randomValue = Math.random();
      
      const won = randomValue < winProbability;
      
      if (won) {
        // User wins! Get prize pool
        const prizePool = await this.getCurrentPrizePool();
        
        // Calculate winnings (user gets percentage based on their ticket ratio)
        const winPercentage = Math.min(winProbability * 2, 0.5); // Max 50% of pool
        
        const winnings = {
          sol: prizePool.sol * winPercentage,
          eth: prizePool.eth * winPercentage,
          usdt: prizePool.usdt * winPercentage,
          usdc: prizePool.usdc * winPercentage,
          points: Math.floor(prizePool.points * winPercentage)
        };

        // Update user balances
        await this.updateBalance(user_id, 'sol', winnings.sol);
        await this.updateBalance(user_id, 'eth', winnings.eth);
        await this.updateBalance(user_id, 'usdt', winnings.usdt);
        await this.updateBalance(user_id, 'usdc', winnings.usdc);
        
        // Add points
        await this.addPoints(user_id, winnings.points);

        // Record the win
        await supabase
          .from("lucky_draw_winners")
          .insert([{
            user_id,
            draw_date: new Date().toISOString().split('T')[0],
            sol_won: winnings.sol,
            eth_won: winnings.eth,
            usdt_won: winnings.usdt,
            usdc_won: winnings.usdc,
            points_won: winnings.points,
            tickets_used: userTickets,
            total_tickets: totalTickets
          }]);

        // Reset prize pool (reduce by winnings)
        await supabase
          .from("lucky_draw_prize_pool")
          .update({
            sol: prizePool.sol - winnings.sol,
            eth: prizePool.eth - winnings.eth,
            usdt: prizePool.usdt - winnings.usdt,
            usdc: prizePool.usdc - winnings.usdc,
            points: prizePool.points - winnings.points
          })
          .eq("id", prizePool.id);

        // Mark tickets as used
        await supabase
          .from("lucky_draw_tickets")
          .update({ is_used: true })
          .eq("user_id", user_id)
          .eq("is_used", false);

        // Log activity
        await this.logActivity(user_id, {
          type: 'lucky_draw_win',
          description: `Won Lucky Draw with ${userTickets} tickets!`,
          pointsChange: winnings.points
        });

        return { won: true, winnings };
      } else {
        // User doesn't win, mark tickets as used
        await supabase
          .from("lucky_draw_tickets")
          .update({ is_used: true })
          .eq("user_id", user_id)
          .eq("is_used", false);

        // Log activity
        await this.logActivity(user_id, {
          type: 'lucky_draw_participate',
          description: `Participated in Lucky Draw with ${userTickets} tickets`,
          pointsChange: 0
        });

        return { won: false, winnings: null };
      }
    } catch (error) {
      console.error("Error participating in lucky draw:", error);
      throw error;
    }
  },

  async updatePrizePool(usdtContribution) {
    try {
      const currentPool = await this.getCurrentPrizePool();
      
      // Convert USDT contribution to prize increases (simplified conversion)
      const ciproIncrease = Math.floor(usdtContribution * 1000); // 1 USDT = 1000 Cipro
      const usdtIncrease = usdtContribution * 0.1; // 10% of contribution goes to USDT pool

      // Get the actual database record to update
      const { data: poolRecord } = await supabase
        .from("lucky_draw_prize_pool")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!poolRecord) {
        // Create initial pool if it doesn't exist
        const { data, error } = await supabase
          .from("lucky_draw_prize_pool")
          .insert([{
            cipro: 50000 + ciproIncrease,
            usdt: 20 + usdtIncrease,
            vip_upgrade: true
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Update existing pool
      const { data, error } = await supabase
        .from("lucky_draw_prize_pool")
        .update({
          cipro: (poolRecord.cipro || 50000) + ciproIncrease,
          usdt: (poolRecord.usdt || 20) + usdtIncrease
        })
        .eq("id", poolRecord.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating prize pool:", error);
      // Don't throw error - this is non-critical
      return null;
    }
  },

  async getRecentLuckyDrawWinners(limit = 10) {
    try {
      // Get winners without foreign key join
      const { data: winners, error } = await supabase
        .from("lucky_draw_winners")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!winners || winners.length === 0) {
        return [];
      }

      // Get user details separately for each winner
      const winnersWithUserData = await Promise.all(
        winners.map(async (winner) => {
          try {
            const { data: userData } = await supabase
              .from("users")
              .select("username, avatar")
              .eq("user_id", winner.user_id)
              .single();

            return {
              user_id: winner.user_id,
              username: userData?.username || 'Anonymous',
              avatar: userData?.avatar || '👤',
              draw_date: winner.draw_date,
              sol_won: winner.sol_won || 0,
              eth_won: winner.eth_won || 0,
              usdt_won: winner.usdt_won || 0,
              usdc_won: winner.usdc_won || 0,
              points_won: winner.points_won || 0
            };
          } catch (userError) {
            console.warn('Could not get user data for winner:', winner.user_id);
            return {
              user_id: winner.user_id,
              username: 'Anonymous',
              avatar: '👤',
              draw_date: winner.draw_date,
              sol_won: winner.sol_won || 0,
              eth_won: winner.eth_won || 0,
              usdt_won: winner.usdt_won || 0,
              usdc_won: winner.usdc_won || 0,
              points_won: winner.points_won || 0
            };
          }
        })
      );

      return winnersWithUserData;
    } catch (error) {
      console.error("Error getting recent lucky draw winners:", error);
      return [];
    }
  },

  // ==================== LUCKY DRAW PAYMENT OPERATIONS ====================

  async createLuckyDrawPayment(paymentData) {
    try {
      const { data, error } = await supabase
        .from('lucky_draw_payments')
        .insert([{
          id: paymentData.id,
          user_id: paymentData.user_id,
          username: paymentData.username,
          payment_type: paymentData.payment_type,
          currency: paymentData.currency,
          amount: paymentData.amount,
          ticket_quantity: paymentData.ticket_quantity,
          wallet_address: paymentData.wallet_address,
          transaction_hash: paymentData.transaction_hash,
          network: paymentData.network,
          status: paymentData.status || 'pending',
          created_at: paymentData.created_at || new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Create notification for user
      await this.createNotification(paymentData.user_id, {
        type: 'payment',
        title: '💳 Payment Submitted',
        message: `Your payment for ${paymentData.ticket_quantity} Lucky Draw tickets has been submitted for verification.`,
        icon: '🎫'
      });

      // Log activity
      await this.logActivity(paymentData.user_id, {
        type: 'lucky_draw_payment_submitted',
        description: `Submitted payment for ${paymentData.ticket_quantity} Lucky Draw tickets`,
        pointsChange: 0
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error creating lucky draw payment:', error);
      return { success: false, error };
    }
  },

  async getUserLuckyDrawPayments(user_id) {
    try {
      const { data, error } = await supabase
        .from('lucky_draw_payments')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user lucky draw payments:', error);
      return [];
    }
  },

  async getAllLuckyDrawPayments(status = null) {
    try {
      let query = supabase
        .from('lucky_draw_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all lucky draw payments:', error);
      return [];
    }
  },

  async updateLuckyDrawPaymentStatus(paymentId, status, processedBy = null) {
    try {
      const { data, error } = await supabase
        .from('lucky_draw_payments')
        .update({
          status,
          processed_date: new Date().toISOString(),
          processed_by: processedBy
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      // If approved, create tickets using the SQL function
      if (status === 'approved') {
        const { data: result, error: approveError } = await supabase
          .rpc('approve_lucky_draw_payment', {
            p_payment_id: paymentId,
            p_processed_by: processedBy || 'admin'
          });

        if (approveError) {
          console.error('Error approving payment:', approveError);
          // Still return success for the status update
        }

        // Create success notification
        await this.createNotification(data.user_id, {
          type: 'success',
          title: '🎉 Payment Approved!',
          message: `Your payment has been approved! ${data.ticket_quantity} Lucky Draw tickets have been added to your account.`,
          icon: '🎫'
        });

        // Log activity
        await this.logActivity(data.user_id, {
          type: 'lucky_draw_tickets_received',
          description: `Received ${data.ticket_quantity} Lucky Draw tickets from approved payment`,
          pointsChange: 0
        });
      } else if (status === 'rejected') {
        // Create rejection notification
        await this.createNotification(data.user_id, {
          type: 'error',
          title: '❌ Payment Rejected',
          message: 'Your payment for Lucky Draw tickets has been rejected. Please contact support for details.',
          icon: '💳'
        });
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating lucky draw payment status:', error);
      return { success: false, error };
    }
  },

  async createLuckyDrawPayment(paymentData) {
    try {
      const { data, error } = await supabase
        .from('lucky_draw_payments')
        .insert([{
          id: paymentData.id,
          user_id: paymentData.user_id,
          username: paymentData.username,
          payment_type: paymentData.payment_type,
          currency: paymentData.currency,
          amount: paymentData.amount,
          ticket_quantity: paymentData.ticket_quantity,
          wallet_address: paymentData.wallet_address,
          transaction_hash: paymentData.transaction_hash,
          network: paymentData.network,
          status: paymentData.status || 'pending',
          created_at: paymentData.created_at || new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Create notification for user
      await this.createNotification(paymentData.user_id, {
        type: 'payment',
        title: '💳 Payment Submitted',
        message: `Your payment for ${paymentData.ticket_quantity} Lucky Draw tickets has been submitted for verification.`,
        icon: '🎫'
      });

      // Log activity
      await this.logActivity(paymentData.user_id, {
        type: 'lucky_draw_payment_submitted',
        description: `Submitted payment for ${paymentData.ticket_quantity} Lucky Draw tickets`,
        pointsChange: 0
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error creating lucky draw payment:', error);
      return { success: false, error };
    }
  },

  async getLuckyDrawPayments(status = null) {
    try {
      let query = supabase
        .from('lucky_draw_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting lucky draw payments:', error);
      return [];
    }
  },

  async updateLuckyDrawPaymentStatus(paymentId, status, processedBy = null) {
    try {
      const { data: payment, error: fetchError } = await supabase
        .from('lucky_draw_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Update payment status
      const { data, error } = await supabase
        .from('lucky_draw_payments')
        .update({
          status,
          processed_date: new Date().toISOString(),
          processed_by: processedBy
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      if (status === 'approved') {
        // Create the tickets for the user
        const tickets = Array.from({ length: payment.ticket_quantity }, (_, index) => ({
          user_id: payment.user_id,
          ticket_number: `${payment.user_id.slice(-4)}-${Date.now()}-${index}`.toUpperCase(),
          purchase_date: new Date().toISOString(),
          cost: payment.amount / payment.ticket_quantity,
          is_used: false,
          payment_id: paymentId
        }));

        const { error: ticketError } = await supabase
          .from('lucky_draw_tickets')
          .insert(tickets);

        if (ticketError) {
          console.error('Error creating tickets:', ticketError);
          throw ticketError;
        }

        // Update prize pool
        await this.updatePrizePool(payment.amount * 0.8);

        // Create success notification
        await this.createNotification(payment.user_id, {
          type: 'success',
          title: '🎉 Payment Approved!',
          message: `Your payment has been approved! ${payment.ticket_quantity} Lucky Draw tickets have been added to your account.`,
          icon: '🎫'
        });

        // Log activity
        await this.logActivity(payment.user_id, {
          type: 'lucky_draw_tickets_received',
          description: `Received ${payment.ticket_quantity} Lucky Draw tickets from approved payment`,
          pointsChange: 0
        });
      } else if (status === 'rejected') {
        // Create rejection notification
        await this.createNotification(payment.user_id, {
          type: 'error',
          title: '❌ Payment Rejected',
          message: `Your payment for Lucky Draw tickets has been rejected. Please contact support for details.`,
          icon: '💳'
        });
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating lucky draw payment status:', error);
      return { success: false, error };
    }
  },

  async getUserLuckyDrawPayments(user_id) {
    try {
      const { data, error } = await supabase
        .from('lucky_draw_payments')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user lucky draw payments:', error);
      return [];
    }
  },

  // ==================== ADMIN LUCKY DRAW OPERATIONS ====================

  async getAllLuckyDrawPayments(status = null, limit = 50) {
    try {
      let query = supabase
        .from('lucky_draw_payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all lucky draw payments:', error);
      return [];
    }
  },

  async getLuckyDrawStats() {
    try {
      // Get payment statistics
      const { data: payments } = await supabase
        .from('lucky_draw_payments')
        .select('status, amount, ticket_quantity');

      // Get ticket statistics
      const { data: tickets } = await supabase
        .from('lucky_draw_tickets')
        .select('is_used, cost');

      // Get winner statistics
      const { data: winners } = await supabase
        .from('lucky_draw_winners')
        .select('*');

      const stats = {
        totalPayments: payments?.length || 0,
        pendingPayments: payments?.filter(p => p.status === 'pending').length || 0,
        approvedPayments: payments?.filter(p => p.status === 'approved').length || 0,
        rejectedPayments: payments?.filter(p => p.status === 'rejected').length || 0,
        totalRevenue: payments?.filter(p => p.status === 'approved').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0,
        totalTicketsSold: payments?.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.ticket_quantity, 0) || 0,
        activeTickets: tickets?.filter(t => !t.is_used).length || 0,
        usedTickets: tickets?.filter(t => t.is_used).length || 0,
        totalWinners: winners?.length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting lucky draw stats:', error);
      return {
        totalPayments: 0,
        pendingPayments: 0,
        approvedPayments: 0,
        rejectedPayments: 0,
        totalRevenue: 0,
        totalTicketsSold: 0,
        activeTickets: 0,
        usedTickets: 0,
        totalWinners: 0
      };
    }
  }
};