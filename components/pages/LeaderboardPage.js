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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [points, earnings, streak] = await Promise.all([
        db.getLeaderboard('points', 50),
        db.getLeaderboard('earnings', 50),
        db.getLeaderboard('streak', 50),
      ]);
      setData({ points, earnings, streak });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentList = data[activeTab] || [];

  const getValue = (entry) => {
    if (activeTab === 'points') return `${(entry.points || 0).toLocaleString()} pts`;
    if (activeTab === 'earnings') return `$${((entry.total_earnings || 0)).toFixed(2)}`;
    return `${entry.day_streak || 0} days`;
  };

  const getRankStyle = (i) => {
    if (i === 0) return 'text-amber-400';
    if (i === 1) return 'text-slate-300';
    if (i === 2) return 'text-amber-600';
    return 'text-slate-500';
  };

  const getRankIcon = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Leaderboard</h1>
        <p className="text-slate-400 mt-1">Top players ranked by performance</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-800/60 rounded-xl p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === t.key ? 'bg-primary text-white shadow-brand' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-8 h-4 bg-white/5 rounded" />
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div className="flex-1 h-4 bg-white/5 rounded" />
                <div className="w-20 h-4 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No data yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {currentList.map((entry, i) => {
              const isMe = entry.user_id === user?.userId || entry.userId === user?.userId;
              return (
                <div
                  key={entry.user_id || i}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${isMe ? 'bg-primary/5' : 'hover:bg-white/2'}`}
                >
                  <span className={`w-8 text-center font-bold text-sm ${getRankStyle(i)}`}>
                    {getRankIcon(i)}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-lg flex-shrink-0">
                    {entry.avatar || '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isMe ? 'text-primary' : 'text-white'}`}>
                      {entry.username || 'Anonymous'}
                      {isMe && <span className="ml-2 text-xs text-primary/70">(you)</span>}
                    </p>
                    {entry.vip_level > 1 && (
                      <span className="text-xs text-amber-400">VIP {entry.vip_level}</span>
                    )}
                  </div>
                  <span className="font-bold text-sm text-white">{getValue(entry)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
