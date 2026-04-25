'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

export default function ReferralPage() {
  const { user, addNotification } = useStore();
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ totalReferrals: 0, activeReferrals: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/login?ref=${user?.userId}`
    : `https://ciprohub.site/login?ref=${user?.userId}`;

  useEffect(() => {
    if (user?.userId) loadReferrals();
  }, [user?.userId]);

  const loadReferrals = async () => {
    try {
      const [refs, s] = await Promise.all([
        db.getUserReferrals(user.userId),
        db.getReferralStats(user.userId),
      ]);
      setReferrals(refs);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      addNotification({ type: 'success', title: 'Copied!', message: 'Referral link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: 'Could not copy link' });
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Invite Friends</h1>
        <p className="text-slate-400 mt-1">Earn 10% of your referrals&apos; rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold text-white">{stats.totalReferrals}</div>
          <div className="text-xs text-slate-500">Total Referrals</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-white">{stats.activeReferrals}</div>
          <div className="text-xs text-slate-500">Active (7 days)</div>
        </div>
      </div>

      {/* Referral link */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-3">Your Referral Link</h3>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralLink}
            className="input-field flex-1 text-sm font-mono text-slate-400"
          />
          <button
            onClick={copyLink}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex-shrink-0 ${
              copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'btn-primary'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Share this link. When friends sign up and earn, you get 10% of their rewards automatically.
        </p>
      </div>

      {/* How it works */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-4">How It Works</h3>
        <div className="space-y-3">
          {[
            { icon: '🔗', text: 'Share your unique referral link' },
            { icon: '👤', text: 'Friend signs up using your link' },
            { icon: '🎮', text: 'They play games and earn points' },
            { icon: '💰', text: 'You earn 10% of their rewards automatically' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">{s.icon}</div>
              <p className="text-sm text-slate-300">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="font-semibold text-white">Your Referrals</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-slate-400">No referrals yet. Share your link!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {referrals.map((r, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-lg">
                  {r.avatar || '👤'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{r.name || r.username}</p>
                  <p className="text-xs text-slate-500">Joined {new Date(r.joined).toLocaleDateString()}</p>
                </div>
                <span className={`badge text-xs ${r.active ? 'badge-success' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                  {r.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
