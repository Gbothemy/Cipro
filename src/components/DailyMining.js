import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import AnimatedCounter from './AnimatedCounter';
import ProgressBar from './ProgressBar';
import ConfettiEffect from './ConfettiEffect';
import haptics from '../utils/haptics';
import './DailyMining.css';

function DailyMining({ user, updateUser, addNotification }) {
  const [mining, setMining] = useState(false);
  const [lastMineTime, setLastMineTime] = useState(null);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [miningProgress, setMiningProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalMined, setTotalMined] = useState(0);

  const COOLDOWN_HOURS = 8;
  const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000; // 8 hours in milliseconds
  const MINING_DURATION = 5000; // 5 seconds mining animation
  const BASE_REWARD = 200; // Base Cipro reward
  const VIP_MULTIPLIER = {
    // Bronze Tier (Levels 1-4) - FREE
    1: 1, 2: 1, 3: 1, 4: 1,
    // Silver Tier (Levels 5-8) - Subscription
    5: 1.2, 6: 1.2, 7: 1.2, 8: 1.2,
    // Gold Tier (Levels 9-12) - Subscription
    9: 1.5, 10: 1.5, 11: 1.5, 12: 1.5,
    // Platinum Tier (Levels 13-16) - Subscription
    13: 2.0, 14: 2.0, 15: 2.0, 16: 2.0,
    // Diamond Tier (Levels 17-20) - Subscription
    17: 2.5, 18: 2.5, 19: 2.5, 20: 2.5
  };

  useEffect(() => {
    loadMiningData();
  }, [user.userId]);

  // Update local state when user prop changes (e.g., after mining)
  useEffect(() => {
    if (user.last_mine_time) {
      const lastMine = new Date(user.last_mine_time).getTime();
      setLastMineTime(lastMine);
    }
    if (user.total_mined !== undefined) {
      setTotalMined(user.total_mined);
    }
  }, [user.last_mine_time, user.total_mined]);

  // Update cooldown timer every second (only when tab is visible)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateCooldown();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastMineTime]);

  const loadMiningData = async () => {
    try {
      // Load from database instead of localStorage
      const userData = await db.getUser(user.userId);
      if (userData) {
        const lastMine = userData.last_mine_time ? new Date(userData.last_mine_time).getTime() : null;
        setLastMineTime(lastMine);
        setTotalMined(userData.total_mined || 0);
      }
    } catch (e) {
      console.error('Error loading mining data:', e);
    }
  };

  const updateCooldown = () => {
    if (!lastMineTime) {
      setTimeUntilNext(0);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastMineTime;
    const remaining = COOLDOWN_MS - elapsed;

    if (remaining <= 0) {
      setTimeUntilNext(0);
    } else {
      setTimeUntilNext(remaining);
    }
  };

  const canMine = () => {
    if (!lastMineTime) return true;
    return Date.now() - lastMineTime >= COOLDOWN_MS;
  };

  const calculateReward = () => {
    const vipLevel = user.vipLevel || 1;
    const multiplier = VIP_MULTIPLIER[vipLevel] || 1;
    return Math.floor(BASE_REWARD * multiplier);
  };

  const startMining = async () => {
    if (!canMine() || mining) return;

    setMining(true);
    setMiningProgress(0);
    haptics.medium();

    // Animate progress
    const progressInterval = setInterval(() => {
      setMiningProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / (MINING_DURATION / 100));
      });
    }, 100);

    // Complete mining after duration
    setTimeout(async () => {
      await completeMining();
      clearInterval(progressInterval);
    }, MINING_DURATION);
  };

  const completeMining = async () => {
    const reward = calculateReward();
    const expReward = Math.floor(reward / 4); // 25% of Cipro as EXP
    const newPoints = user.points + reward;
    const newExp = user.exp + expReward;
    const newTotalMined = totalMined + reward;

    // Check for level up
    let newLevel = user.vipLevel;
    let finalExp = newExp;
    if (newExp >= user.maxExp) {
      newLevel = user.vipLevel + 1;
      finalExp = newExp - user.maxExp;
      addNotification(`🎉 Level Up! You are now VIP Level ${newLevel}!`, 'success');
    }

    try {
      // Update user in database with mining data
      const now = new Date().toISOString();
      await db.updateUser(user.userId, {
        points: newPoints,
        vipLevel: newLevel,
        exp: finalExp,
        last_mine_time: now,
        total_mined: newTotalMined
      });

      // Update local mining state first
      const nowMs = Date.now();
      setLastMineTime(nowMs);
      setTotalMined(newTotalMined);

      // Update parent component state with all data including mining fields
      updateUser({
        ...user,
        points: newPoints,
        vipLevel: newLevel,
        exp: finalExp,
        last_mine_time: now,
        total_mined: newTotalMined
      });

      // Show success
      setMining(false);
      setMiningProgress(100);
      setShowConfetti(true);
      haptics.success();
      addNotification(`⛏️ Mining complete! Earned ${reward} Cipro!`, 'success');

      setTimeout(() => {
        setShowConfetti(false);
        setMiningProgress(0);
      }, 3000);

    } catch (error) {
      console.error('Error completing mining:', error);
      addNotification('Failed to complete mining. Please try again.', 'error');
      setMining(false);
      setMiningProgress(0);
    }
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const reward = calculateReward();
  const isAvailable = canMine();

  return (
    <div className="daily-mining-section">
      <h3 className="section-title">⛏️ 8-Hour Mining</h3>
      <p className="section-subtitle">Mine every 8 hours to earn bonus Cipro rewards!</p>

      <div className={`daily-mining-card ${mining ? 'mining-active' : ''} ${!isAvailable ? 'on-cooldown' : ''}`}>
        <div className="mining-header">
          <div className="mining-icon-large">⛏️</div>
          <div className="mining-info">
            <h4>8-Hour Mining Session</h4>
            {isAvailable ? (
              <p className="mining-description mining-ready">
                ✅ Ready to mine!
              </p>
            ) : (
              <p className="mining-description mining-cooldown">
                ⏰ Cooldown: <strong>{formatTime(timeUntilNext)}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="mining-stats">
          <div className="mining-stat">
            <span className="stat-label">Reward</span>
            <span className="stat-value">
              <AnimatedCounter value={reward} suffix=" CIPRO" />
            </span>
          </div>
          <div className="mining-stat">
            <span className="stat-label">VIP Bonus</span>
            <span className="stat-value">×{VIP_MULTIPLIER[user.vipLevel || 1]}</span>
          </div>
          <div className="mining-stat">
            <span className="stat-label">Total Mined</span>
            <span className="stat-value">
              <AnimatedCounter value={totalMined} />
            </span>
          </div>
        </div>

        {mining && (
          <div className="mining-progress-section">
            <ProgressBar 
              current={miningProgress} 
              max={100}
              label="Mining Progress"
              color="warning"
              animated
            />
          </div>
        )}

        <button 
          className={`mine-button ${mining ? 'mining' : ''} ${!isAvailable ? 'disabled' : ''}`}
          onClick={startMining}
          disabled={!isAvailable || mining}
        >
          {mining ? (
            <>
              <span className="mining-spinner">⛏️</span>
              Mining...
            </>
          ) : !isAvailable ? (
            <>
              <span>⏱️</span>
              {formatTime(timeUntilNext)}
            </>
          ) : (
            <>
              <span>⛏️</span>
              Start Mining
            </>
          )}
        </button>

        {!isAvailable && !mining && (
          <div className="cooldown-info">
            <p>💡 Tip: Higher VIP levels earn more rewards!</p>
          </div>
        )}
      </div>

      <ConfettiEffect active={showConfetti} />
    </div>
  );
}

export default DailyMining;
