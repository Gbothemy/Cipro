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
  const BASE_REWARD = 200; // Base points reward
  const VIP_MULTIPLIER = {
    1: 1,
    2: 1.2,
    3: 1.5,
    4: 2,
    5: 2.5
  };

  useEffect(() => {
    loadMiningData();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadMiningData = () => {
    const savedData = localStorage.getItem(`dailyMining_${user.userId}`);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setLastMineTime(data.lastMineTime);
        setTotalMined(data.totalMined || 0);
      } catch (e) {
        console.error('Error loading mining data:', e);
      }
    }
  };

  const saveMiningData = (mineTime, total) => {
    const data = {
      lastMineTime: mineTime,
      totalMined: total
    };
    localStorage.setItem(`dailyMining_${user.userId}`, JSON.stringify(data));
  };

  const updateCooldown = () => {
    if (!lastMineTime) {
      setTimeUntilNext(0);
      return;
    }

    const elapsed = Date.now() - lastMineTime;
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
    const expReward = Math.floor(reward / 4); // 25% of points as EXP
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
      // Update user in database
      await db.updateUser(user.userId, {
        points: newPoints,
        vipLevel: newLevel,
        exp: finalExp
      });

      // Update local state
      updateUser({
        ...user,
        points: newPoints,
        vipLevel: newLevel,
        exp: finalExp
      });

      // Save mining data
      const now = Date.now();
      setLastMineTime(now);
      setTotalMined(newTotalMined);
      saveMiningData(now, newTotalMined);

      // Show success
      setMining(false);
      setMiningProgress(100);
      setShowConfetti(true);
      haptics.success();
      addNotification(`⛏️ Mining complete! Earned ${reward} points!`, 'success');

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
      <h3 className="section-title">⛏️ Daily Mining</h3>
      <p className="section-subtitle">Mine every 8 hours to earn bonus points!</p>

      <div className={`daily-mining-card ${mining ? 'mining-active' : ''} ${!isAvailable ? 'on-cooldown' : ''}`}>
        <div className="mining-header">
          <div className="mining-icon-large">⛏️</div>
          <div className="mining-info">
            <h4>Daily Mining Session</h4>
            <p className="mining-description">
              {isAvailable ? 'Ready to mine!' : `Next mining in ${formatTime(timeUntilNext)}`}
            </p>
          </div>
        </div>

        <div className="mining-stats">
          <div className="mining-stat">
            <span className="stat-label">Reward</span>
            <span className="stat-value">
              <AnimatedCounter value={reward} suffix=" pts" />
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
