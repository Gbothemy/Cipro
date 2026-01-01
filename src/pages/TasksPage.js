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
    loadTasks();
    loadUserStats();
    updateTaskProgress();
  }, [user.userId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Load all tasks from database
      const [dailyTasks, weeklyTasks, monthlyTasks, userTasksData] = await Promise.all([
        db.getTasks('daily'),
        db.getTasks('weekly'),
        db.getTasks('monthly'),
        db.getUserTasks(user.userId)
      ]);

      setTasks({
        daily: dailyTasks,
        weekly: weeklyTasks,
        monthly: monthlyTasks
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
      // Get user's actual activity data
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Get games played today
      const gamesPlayedToday = await db.getGamesPlayedToday(user.userId);
      
      // Get mining sessions today (if available)
      const miningSessionsToday = await db.getMiningSessionsToday(user.userId);
      
      // Get total points earned this month
      const totalPointsThisMonth = await db.getPointsEarnedThisMonth(user.userId);
      
      setUserStats({
        gamesPlayedToday: gamesPlayedToday || 0,
        loginStreak: user.dayStreak || 0,
        totalPointsThisMonth: totalPointsThisMonth || 0,
        miningSessionsToday: miningSessionsToday || 0,
        lastLoginDate: user.lastLogin
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const updateTaskProgress = async () => {
    try {
      // Auto-update task progress based on user actions
      const tasks = await db.getTasks();
      
      for (const task of tasks) {
        let currentProgress = 0;
        
        switch (task.task_name) {
          case 'Daily Login':
            // Check if user logged in today
            const today = new Date().toDateString();
            const lastLogin = user.lastLogin ? new Date(user.lastLogin).toDateString() : null;
            currentProgress = (lastLogin === today) ? 1 : 0;
            break;
            
          case 'Play 3 Games':
            currentProgress = Math.min(userStats.gamesPlayedToday, 3);
            break;
            
          case 'Mining Session':
            currentProgress = Math.min(userStats.miningSessionsToday, 1);
            break;
            
          case 'Weekly Streak':
            currentProgress = Math.min(userStats.loginStreak, 7);
            break;
            
          case 'Monthly Champion':
            currentProgress = Math.min(userStats.totalPointsThisMonth, 10000);
            break;
            
          default:
            // For custom tasks, keep existing progress
            const existingTask = userTasks.find(ut => ut.task_id === task.id);
            currentProgress = existingTask?.progress || 0;
        }
        
        // Update progress if it's different
        const existingTask = userTasks.find(ut => ut.task_id === task.id);
        if (!existingTask || existingTask.progress !== currentProgress) {
          await db.updateTaskProgress(user.userId, task.id, currentProgress);
        }
      }
      
      // Reload tasks after updating progress
      await loadTasks();
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
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
        await db.updateTaskProgress(user.userId, task.id, task.required_count);
      }
      
      // Claim task in database
      await db.claimTask(user.userId, task.id);
      
      // Add reward points
      await db.addPoints(user.userId, task.reward_points);
      
      // Log activity
      await db.logActivity(user.userId, {
        type: 'task_completed',
        description: `Completed task: ${task.task_name}`,
        pointsChange: task.reward_points
      });

      // Create notification
      await db.createNotification(user.userId, {
        type: 'task',
        title: 'Task Completed!',
        message: `You earned ${task.reward_points} Cipro from "${task.task_name}"`,
        icon: '✅'
      });

      // Update local state
      updateUser({
        points: user.points + task.reward_points
      });

      // Reload tasks
      await loadTasks();
      
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
    switch (task.task_name) {
      case 'Daily Login':
        return userStats.lastLoginDate && 
               new Date(userStats.lastLoginDate).toDateString() === new Date().toDateString()
               ? "✅ You've already logged in today!"
               : "🔑 Simply being here counts as logging in!";
      
      case 'Play 3 Games':
        const remaining = Math.max(0, 3 - userStats.gamesPlayedToday);
        return remaining > 0 
               ? `🎮 Play ${remaining} more game${remaining > 1 ? 's' : ''} to complete this task`
               : "✅ You've played enough games today!";
      
      case 'Mining Session':
        return userStats.miningSessionsToday > 0
               ? "✅ You've completed your mining session today!"
               : "⛏️ Visit the mining page to complete a session";
      
      case 'Weekly Streak':
        const streakNeeded = Math.max(0, 7 - userStats.loginStreak);
        return streakNeeded > 0
               ? `🔥 Keep logging in daily! ${streakNeeded} more day${streakNeeded > 1 ? 's' : ''} needed`
               : "✅ Amazing! You've maintained a 7-day streak!";
      
      case 'Monthly Champion':
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
