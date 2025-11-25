import React from 'react';
import './ShareModal.css';

function ShareModal({ user, onClose, type = 'achievement' }) {
  const shareData = {
    achievement: {
      title: '🏆 Achievement Unlocked!',
      message: `I just reached VIP Level ${user.vipLevel} with ${user.points.toLocaleString()} points! Join me on this amazing reward journey!`,
      hashtags: '#RewardGame #Achievement #Gaming'
    },
    points: {
      title: '💎 Points Milestone!',
      message: `I've earned ${user.points.toLocaleString()} points! Can you beat my score?`,
      hashtags: '#RewardGame #HighScore #Gaming'
    },
    referral: {
      title: '🎁 Join Me!',
      message: `Join me on this amazing reward game! Use my referral code: ${user.referralCode}`,
      hashtags: '#RewardGame #Referral #JoinNow'
    }
  };

  const currentShare = shareData[type];
  const shareUrl = window.location.origin;

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${currentShare.message}\n\n${currentShare.hashtags}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(currentShare.message);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const copyToClipboard = () => {
    const textToCopy = `${currentShare.message}\n\n${shareUrl}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Copied to clipboard!');
    });
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-header">
          <h2>{currentShare.title}</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="share-preview">
          <p>{currentShare.message}</p>
        </div>

        <div className="share-buttons">
          <button onClick={shareToTwitter} className="share-btn twitter">
            <span className="share-icon">🐦</span>
            <span>Twitter</span>
          </button>
          
          <button onClick={shareToFacebook} className="share-btn facebook">
            <span className="share-icon">📘</span>
            <span>Facebook</span>
          </button>
          
          <button onClick={shareToTelegram} className="share-btn telegram">
            <span className="share-icon">✈️</span>
            <span>Telegram</span>
          </button>
          
          <button onClick={copyToClipboard} className="share-btn copy">
            <span className="share-icon">📋</span>
            <span>Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
