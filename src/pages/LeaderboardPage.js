import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
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
    const fetchLeaderboardData = async () => {
      try {
        // Fetch leaderboard data from Supabase
        const [pointsData, earningsData, streakData, allUsers] = await Promise.all([
          db.getLeaderboard('points', 10),
          db.getLeaderboard('earnings', 10),
          db.getLeaderboard('streak', 10),
          db.getAllUsers()
        ]);

        // Format points leaderboard
        const pointsLeaderboard = pointsData.map((u, index) => ({
          rank: index + 1,
          username: u.username,
          avatar: u.avatar,
          points: u.points,
          vipLevel: u.vip_level || u.vipLevel
        }));

        // Format earnings leaderboard
        const earningsLeaderboard = earningsData.map((u, index) => ({
          rank: index + 1,
          username: u.username,
          avatar: u.avatar,
          earnings: u.total_earnings || 0,
          ton: u.balances?.ton || 0,
          cati: u.balances?.cati || 0,
          usdt: u.balances?.usdt || 0
        }));

        // Format streak leaderboard
        const streakLeaderboard = streakData.map((u, index) => ({
          rank: index + 1,
          username: u.username,
          avatar: u.avatar,
          streak: u.day_streak || u.dayStreak || 0,
          points: u.points
        }));

        setLeaderboardData({
          points: pointsLeaderboard,
          earnings: earningsLeaderboard,
          streak: streakLeaderboard
        });

        // Calculate current user rank
        const pointsRank = allUsers.findIndex(u => u.userId === user.userId) + 1;
        const earningsRank = [...allUsers]
          .sort((a, b) => (b.balance?.ton || 0) - (a.balance?.ton || 0))
          .findIndex(u => u.userId === user.userId) + 1;
        const streakRank = [...allUsers]
          .sort((a, b) => (b.dayStreak || 0) - (a.dayStreak || 0))
          .findIndex(u => u.userId === user.userId) + 1;

        setCurrentUserRank({
          points: { rank: pointsRank || allUsers.length + 1, total: allUsers.length },
          earnings: { rank: earningsRank || allUsers.length + 1, total: allUsers.length },
          streak: { rank: streakRank || allUsers.length + 1, total: allUsers.length }
        });
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      }
    };

    fetchLeaderboardData();
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
                <p>
                  💎 {player.ton?.toFixed(4) || 0} TON • 
                  🐱 {player.cati?.toFixed(2) || 0} CATI • 
                  💵 {player.usdt?.toFixed(2) || 0} USDT
                </p>
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
