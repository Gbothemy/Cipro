'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const FALLBACK_TASKS = [
  { id: 'daily_login', task_name: 'Daily Login', description: 'Log in today', icon: '🔑', required_count: 1, reward_points: 50, task_type: 'daily' },
  { id: 'play_games', task_name: 'Play 3 Games', description: 'Play any 3 games', icon: '🎮', required_count: 3, reward_points: 100, task_type: 'daily' },
  { id: 'mining_session', task_name: 'Mining Session', description: 'Complete a mining session', icon: '⛏️', required_count: 1, reward_points: 75, task_type: 'daily' },
  { id: 'earn_points', task_name: 'Earn 200 Points', description: 'Earn 200 points today', icon: '💎', required_count: 200, reward_points: 150, task_type: 'daily' },
  { id: 'weekly_games', task_name: 'Play 20 Games', description: 'Play 20 games this week', icon: '🏆', required_count: 20, reward_points: 500, task_type: 'weekly' },
  { id: 'monthly_points', task_name: 'Earn 5000 Points', description: 'Earn 5000 points this month', icon: '🌟', required_count: 5000, reward_points: 2000, task_type: 'monthly' },
];

export default function TasksPage() {
  const { user, addPoints, addNotification } = useStore();
  const [tasks, setTasks] = useState({ daily: [], weekly: [], monthly: [] });
  const [claimed, setClaimed] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    if (user?.userId) initTasks();
  }, [user?.userId]);

  const initTasks = async () => {
    const today = new Date().toISOString().split('T')[0];
    const claimedKey = `claimedTasks_${user.userId}_${today}`;
    const savedClaimed = JSON.parse(localStorage.getItem(claimedKey) || '{}');
    setClaimed(savedClaimed);

    try {
      const [dbTasks, gamesPlayed] = await Promise.all([
        db.getTasks().catch(() => []),
        db.getGamesPlayedToday(user.userId).catch(() => 0),
      ]);

      const allTasks = dbTasks.length > 0 ? dbTasks : FALLBACK_TASKS;
      const grouped = { daily: [], weekly: [], monthly: [] };

      allTasks.forEach((t) => {
        const type = t.task_type || 'daily';
        let progress = 0;
        if (t.id === 'daily_login') progress = 1;
        if (t.id === 'play_games') progress = Math.min(gamesPlayed, t.required_count);
        if (t.id === 'earn_points') progress = Math.min(user.points || 0, t.required_count);
        if (grouped[type]) grouped[type].push({ ...t, progress });
      });

      setTasks(grouped);
    } catch (e) {
      const grouped = { daily: [], weekly: [], monthly: [] };
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
      await db.addPoints(user.userId, task.reward_points);
      addPoints(task.reward_points);
      addNotification({ type: 'success', title: 'Task Complete!', message: `+${task.reward_points} points earned` });
      const today = new Date().toISOString().split('T')[0];
      const claimedKey = `claimedTasks_${user.userId}_${today}`;
      const updated = { ...claimed, [task.id]: true };
      setClaimed(updated);
      localStorage.setItem(claimedKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    { key: 'daily', label: 'Daily', icon: '📅' },
    { key: 'weekly', label: 'Weekly', icon: '📆' },
    { key: 'monthly', label: 'Monthly', icon: '🗓️' },
  ];

  const currentTasks = tasks[activeTab] || [];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Tasks</h1>
        <p className="text-muted mt-2">Complete tasks to earn bonus points</p>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6" style={{ width: 'fit-content' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={activeTab === t.key ? 'tab tab-active' : 'tab'}
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
