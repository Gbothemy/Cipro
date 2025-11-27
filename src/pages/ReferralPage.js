import React, { useState } from 'react';
import './ReferralPage.css';

function ReferralPage({ user, updateUser, addNotification }) {
  const [referrals] = useState([
    { id: 1, name: 'Alice', avatar: '👩', ton: 12.5, cati: 340, usdt: 8.2, joined: '2024-01-15', active: true },
    { id: 2, name: 'Bob', avatar: '👨', ton: 8.3, cati: 220, usdt: 5.5, joined: '2024-01-20', active: true },
    { id: 3, name: 'Charlie', avatar: '🧑', ton: 15.7, cati: 450, usdt: 12.0, joined: '2024-01-10', active: true },
    { id: 4, name: 'Diana', avatar: '👧', ton: 6.2, cati: 180, usdt: 4.1, joined: '2024-01-25', active: false }
  ]);

  const referralLink = `https://rewardgame.com/ref/${user.userId}`;

  const handleInvite = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      addNotification('Referral link copied to clipboard!', 'success');
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

  const totalEarnings = referrals.reduce((acc, ref) => ({
    sol: acc.sol + ref.sol,
    eth: acc.eth + ref.eth,
    usdt: acc.usdt + ref.usdt,
    usdc: acc.usdc + ref.usdc
  }), { sol: 0, eth: 0, usdt: 0, usdc: 0 });

  return (
    <div className="referral-page">
      <div className="page-header">
        <h1 className="page-title">Referral Program</h1>
        <p className="page-subtitle">Invite friends and earn 10% commission</p>
      </div>

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
          <button onClick={handleInvite}>📋 Copy</button>
        </div>
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

      <h3 className="section-title">Your Referrals ({referrals.length})</h3>
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
                <span>◎ {ref.sol}</span>
                <span>Ξ {ref.eth}</span>
                <span>💵 {ref.usdt}</span>
                <span>💵 {ref.usdc}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReferralPage;
