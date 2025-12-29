import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import SkeletonLoader from '../components/SkeletonLoader';
import SEOHead from '../components/SEOHead';
import './ReferralPage.css';

function ReferralPage({ user, updateUser, addNotification }) {
  const [referrals, setReferrals] = useState([]);
  const [referrer, setReferrer] = useState(null);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: { sol: 0, eth: 0, usdt: 0, usdc: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = `https://www.ciprohub.site/login?ref=${user.userId}`;

  useEffect(() => {
    loadReferralData();
  }, [user.userId]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Load all referral data in parallel
      const [referralsData, referrerData, statsData] = await Promise.all([
        db.getUserReferrals(user.userId),
        db.getReferrer(user.userId),
        db.getReferralStats(user.userId)
      ]);

      setReferrals(referralsData);
      setReferrer(referrerData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading referral data:', error);
      addNotification('Failed to load referral data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      addNotification('Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addNotification('Failed to copy link', 'error');
    }
  };

  const handleShare = (platform) => {
    const text = `Join me on Cipro and earn crypto! Use my referral link: ${referralLink}`;
    let url = '';

    switch(platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank');
  };

  const totalEarnings = stats.totalEarnings;

  if (loading) {
    return (
      <div className="referral-page">
        <div className="page-header">
          <h1 className="page-title">Referral Program</h1>
          <p className="page-subtitle">Invite friends and earn 10% commission</p>
        </div>
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="referral-page">
      <SEOHead 
        title="👥 Crypto Referral Program - Earn 10% Forever | Cipro"
        description="👥 Earn crypto by referring friends! Get 10% of your referrals' earnings forever. Share your link and build passive cryptocurrency income. Start referring now!"
        keywords="crypto referral program, earn crypto referring, passive crypto income, referral rewards, cryptocurrency affiliate, earn 10% commission, crypto MLM, referral earnings"
        url="https://www.ciprohub.site/referral"
      />
      <div className="page-header">
        <h1 className="page-title">Referral Program</h1>
        <p className="page-subtitle">Invite friends and earn 10% commission</p>
      </div>

      {/* Show who referred this user */}
      {referrer && (
        <div className="referrer-card">
          <div className="referrer-header">
            <span className="referrer-label">👤 Referred by</span>
          </div>
          <div className="referrer-info">
            <div className="referrer-avatar">{referrer.avatar}</div>
            <div className="referrer-details">
              <h4>{referrer.username}</h4>
              <p className="referrer-date">Joined: {new Date(referrer.joinedDate).toLocaleDateString()}</p>
              <span className="vip-badge">VIP Level {referrer.vipLevel}</span>
            </div>
          </div>
        </div>
      )}

      <div className="balance-card">
        <h2>Referral Earnings</h2>
        <div className="earnings-grid">
          <div className="earning-item">
            <span className="earning-label">SOL</span>
            <span className="earning-value">{totalEarnings.sol.toFixed(4)}</span>
          </div>
          <div className="earning-item">
            <span className="earning-label">ETH</span>
            <span className="earning-value">{totalEarnings.eth.toFixed(4)}</span>
          </div>
          <div className="earning-item">
            <span className="earning-label">USDT</span>
            <span className="earning-value">{totalEarnings.usdt.toFixed(2)}</span>
          </div>
          <div className="earning-item">
            <span className="earning-label">USDC</span>
            <span className="earning-value">{totalEarnings.usdc.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="commission-info">
        <p>🎉 Enjoy 10% commission from your referrals' top-ups</p>
      </div>

      <div className="referral-link-section">
        <label>Your Referral Link</label>
        <div className="link-input-group">
          <input type="text" value={referralLink} readOnly />
          <button onClick={handleInvite} className={copied ? 'copied' : ''}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        <p className="referral-hint">Share this link with friends to earn 10% commission on their earnings!</p>
      </div>

      <div className="share-buttons">
        <button className="share-btn twitter" onClick={() => handleShare('twitter')}>
          🐦 Twitter
        </button>
        <button className="share-btn telegram" onClick={() => handleShare('telegram')}>
          ✈️ Telegram
        </button>
        <button className="share-btn whatsapp" onClick={() => handleShare('whatsapp')}>
          💬 WhatsApp
        </button>
      </div>

      <div className="referral-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.totalReferrals}</span>
          <span className="stat-label">Total Referrals</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.activeReferrals}</span>
          <span className="stat-label">Active Referrals</span>
        </div>
      </div>

      <h3 className="section-title">Your Referrals ({referrals.length})</h3>
      
      {referrals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h4>No referrals yet</h4>
          <p>Share your referral link to start earning commissions!</p>
        </div>
      ) : (
        <div className="referrals-list">
          {referrals.map(ref => (
            <div key={ref.id} className="referral-card">
              <div className="referral-avatar">{ref.avatar}</div>
              <div className="referral-info">
                <div className="referral-header">
                  <h4>{ref.name}</h4>
                  <span className={`status-badge ${ref.active ? 'active' : 'inactive'}`}>
                    {ref.active ? '🟢 Active' : '⚪ Inactive'}
                  </span>
                </div>
                <p className="joined-date">Joined: {new Date(ref.joined).toLocaleDateString()}</p>
                <div className="referral-earnings">
                  <span>◎ {ref.sol.toFixed(4)}</span>
                  <span>Ξ {ref.eth.toFixed(4)}</span>
                  <span>💵 {ref.usdt.toFixed(2)}</span>
                  <span>💵 {ref.usdc.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReferralPage;
