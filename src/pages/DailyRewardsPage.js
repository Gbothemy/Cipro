import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import SEOHead from '../components/SEOHead';
import './DailyRewardsPage.css';

function DailyRewardsPage({ user, updateUser, addNotification }) {
  const [streak, setStreak] = useState(user.dayStreak || 0);
  const [canClaim, setCanClaim] = useState(false);
  const [nextClaimTime, setNextClaimTime] = useState(null);
  const [claimAnimation, setClaimAnimation] = useState(false);

  const streakRewards = [
    { day: 1, points: 100, bonus: 'Welcome Bonus' },
    { day: 2, points: 150, bonus: 'Keep Going!' },
    { day: 3, points: 200, bonus: 'On Fire!' },
    { day: 4, points: 250, bonus: 'Unstoppable!' },
    { day: 5, points: 300, bonus: 'Week Warrior!' },
    { day: 6, points: 400, bonus: 'Almost There!' },
    { day: 7, points: 500, bonus: '🎉 Week Complete!' },
    { day: 14, points: 1000, bonus: '🔥 Two Weeks!' },
    { day: 30, points: 3000, bonus: '💎 Monthly Master!' },
    { day: 100, points: 10000, bonus: '👑 Century Club!' }
  ];

  useEffect(() => {
    checkClaimStatus();
    
    // Update timer every second
    const interval = setInterval(checkClaimStatus, 1000);
    return () => clearInterval(interval);
  }, [user.lastClaim]);

  const checkClaimStatus = () => {
    if (!user.lastClaim) {
      setCanClaim(true);
      return;
    }

    const lastClaim = new Date(user.lastClaim);
    const now = new Date();
    const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);

    if (hoursSinceLastClaim >= 24) {
      // Check if streak should continue or reset
      if (hoursSinceLastClaim <= 48) {
        // Within grace period, continue streak
        setCanClaim(true);
      } else {
        // Streak broken, reset
        setStreak(0);
        setCanClaim(true);
      }
    } else {
      // Already claimed today
      setCanClaim(false);
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      setNextClaimTime(nextClaim);
    }
  };

  const handleClaim = async () => {
    if (!canClaim) return;

    setClaimAnimation(true);

    const now = new Date();
    const lastClaim = user.lastClaim ? new Date(user.lastClaim) : null;
    const hoursSinceLastClaim = lastClaim ? (now - lastClaim) / (1000 * 60 * 60) : 999;

    let newStreak = streak;
    if (hoursSinceLastClaim > 48) {
      // Streak broken
      newStreak = 1;
    } else {
      // Continue streak
      newStreak = streak + 1;
    }

    // Calculate reward
    const baseReward = 100 + (newStreak * 10);
    const milestoneBonus = getMilestoneBonus(newStreak);
    const totalReward = baseReward + milestoneBonus;

    try {
      // Update user in database
      await db.updateUser(user.userId, {
        points: user.points + totalReward,
        vipLevel: user.vipLevel,
        exp: user.exp + 50,
        completedTasks: user.completedTasks,
        dayStreak: newStreak,
        lastClaim: now.toISOString()
      });

      // Update local state
      updateUser({
        points: user.points + totalReward,
        dayStreak: newStreak,
        lastClaim: now.toISOString(),
        exp: user.exp + 50
      });

      setStreak(newStreak);
      setCanClaim(false);
      
      addNotification(`🎉 Claimed ${totalReward} points! Day ${newStreak} streak!`, 'success');

      setTimeout(() => setClaimAnimation(false), 2000);
    } catch (error) {
      console.error('Error claiming reward:', error);
      addNotification('Failed to claim reward. Please try again.', 'error');
      setClaimAnimation(false);
    }
  };

  const getMilestoneBonus = (day) => {
    const milestone = streakRewards.find(r => r.day === day);
    return milestone ? milestone.points - 100 : 0;
  };

  const getTimeUntilNextClaim = () => {
    if (!nextClaimTime) return '';
    
    const now = new Date();
    const diff = nextClaimTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStreakLevel = () => {
    if (streak >= 100) return { level: 'Legendary', color: '#ffd700', icon: '👑' };
    if (streak >= 30) return { level: 'Master', color: '#e74c3c', icon: '💎' };
    if (streak >= 14) return { level: 'Expert', color: '#9b59b6', icon: '🔥' };
    if (streak >= 7) return { level: 'Advanced', color: '#3498db', icon: '⭐' };
    if (streak >= 3) return { level: 'Intermediate', color: '#2ecc71', icon: '🌟' };
    return { level: 'Beginner', color: '#95a5a6', icon: '🎯' };
  };

  const streakLevel = getStreakLevel();

  return (
    <div className="daily-rewards-page">
      <SEOHead 
        title="🎁 Daily Crypto Rewards & Streak Bonuses | Cipro"
        description="🎁 Claim daily cryptocurrency rewards and build your streak! Get bigger bonuses for consecutive days. Earn SOL, ETH, USDT & USDC daily. Start your streak now!"
        keywords="daily crypto rewards, daily cryptocurrency, streak bonuses, daily login rewards, crypto streak, daily crypto bonus, consecutive day rewards, daily crypto earnings"
        url="https://www.ciprohub.site/daily-rewards"
      />
      <div className="rewards-header">
        <h1>🎁 Daily Rewards</h1>
        <p>Login every day to build your streak and earn bigger rewards!</p>
      </div>

      {/* Current Streak Display */}
      <div className="current-streak-card">
        <div className="streak-badge" style={{ borderColor: streakLevel.color }}>
          <div className="streak-icon">{streakLevel.icon}</div>
          <div className="streak-number">{streak}</div>
          <div className="streak-label">Day Streak</div>
        </div>
        <div className="streak-info">
          <h3 style={{ color: streakLevel.color }}>{streakLevel.level} Streaker</h3>
          <p>Keep logging in daily to maintain your streak!</p>
          {!canClaim && nextClaimTime && (
            <div className="next-claim">
              ⏰ Next claim in: <strong>{getTimeUntilNextClaim()}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Claim Button */}
      <div className="claim-section">
        <button 
          className={`claim-btn ${canClaim ? 'active' : 'disabled'} ${claimAnimation ? 'claiming' : ''}`}
          onClick={handleClaim}
          disabled={!canClaim || claimAnimation}
        >
          {claimAnimation ? (
            <>
              <span className="claim-spinner"></span>
              Claiming...
            </>
          ) : canClaim ? (
            <>
              🎁 Claim Today's Reward
              <span className="claim-amount">+{100 + (streak * 10)} points</span>
            </>
          ) : (
            <>
              ✓ Already Claimed Today
            </>
          )}
        </button>
      </div>

      {/* Streak Calendar */}
      <div className="streak-calendar">
        <h3>📅 Your Streak Calendar</h3>
        <div className="calendar-grid">
          {[...Array(7)].map((_, index) => {
            const dayNumber = streak - 6 + index;
            const isToday = index === 6;
            const isFuture = dayNumber > streak;
            const isPast = dayNumber < streak && dayNumber > 0;

            return (
              <div 
                key={index} 
                className={`calendar-day ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${isPast ? 'past' : ''}`}
              >
                <div className="day-number">Day {Math.max(1, dayNumber)}</div>
                <div className="day-icon">
                  {isPast && '✓'}
                  {isToday && '🎁'}
                  {isFuture && '🔒'}
                </div>
                <div className="day-reward">
                  {Math.max(1, dayNumber) <= streak ? 'Claimed' : `+${100 + (Math.max(1, dayNumber) * 10)} pts`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Rewards */}
      <div className="milestone-rewards">
        <h3>🏆 Milestone Rewards</h3>
        <div className="milestones-grid">
          {streakRewards.map((milestone) => {
            const isUnlocked = streak >= milestone.day;
            const isCurrent = streak === milestone.day - 1;

            return (
              <div 
                key={milestone.day} 
                className={`milestone-card ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="milestone-day">Day {milestone.day}</div>
                <div className="milestone-icon">
                  {isUnlocked ? '✓' : isCurrent ? '🎯' : '🔒'}
                </div>
                <div className="milestone-points">+{milestone.points} pts</div>
                <div className="milestone-bonus">{milestone.bonus}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Tips */}
      <div className="streak-tips">
        <h3>💡 Streak Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">⏰</div>
            <h4>Login Daily</h4>
            <p>Claim your reward every 24 hours to maintain your streak</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🛡️</div>
            <h4>Grace Period</h4>
            <p>You have 48 hours to claim before your streak resets</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎁</div>
            <h4>Bigger Rewards</h4>
            <p>Longer streaks earn more points and unlock milestones</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🔔</div>
            <h4>Set Reminders</h4>
            <p>Enable notifications to never miss a daily claim</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyRewardsPage;
