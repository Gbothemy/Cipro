'use client';
import { useState, useEffect, useRef } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

export default function MiningPage() {
  const { user, addPoints, addNotification } = useStore();
  const [mining, setMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hashRate, setHashRate] = useState(0);
  const [totalMined, setTotalMined] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (user?.userId) loadMiningStats();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.userId]);

  const loadMiningStats = async () => {
    try {
      const sessions = await db.getMiningSessionsToday(user.userId).catch(() => 0);
      setSessionsToday(sessions);
    } catch (e) {
      console.error(e);
    }
  };

  const startMining = () => {
    if (mining) return;
    
    setMining(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    
    // Simulate mining with increasing hash rate
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          completeMining();
          return 100;
        }
        return prev + 1;
      });
      
      // Simulate fluctuating hash rate
      setHashRate(Math.floor(Math.random() * 50) + 50);
    }, 300); // 30 seconds total (100 * 300ms)
  };

  const completeMining = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setMining(false);
    setHashRate(0);
    
    // Calculate rewards (50-150 points)
    const baseReward = 75;
    const bonus = Math.floor(Math.random() * 75);
    const reward = baseReward + bonus;
    
    try {
      await db.addPoints(user.userId, reward);
      await db.recordMiningSession(user.userId, reward);
      addPoints(reward);
      setTotalMined((prev) => prev + reward);
      setSessionsToday((prev) => prev + 1);
      
      addNotification({
        type: 'success',
        title: 'Mining Complete!',
        message: `You mined ${reward} points! 💎`,
      });
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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setMining(false);
    setProgress(0);
    setHashRate(0);
  };

  const vipMultiplier = user?.vipLevel || 1;
  const maxSessions = 5 + (vipMultiplier - 1) * 2; // 5 base, +2 per VIP level

  return (
    <div className="page-container-md">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">⛏️ Crypto Mining</h1>
        <p className="text-muted mt-2">Mine crypto to earn points</p>
      </div>

      {/* Mining Stats */}
      <div className="grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-icon">⛏️</div>
          <div className="stat-value">{sessionsToday}/{maxSessions}</div>
          <div className="stat-label">Today's Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-value">{totalMined.toLocaleString()}</div>
          <div className="stat-label">Mined This Session</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{hashRate} H/s</div>
          <div className="stat-label">Hash Rate</div>
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
          <p className="text-muted">
            {mining 
              ? `${progress}% complete` 
              : `Start mining to earn 50-150 points per session`}
          </p>
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
              disabled={sessionsToday >= maxSessions}
              className="btn btn-primary btn-full py-4 text-lg"
            >
              {sessionsToday >= maxSessions ? '⏸️ Daily Limit Reached' : '⛏️ Start Mining'}
            </button>
          ) : (
            <button
              onClick={stopMining}
              className="btn btn-danger btn-full py-4 text-lg"
            >
              ⏹️ Stop Mining
            </button>
          )}
        </div>

        {sessionsToday >= maxSessions && (
          <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm text-danger">
              You've reached your daily mining limit. Come back tomorrow or upgrade your VIP tier for more sessions!
            </p>
          </div>
        )}
      </div>

      {/* VIP Benefits */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4">👑 VIP Mining Benefits</h3>
        <div className="flex-col gap-3">
          {[
            { level: 1, sessions: 5, color: '#9ca3af' },
            { level: 2, sessions: 7, color: '#c0c0c0' },
            { level: 3, sessions: 9, color: '#fbbf24' },
            { level: 4, sessions: 11, color: '#a78bfa' },
            { level: 5, sessions: 15, color: '#60a5fa' },
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
              <span className="text-sm text-muted">{tier.sessions} sessions/day</span>
            </div>
          ))}
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
