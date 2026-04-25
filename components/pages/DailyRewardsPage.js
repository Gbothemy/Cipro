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
      const newStreak = lastClaimDate === yesterday ? streak + 1 : 1;

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
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Daily Rewards</h1>
        <p className="text-slate-400 mt-1">Claim your daily bonus and build your streak</p>
      </div>

      {/* Streak display */}
      <div className="card p-6 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand opacity-5" />
        <div className="relative">
          <div className="text-6xl mb-3">🔥</div>
          <div className="text-5xl font-black text-white mb-1">{streak}</div>
          <p className="text-slate-400 mb-6">Day Streak</p>
          <button
            onClick={handleClaim}
            disabled={claimed || loading}
            className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
              claimed
                ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                : 'btn-primary shadow-brand-lg hover:scale-105'
            }`}
          >
            {loading ? '⏳ Claiming...' : claimed ? '✅ Claimed Today' : `🎁 Claim +${todayReward.points} Points`}
          </button>
          {claimed && <p className="text-xs text-slate-500 mt-3">Come back tomorrow for your next reward</p>}
        </div>
      </div>

      {/* 7-day streak calendar */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-4">7-Day Streak Rewards</h3>
        <div className="grid grid-cols-7 gap-2">
          {STREAK_REWARDS.map((r, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === ((streak % 7) + 1);
            const isPast = dayNum <= (streak % 7);
            return (
              <div
                key={i}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                  isToday && !claimed ? 'border-primary/50 bg-primary/10 scale-105' :
                  isPast ? 'border-emerald-500/30 bg-emerald-500/5' :
                  'border-white/5 bg-white/3'
                }`}
              >
                <span className="text-lg">{r.icon}</span>
                <span className="text-xs font-bold text-white mt-1">+{r.points}</span>
                <span className="text-[10px] text-slate-500">Day {dayNum}</span>
                {isPast && <span className="text-[10px] text-emerald-400">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white">Recent Claims</h3>
          </div>
          <div className="divide-y divide-white/5">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Day {h.streak_day} Reward</p>
                  <p className="text-xs text-slate-500">{new Date(h.claim_date).toLocaleDateString()}</p>
                </div>
                <span className="font-bold text-emerald-400 text-sm">+{h.points_earned} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
