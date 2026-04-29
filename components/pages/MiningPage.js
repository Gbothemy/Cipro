'use client';
import { useState, useEffect, useRef } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const MINING_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// Mining rates per VIP level (points per hour)
const MINING_RATES = {
  1: 100,   // VIP 1: 100 points/hour = 800 points per 8hr session
  2: 150,   // VIP 2: 150 points/hour = 1,200 points per 8hr session
  3: 200,   // VIP 3: 200 points/hour = 1,600 points per 8hr session
  4: 300,   // VIP 4: 300 points/hour = 2,400 points per 8hr session
  5: 500,   // VIP 5: 500 points/hour = 4,000 points per 8hr session
};

export default function MiningPage() {
  const { user, addPoints, addNotification } = useStore();
  const [mining, setMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hashRate, setHashRate] = useState(0);
  const [totalMined, setTotalMined] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  useEffect(() => {
    if (user?.userId) loadMiningStats();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.userId]);

  useEffect(() => {
    // Check if there's an active mining session in localStorage
    const savedSession = localStorage.getItem(`mining_${user?.userId}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const now = Date.now();
      const endTime = session.endTime;
      
      if (now < endTime) {
        // Resume mining session
        startTimeRef.current = session.startTime;
        endTimeRef.current = endTime;
        setMining(true);
        startMiningTimer();
      } else {
        // Session completed while user was away
        completeMining();
        localStorage.removeItem(`mining_${user?.userId}`);
      }
    }
  }, [user?.userId]);

  const loadMiningStats = async () => {
    try {
      const sessions = await db.getActiveMiningCount(user.userId).catch(() => 0);
      setActiveSessions(sessions);
    } catch (e) {
      console.error(e);
    }
  };

  const startMiningTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const remaining = endTimeRef.current - now;
      const progressPct = (elapsed / MINING_DURATION) * 100;
      
      setProgress(Math.min(progressPct, 100));
      setTimeRemaining(Math.max(remaining, 0));
      
      // Simulate fluctuating hash rate based on VIP level
      const baseRate = MINING_RATES[user?.vipLevel || 1] || 100;
      const variance = Math.floor(Math.random() * 20) - 10; // ±10
      setHashRate(baseRate + variance);
      
      if (remaining <= 0) {
        completeMining();
      }
    }, 1000); // Update every second
  };

  const startMining = () => {
    if (mining || activeSessions >= 1) return;
    
    const now = Date.now();
    const endTime = now + MINING_DURATION;
    
    startTimeRef.current = now;
    endTimeRef.current = endTime;
    setMining(true);
    setProgress(0);
    
    // Save session to localStorage
    localStorage.setItem(`mining_${user.userId}`, JSON.stringify({
      startTime: now,
      endTime: endTime,
    }));
    
    startMiningTimer();
    
    addNotification({
      type: 'info',
      title: 'Mining Started!',
      message: '8-hour mining session has begun',
    });
  };

  const completeMining = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setMining(false);
    setHashRate(0);
    setProgress(100);
    
    // Calculate rewards based on VIP level
    const vipLevel = user?.vipLevel || 1;
    const pointsPerHour = MINING_RATES[vipLevel] || 100;
    const reward = pointsPerHour * 8; // 8 hours
    
    try {
      await db.addPoints(user.userId, reward);
      await db.recordMiningSession(user.userId, reward);
      addPoints(reward);
      setTotalMined((prev) => prev + reward);
      setActiveSessions(0);
      
      // Remove from localStorage
      localStorage.removeItem(`mining_${user.userId}`);
      
      addNotification({
        type: 'success',
        title: 'Mining Complete!',
        message: `You mined ${reward.toLocaleString()} points! 💎`,
      });
      
      // Reset progress after 3 seconds
      setTimeout(() => setProgress(0), 3000);
    } catch (e) {
      console.error('Mining error:', e);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to record mining session',
      });
    }
  };

  const stopMining = () => {
    if (!confirm('Are you sure you want to stop mining? You will lose all progress!')) {
      return;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setMining(false);
    setProgress(0);
    setHashRate(0);
    setTimeRemaining(0);
    
    // Remove from localStorage
    localStorage.removeItem(`mining_${user?.userId}`);
    
    addNotification({
      type: 'warning',
      title: 'Mining Stopped',
      message: 'Mining session cancelled',
    });
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const vipLevel = user?.vipLevel || 1;
  const miningRate = MINING_RATES[vipLevel] || 100;
  const sessionReward = miningRate * 8;

  return (
    <div className="page-container-md">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">⛏️ Crypto Mining</h1>
        <p className="text-muted mt-2">Mine crypto to earn points - 8 hour sessions</p>
      </div>

      {/* Mining Stats */}
      <div className="grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-icon">⛏️</div>
          <div className="stat-value">{activeSessions}/1</div>
          <div className="stat-label">Active Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-value">{totalMined.toLocaleString()}</div>
          <div className="stat-label">Mined This Session</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{hashRate} pts/hr</div>
          <div className="stat-label">Mining Rate</div>
        </div>
      </div>

      {/* Mining Interface */}
      <div className="card p-8 mb-6">
        <div className="text-center mb-6">
          <div 
            className="mx-auto rounded-full flex items-center justify-center mb-4"
            style={{
              width: '8rem',
              height: '8rem',
              fontSize: '4rem',
              background: mining 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255,255,255,0.05)',
              animation: mining ? 'pulse 2s infinite' : 'none',
            }}
          >
            {mining ? '⚡' : '⛏️'}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {mining ? 'Mining in Progress...' : 'Ready to Mine'}
          </h2>
          <p className="text-muted mb-2">
            {mining 
              ? `${progress.toFixed(1)}% complete` 
              : `Start 8-hour mining session to earn ${sessionReward.toLocaleString()} points`}
          </p>
          {mining && (
            <p className="text-sm text-primary font-medium">
              ⏱️ Time Remaining: {formatTime(timeRemaining)}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {mining && (
          <div className="mb-6">
            <div className="progress-track" style={{ height: '1rem' }}>
              <div 
                className="progress-fill"
                style={{ 
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>
        )}

        {/* Mining Button */}
        <div className="flex gap-3">
          {!mining ? (
            <button
              onClick={startMining}
              disabled={activeSessions >= 1}
              className="btn btn-primary btn-full py-4 text-lg"
            >
              {activeSessions >= 1 ? '⏸️ Mining Session Active' : '⛏️ Start 8-Hour Mining'}
            </button>
          ) : (
            <button
              onClick={stopMining}
              className="btn btn-danger btn-full py-4 text-lg"
            >
              ⏹️ Stop Mining (Lose Progress)
            </button>
          )}
        </div>

        {activeSessions >= 1 && !mining && (
          <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm text-danger">
              You have an active mining session. Please wait for it to complete.
            </p>
          </div>
        )}
      </div>

      {/* Session Info */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-4">ℹ️ Mining Information</h3>
        <div className="flex-col gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-sm text-muted">Session Duration</span>
            <span className="text-sm font-medium text-white">8 Hours</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-sm text-muted">Your Mining Rate</span>
            <span className="text-sm font-medium text-white">{miningRate} points/hour</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-sm text-muted">Session Reward</span>
            <span className="text-sm font-medium text-primary">{sessionReward.toLocaleString()} points</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-sm text-muted">Max Active Sessions</span>
            <span className="text-sm font-medium text-white">1 at a time</span>
          </div>
        </div>
      </div>

      {/* VIP Benefits */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4">👑 VIP Mining Rates</h3>
        <div className="flex-col gap-3">
          {[
            { level: 1, rate: 100, reward: 800, color: '#9ca3af' },
            { level: 2, rate: 150, reward: 1200, color: '#c0c0c0' },
            { level: 3, rate: 200, reward: 1600, color: '#fbbf24' },
            { level: 4, rate: 300, reward: 2400, color: '#a78bfa' },
            { level: 5, rate: 500, reward: 4000, color: '#60a5fa' },
          ].map((tier) => (
            <div 
              key={tier.level}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ 
                background: user?.vipLevel === tier.level 
                  ? `${tier.color}20` 
                  : 'rgba(255,255,255,0.03)',
                border: user?.vipLevel === tier.level 
                  ? `1px solid ${tier.color}` 
                  : '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: tier.color, fontSize: '1.25rem' }}>
                  {tier.level === 1 ? '⭐' : tier.level === 2 ? '🥈' : tier.level === 3 ? '🥇' : tier.level === 4 ? '💎' : '💠'}
                </span>
                <span className="text-sm font-medium text-white">VIP Level {tier.level}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{tier.rate} pts/hr</div>
                <div className="text-xs text-muted">{tier.reward.toLocaleString()} per session</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg text-center" style={{ background: 'rgba(102,126,234,0.05)', border: '1px solid rgba(102,126,234,0.1)' }}>
          <p className="text-xs text-primary">
            💡 Upgrade your VIP tier to increase your mining rate and earn more points per session!
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
