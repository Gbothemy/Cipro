import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BenefitPage.css';

function BenefitPage({ user, updateUser, addNotification, onLogout }) {
  const navigate = useNavigate();
  const [claimedPacks, setClaimedPacks] = useState([]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authUser');
      addNotification('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  const rewardPacks = [
    { 
      id: 1, 
      name: 'Starter Pack', 
      icon: '🎁', 
      points: 1000, 
      rewards: { ton: 1, cati: 50, usdt: 2, giftPoints: 100 },
      description: 'Perfect for beginners'
    },
    { 
      id: 2, 
      name: 'Warrior Pack', 
      icon: '🛡️', 
      points: 3000, 
      rewards: { ton: 3, cati: 150, usdt: 5, giftPoints: 300 },
      description: 'For dedicated players'
    },
    { 
      id: 3, 
      name: 'Crimson Blade Pack', 
      icon: '⚔️', 
      points: 5000, 
      rewards: { ton: 5, cati: 250, usdt: 10, giftPoints: 500 },
      description: 'Powerful rewards await'
    },
    { 
      id: 4, 
      name: 'Hero Pack', 
      icon: '🦸', 
      points: 7500, 
      rewards: { ton: 8, cati: 400, usdt: 15, giftPoints: 750 },
      description: 'For true heroes'
    },
    { 
      id: 5, 
      name: 'Legendary Pack', 
      icon: '👑', 
      points: 10000, 
      rewards: { ton: 12, cati: 600, usdt: 25, giftPoints: 1000 },
      description: 'Ultimate rewards'
    }
  ];

  const handleClaimPack = (pack) => {
    if (user.points < pack.points || claimedPacks.includes(pack.id)) return;

    const newPoints = user.points - pack.points;
    const newBalance = {
      ton: user.balance.ton + pack.rewards.ton,
      cati: user.balance.cati + pack.rewards.cati,
      usdt: user.balance.usdt + pack.rewards.usdt
    };
    const newGiftPoints = user.giftPoints + pack.rewards.giftPoints;

    updateUser({
      points: newPoints,
      balance: newBalance,
      giftPoints: newGiftPoints
    });

    setClaimedPacks([...claimedPacks, pack.id]);
    addNotification(`🎉 ${pack.name} claimed successfully!`, 'success');
  };

  return (
    <div className="benefit-page">
      <div className="page-header">
        <h1 className="page-title">Benefits & Rewards</h1>
        <p className="page-subtitle">Track your progress and claim reward packs</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">{user.avatar}</div>
        <h2>{user.username}</h2>
        <p className="user-id">{user.userId}</p>
        
        <div className="vip-section">
          <div className="vip-header">
            <span>VIP Level {user.vipLevel}</span>
            <span>{user.exp} / {user.maxExp} EXP</span>
          </div>
          <div className="exp-bar">
            <div className="exp-fill" style={{ width: `${(user.exp / user.maxExp) * 100}%` }}></div>
          </div>
          <p className="exp-info">
            {user.maxExp - user.exp} EXP to next level
          </p>
        </div>

        <div className="gift-points">
          <span className="gift-icon">🎁</span>
          <span className="gift-label">Gift Points:</span>
          <span className="gift-value">{user.giftPoints}</span>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="stat-icon">📊</span>
            <div>
              <div className="stat-number">{user.completedTasks}</div>
              <div className="stat-text">Tasks</div>
            </div>
          </div>
          <div className="profile-stat">
            <span className="stat-icon">🔥</span>
            <div>
              <div className="stat-number">{user.dayStreak}</div>
              <div className="stat-text">Streak</div>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/profile/edit')} className="profile-edit-btn">
          ✏️ Edit Profile
        </button>

        <button onClick={handleLogout} className="profile-logout-btn">
          🚪 Logout
        </button>
      </div>

      <h3 className="section-title">Reward Packs</h3>
      <div className="packs-list">
        {rewardPacks.map(pack => {
          const canClaim = user.points >= pack.points;
          const isClaimed = claimedPacks.includes(pack.id);
          const progress = Math.min((user.points / pack.points) * 100, 100);
          
          return (
            <div key={pack.id} className={`pack-card ${canClaim && !isClaimed ? 'claimable' : ''} ${isClaimed ? 'claimed' : ''}`}>
              <div className="pack-icon">{pack.icon}</div>
              <div className="pack-info">
                <h4>{pack.name}</h4>
                <p className="pack-description">{pack.description}</p>
                <div className="pack-rewards-list">
                  <span>💎 {pack.rewards.ton} TON</span>
                  <span>🐱 {pack.rewards.cati} CATI</span>
                  <span>💵 {pack.rewards.usdt} USDT</span>
                  <span>🎁 {pack.rewards.giftPoints} GP</span>
                </div>
                <p className="pack-cost">{pack.points.toLocaleString()} points required</p>
                <div className="pack-progress">
                  <div className="pack-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              <button 
                className="claim-pack-btn" 
                disabled={!canClaim || isClaimed}
                onClick={() => handleClaimPack(pack)}
              >
                {isClaimed ? '✓ Claimed' : canClaim ? 'Claim' : 'Locked'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BenefitPage;
