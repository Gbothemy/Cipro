'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useStore();
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    tasksCompleted: 0,
    achievements: 0,
    deposits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.userId) loadStats();
  }, [user?.userId]);

  const loadStats = async () => {
    try {
      const [games, tasks, achievements, deposits] = await Promise.all([
        db.getGameAttempts(user.userId).catch(() => []),
        db.getUserTasks(user.userId).catch(() => []),
        db.getUserAchievements(user.userId).catch(() => []),
        db.getDepositRequests(user.userId).catch(() => [])
      ]);
      
      setStats({
        gamesPlayed: games.length,
        tasksCompleted: tasks.filter(t => t.is_claimed).length,
        achievements: achievements.length,
        deposits: deposits.filter(d => d.status === 'approved').length
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'Play Games', desc: 'Earn points', icon: '🎮', path: '/game', color: '#667eea' },
    { title: 'Complete Tasks', desc: 'Get rewards', icon: '✅', path: '/tasks', color: '#10b981' },
    { title: 'Deposit Crypto', desc: 'Add funds', icon: '💰', path: '/deposit', color: '#f59e0b' },
    { title: 'Lucky Draw', desc: 'Win prizes', icon: '🎰', path: '/lucky-draw', color: '#ec4899' },
    { title: 'VIP Upgrade', desc: 'Get benefits', icon: '👑', path: '/vip-tiers', color: '#8b5cf6' },
    { title: 'Leaderboard', desc: 'Top players', icon: '🏆', path: '/leaderboard', color: '#06b6d4' },
  ];

  const vipProgress = ((user?.exp || 0) / (user?.maxExp || 1000)) * 100;

  return (
    <div className="page-container">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">
          Welcome back, {user?.username}! 👋
        </h1>
        <p className="text-muted">Here's your gaming overview</p>
      </div>

      {/* Stats Overview */}
      <div className="grid-4 mb-8">
        {[
          { label: 'Total Points', value: (user?.points || 0).toLocaleString(), icon: '💎', color: '#667eea' },
          { label: 'VIP Level', value: user?.vipLevel || 1, icon: '⭐', color: '#f59e0b' },
          { label: 'Day Streak', value: `${user?.dayStreak || 0} days`, icon: '🔥', color: '#ef4444' },
          { label: 'Games Played', value: stats.gamesPlayed, icon: '🎮', color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* VIP Progress */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white mb-1">VIP Progress</h3>
            <p className="text-xs text-dim">Level {user?.vipLevel || 1} • {user?.exp || 0} / {user?.maxExp || 1000} XP</p>
          </div>
          <button 
            onClick={() => router.push('/vip-tiers')}
            className="btn btn-primary btn-sm"
          >
            Upgrade
          </button>
        </div>
        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${vipProgress}%`,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
            }} 
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => router.push(action.path)}
              className="card-hover p-5 text-left"
            >
              <div 
                className="rounded-xl flex items-center justify-center mb-3"
                style={{
                  width: '3rem',
                  height: '3rem',
                  background: `${action.color}20`,
                  fontSize: '1.5rem'
                }}
              >
                {action.icon}
              </div>
              <h4 className="font-semibold text-white mb-1">{action.title}</h4>
              <p className="text-xs text-dim">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid-2 gap-6">
        {/* Balance Card */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">💰 Your Balance</h3>
          <div className="flex-col gap-3">
            {[
              { label: 'SOL', value: user?.balance?.sol || 0, icon: '◎', decimals: 4 },
              { label: 'ETH', value: user?.balance?.eth || 0, icon: 'Ξ', decimals: 4 },
              { label: 'USDT', value: user?.balance?.usdt || 0, icon: '₮', decimals: 2 },
              { label: 'USDC', value: user?.balance?.usdc || 0, icon: '$', decimals: 2 },
            ].map((crypto, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-muted">{crypto.icon} {crypto.label}</span>
                <span className="text-sm font-medium text-white">
                  {Number(crypto.value).toFixed(crypto.decimals)}
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => router.push('/deposit')}
            className="btn btn-primary btn-full mt-4"
          >
            Deposit Crypto
          </button>
        </div>

        {/* Achievements Card */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">🏆 Achievements</h3>
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎖️</div>
            <p className="text-2xl font-bold text-white mb-1">{stats.achievements}</p>
            <p className="text-sm text-muted mb-4">Unlocked</p>
            <button 
              onClick={() => router.push('/achievements')}
              className="btn btn-secondary btn-full"
            >
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
