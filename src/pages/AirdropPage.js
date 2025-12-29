import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import SEOHead from '../components/SEOHead';
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

  const handleClaim = async () => {
    if (!canClaim || claimed) return;

    setClaimed(true);
    
    const rewards = {
      sol: parseFloat((Math.random() * 0.000167 + 0.000033).toFixed(6)), // Max: 0.0002 SOL (~$0.005)
      eth: parseFloat((Math.random() * 0.000001 + 0.0000003).toFixed(7)), // Max: 0.0000013 ETH (~$0.003)
      usdt: parseFloat((Math.random() * 0.0033 + 0.0017).toFixed(4)), // Max: 0.005 USDT
      usdc: parseFloat((Math.random() * 0.0033 + 0.0017).toFixed(4)), // Max: 0.005 USDC
      points: Math.floor(Math.random() * 17 + 7) // Max: 24 points (scaled down from 700)
    };

    try {
      // Update balances in database
      await db.updateBalance(user.userId, 'sol', user.balance.sol + rewards.sol);
      await db.updateBalance(user.userId, 'eth', user.balance.eth + rewards.eth);
      await db.updateBalance(user.userId, 'usdt', user.balance.usdt + rewards.usdt);
      await db.updateBalance(user.userId, 'usdc', user.balance.usdc + rewards.usdc);
      
      // Update user data in database
      await db.updateUser(user.userId, {
        points: user.points + rewards.points,
        vipLevel: user.vipLevel,
        exp: user.exp,
        completedTasks: user.completedTasks,
        dayStreak: user.dayStreak + 1,
        lastClaim: new Date().toISOString()
      });

      // Update local state
      updateUser({
        balance: {
          sol: user.balance.sol + rewards.sol,
          eth: user.balance.eth + rewards.eth,
          usdt: user.balance.usdt + rewards.usdt,
          usdc: user.balance.usdc + rewards.usdc
        },
        points: user.points + rewards.points,
        lastClaim: new Date().toISOString(),
        dayStreak: user.dayStreak + 1
      });

      addNotification(`🎁 Claimed: ${rewards.sol.toFixed(6)} SOL, ${rewards.eth.toFixed(7)} ETH, ${rewards.usdt.toFixed(4)} USDT, ${rewards.usdc.toFixed(4)} USDC, ${rewards.points} Cipro!`, 'success');
      setClaimed(false);
      setCanClaim(false);
    } catch (error) {
      console.error('Error claiming airdrop:', error);
      addNotification('Failed to claim airdrop. Please try again.', 'error');
      setClaimed(false);
    }
  };

  return (
    <div className="airdrop-page">
      <SEOHead 
        title="🎁 Daily Crypto Airdrop - Free SOL, ETH, USDT, USDC | Cipro"
        description="🎁 Claim your daily cryptocurrency airdrops! Get free SOL, ETH, USDT & USDC rewards every day. Build your streak for bigger rewards. Claim your free crypto now!"
        keywords="daily crypto airdrop, free cryptocurrency, free SOL, free ETH, free USDT, free USDC, crypto rewards, daily rewards, cryptocurrency giveaway, free crypto daily"
        url="https://www.ciprohub.site/airdrop"
      />
      <div className="page-header">
        <h1 className="page-title">Airdrop Rewards</h1>
        <p className="page-subtitle">Claim your daily rewards and check your balance</p>
      </div>

      <div className="balance-section">
        <h2>Your Balance</h2>
        <div className="balance-grid">
          <div className="balance-item">
            <div className="currency-icon">◎</div>
            <div className="currency-info">
              <span className="currency-name">SOL</span>
              <span className="currency-amount">{user.balance.sol.toFixed(6)}</span>
            </div>
          </div>
          <div className="balance-item">
            <div className="currency-icon">Ξ</div>
            <div className="currency-info">
              <span className="currency-name">ETH</span>
              <span className="currency-amount">{user.balance.eth.toFixed(7)}</span>
            </div>
          </div>
          <div className="balance-item">
            <div className="currency-icon">💵</div>
            <div className="currency-info">
              <span className="currency-name">USDT</span>
              <span className="currency-amount">{user.balance.usdt.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="claim-section">
        <h3>Daily Rewards</h3>
        <p className="claim-description">
          {canClaim ? 'Claim your daily airdrop rewards now!' : 'Come back later for your next reward'}
        </p>
        {!canClaim && timeUntilNextClaim && (
          <div className="countdown-timer">
            <div className="timer-icon">⏰</div>
            <div className="timer-display">
              <div className="timer-label">Next claim in:</div>
              <div className="timer-value">{timeUntilNextClaim}</div>
            </div>
          </div>
        )}
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
