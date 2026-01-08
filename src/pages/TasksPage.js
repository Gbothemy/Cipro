import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import SEOHead from '../components/SEOHead';
import './TasksPage.css';

function TasksPage({ user, updateUser, addNotification }) {
  const [tasks, setTasks] = useState({ daily: [], weekly: [], monthly: [] });
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    gamesPlayedToday: 0,
    loginStreak: 0,
    totalPointsThisMonth: 0,
    miningSessionsToday: 0,
    lastLoginDate: null
  });

  useEffect(() => {
    if (user?.userId) {
      cleanupOldTaskData();
      initializeTasks();
    }
  }, [user.userId]);

  // Clean up old task data from localStorage (keep only last 7 days)
  const cleanupOldTaskData = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get all localStorage keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.includes(`_${user.userId}_`)) {
        // Extract date from key
        const datePart = key.split('_').pop();
        if (datePart && datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const keyDate = new Date(datePart);
          if (keyDate < sevenDaysAgo) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  };

  const initializeTasks = async () => {
    setLoading(true);
    
    // Get today's date for daily task tracking
    const today = new Date().toISOString().split('T')[0];
    
    // Check localStorage for claimed tasks today
    const claimedTasksKey = `claimedTasks_${user.userId}_${today}`;
    const claimedTasks = JSON.parse(localStorage.getItem(claimedTasksKey) || '[]');
    
    // Initialize tasks with immediate progress calculation
    const fallbackDailyTasks = [
      {
        id: 'daily_login',
        task_name: 'Daily Login',
        description: 'Simply being here counts as logging in!',
        icon: '🔑',
        required_count: 1,
        reward_points: 50,
        task_type: 'daily'
      },
      {
        id: 'play_games',
        task_name: 'Play 3 Games',
        description: 'Play any 3 games to complete this task',
        icon: '🎮',
        required_count: 3,
        reward_points: 100,
        task_type: 'daily'
      },
      {
        id: 'mining_session',
        task_name: 'Mining Session',
        description: 'Complete a mining session today',
        icon: '⛏️',
        required_count: 1,
        reward_points: 75,
        task_type: 'daily'
      }
    ];

    const fallbackWeeklyTasks = [
      {
        id: 'weekly_streak',
        task_name: 'Weekly Streak',
        description: 'Login for 7 consecutive days',
        icon: '🔥',
        required_count: 7,
        reward_points: 500,
        task_type: 'weekly'
      }
    ];

    const fallbackMonthlyTasks = [
      {
        id: 'monthly_champion',
        task_name: 'Monthly Champion',
        description: 'Earn 10,000 Cipro points this month',
        icon: '👑',
        required_count: 10000,
        reward_points: 2000,
        task_type: 'monthly'
      }
    ];

    // Set tasks immediately
    setTasks({
      daily: fallbackDailyTasks,
      weekly: fallbackWeeklyTasks,
      monthly: fallbackMonthlyTasks
    });

    // Initialize user stats
    const stats = {
      gamesPlayedToday: parseInt(localStorage.getItem(`gamesPlayed_${user.userId}_${today}`) || '0'),
      loginStreak: user.dayStreak || user.day_streak || 1,
      totalPointsThisMonth: user.points || 0,
      miningSessionsToday: parseInt(localStorage.getItem(`miningDone_${user.userId}_${today}`) || '0'),
      lastLoginDate: new Date().toISOString()
    };
    
    setUserStats(stats);

    // Initialize user tasks with progress and claimed status
    const initialUserTasks = [
      {
        task_id: 'daily_login',
        progress: 1, // Completed since they're logged in
        is_claimed: claimedTasks.includes('daily_login')
      },
      {
        task_id: 'play_games',
        progress: Math.min(stats.gamesPlayedToday, 3),
        is_claimed: claimedTasks.includes('play_games')
      },
      {
        task_id: 'mining_session',
        progress: Math.min(stats.miningSessionsToday, 1),
        is_claimed: claimedTasks.includes('mining_session')
      },
      {
        task_id: 'weekly_streak',
        progress: Math.min(stats.loginStreak, 7),
        is_claimed: claimedTasks.includes('weekly_streak')
      },
      {
        task_id: 'monthly_champion',
        progress: Math.min(stats.totalPointsThisMonth, 10000),
        is_claimed: claimedTasks.includes('monthly_champion')
      }
    ];

    setUserTasks(initialUserTasks);
    setLoading(false);
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Load all tasks from database
      const [dailyTasks, weeklyTasks, monthlyTasks, userTasksData] = await Promise.all([
        db.getTasks('daily').catch(() => []),
        db.getTasks('weekly').catch(() => []),
        db.getTasks('monthly').catch(() => []),
        db.getUserTasks(user.userId).catch(() => [])
      ]);

      // If no tasks from database, use fallback tasks
      const fallbackDailyTasks = [
        {
          id: 'daily_login',
          task_name: 'Daily Login',
          description: 'Simply being here counts as logging in!',
          icon: '🔑',
          required_count: 1,
          reward_points: 50,
          task_type: 'daily'
        },
        {
          id: 'play_games',
          task_name: 'Play 3 Games',
          description: 'Play any 3 games to complete this task',
          icon: '🎮',
          required_count: 3,
          reward_points: 100,
          task_type: 'daily'
        },
        {
          id: 'mining_session',
          task_name: 'Mining Session',
          description: 'Complete a mining session today',
          icon: '⛏️',
          required_count: 1,
          reward_points: 75,
          task_type: 'daily'
        }
      ];

      const fallbackWeeklyTasks = [
        {
          id: 'weekly_streak',
          task_name: 'Weekly Streak',
          description: 'Login for 7 consecutive days',
          icon: '🔥',
          required_count: 7,
          reward_points: 500,
          task_type: 'weekly'
        }
      ];

      const fallbackMonthlyTasks = [
        {
          id: 'monthly_champion',
          task_name: 'Monthly Champion',
          description: 'Earn 10,000 Cipro points this month',
          icon: '👑',
          required_count: 10000,
          reward_points: 2000,
          task_type: 'monthly'
        }
      ];

      setTasks({
        daily: dailyTasks.length > 0 ? dailyTasks : fallbackDailyTasks,
        weekly: weeklyTasks.length > 0 ? weeklyTasks : fallbackWeeklyTasks,
        monthly: monthlyTasks.length > 0 ? monthlyTasks : fallbackMonthlyTasks
      });
      setUserTasks(userTasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      addNotification('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Get user's actual activity data with fallbacks
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Get games played today (with fallback)
      let gamesPlayedToday = 0;
      try {
        gamesPlayedToday = await db.getGamesPlayedToday(user.userId);
      } catch (error) {
        console.error('Error getting games played today:', error);
        // Fallback: check if user has played any games today based on user data
        gamesPlayedToday = 0; // Default to 0 if we can't get the data
      }
      
      // Get mining sessions today (with fallback)
      let miningSessionsToday = 0;
      try {
        miningSessionsToday = await db.getMiningSessionsToday(user.userId);
      } catch (error) {
        console.error('Error getting mining sessions today:', error);
        // Fallback: check if user has mined today
        const lastMineTime = user.lastMineTime || user.last_mine_time;
        if (lastMineTime) {
          const lastMineDate = new Date(lastMineTime).toISOString().split('T')[0];
          miningSessionsToday = lastMineDate === today ? 1 : 0;
        }
      }
      
      // Get total points earned this month (with fallback)
      let totalPointsThisMonth = 0;
      try {
        totalPointsThisMonth = await db.getPointsEarnedThisMonth(user.userId);
      } catch (error) {
        console.error('Error getting points earned this month:', error);
        // Fallback: use current user points as approximation
        totalPointsThisMonth = user.points || 0;
      }
      
      setUserStats({
        gamesPlayedToday: gamesPlayedToday || 0,
        loginStreak: user.dayStreak || user.day_streak || 0,
        totalPointsThisMonth: totalPointsThisMonth || 0,
        miningSessionsToday: miningSessionsToday || 0,
        lastLoginDate: user.lastLogin || user.last_login || new Date().toISOString()
      });
      
      // Debug logging
      console.log('User stats loaded:', {
        gamesPlayedToday: gamesPlayedToday || 0,
        loginStreak: user.dayStreak || user.day_streak || 0,
        totalPointsThisMonth: totalPointsThisMonth || 0,
        miningSessionsToday: miningSessionsToday || 0,
        lastLoginDate: user.lastLogin || user.last_login || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Set default stats if everything fails
      setUserStats({
        gamesPlayedToday: 0,
        loginStreak: user.dayStreak || user.day_streak || 0,
        totalPointsThisMonth: user.points || 0,
        miningSessionsToday: 0,
        lastLoginDate: user.lastLogin || user.last_login || new Date().toISOString()
      });
    }
  };

  const updateTaskProgress = async () => {
    try {
      // Auto-update task progress based on user actions
      const allTasks = [...tasks.daily, ...tasks.weekly, ...tasks.monthly];
      
      for (const task of allTasks) {
        let currentProgress = 0;
        
        console.log(`Processing task: ${task.id} (${task.task_name})`);
        
        switch (task.task_name || task.id) {
          case 'Daily Login':
          case 'daily_login':
            // User is logged in right now, so this should always be completed
            currentProgress = 1;
            break;
            
          case 'Play 3 Games':
          case 'play_games':
            currentProgress = Math.min(userStats.gamesPlayedToday, 3);
            break;
            
          case 'Mining Session':
          case 'mining_session':
            currentProgress = Math.min(userStats.miningSessionsToday, 1);
            break;
            
          case 'Weekly Streak':
          case 'weekly_streak':
            currentProgress = Math.min(userStats.loginStreak, 7);
            break;
            
          case 'Monthly Champion':
          case 'monthly_champion':
            currentProgress = Math.min(userStats.totalPointsThisMonth, 10000);
            break;
            
          default:
            // For custom tasks, keep existing progress
            const existingTask = userTasks.find(ut => ut.task_id === task.id);
            currentProgress = existingTask?.progress || 0;
        }
        
        // Update progress locally as well
        const updatedUserTasks = [...userTasks];
        const taskIndex = updatedUserTasks.findIndex(ut => ut.task_id === task.id);
        if (taskIndex >= 0) {
          updatedUserTasks[taskIndex].progress = currentProgress;
        } else {
          updatedUserTasks.push({
            task_id: task.id,
            progress: currentProgress,
            is_claimed: false
          });
        }
        setUserTasks(updatedUserTasks);
      }
      
      // Reload tasks after updating progress
      await loadTasks();
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };

  // Function to update game progress (can be called from game components)
  const updateGameProgress = (gamesPlayed = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const currentGames = parseInt(localStorage.getItem(`gamesPlayed_${user.userId}_${today}`) || '0');
    const newGamesCount = currentGames + gamesPlayed;
    
    // Store in localStorage
    localStorage.setItem(`gamesPlayed_${user.userId}_${today}`, newGamesCount.toString());
    
    setUserStats(prev => ({
      ...prev,
      gamesPlayedToday: newGamesCount
    }));
    
    // Update user tasks
    setUserTasks(prev => 
      prev.map(task => 
        task.task_id === 'play_games' 
          ? { ...task, progress: Math.min(newGamesCount, 3) }
          : task
      )
    );
  };

  // Function to update mining progress
  const updateMiningProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Store in localStorage
    localStorage.setItem(`miningDone_${user.userId}_${today}`, '1');
    
    setUserStats(prev => ({
      ...prev,
      miningSessionsToday: 1
    }));
    
    // Update user tasks
    setUserTasks(prev => 
      prev.map(task => 
        task.task_id === 'mining_session' 
          ? { ...task, progress: 1 }
          : task
      )
    );
  };

  // Expose functions globally for other components to use
  window.updateTaskProgress = {
    game: updateGameProgress,
    mining: updateMiningProgress
  };

  const getUserTaskProgress = (taskId) => {
    const userTask = userTasks.find(ut => ut.task_id === taskId);
    return userTask || { progress: 0, is_claimed: false };
  };

  const handleClaimTask = async (task) => {
    const userTask = getUserTaskProgress(task.id);
    const progress = userTask.progress || 0;
    const isCompleted = progress >= task.required_count;

    if (!isCompleted) {
      addNotification('Task not completed yet!', 'error');
      return;
    }

    if (userTask.is_claimed) {
      addNotification('Task already claimed!', 'info');
      return;
    }

    try {
      // First, ensure task progress exists in database
      const existingTask = userTasks.find(ut => ut.task_id === task.id);
      if (!existingTask) {
        // Create task progress record first
        try {
          await db.updateTaskProgress(user.userId, task.id, task.required_count);
        } catch (error) {
          console.error('Error creating task progress:', error);
          // Continue anyway for fallback tasks
        }
      }
      
      // Try to claim task in database
      try {
        await db.claimTask(user.userId, task.id);
      } catch (error) {
        console.error('Error claiming task in database:', error);
        // For fallback tasks, we'll still give the reward
      }
      
      // Add reward points
      try {
        await db.addPoints(user.userId, task.reward_points);
      } catch (error) {
        console.error('Error adding points:', error);
        // Fallback: update user points locally
        updateUser({
          points: user.points + task.reward_points
        });
      }
      
      // Try to log activity (optional)
      try {
        await db.logActivity(user.userId, {
          type: 'task_completed',
          description: `Completed task: ${task.task_name}`,
          pointsChange: task.reward_points
        });
      } catch (error) {
        console.error('Error logging activity:', error);
        // Continue without logging
      }

      // Try to create notification (optional)
      try {
        await db.createNotification(user.userId, {
          type: 'task',
          title: 'Task Completed!',
          message: `You earned ${task.reward_points} Cipro from "${task.task_name}"`,
          icon: '✅'
        });
      } catch (error) {
        console.error('Error creating notification:', error);
        // Continue without notification
      }

      // Update local state
      updateUser({
        points: user.points + task.reward_points
      });

      // Persist claimed status in localStorage
      const today = new Date().toISOString().split('T')[0];
      const claimedTasksKey = `claimedTasks_${user.userId}_${today}`;
      const claimedTasks = JSON.parse(localStorage.getItem(claimedTasksKey) || '[]');
      
      if (!claimedTasks.includes(task.id)) {
        claimedTasks.push(task.id);
        localStorage.setItem(claimedTasksKey, JSON.stringify(claimedTasks));
      }

      // Mark task as claimed locally
      const updatedUserTasks = [...userTasks];
      const taskIndex = updatedUserTasks.findIndex(ut => ut.task_id === task.id);
      if (taskIndex >= 0) {
        updatedUserTasks[taskIndex].is_claimed = true;
      } else {
        updatedUserTasks.push({
          task_id: task.id,
          progress: task.required_count,
          is_claimed: true
        });
      }
      setUserTasks(updatedUserTasks);
      
      addNotification(`🎉 Claimed ${task.reward_points} Cipro!`, 'success');
    } catch (error) {
      console.error('Error claiming task:', error);
      addNotification('Failed to claim task', 'error');
    }
  };

  const getProgressPercentage = (task) => {
    const userTask = getUserTaskProgress(task.id);
    const progress = userTask.progress || 0;
    return Math.min((progress / task.required_count) * 100, 100);
  };

  const isTaskCompleted = (task) => {
    const userTask = getUserTaskProgress(task.id);
    return (userTask.progress || 0) >= task.required_count;
  };

  const isTaskClaimed = (task) => {
    const userTask = getUserTaskProgress(task.id);
    return userTask.is_claimed;
  };

  const getTotalRewards = (taskList) => {
    return taskList.reduce((sum, task) => sum + task.reward_points, 0);
  };

  const getCompletedCount = (taskList) => {
    return taskList.filter(task => isTaskCompleted(task)).length;
  };

  const getTaskProgress = (task) => {
    const userTask = getUserTaskProgress(task.id);
    return userTask.progress || 0;
  };

  const getTotalClaimed = () => {
    return userTasks.filter(ut => ut.is_claimed).length;
  };

  const getTotalPointsEarned = () => {
    return userTasks
      .filter(ut => ut.is_claimed)
      .reduce((sum, ut) => {
        const task = [...tasks.daily, ...tasks.weekly, ...tasks.monthly].find(t => t.id === ut.task_id);
        return sum + (task?.reward_points || 0);
      }, 0);
  };

  const getTaskGuidance = (task) => {
    const taskName = task.task_name || task.id;
    
    switch (taskName) {
      case 'Daily Login':
      case 'daily_login':
        return userStats.lastLoginDate && 
               new Date(userStats.lastLoginDate).toDateString() === new Date().toDateString()
               ? "✅ You've already logged in today!"
               : "🔑 Simply being here counts as logging in!";
      
      case 'Play 3 Games':
      case 'play_games':
        const remaining = Math.max(0, 3 - userStats.gamesPlayedToday);
        return remaining > 0 
               ? `🎮 Play ${remaining} more game${remaining > 1 ? 's' : ''} to complete this task`
               : "✅ You've played enough games today!";
      
      case 'Mining Session':
      case 'mining_session':
        return userStats.miningSessionsToday > 0
               ? "✅ You've completed your mining session today!"
               : "⛏️ Visit the mining page to complete a session";
      
      case 'Weekly Streak':
      case 'weekly_streak':
        const streakNeeded = Math.max(0, 7 - userStats.loginStreak);
        return streakNeeded > 0
               ? `🔥 Keep logging in daily! ${streakNeeded} more day${streakNeeded > 1 ? 's' : ''} needed`
               : "✅ Amazing! You've maintained a 7-day streak!";
      
      case 'Monthly Champion':
      case 'monthly_champion':
        const pointsNeeded = Math.max(0, 10000 - userStats.totalPointsThisMonth);
        return pointsNeeded > 0
               ? `💎 Earn ${pointsNeeded.toLocaleString()} more Cipro this month`
               : "✅ You're a true champion this month!";
      
      default:
        return "Complete the required actions to unlock this reward";
    }
  };

  if (loading) {
    return (
      <div className="tasks-page">
        <div className="page-header">
          <h1 className="page-title">📋 Tasks & Missions</h1>
          <p className="page-subtitle">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <SEOHead 
        title="📋 Daily Tasks & Challenges - Earn Extra Crypto | Cipro"
        description="📋 Complete tasks and earn cryptocurrency! Daily, weekly & monthly challenges with crypto rewards. Boost your earnings with bonus tasks. Start completing now!"
        keywords="crypto tasks, daily challenges, earn crypto tasks, cryptocurrency challenges, bonus crypto rewards, gaming tasks, crypto missions, daily crypto tasks"
        url="https://www.ciprohub.site/tasks"
      />
      <div className="page-header">
        <h1 className="page-title">📋 Tasks & Missions</h1>
        <p className="page-subtitle">Complete tasks to earn bonus rewards</p>
      </div>

      {/* Overview Stats */}
      <div className="tasks-overview">
        <div className="overview-card">
          <div className="overview-icon">📊</div>
          <div className="overview-info">
            <div className="overview-value">{getTotalClaimed()}</div>
            <div className="overview-label">Tasks Claimed</div>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">💎</div>
          <div className="overview-info">
            <div className="overview-value">{getTotalPointsEarned()}</div>
            <div className="overview-label">Cipro Earned</div>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">🎯</div>
          <div className="overview-info">
            <div className="overview-value">
              {getCompletedCount([...tasks.daily, ...tasks.weekly, ...tasks.monthly])}
            </div>
            <div className="overview-label">Completed</div>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">🎮</div>
          <div className="overview-info">
            <div className="overview-value">{userStats.gamesPlayedToday}</div>
            <div className="overview-label">Games Today</div>
          </div>
        </div>
      </div>

      {/* User Activity Summary */}
      <div className="activity-summary">
        <h2 className="section-title">📈 Your Activity Today</h2>
        <div className="activity-grid">
          <div className="activity-item">
            <div className="activity-icon">🔑</div>
            <div className="activity-info">
              <div className="activity-label">Daily Login</div>
              <div className="activity-status">
                {userStats.lastLoginDate && 
                 new Date(userStats.lastLoginDate).toDateString() === new Date().toDateString() 
                 ? '✅ Completed' : '❌ Not completed'}
              </div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🎮</div>
            <div className="activity-info">
              <div className="activity-label">Games Played</div>
              <div className="activity-status">{userStats.gamesPlayedToday}/3 games</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">⛏️</div>
            <div className="activity-info">
              <div className="activity-label">Mining Session</div>
              <div className="activity-status">
                {userStats.miningSessionsToday > 0 ? '✅ Completed' : '❌ Not completed'}
              </div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🔥</div>
            <div className="activity-info">
              <div className="activity-label">Login Streak</div>
              <div className="activity-status">{userStats.loginStreak} days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Tasks */}
      <div className="tasks-section">
        <div className="section-header">
          <h2>🌅 Daily Tasks</h2>
          <span className="section-info">
            {getCompletedCount(tasks.daily)}/{tasks.daily.length} • 
            {getTotalRewards(tasks.daily)} CIPRO total
          </span>
        </div>
        <div className="tasks-grid">
          {tasks.daily.map(task => {
            const completed = isTaskCompleted(task);
            const claimed = isTaskClaimed(task);
            const progress = getProgressPercentage(task);
            const currentProgress = getTaskProgress(task);

            return (
              <div key={task.id} className={`task-card ${completed ? 'completed' : ''} ${claimed ? 'claimed' : ''}`}>
                <div className="task-icon">{task.icon}</div>
                <div className="task-content">
                  <h3>{task.task_name}</h3>
                  <p>{task.description}</p>
                  
                  {/* Task-specific guidance */}
                  {!completed && (
                    <div className="task-guidance">
                      {getTaskGuidance(task)}
                    </div>
                  )}
                  
                  <div className="task-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-text">
                      {currentProgress}/{task.required_count}
                    </span>
                  </div>
                  <div className="task-reward">
                    <span className="reward-icon">💎</span>
                    <span className="reward-amount">+{task.reward_points} pts</span>
                  </div>
                </div>
                <button
                  className={`claim-btn ${completed && !claimed ? 'active' : ''}`}
                  onClick={() => handleClaimTask(task)}
                  disabled={!completed || claimed}
                >
                  {claimed ? '✓ Claimed' : completed ? 'Claim' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Tasks */}
      <div className="tasks-section">
        <div className="section-header">
          <h2>📅 Weekly Tasks</h2>
          <span className="section-info">
            {getCompletedCount(tasks.weekly)}/{tasks.weekly.length} • 
            {getTotalRewards(tasks.weekly)} CIPRO total
          </span>
        </div>
        <div className="tasks-grid">
          {tasks.weekly.map(task => {
            const completed = isTaskCompleted(task);
            const claimed = isTaskClaimed(task);
            const progress = getProgressPercentage(task);
            const currentProgress = getTaskProgress(task);

            return (
              <div key={task.id} className={`task-card ${completed ? 'completed' : ''} ${claimed ? 'claimed' : ''}`}>
                <div className="task-icon">{task.icon}</div>
                <div className="task-content">
                  <h3>{task.task_name}</h3>
                  <p>{task.description}</p>
                  
                  {/* Task-specific guidance */}
                  {!completed && (
                    <div className="task-guidance">
                      {getTaskGuidance(task)}
                    </div>
                  )}
                  
                  <div className="task-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-text">
                      {currentProgress}/{task.required_count}
                    </span>
                  </div>
                  <div className="task-reward">
                    <span className="reward-icon">💎</span>
                    <span className="reward-amount">+{task.reward_points} pts</span>
                  </div>
                </div>
                <button
                  className={`claim-btn ${completed && !claimed ? 'active' : ''}`}
                  onClick={() => handleClaimTask(task)}
                  disabled={!completed || claimed}
                >
                  {claimed ? '✓ Claimed' : completed ? 'Claim' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Tasks */}
      <div className="tasks-section">
        <div className="section-header">
          <h2>🗓️ Monthly Tasks</h2>
          <span className="section-info">
            {getCompletedCount(tasks.monthly)}/{tasks.monthly.length} • 
            {getTotalRewards(tasks.monthly)} CIPRO total
          </span>
        </div>
        <div className="tasks-grid">
          {tasks.monthly.map(task => {
            const completed = isTaskCompleted(task);
            const claimed = isTaskClaimed(task);
            const progress = getProgressPercentage(task);
            const currentProgress = getTaskProgress(task);

            return (
              <div key={task.id} className={`task-card ${completed ? 'completed' : ''} ${claimed ? 'claimed' : ''}`}>
                <div className="task-icon">{task.icon}</div>
                <div className="task-content">
                  <h3>{task.task_name}</h3>
                  <p>{task.description}</p>
                  
                  {/* Task-specific guidance */}
                  {!completed && (
                    <div className="task-guidance">
                      {getTaskGuidance(task)}
                    </div>
                  )}
                  
                  <div className="task-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-text">
                      {currentProgress}/{task.required_count}
                    </span>
                  </div>
                  <div className="task-reward">
                    <span className="reward-icon">💎</span>
                    <span className="reward-amount">+{task.reward_points} pts</span>
                  </div>
                </div>
                <button
                  className={`claim-btn ${completed && !claimed ? 'active' : ''}`}
                  onClick={() => handleClaimTask(task)}
                  disabled={!completed || claimed}
                >
                  {claimed ? '✓ Claimed' : completed ? 'Claim' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TasksPage;