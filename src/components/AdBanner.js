import React, { useEffect } from 'react';
import trafficTracker from '../utils/trafficTracker';
import './AdBanner.css';

function AdBanner({ size = 'banner', position = 'top' }) {
  useEffect(() => {
    // Track ad impression when component mounts
    trafficTracker.trackAdImpression();
  }, []);

  const handleAdClick = () => {
    // Track ad click
    trafficTracker.onAdClick();
    
    // In a real implementation, this would redirect to advertiser's site
    // For demo purposes, we'll just show an alert
    alert('Ad clicked! This would redirect to advertiser site.');
  };

  const getAdContent = () => {
    const ads = {
      banner: {
        title: '🚀 Boost Your Crypto Earnings!',
        description: 'Join premium crypto trading platform',
        cta: 'Start Trading Now'
      },
      square: {
        title: '💰 Earn More',
        description: 'Best crypto wallet',
        cta: 'Download App'
      },
      sidebar: {
        title: '📈 Crypto News',
        description: 'Stay updated with latest crypto trends',
        cta: 'Read More'
      }
    };
    
    return ads[size] || ads.banner;
  };

  const adContent = getAdContent();

  return (
    <div className={`ad-banner ad-${size} ad-${position}`} onClick={handleAdClick}>
      <div className="ad-content">
        <div className="ad-title">{adContent.title}</div>
        <div className="ad-description">{adContent.description}</div>
        <div className="ad-cta">{adContent.cta}</div>
      </div>
      <div className="ad-label">Ad</div>
    </div>
  );
}

export default AdBanner;
