import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import './TasksPage.css';

function TasksPage({ user, updateUser, addNotification }) {
  const [tasks, setTasks] = useState({ daily: [], weekly: [], monthly: [] });
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
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

  const getUserTaskProgress = (taskId) => {
    const userTask = userTasks.find(ut => ut.task_id === taskId);
    // If no progress exists, auto-complete the task for demo purposes
    if (!userTask) {
      return { progress: 1, is_claimed: false }; // Set progress to 1 to unlock tasks
    }
    return userTask;
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
        message: `You earned ${task.reward_points} points from "${task.task_name}"`,
        icon: '✅'
      });

      // Update local state
      updateUser({
        points: user.points + task.reward_points
      });

      // Reload tasks
      await loadTasks();
      
      addNotification(`🎉 Claimed ${task.reward_points} points!`, 'success');
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
            <div className="overview-label">Points Earned</div>
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
      </div>

      {/* Daily Tasks */}
      <div className="tasks-section">
        <div className="section-header">
          <h2>🌅 Daily Tasks</h2>
          <span className="section-info">
            {getCompletedCount(tasks.daily)}/{tasks.daily.length} • 
            {getTotalRewards(tasks.daily)} pts total
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
            {getTotalRewards(tasks.weekly)} pts total
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
            {getTotalRewards(tasks.monthly)} pts total
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
