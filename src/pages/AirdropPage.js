import React, { useState, useEffect } from 'react';
import './AirdropPage.css';

function AirdropPage({ user, updateUser, addNotification }) {
  const [claimed, setClaimed] = useState(false);
  const [canClaim, setCanClaim] = useState(true);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState('');

  useEffect(() => {
    checkClaimStatus();
    const interval = setInterval(checkClaimStatus, 1000);
    return () => clearInterval(interval);
  }, [user.lastClaim]);

  const checkClaimStatus = () => {
    if (!user.lastClaim) {
      setCanClaim(true);
      return;
    }

    const lastClaimDate = new Date(user.lastClaim);
    const now = new Date();
    const nextClaimTime = new Date(lastClaimDate);
    nextClaimTime.setHours(24, 0, 0, 0);

    if (now >= nextClaimTime) {
      setCanClaim(true);
      setTimeUntilNextClaim('');
    } else {
      setCanClaim(false);
      const diff = nextClaimTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilNextClaim(`${hours}h ${minutes}m ${seconds}s`);
    }
  };

  const handleClaim = () => {
    if (!canClaim || claimed) return;

    setClaimed(true);
    
    const rewards = {
      ton: parseFloat((Math.random() * 5 + 1).toFixed(2)),
      cati: Math.floor(Math.random() * 100 + 50),
      usdt: parseFloat((Math.random() * 10 + 5).toFixed(2)),
      points: Math.floor(Math.random() * 500 + 200)
    };

    setTimeout(() => {
      updateUser({
        balance: {
          ton: user.balance.ton + rewards.ton,
          cati: user.balance.cati + rewards.cati,
          usdt: user.balance.usdt + rewards.usdt
        },
        points: user.points + rewards.points,
        lastClaim: new Date().toISOString(),
        dayStreak: user.dayStreak + 1
      });

      addNotification(`🎁 Claimed: ${rewards.ton} TON, ${rewards.cati} CATI, ${rewards.usdt} USDT, ${rewards.points} Points!`, 'success');
      setClaimed(false);
      setCanClaim(false);
    }, 1500);
  };

  return (
    <div className="airdrop-page">
      <div className="page-header">
        <h1 className="page-title">Airdrop Rewards</h1>
        <p className="page-subtitle">Claim your daily rewards and check your balance</p>
      </div>

      <div className="balance-section">
        <h2>Your Balance</h2>
        <div className="balance-grid">
          <div className="balance-item">
            <div className="currency-icon">💎</div>
            <div className="currency-info">
              <span className="currency-name">TON</span>
              <span className="currency-amount">{user.balance.ton}</span>
            </div>
          </div>
          <div className="balance-item">
            <div className="currency-icon">🐱</div>
            <div className="currency-info">
              <span className="currency-name">CATI</span>
              <span className="currency-amount">{user.balance.cati}</span>
            </div>
          </div>
          <div className="balance-item">
            <div className="currency-icon">💵</div>
            <div className="currency-info">
              <span className="currency-name">USDT</span>
              <span className="currency-amount">{user.balance.usdt}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="claim-section">
        <h3>Daily Rewards</h3>
        <p className="claim-description">
          {canClaim ? 'Claim your daily airdrop rewards now!' : `Next claim in: ${timeUntilNextClaim}`}
        </p>
        <div className="streak-info">
          <span className="streak-icon">🔥</span>
          <span className="streak-text">{user.dayStreak} Day Streak</span>
        </div>
        <button 
          className={`claim-btn ${claimed ? 'claimed' : ''} ${!canClaim ? 'disabled' : ''}`}
          onClick={handleClaim}
          disabled={claimed || !canClaim}
        >
          {claimed ? '✓ Claiming...' : canClaim ? '🎁 Claim Rewards' : `⏱️ ${timeUntilNextClaim}`}
        </button>
      </div>

      <div className="rewards-info">
        <h3>Upcoming Airdrops</h3>
        <div className="airdrop-card">
          <div className="airdrop-icon">🎉</div>
          <div className="airdrop-details">
            <h4>Weekly Bonus</h4>
            <p>Available in 3 days</p>
          </div>
        </div>
        <div className="airdrop-card">
          <div className="airdrop-icon">🏆</div>
          <div className="airdrop-details">
            <h4>Achievement Reward</h4>
            <p>Complete 10 more tasks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AirdropPage;
