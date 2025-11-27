import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/supabase';
import './ProfilePage.css';

function ProfilePage({ user, updateUser, addNotification, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authUser');
      addNotification('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  const getTierName = (level) => {
    if (level >= 51) return { name: 'Diamond', icon: '💠', color: '#B9F2FF' };
    if (level >= 31) return { name: 'Platinum', icon: '💎', color: '#E5E4E2' };
    if (level >= 16) return { name: 'Gold', icon: '🥇', color: '#FFD700' };
    if (level >= 6) return { name: 'Silver', icon: '🥈', color: '#C0C0C0' };
    return { name: 'Bronze', icon: '🥉', color: '#CD7F32' };
  };

  const tier = getTierName(user.vipLevel);

  const stats = [
    { label: 'Total Points', value: user.points.toLocaleString(), icon: '💎', color: '#667eea' },
    { label: 'VIP Level', value: user.vipLevel, icon: '⭐', color: '#f59e0b' },
    { label: 'Games Played', value: user.completedTasks, icon: '🎮', color: '#10b981' },
    { label: 'Day Streak', value: user.dayStreak, icon: '🔥', color: '#ef4444' },
    { label: 'SOL Balance', value: user.balance?.sol?.toFixed(4) || '0.0000', icon: '◎', color: '#14F195' },
    { label: 'ETH Balance', value: user.balance?.eth?.toFixed(4) || '0.0000', icon: 'Ξ', color: '#627EEA' },
    { label: 'USDT Balance', value: user.balance?.usdt?.toFixed(2) || '0.00', icon: '💵', color: '#26a17b' },
    { label: 'USDC Balance', value: user.balance?.usdc?.toFixed(2) || '0.00', icon: '💵', color: '#2775CA' },
    { label: 'Gift Points', value: user.giftPoints || 0, icon: '🎁', color: '#f97316' }
  ];

  const achievements = [
    { id: 1, name: 'First Login', icon: '👋', unlocked: true },
    { id: 2, name: 'Week Warrior', icon: '🔥', unlocked: user.dayStreak >= 7 },
    { id: 3, name: 'Point Collector', icon: '💎', unlocked: user.points >= 1000 },
    { id: 4, name: 'Game Master', icon: '🎮', unlocked: user.completedTasks >= 10 },
    { id: 5, name: 'VIP Elite', icon: '⭐', unlocked: user.vipLevel >= 5 },
    { id: 6, name: 'Social Butterfly', icon: '👥', unlocked: false }
  ];

  const recentActivity = [
    { id: 1, action: 'Played Puzzle Game', points: '+50 pts', time: '2 hours ago', icon: '🧩' },
    { id: 2, action: 'Claimed Daily Reward', points: '+100 pts', time: '5 hours ago', icon: '🎁' },
    { id: 3, action: 'Level Up to VIP ' + user.vipLevel, points: '+200 pts', time: '1 day ago', icon: '⭐' },
    { id: 4, action: 'Completed Task', points: '+150 pts', time: '2 days ago', icon: '✅' }
  ];

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-banner" style={{ background: `linear-gradient(135deg, ${tier.color} 0%, #764ba2 100%)` }}>
          <div className="banner-content">
            <div className="profile-avatar-large">{user.avatar}</div>
            <div className="profile-info">
              <h1>{user.username}</h1>
              <p className="user-id-display">{user.userId}</p>
              <div className="tier-badge" style={{ background: tier.color }}>
                <span>{tier.icon}</span>
                <span>{tier.name} Tier</span>
              </div>
            </div>
          </div>
          <button className="edit-profile-btn" onClick={() => navigate('/profile/edit')}>
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* VIP Progress */}
      <div className="vip-progress-card">
        <div className="vip-progress-header">
          <div>
            <h3>VIP Level {user.vipLevel}</h3>
            <p>{user.exp} / {user.maxExp} EXP</p>
          </div>
          <button className="view-tiers-btn" onClick={() => navigate('/vip-tiers')}>
            View All Tiers →
          </button>
        </div>
        <div className="vip-progress-bar">
          <div 
            className="vip-progress-fill" 
            style={{ width: `${(user.exp / user.maxExp) * 100}%` }}
          ></div>
        </div>
        <p className="vip-progress-text">{user.maxExp - user.exp} EXP to next level</p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📈 Statistics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📜 Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid-profile">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card-profile" style={{ borderLeftColor: stat.color }}>
                  <div className="stat-icon-profile" style={{ color: stat.color }}>{stat.icon}</div>
                  <div className="stat-info-profile">
                    <div className="stat-value-profile">{stat.value}</div>
                    <div className="stat-label-profile">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-card" onClick={() => navigate('/game')}>
                  <span className="action-icon">🎮</span>
                  <span className="action-label">Play Games</span>
                </button>
                <button className="action-card" onClick={() => navigate('/tasks')}>
                  <span className="action-icon">📋</span>
                  <span className="action-label">View Tasks</span>
                </button>
                <button className="action-card" onClick={() => navigate('/daily-rewards')}>
                  <span className="action-icon">🎁</span>
                  <span className="action-label">Daily Rewards</span>
                </button>
                <button className="action-card" onClick={() => navigate('/conversion')}>
                  <span className="action-icon">🔄</span>
                  <span className="action-label">Convert Points</span>
                </button>
                <button className="action-card" onClick={() => navigate('/referral')}>
                  <span className="action-icon">👥</span>
                  <span className="action-label">Refer Friends</span>
                </button>
                <button className="action-card" onClick={() => navigate('/leaderboard')}>
                  <span className="action-icon">🏆</span>
                  <span className="action-label">Leaderboard</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="stats-tab">
            <div className="stats-section">
              <h3>📊 Earnings Overview</h3>
              <div className="earnings-cards">
                <div className="earning-card">
                  <div className="earning-icon">◎</div>
                  <div className="earning-info">
                    <div className="earning-value">{user.balance?.sol?.toFixed(4) || '0.0000'} SOL</div>
                    <div className="earning-label">Total SOL Earned</div>
                  </div>
                </div>
                <div className="earning-card">
                  <div className="earning-icon">Ξ</div>
                  <div className="earning-info">
                    <div className="earning-value">{user.balance?.eth?.toFixed(4) || '0.0000'} ETH</div>
                    <div className="earning-label">Total ETH Earned</div>
                  </div>
                </div>
                <div className="earning-card">
                  <div className="earning-icon">💵</div>
                  <div className="earning-info">
                    <div className="earning-value">{user.balance?.usdt?.toFixed(2) || '0.00'} USDT</div>
                    <div className="earning-label">Total USDT Earned</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h3>🎮 Gaming Statistics</h3>
              <div className="gaming-stats">
                <div className="gaming-stat">
                  <span className="gaming-stat-label">Total Games Played</span>
                  <span className="gaming-stat-value">{user.completedTasks}</span>
                </div>
                <div className="gaming-stat">
                  <span className="gaming-stat-label">Win Rate</span>
                  <span className="gaming-stat-value">85%</span>
                </div>
                <div className="gaming-stat">
                  <span className="gaming-stat-label">Favorite Game</span>
                  <span className="gaming-stat-value">Puzzle Challenge</span>
                </div>
                <div className="gaming-stat">
                  <span className="gaming-stat-label">Average Points/Game</span>
                  <span className="gaming-stat-value">{user.completedTasks > 0 ? Math.floor(user.points / user.completedTasks) : 0}</span>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h3>📅 Activity Statistics</h3>
              <div className="activity-stats">
                <div className="activity-stat">
                  <span className="activity-stat-icon">🔥</span>
                  <div>
                    <div className="activity-stat-value">{user.dayStreak} Days</div>
                    <div className="activity-stat-label">Current Streak</div>
                  </div>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat-icon">📆</span>
                  <div>
                    <div className="activity-stat-value">Recently</div>
                    <div className="activity-stat-label">Member Since</div>
                  </div>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat-icon">⏰</span>
                  <div>
                    <div className="activity-stat-value">{user.lastClaim ? 'Today' : 'Never'}</div>
                    <div className="activity-stat-label">Last Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <div className="achievements-header">
              <h3>🏆 Your Achievements</h3>
              <p>{achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked</p>
            </div>
            <div className="achievements-grid-profile">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card-profile ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon-profile">{achievement.icon}</div>
                  <div className="achievement-name-profile">{achievement.name}</div>
                  {achievement.unlocked && <div className="achievement-badge">✓</div>}
                  {!achievement.unlocked && <div className="achievement-lock">🔒</div>}
                </div>
              ))}
            </div>
            <button className="view-all-achievements-btn" onClick={() => navigate('/achievements')}>
              View All Achievements →
            </button>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="activity-tab">
            <h3>📜 Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <div className="activity-action">{activity.action}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                  <div className="activity-points">{activity.points}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Account Actions */}
      <div className="account-actions">
        <button className="action-btn-profile secondary" onClick={() => navigate('/profile/edit')}>
          ✏️ Edit Profile
        </button>
        <button className="action-btn-profile secondary" onClick={() => navigate('/notifications')}>
          🔔 Notifications
        </button>
        <button className="action-btn-profile danger" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
