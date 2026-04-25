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
    <div className="page-container-md">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Invite Friends</h1>
        <p className="text-muted mt-2">Earn 10% of your referrals&apos; rewards</p>
      </div>

      {/* Stats */}
      <div className="grid-2 mb-6">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.totalReferrals}</div>
          <div className="stat-label">Total Referrals</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.activeReferrals}</div>
          <div className="stat-label">Active (7 days)</div>
        </div>
      </div>

      {/* Referral link */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-3">Your Referral Link</h3>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralLink}
            className="input flex-1 text-sm text-muted"
            style={{ fontFamily: 'monospace' }}
          />
          <button
            onClick={copyLink}
            className={copied ? 'btn badge-success flex-shrink-0' : 'btn btn-primary flex-shrink-0'}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-dim mt-3">
          Share this link. When friends sign up and earn, you get 10% of their rewards automatically.
        </p>
      </div>

      {/* How it works */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-4">How It Works</h3>
        <div className="flex-col gap-3">
          {[
            { icon: '🔗', text: 'Share your unique referral link' },
            { icon: '👤', text: 'Friend signs up using your link' },
            { icon: '🎮', text: 'They play games and earn points' },
            { icon: '💰', text: 'You earn 10% of their rewards automatically' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div 
                className="rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  background: 'rgba(102,126,234,0.1)' 
                }}
              >{s.icon}</div>
              <p className="text-sm text-light">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="font-semibold text-white">Your Referrals</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
            <p className="text-muted">No referrals yet. Share your link!</p>
          </div>
        ) : (
          <div>
            {referrals.map((r, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < referrals.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                <div 
                  className="rounded-full bg-grad-brand flex items-center justify-center"
                  style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.125rem' }}
                >
                  {r.avatar || '👤'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{r.name || r.username}</p>
                  <p className="text-xs text-dim">Joined {new Date(r.joined).toLocaleDateString()}</p>
                </div>
                <span className={`badge text-xs ${r.active ? 'badge-success' : 'badge text-dim'}`}>
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
