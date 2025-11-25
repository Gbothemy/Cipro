import React, { useState, useEffect } from 'react';
import './LeaderboardPage.css';

function LeaderboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('points');
  const [leaderboardData, setLeaderboardData] = useState({
    points: [],
    earnings: [],
    streak: []
  });
  const [currentUserRank, setCurrentUserRank] = useState({
    points: { rank: 0, total: 0 },
    earnings: { rank: 0, total: 0 },
    streak: { rank: 0, total: 0 }
  });

  useEffect(() => {
    // Get all users from localStorage
    const getAllUsers = () => {
      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(key => key.startsWith('rewardGameUser_'));
      
      const users = userKeys.map(key => {
        try {
          const userData = JSON.parse(localStorage.getItem(key));
          return userData;
        } catch (e) {
          return null;
        }
      }).filter(u => u !== null);

      return users;
    };

    const users = getAllUsers();
    
    // Filter out admin and demo users
    const realUsers = users.filter(u => 
      !u.userId?.startsWith('ADMIN-') && 
      !u.userId?.startsWith('USR-98765') && 
      !u.username?.toLowerCase().includes('demo') &&
      !u.username?.toLowerCase().includes('admin')
    );
    
    // Sort by points
    const pointsLeaderboard = [...realUsers]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((u, index) => ({
        rank: index + 1,
        username: u.username,
        avatar: u.avatar,
        points: u.points,
        vipLevel: u.vipLevel
      }));

    // Sort by earnings (TON)
    const earningsLeaderboard = [...realUsers]
      .sort((a, b) => (b.balance?.ton || 0) - (a.balance?.ton || 0))
      .slice(0, 10)
      .map((u, index) => ({
        rank: index + 1,
        username: u.username,
        avatar: u.avatar,
        earnings: u.balance?.ton || 0,
        currency: 'TON'
      }));

    // Sort by streak
    const streakLeaderboard = [...realUsers]
      .sort((a, b) => (b.dayStreak || 0) - (a.dayStreak || 0))
      .slice(0, 10)
      .map((u, index) => ({
        rank: index + 1,
        username: u.username,
        avatar: u.avatar,
        streak: u.dayStreak || 0,
        points: u.points
      }));

    setLeaderboardData({
      points: pointsLeaderboard,
      earnings: earningsLeaderboard,
      streak: streakLeaderboard
    });

    // Calculate current user rank (using realUsers)
    const pointsRank = realUsers.sort((a, b) => b.points - a.points).findIndex(u => u.userId === user.userId) + 1;
    const earningsRank = realUsers.sort((a, b) => (b.balance?.ton || 0) - (a.balance?.ton || 0)).findIndex(u => u.userId === user.userId) + 1;
    const streakRank = realUsers.sort((a, b) => (b.dayStreak || 0) - (a.dayStreak || 0)).findIndex(u => u.userId === user.userId) + 1;

    setCurrentUserRank({
      points: { rank: pointsRank || realUsers.length + 1, total: realUsers.length },
      earnings: { rank: earningsRank || realUsers.length + 1, total: realUsers.length },
      streak: { rank: streakRank || realUsers.length + 1, total: realUsers.length }
    });
  }, [user.userId]);

  const getRankColor = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'default';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1 className="page-title">🏆 Leaderboard</h1>
        <p className="page-subtitle">Compete with players worldwide</p>
      </div>

      <div className="user-rank-card">
        <div className="user-rank-info">
          <div className="user-rank-avatar">{user.avatar}</div>
          <div className="user-rank-details">
            <h3>{user.username}</h3>
            <p>Your Rank: #{currentUserRank[activeTab].rank} of {currentUserRank[activeTab].total}</p>
          </div>
        </div>
        <div className="user-rank-stats">
          <div className="rank-stat">
            <span className="rank-stat-value">{user.points.toLocaleString()}</span>
            <span className="rank-stat-label">Points</span>
          </div>
          <div className="rank-stat">
            <span className="rank-stat-value">Level {user.vipLevel}</span>
            <span className="rank-stat-label">VIP</span>
          </div>
        </div>
      </div>

      <div className="leaderboard-tabs">
        <button 
          className={activeTab === 'points' ? 'active' : ''}
          onClick={() => setActiveTab('points')}
        >
          💎 Points
        </button>
        <button 
          className={activeTab === 'earnings' ? 'active' : ''}
          onClick={() => setActiveTab('earnings')}
        >
          💰 Earnings
        </button>
        <button 
          className={activeTab === 'streak' ? 'active' : ''}
          onClick={() => setActiveTab('streak')}
        >
          🔥 Streak
        </button>
      </div>

      <div className="leaderboard-list">
        {leaderboardData[activeTab].map((player) => (
          <div 
            key={player.rank} 
            className={`leaderboard-item ${getRankColor(player.rank)}`}
          >
            <div className="rank-badge">
              {getRankIcon(player.rank)}
            </div>
            <div className="player-avatar">{player.avatar}</div>
            <div className="player-info">
              <h4>{player.username}</h4>
              {activeTab === 'points' && (
                <p>{player.points.toLocaleString()} points • VIP {player.vipLevel}</p>
              )}
              {activeTab === 'earnings' && (
                <p>{player.earnings.toFixed(2)} {player.currency}</p>
              )}
              {activeTab === 'streak' && (
                <p>{player.streak} days • {player.points.toLocaleString()} pts</p>
              )}
            </div>
            {player.rank <= 3 && (
              <div className="trophy-icon">
                {player.rank === 1 && '👑'}
                {player.rank === 2 && '🥈'}
                {player.rank === 3 && '🥉'}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="leaderboard-footer">
        <p>🔄 Updates every hour</p>
        <p>Keep playing to climb the ranks!</p>
      </div>
    </div>
  );
}

export default LeaderboardPage;
