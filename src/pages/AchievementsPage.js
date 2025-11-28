import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import './AchievementsPage.css';

function AchievementsPage({ user, updateUser, addNotification }) {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unlocked, locked

  useEffect(() => {
    loadAchievements();
  }, [user.userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [allAchievements, userAchievementsData] = await Promise.all([
        db.getAchievements(),
        db.getUserAchievements(user.userId)
      ]);

      setAchievements(allAchievements);
      setUserAchievements(userAchievementsData);
    } catch (error) {
      console.error('Error loading achievements:', error);
      addNotification('Failed to load achievements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getUnlockedDate = (achievementId) => {
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievementId);
    return userAchievement ? new Date(userAchievement.unlocked_at) : null;
  };

  const getFilteredAchievements = () => {
    if (filter === 'unlocked') {
      return achievements.filter(a => isUnlocked(a.id));
    }
    if (filter === 'locked') {
      return achievements.filter(a => !isUnlocked(a.id));
    }
    return achievements;
  };

  const getAchievementsByCategory = (category) => {
    return getFilteredAchievements().filter(a => a.category === category);
  };

  const getUnlockedCount = () => {
    return userAchievements.length;
  };

  const getTotalPoints = () => {
    return userAchievements.reduce((sum, ua) => {
      const achievement = achievements.find(a => a.id === ua.achievement_id);
      return sum + (achievement?.reward_points || 0);
    }, 0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const categories = ['starter', 'cipro', 'games', 'streak', 'vip'];
  const categoryIcons = {
    starter: '🎯',
    points: '💎',
    games: '🎮',
    streak: '🔥',
    vip: '⭐'
  };
  const categoryNames = {
    starter: 'Starter',
    cipro: 'Cipro Master',
    games: 'Game Champion',
    streak: 'Streak Legend',
    vip: 'VIP Elite'
  };

  if (loading) {
    return (
      <div className="achievements-page">
        <div className="page-header">
          <h1 className="page-title">🏆 Achievements</h1>
          <p className="page-subtitle">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-page">
      <div className="page-header">
        <h1 className="page-title">🏆 Achievements</h1>
        <p className="page-subtitle">Unlock achievements and earn rewards</p>
      </div>

      {/* Stats */}
      <div className="achievements-stats">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <div className="stat-value">{getUnlockedCount()}/{achievements.length}</div>
            <div className="stat-label">Unlocked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-info">
            <div className="stat-value">{getTotalPoints()}</div>
            <div className="stat-label">Cipro Earned</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{Math.round((getUnlockedCount() / achievements.length) * 100)}%</div>
            <div className="stat-label">Completion</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="achievements-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({achievements.length})
        </button>
        <button
          className={`filter-btn ${filter === 'unlocked' ? 'active' : ''}`}
          onClick={() => setFilter('unlocked')}
        >
          Unlocked ({getUnlockedCount()})
        </button>
        <button
          className={`filter-btn ${filter === 'locked' ? 'active' : ''}`}
          onClick={() => setFilter('locked')}
        >
          Locked ({achievements.length - getUnlockedCount()})
        </button>
      </div>

      {/* Achievements by Category */}
      {categories.map(category => {
        const categoryAchievements = getAchievementsByCategory(category);
        if (categoryAchievements.length === 0) return null;

        return (
          <div key={category} className="achievements-section">
            <div className="section-header">
              <h2>{categoryIcons[category]} {categoryNames[category]}</h2>
              <span className="section-info">
                {categoryAchievements.filter(a => isUnlocked(a.id)).length}/{categoryAchievements.length}
              </span>
            </div>
            <div className="achievements-grid">
              {categoryAchievements.map(achievement => {
                const unlocked = isUnlocked(achievement.id);
                const unlockedDate = getUnlockedDate(achievement.id);

                return (
                  <div
                    key={achievement.id}
                    className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-content">
                      <h3>{achievement.achievement_name}</h3>
                      <p>{achievement.description}</p>
                      <div className="achievement-requirement">
                        <span className="requirement-text">
                          {achievement.requirement_text}
                        </span>
                      </div>
                      <div className="achievement-reward">
                        <span className="reward-icon">💎</span>
                        <span className="reward-amount">+{achievement.reward_points} CIPRO</span>
                      </div>
                      {unlocked && unlockedDate && (
                        <div className="achievement-date">
                          Unlocked on {formatDate(unlockedDate)}
                        </div>
                      )}
                    </div>
                    <div className="achievement-status">
                      {unlocked ? (
                        <span className="status-badge unlocked">✓ Unlocked</span>
                      ) : (
                        <span className="status-badge locked">🔒 Locked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {getFilteredAchievements().length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>No achievements found</h3>
          <p>Try changing your filter</p>
        </div>
      )}
    </div>
  );
}

export default AchievementsPage;
