'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const TABS = [
  { key: 'points', label: 'Points', icon: '💎' },
  { key: 'earnings', label: 'Earnings', icon: '💰' },
  { key: 'streak', label: 'Streak', icon: '🔥' },
];

export default function LeaderboardPage() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState('points');
  const [data, setData] = useState({ points: [], earnings: [], streak: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchData();
    const refreshTimer = window.setInterval(() => fetchData(true), 30000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [points, earnings, streak] = await Promise.all([
        db.getLeaderboard('points', 50),
        db.getLeaderboard('earnings', 50),
        db.getLeaderboard('streak', 50),
      ]);
      
      const normalizeAndSort = (realUsers = [], sortKey) => {
        return realUsers.map((entry) => ({
          ...entry,
          points: Number(entry.points) || 0,
          total_earnings: Number(entry.total_earnings) || 0,
          day_streak: Number(entry.day_streak) || 0,
          vip_level: Number(entry.vip_level) || 1,
        })).sort((a, b) => {
          const aVal = Number(a[sortKey] || 0);
          const bVal = Number(b[sortKey] || 0);
          return bVal - aVal;
        });
      };
      
      setData({ 
        points: normalizeAndSort(points, 'points'),
        earnings: normalizeAndSort(earnings, 'total_earnings'),
        streak: normalizeAndSort(streak, 'day_streak'),
      });
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      setError('Live rankings are temporarily unavailable.');
      setData({ points: [], earnings: [], streak: [] });
      setLastUpdated(new Date());
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const currentList = data[activeTab] || [];

  const getValue = (entry) => {
      if (activeTab === 'points') return `${(entry.points || 0).toLocaleString()} pts`;
      if (activeTab === 'earnings') return `$${Number(entry.total_earnings || 0).toFixed(2)}`;
      return `${entry.day_streak || 0} days`;
    };

  const getRankStyle = (i) => {
    if (i === 0) return '#fbbf24'; // gold
    if (i === 1) return '#cbd5e1'; // silver
    if (i === 2) return '#d97706'; // bronze
    return '#64748b'; // default
  };

  const getRankIcon = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <div className="page-container-md">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Leaderboard</h1>
        <p className="text-muted mt-2">
          {activeTab === 'earnings'
            ? 'Ranked by the estimated USD value of approved lifetime withdrawals'
            : activeTab === 'points'
              ? 'Ranked by lifetime points accumulated, including converted points'
              : 'Top players ranked by performance'}
        </p>
        <p className="text-xs text-dim mt-2" aria-live="polite">
          <span style={{ color: '#22c55e' }}>●</span>{' '}
          Live updates every 30 seconds
          {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={activeTab === t.key ? 'tab tab-active' : 'tab'}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert-warning mb-4">{error}</div>}

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divider" style={{ margin: 0 }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="skeleton" style={{ width: '2rem', height: '1rem' }} />
                <div className="skeleton rounded-full" style={{ width: '2.5rem', height: '2.5rem' }} />
                <div className="skeleton flex-1" style={{ height: '1rem' }} />
                <div className="skeleton" style={{ width: '5rem', height: '1rem' }} />
              </div>
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <p>No leaderboard data available</p>
          </div>
        ) : (
          <div>
            {currentList.map((entry, i) => {
              const isMe = entry.user_id === user?.userId || entry.userId === user?.userId;
              return (
                <div
                  key={entry.user_id || i}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{
                    background: isMe ? 'rgba(102,126,234,0.05)' : 'transparent',
                    borderBottom: i < currentList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => !isMe && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => !isMe && (e.currentTarget.style.background = 'transparent')}
                >
                  <span 
                    className="font-bold text-sm text-center"
                    style={{ 
                      width: '2rem',
                      color: getRankStyle(i)
                    }}
                  >
                    {getRankIcon(i)}
                  </span>
                  <div 
                    className="rounded-full flex items-center justify-center flex-shrink-0 bg-grad-brand"
                    style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.125rem' }}
                  >
                    {entry.avatar || '👤'}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <p className={`font-semibold text-sm truncate ${isMe ? 'text-primary' : 'text-white'}`}>
                      {entry.username || 'Anonymous'}
                      {isMe && <span className="ml-2 text-xs" style={{ color: 'rgba(102,126,234,0.7)' }}>(you)</span>}
                    </p>
                    {entry.vip_level > 1 && (
                      <span className="text-xs text-warning">VIP {entry.vip_level}</span>
                    )}
                  </div>
                  <span className="font-bold text-sm text-white" style={{ whiteSpace: 'nowrap' }}>{getValue(entry)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
