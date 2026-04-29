'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const FALLBACK_TASKS = [
  { id: 'daily_login', task_name: 'Daily Login', description: 'Log in today', icon: '🔑', required_count: 1, reward_points: 50, task_type: 'daily' },
  { id: 'play_games', task_name: 'Play 3 Games', description: 'Play any 3 games', icon: '🎮', required_count: 3, reward_points: 100, task_type: 'daily' },
  { id: 'mining_session', task_name: 'Mining Session', description: 'Complete a mining session', icon: '⛏️', required_count: 1, reward_points: 75, task_type: 'daily' },
  { id: 'earn_points', task_name: 'Earn 500 Points', description: 'Earn 500 points today', icon: '💎', required_count: 500, reward_points: 150, task_type: 'daily' },
  { id: 'weekly_games', task_name: 'Play 20 Games', description: 'Play 20 games this week', icon: '🏆', required_count: 20, reward_points: 500, task_type: 'weekly' },
  { id: 'monthly_points', task_name: 'Earn 25000 Points', description: 'Earn 25000 points this month', icon: '🌟', required_count: 25000, reward_points: 5000, task_type: 'monthly' },
];

export default function TasksPage() {
  const { user, addPoints, addNotification } = useStore();
  const [tasks, setTasks] = useState({ daily: [], weekly: [], monthly: [], social: [], vip: [], financial: [], achievement: [] });
  const [claimed, setClaimed] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    if (user?.userId) initTasks();
  }, [user?.userId]);

  const initTasks = async () => {
    try {
      const [dbTasks, userTasks, gamesPlayed, miningSessions, pointsEarned, achievements, deposits, vipLevel] = await Promise.all([
        db.getTasks().catch(() => []),
        db.getUserTasks(user.userId).catch(() => []),
        db.getGamesPlayedToday(user.userId).catch(() => 0),
        db.getActiveMiningCount(user.userId).catch(() => 0),
        db.getPointsEarnedThisMonth(user.userId).catch(() => 0),
        db.getUserAchievements(user.userId).catch(() => []),
        db.getDepositRequests(user.userId, 'approved').catch(() => []),
        Promise.resolve(user?.vipLevel || 1),
      ]);

      const allTasks = dbTasks.length > 0 ? dbTasks : FALLBACK_TASKS;
      const grouped = { daily: [], weekly: [], monthly: [], social: [], vip: [], financial: [], achievement: [] };

      // Create a map of user task progress
      const userTaskMap = {};
      userTasks.forEach(ut => {
        userTaskMap[ut.task_id] = ut;
      });

      allTasks.forEach((t) => {
        const type = t.task_type || 'daily';
        let progress = 0;
        
        // Calculate progress based on task name/type
        const taskName = t.task_name.toLowerCase();
        
        // Daily tasks
        if (taskName.includes('daily login') || taskName.includes('log in')) progress = 1;
        if (taskName.includes('play') && taskName.includes('game')) {
          const count = parseInt(taskName.match(/\d+/)?.[0] || '0');
          progress = Math.min(gamesPlayed, count);
        }
        if (taskName.includes('mining')) progress = miningSessions;
        if (taskName.includes('earn') && taskName.includes('point')) {
          const count = parseInt(taskName.match(/\d+/)?.[0] || '0');
          progress = Math.min(user?.points || 0, count);
        }
        if (taskName.includes('win') && taskName.includes('game')) {
          // Would need win tracking - for now use games played / 2
          const count = parseInt(taskName.match(/\d+/)?.[0] || '0');
          progress = Math.min(Math.floor(gamesPlayed / 2), count);
        }
        
        // VIP tasks
        if (taskName.includes('vip') || taskName.includes('upgrade')) {
          if (taskName.includes('silver') || taskName.includes('level 2')) progress = vipLevel >= 2 ? 1 : 0;
          if (taskName.includes('gold') || taskName.includes('level 3')) progress = vipLevel >= 3 ? 1 : 0;
          if (taskName.includes('platinum') || taskName.includes('level 4')) progress = vipLevel >= 4 ? 1 : 0;
          if (taskName.includes('diamond') || taskName.includes('level 5')) progress = vipLevel >= 5 ? 1 : 0;
        }
        
        // Financial tasks
        if (taskName.includes('deposit')) {
          const totalDeposited = deposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
          if (taskName.includes('first')) progress = deposits.length > 0 ? 1 : 0;
          else {
            const amount = parseInt(taskName.match(/\$(\d+)/)?.[1] || '0');
            progress = Math.min(totalDeposited, amount);
          }
        }
        
        // Achievement tasks
        if (taskName.includes('achievement') || taskName.includes('unlock')) {
          const count = parseInt(taskName.match(/\d+/)?.[0] || '0');
          progress = Math.min(achievements.length, count);
        }
        
        // Check if task is claimed from database
        const userTask = userTaskMap[t.id];
        const isClaimed = userTask?.is_claimed || false;
        
        if (grouped[type]) {
          grouped[type].push({ 
            ...t, 
            progress,
            is_claimed: isClaimed,
            user_task_id: userTask?.id
          });
        }
      });

      setTasks(grouped);
      
      // Build claimed map from database
      const claimedMap = {};
      userTasks.forEach(ut => {
        if (ut.is_claimed) {
          claimedMap[ut.task_id] = true;
        }
      });
      setClaimed(claimedMap);
      
    } catch (e) {
      console.error('Error loading tasks:', e);
      const grouped = { daily: [], weekly: [], monthly: [], social: [], vip: [], financial: [], achievement: [] };
      FALLBACK_TASKS.forEach((t) => {
        grouped[t.task_type]?.push({ ...t, progress: t.id === 'daily_login' ? 1 : 0 });
      });
      setTasks(grouped);
    } finally {
      setLoading(false);
    }
  };

  const claimTask = async (task) => {
    if (claimed[task.id]) return;
    try {
      // Update task progress first
      await db.updateTaskProgress(user.userId, task.id, task.progress);
      
      // Claim the task with progress
      await db.claimTask(user.userId, task.id, task.progress);
      
      // Add points to user
      await db.addPoints(user.userId, task.reward_points);
      addPoints(task.reward_points);
      addNotification({ 
        type: 'success', 
        title: 'Task Complete!', 
        message: `+${task.reward_points} points earned` 
      });
      
      // Update local state
      const updated = { ...claimed, [task.id]: true };
      setClaimed(updated);
      
      // Refresh tasks to get updated data
      initTasks();
    } catch (e) {
      console.error('Error claiming task:', e);
      addNotification({ 
        type: 'error', 
        title: 'Error', 
        message: e.message || 'Failed to claim task. Please try again.' 
      });
    }
  };

  const tabs = [
    { key: 'daily', label: 'Daily', icon: '📅' },
    { key: 'weekly', label: 'Weekly', icon: '📆' },
    { key: 'monthly', label: 'Monthly', icon: '🗓️' },
    { key: 'social', label: 'Social', icon: '👥' },
    { key: 'vip', label: 'VIP', icon: '👑' },
    { key: 'financial', label: 'Financial', icon: '💰' },
    { key: 'achievement', label: 'Achievements', icon: '🏆' },
  ];

  const currentTasks = tasks[activeTab] || [];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Tasks</h1>
        <p className="text-muted mt-2">Complete tasks to earn bonus points</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'thin' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={activeTab === t.key ? 'btn btn-primary flex-shrink-0 px-4 py-2 text-sm' : 'btn btn-secondary flex-shrink-0 px-4 py-2 text-sm'}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton" style={{ height: '1rem', width: '75%', marginBottom: '0.75rem' }} />
              <div className="skeleton" style={{ height: '0.75rem', width: '50%' }} />
            </div>
          ))}
        </div>
      ) : currentTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
          <p className="text-muted">No {activeTab} tasks available</p>
        </div>
      ) : (
        <div className="grid-2">
          {currentTasks.map((task) => {
            const progress = task.progress || 0;
            const pct = Math.min((progress / task.required_count) * 100, 100);
            const complete = pct >= 100;
            const isClaimed = claimed[task.id];

            return (
              <div 
                key={task.id} 
                className="card p-5"
                style={{ 
                  borderColor: complete && !isClaimed ? 'rgba(16,185,129,0.3)' : undefined,
                  transition: 'all 0.3s'
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      width: '3rem',
                      height: '3rem',
                      fontSize: '1.5rem',
                      background: isClaimed ? 'rgba(16,185,129,0.1)' : complete ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    {isClaimed ? '✅' : task.icon}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-white text-sm">{task.task_name}</h3>
                      <span className="badge-primary text-xs flex-shrink-0">+{task.reward_points}</span>
                    </div>
                    <p className="text-xs text-muted mb-3">{task.description}</p>
                    {/* Progress bar */}
                    <div className="progress-track mb-2">
                      <div
                        className={complete ? 'progress-fill progress-fill-success' : 'progress-fill'}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dim">{progress}/{task.required_count}</span>
                      {complete && !isClaimed && (
                        <button
                          onClick={() => claimTask(task)}
                          className="text-xs font-semibold text-success"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Claim →
                        </button>
                      )}
                      {isClaimed && <span className="text-xs text-success font-medium">Claimed ✓</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
