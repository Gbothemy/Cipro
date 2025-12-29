import React, { useState, useEffect } from 'react';
import './CryptoAd.css';

function CryptoAd({ 
  type = 'banner', // banner, square, skyscraper
  position = 'top',
  className = ''
}) {
  const [currentAd, setCurrentAd] = useState(0);

  // Legitimate crypto-related promotional content
  const cryptoAds = [
    {
      id: 1,
      title: "🚀 Boost Your CIPRO Earnings!",
      description: "Upgrade to VIP and earn 3x more rewards",
      cta: "Upgrade Now",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      action: () => window.location.href = '/vip-tiers'
    },
    {
      id: 2,
      title: "💰 Daily Crypto Airdrops",
      description: "Claim free SOL, ETH, USDT & USDC every 24 hours",
      cta: "Claim Now",
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      action: () => window.location.href = '/airdrop'
    },
    {
      id: 3,
      title: "👥 Refer & Earn 10%",
      description: "Invite friends and earn commission forever",
      cta: "Start Referring",
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      action: () => window.location.href = '/referral'
    },
    {
      id: 4,
      title: "🏆 Join the Competition",
      description: "Climb the leaderboard and win exclusive prizes",
      cta: "View Rankings",
      background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      action: () => window.location.href = '/leaderboard'
    },
    {
      id: 5,
      title: "🎮 Play More Games",
      description: "100+ games available to earn crypto rewards",
      cta: "Play Now",
      background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      action: () => window.location.href = '/game'
    }
  ];

  // Rotate ads every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % cryptoAds.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [cryptoAds.length]);

  const ad = cryptoAds[currentAd];

  const getAdDimensions = () => {
    switch (type) {
      case 'banner':
        return { width: '100%', height: '90px', maxWidth: '728px' };
      case 'square':
        return { width: '300px', height: '250px' };
      case 'skyscraper':
        return { width: '160px', height: '600px' };
      default:
        return { width: '100%', height: '90px' };
    }
  };

  const dimensions = getAdDimensions();

  return (
    <div 
      className={`crypto-ad crypto-ad-${type} ${className}`}
      style={{
        background: ad.background,
        ...dimensions
      }}
      onClick={ad.action}
    >
      <div className="crypto-ad-content">
        <div className="crypto-ad-text">
          <h4 className="crypto-ad-title">{ad.title}</h4>
          <p className="crypto-ad-description">{ad.description}</p>
        </div>
        <button className="crypto-ad-cta">{ad.cta}</button>
      </div>
      <div className="crypto-ad-indicator">
        {cryptoAds.map((_, index) => (
          <span 
            key={index}
            className={`indicator-dot ${index === currentAd ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentAd(index);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default CryptoAd;