'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const TABS = [
  { key: 'points', label: 'Points', icon: '💎' },
  { key: 'earnings', label: 'Earnings', icon: '💰' },
  { key: 'streak', label: 'Streak', icon: '🔥' },
];

// Generate 50 default users for leaderboard
const AVATARS = ['🎮', '🚀', '⚡', '🔥', '💎', '🌟', '🎯', '🏆', '👑', '💰', '🎨', '🎭', '🎪', '🎬', '🎸', '🎺', '🎻', '🎹', '🥁', '🎤'];
const NAMES = [
  'CryptoKing', 'DiamondHands', 'MoonWalker', 'RocketMan', 'GemHunter', 'PointMaster', 'GameChamp', 'ProPlayer',
  'LuckyWinner', 'TopEarner', 'StreakLord', 'TaskMaster', 'CoinCollector', 'RewardSeeker', 'VIPPlayer', 'EliteGamer',
  'ChainBreaker', 'TokenHunter', 'ProfitMaker', 'WealthBuilder', 'PointChaser', 'GameNinja', 'CryptoWhale', 'MegaMiner',
  'StarPlayer', 'LegendaryUser', 'UltimateGamer', 'PowerPlayer', 'SuperStreak', 'MasterMiner', 'EpicWinner', 'ProMiner',
  'GoldDigger', 'TreasureHunter', 'FortuneSeeker', 'BonusKing', 'RewardHunter', 'PointCollector', 'TaskNinja', 'GameMaster',
  'CryptoLord', 'DiamondMiner', 'MoonShooter', 'StarChaser', 'WinStreak', 'TopGamer', 'ElitePlayer', 'ProChamp', 'MegaWinner', 'UltraPlayer'
];

const generateDefaultUsers = () => {
  return NAMES.map((name, i) => ({
    user_id: `DEFAULT-${i}`,
    username: name,
    avatar: AVATARS[i % AVATARS.length],
    points: Math.floor(Math.random() * 50000) + 10000 - (i * 800),
    total_earnings: (Math.random() * 500 + 50 - (i * 8)).toFixed(2),
    day_streak: Math.floor(Math.random() * 30) + 5 - Math.floor(i / 2),
    vip_level: i < 10 ? Math.floor(Math.random() * 3) + 2 : 1,
  })).sort((a, b) => b.points - a.points);
};

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
      
      // Use default users if database returns empty
      const defaultUsers = generateDefaultUsers();
      setData({ 
        points: points.length > 0 ? points : defaultUsers.sort((a, b) => b.points - a.points),
        earnings: earnings.length > 0 ? earnings : defaultUsers.sort((a, b) => b.total_earnings - a.total_earnings),
        streak: streak.length > 0 ? streak : defaultUsers.sort((a, b) => b.day_streak - a.day_streak),
      });
    } catch (e) {
      console.error(e);
      // On error, show default users
      const defaultUsers = generateDefaultUsers();
      setData({ 
        points: defaultUsers.sort((a, b) => b.points - a.points),
        earnings: defaultUsers.sort((a, b) => b.total_earnings - a.total_earnings),
        streak: defaultUsers.sort((a, b) => b.day_streak - a.day_streak),
      });
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
        <p className="text-muted mt-2">Top players ranked by performance</p>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {TABS.map((t) => (
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
