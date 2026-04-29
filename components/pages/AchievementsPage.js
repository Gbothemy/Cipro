'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';
import { checkAndUnlockAchievements, getUserStatsForAchievements } from '../../lib/achievementChecker';

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
  const { user, addPoints, addNotification } = useStore();
  const [achievements, setAchievements] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
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
      
      // Map database achievements to match component format
      const mappedAchievements = all.length > 0 
        ? all.map(a => ({
            id: a.id,
            title: a.achievement_name,
            description: a.description,
            icon: a.icon || '🏆',
            reward_points: a.reward_points,
            category: a.category,
            requirement_text: a.requirement_text,
          }))
        : DEFAULT_ACHIEVEMENTS;
      
      setAchievements(mappedAchievements);
      setUnlocked(userAch.map((a) => a.achievement_id || a.id));
    } catch (e) {
      console.error('Error loading achievements:', e);
      setAchievements(DEFAULT_ACHIEVEMENTS);
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async () => {
    if (checking) return;
    setChecking(true);
    
    try {
      // Get user stats
      const stats = await getUserStatsForAchievements(user.userId);
      
      // Check and unlock achievements
      const newlyUnlocked = await checkAndUnlockAchievements(user.userId, stats);
      
      if (newlyUnlocked.length > 0) {
        // Add points for all newly unlocked achievements
        const totalPoints = newlyUnlocked.reduce((sum, a) => sum + a.reward_points, 0);
        addPoints(totalPoints);
        
        // Show notifications
        newlyUnlocked.forEach(achievement => {
          addNotification({
            type: 'success',
            title: '🏆 Achievement Unlocked!',
            message: `${achievement.achievement_name} (+${achievement.reward_points} pts)`,
          });
        });
        
        // Reload achievements
        await loadAchievements();
      } else {
        addNotification({
          type: 'info',
          title: 'All Caught Up!',
          message: 'No new achievements to unlock',
        });
      }
    } catch (e) {
      console.error('Error checking achievements:', e);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to check achievements',
      });
    } finally {
      setChecking(false);
    }
  };

  const categories = ['all', 'points', 'games', 'streak', 'tasks', 'social', 'vip', 'financial', 'lucky', 'special'];
  const filtered = filter === 'all' ? achievements : achievements.filter((a) => a.category === filter);
  const unlockedCount = unlocked.length;

  return (
    <div className="page-container">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Achievements</h1>
            <p className="text-muted mt-2">{unlockedCount}/{achievements.length} unlocked</p>
          </div>
          <button
            onClick={checkAchievements}
            disabled={checking}
            className="btn btn-primary px-4 py-2"
          >
            {checking ? '⏳ Checking...' : '🔍 Check Progress'}
          </button>
        </div>
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
