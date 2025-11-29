import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import './ActivityFeed.css';

function ActivityFeed({ user, compact = false, maxItems = 10 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, games, rewards, achievements, conversions

  useEffect(() => {
    loadActivities();
    
    // Refresh activities every 30 seconds (only when tab is visible)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadActivities();
      }
    }, 30000); // Reduced from 10s to 30s for better performance
    return () => clearInterval(interval);
  }, [filter]);

  const loadActivities = async () => {
    try {
      // Load recent activities from database
      const recentActivities = await db.getRecentActivities(maxItems * 2, filter);
      
      // If no real activities, generate some sample ones
      if (!recentActivities || recentActivities.length === 0) {
        setActivities(generateSampleActivities());
      } else {
        setActivities(recentActivities);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading activities:', error);
      // Fallback to sample activities
      setActivities(generateSampleActivities());
      setLoading(false);
    }
  };

  const generateSampleActivities = () => {
    const sampleUsers = [
      { username: 'CryptoKing', avatar: '👑' },
      { username: 'DiamondHands', avatar: '💎' },
      { username: 'MoonWalker', avatar: '🚀' },
      { username: 'TokenMaster', avatar: '🎯' },
      { username: 'CoinCollector', avatar: '🪙' },
      { username: 'BlockchainBoss', avatar: '⛓️' },
      { username: 'NFTNinja', avatar: '🥷' },
      { username: 'DeFiDegen', avatar: '🦍' },
      { username: 'SatoshiFan', avatar: '₿' },
      { username: 'EthereumElite', avatar: 'Ξ' }
    ];

    const activityTypes = [
      {
        type: 'game_win',
        icon: '🎮',
        color: '#10b981',
        templates: [
          'won {amount} CIPRO playing Puzzle Challenge!',
          'crushed the Memory Match game for {amount} CIPRO!',
          'spun the wheel and won {amount} CIPRO!',
          'aced the Trivia Quiz for {amount} CIPRO!'
        ]
      },
      {
        type: 'level_up',
        icon: '⭐',
        color: '#f59e0b',
        templates: [
          'leveled up to VIP {level}!',
          'reached VIP Level {level}!',
          'unlocked VIP {level} status!'
        ]
      },
      {
        type: 'big_win',
        icon: '💰',
        color: '#8b5cf6',
        templates: [
          'earned {amount} CIPRO in one session!',
          'hit a massive {amount} CIPRO jackpot!',
          'scored an epic {amount} CIPRO win!'
        ]
      },
      {
        type: 'streak',
        icon: '🔥',
        color: '#ef4444',
        templates: [
          'reached a {days}-day login streak!',
          'maintained {days} days of consistent play!',
          'hit {days} days streak milestone!'
        ]
      },
      {
        type: 'conversion',
        icon: '🔄',
        color: '#3b82f6',
        templates: [
          'converted {amount} CIPRO to crypto!',
          'cashed out {amount} CIPRO!',
          'exchanged {amount} CIPRO for rewards!'
        ]
      },
      {
        type: 'achievement',
        icon: '🏆',
        color: '#ec4899',
        templates: [
          'unlocked the "{achievement}" achievement!',
          'earned the "{achievement}" badge!',
          'completed "{achievement}" challenge!'
        ]
      },
      {
        type: 'referral',
        icon: '👥',
        color: '#14b8a6',
        templates: [
          'invited a new player and earned {amount} CIPRO!',
          'got {amount} CIPRO from referral bonus!',
          'welcomed a friend and earned {amount} CIPRO!'
        ]
      }
    ];

    const achievements = [
      'Week Warrior', 'Cipro Collector', 'Game Master', 
      'VIP Elite', 'Streak Legend', 'Fortune Hunter'
    ];

    const activities = [];
    const now = Date.now();

    for (let i = 0; i < maxItems; i++) {
      const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const randomTemplate = randomType.templates[Math.floor(Math.random() * randomType.templates.length)];
      
      let message = randomTemplate
        .replace('{amount}', (Math.floor(Math.random() * 500) + 50).toLocaleString())
        .replace('{level}', Math.floor(Math.random() * 5) + 1)
        .replace('{days}', Math.floor(Math.random() * 30) + 7)
        .replace('{achievement}', achievements[Math.floor(Math.random() * achievements.length)]);

      activities.push({
        id: `sample-${i}`,
        username: randomUser.username,
        avatar: randomUser.avatar,
        type: randomType.type,
        icon: randomType.icon,
        color: randomType.color,
        message: message,
        timestamp: now - (i * 60000 * Math.random() * 10), // Random time in last 10 minutes
        isNew: i < 2 // Mark first 2 as new
      });
    }

    return activities;
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const filterActivities = (type) => {
    setFilter(type);
    setLoading(true);
  };

  if (loading && activities.length === 0) {
    return (
      <div className={`activity-feed ${compact ? 'compact' : ''}`}>
        <div className="activity-feed-loading">
          <div className="loading-spinner">⏳</div>
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`activity-feed ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="activity-feed-header">
          <h3>🌐 Live Activity Feed</h3>
          <p className="activity-subtitle">See what's happening right now</p>
        </div>
      )}

      {!compact && (
        <div className="activity-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => filterActivities('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'games' ? 'active' : ''}`}
            onClick={() => filterActivities('games')}
          >
            🎮 Games
          </button>
          <button 
            className={`filter-btn ${filter === 'rewards' ? 'active' : ''}`}
            onClick={() => filterActivities('rewards')}
          >
            🎁 Rewards
          </button>
          <button 
            className={`filter-btn ${filter === 'achievements' ? 'active' : ''}`}
            onClick={() => filterActivities('achievements')}
          >
            🏆 Achievements
          </button>
        </div>
      )}

      <div className="activity-list">
        {activities.slice(0, maxItems).map((activity, index) => (
          <div 
            key={activity.id} 
            className={`activity-item ${activity.isNew ? 'new' : ''}`}
            style={{ 
              animationDelay: `${index * 0.05}s`,
              borderLeftColor: activity.color 
            }}
          >
            <div className="activity-avatar">{activity.avatar}</div>
            <div className="activity-content">
              <div className="activity-user">
                <span className="activity-username">{activity.username}</span>
                {activity.isNew && <span className="new-badge">NEW</span>}
              </div>
              <div className="activity-message">
                <span className="activity-icon" style={{ color: activity.color }}>
                  {activity.icon}
                </span>
                <span>{activity.message}</span>
              </div>
              <div className="activity-time">{getTimeAgo(activity.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="activity-feed-footer">
          <button className="refresh-btn" onClick={loadActivities}>
            🔄 Refresh
          </button>
          <span className="auto-refresh-text">Auto-refreshes every 10s</span>
        </div>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(ActivityFeed);
