'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const STREAK_REWARDS = [
  { day: 1, points: 50, icon: '🎁' },
  { day: 2, points: 75, icon: '💫' },
  { day: 3, points: 100, icon: '⭐' },
  { day: 4, points: 125, icon: '🌟' },
  { day: 5, points: 150, icon: '💎' },
  { day: 6, points: 200, icon: '🏆' },
  { day: 7, points: 300, icon: '👑' },
];

export default function DailyRewardsPage() {
  const { user, updateUser, addPoints, addNotification } = useStore();
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user?.userId) {
      checkClaimed();
      db.getDailyRewards(user.userId, 7).then(setHistory).catch(() => {});
    }
  }, [user?.userId]);

  const checkClaimed = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastClaim = user?.lastClaim;
    if (lastClaim && new Date(lastClaim).toISOString().split('T')[0] === today) {
      setClaimed(true);
    }
  };

  const streak = user?.dayStreak || 0;
  const todayReward = STREAK_REWARDS[(streak % 7)] || STREAK_REWARDS[0];

  const handleClaim = async () => {
    if (claimed || loading) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const today = now.split('T')[0];
      const lastClaim = user?.lastClaim;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const lastClaimDate = lastClaim ? new Date(lastClaim).toISOString().split('T')[0] : null;

      // Strict check: only continue streak if last claim was EXACTLY yesterday
      // If last claim was today already, don't allow (shouldn't reach here but safety check)
      // If last claim was 2+ days ago, reset to 1
      let newStreak;
      if (lastClaimDate === yesterday) {
        newStreak = (user?.dayStreak || 0) + 1;
      } else if (lastClaimDate === today) {
        // Already claimed today - shouldn't happen but guard it
        setClaimed(true);
        setLoading(false);
        return;
      } else {
        // Missed a day or first claim - start fresh
        newStreak = 1;
      }

      await db.recordDailyReward(user.userId, { points: todayReward.points, streakDay: newStreak });
      await db.addPoints(user.userId, todayReward.points);
      await db.updateUser(user.userId, { dayStreak: newStreak, lastClaim: now });

      addPoints(todayReward.points);
      updateUser({ dayStreak: newStreak, lastClaim: now });
      addNotification({ type: 'success', title: 'Daily Reward Claimed!', message: `+${todayReward.points} points · Day ${newStreak} streak` });
      setClaimed(true);
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container-md">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Daily Rewards</h1>
        <p className="text-muted mt-2">Claim your daily bonus and build your streak</p>
      </div>

      {/* Streak display */}
      <div className="card p-6 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grad-brand" style={{ opacity: 0.05 }} />
        <div className="relative">
          <div style={{ fontSize: '3.75rem', marginBottom: '0.75rem' }}>🔥</div>
          <div className="text-5xl font-black text-white mb-2">{streak}</div>
          <p className="text-muted mb-6">Day Streak</p>
          <button
            onClick={handleClaim}
            disabled={claimed || loading}
            className={claimed ? 'btn opacity-50 cursor-not-allowed px-10 py-4 text-lg font-bold' : 'btn btn-primary shadow-brand-lg px-10 py-4 text-lg font-bold'}
            style={{ 
              background: claimed ? 'rgba(255,255,255,0.05)' : undefined,
              color: claimed ? '#64748b' : undefined
            }}
          >
            {loading ? '⏳ Claiming...' : claimed ? '✅ Claimed Today' : `🎁 Claim +${todayReward.points} Points`}
          </button>
          {claimed && <p className="text-xs text-dim mt-3">Come back tomorrow for your next reward</p>}
        </div>
      </div>

      {/* 7-day streak calendar */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-4">7-Day Streak Rewards</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {STREAK_REWARDS.map((r, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === ((streak % 7) + 1);
            const isPast = dayNum <= (streak % 7);
            return (
              <div
                key={i}
                className="flex-col items-center p-2 rounded-xl"
                style={{
                  border: isToday && !claimed ? '1px solid rgba(102,126,234,0.5)' :
                         isPast ? '1px solid rgba(16,185,129,0.3)' :
                         '1px solid rgba(255,255,255,0.05)',
                  background: isToday && !claimed ? 'rgba(102,126,234,0.1)' :
                             isPast ? 'rgba(16,185,129,0.05)' :
                             'rgba(255,255,255,0.03)',
                  transform: isToday && !claimed ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s'
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>{r.icon}</span>
                <span className="text-xs font-bold text-white mt-1">+{r.points}</span>
                <span className="text-dim" style={{ fontSize: '0.625rem' }}>Day {dayNum}</span>
                {isPast && <span className="text-success" style={{ fontSize: '0.625rem' }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="font-semibold text-white">Recent Claims</h3>
          </div>
          <div>
            {history.map((h, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                <div>
                  <p className="text-sm font-medium text-white">Day {h.streak_day} Reward</p>
                  <p className="text-xs text-dim">{new Date(h.claim_date).toLocaleDateString()}</p>
                </div>
                <span className="font-bold text-success text-sm">+{h.points_earned} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
