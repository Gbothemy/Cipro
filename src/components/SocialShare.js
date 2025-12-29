import React from 'react';
import { generateSocialShareUrls } from '../utils/seoOptimization';
import { trackEvent } from '../utils/analytics';
import './SocialShare.css';

function SocialShare({ 
  url = window.location.href, 
  title = "🎮 Cipro - Play Games, Earn Real Cryptocurrency",
  description = "Join 15,000+ players earning SOL, ETH, USDT & USDC daily!",
  className = "",
  showLabels = true 
}) {
  const shareUrls = generateSocialShareUrls(url, title, description);

  const handleShare = (platform) => {
    trackEvent('social_share', {
      platform: platform,
      url: url,
      title: title,
      category: 'social_engagement'
    });
  };

  const shareButtons = [
    {
      name: 'Facebook',
      icon: '📘',
      url: shareUrls.facebook,
      color: '#1877F2'
    },
    {
      name: 'Twitter',
      icon: '🐦',
      url: shareUrls.twitter,
      color: '#1DA1F2'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: shareUrls.linkedin,
      color: '#0A66C2'
    },
    {
      name: 'Reddit',
      icon: '🤖',
      url: shareUrls.reddit,
      color: '#FF4500'
    },
    {
      name: 'Telegram',
      icon: '✈️',
      url: shareUrls.telegram,
      color: '#0088CC'
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      url: shareUrls.whatsapp,
      color: '#25D366'
    }
  ];

  return (
    <div className={`social-share ${className}`}>
      <div className="social-share-title">
        🚀 Share & Earn More Crypto!
      </div>
      <div className="social-share-buttons">
        {shareButtons.map((button) => (
          <a
            key={button.name}
            href={button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-share-button"
            style={{ '--button-color': button.color }}
            onClick={() => handleShare(button.name.toLowerCase())}
            title={`Share on ${button.name}`}
          >
            <span className="social-icon">{button.icon}</span>
            {showLabels && <span className="social-label">{button.name}</span>}
          </a>
        ))}
      </div>
      <div className="social-share-incentive">
        💰 Get 10% of your referrals' earnings forever!
      </div>
    </div>
  );
}

export default SocialShare;