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
      const { user_id, username, email, avatar, is_admin } = userData;

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

  // ==================== ACHIEVEMENT OPERATIONS ====================

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
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error recording user session:", error);
      throw error;
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
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating user session:", error);
      throw error;
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
};
