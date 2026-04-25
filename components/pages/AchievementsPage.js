'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_game', title: 'First Game', description: 'Play your first game', icon: '🎮', points: 50, category: 'games' },
  { id: 'game_10', title: 'Gamer', description: 'Play 10 games', icon: '🕹️', points: 100, category: 'games' },
  { id: 'game_50', title: 'Pro Gamer', description: 'Play 50 games', icon: '🏆', points: 300, category: 'games' },
  { id: 'points_1000', title: 'Point Collector', description: 'Earn 1,000 points', icon: '💎', points: 100, category: 'points' },
  { id: 'points_10000', title: 'Point Master', description: 'Earn 10,000 points', icon: '💰', points: 500, category: 'points' },
  { id: 'streak_7', title: 'Week Warrior', description: '7-day login streak', icon: '🔥', points: 200, category: 'streak' },
  { id: 'streak_30', title: 'Monthly Legend', description: '30-day login streak', icon: '👑', points: 1000, category: 'streak' },
  { id: 'first_convert', title: 'Crypto Earner', description: 'Make your first conversion', icon: '💳', points: 150, category: 'crypto' },
  { id: 'referral_1', title: 'Recruiter', description: 'Refer your first friend', icon: '👥', points: 200, category: 'social' },
];

export default function AchievementsPage() {
  const { user } = useStore();
  const [achievements, setAchievements] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.userId) loadAchievements();
  }, [user?.userId]);

  const loadAchievements = async () => {
    try {
      const [all, userAch] = await Promise.all([
        db.getAchievements().catch(() => []),
        db.getUserAchievements(user.userId).catch(() => []),
      ]);
      setAchievements(all.length > 0 ? all : DEFAULT_ACHIEVEMENTS);
      setUnlocked(userAch.map((a) => a.achievement_id || a.id));
    } catch (e) {
      setAchievements(DEFAULT_ACHIEVEMENTS);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'games', 'points', 'streak', 'crypto', 'social'];
  const filtered = filter === 'all' ? achievements : achievements.filter((a) => a.category === filter);
  const unlockedCount = unlocked.length;

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Achievements</h1>
        <p className="text-muted mt-2">{unlockedCount}/{achievements.length} unlocked</p>
      </div>

      {/* Progress */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-light">Overall Progress</span>
          <span className="text-sm font-bold text-primary">{unlockedCount}/{achievements.length}</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={filter === c ? 'btn btn-primary flex-shrink-0 px-4 py-2 text-sm capitalize' : 'btn btn-secondary flex-shrink-0 px-4 py-2 text-sm capitalize'}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 skeleton" style={{ height: '7rem' }} />
          ))}
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((ach) => {
            const isUnlocked = unlocked.includes(ach.id);
            return (
              <div
                key={ach.id}
                className="card p-5"
                style={{
                  borderColor: isUnlocked ? 'rgba(251,191,36,0.3)' : undefined,
                  background: isUnlocked ? 'rgba(251,191,36,0.03)' : undefined,
                  opacity: isUnlocked ? 1 : 0.6,
                  transition: 'all 0.3s'
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '3rem',
                      height: '3rem',
                      fontSize: '1.5rem',
                      background: isUnlocked ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
                      filter: isUnlocked ? 'none' : 'grayscale(1)'
                    }}
                  >
                    {ach.icon}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm">{ach.title}</h3>
                      {isUnlocked && <span className="text-warning text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-muted mb-2">{ach.description}</p>
                    <span className="badge-primary text-xs">+{ach.reward_points || ach.points} pts</span>
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
