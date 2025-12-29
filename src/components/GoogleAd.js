import React, { useEffect, useRef, useState } from 'react';
import './GoogleAd.css';

function GoogleAd({ 
  slot, 
  format = 'auto', 
  responsive = true,
  style = {},
  className = '',
  width = 320,
  height = 250
}) {
  const [isVisible, setIsVisible] = useState(false);
  const adRef = useRef(null);

  useEffect(() => {
    // Check if ad container is visible and has proper dimensions
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.boundingClientRect.width >= 250) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && process.env.NODE_ENV === 'production') {
      try {
        // Ensure container has proper dimensions before pushing ad
        const container = adRef.current;
        if (container && container.offsetWidth >= 250) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, [isVisible]);

  // Show demo ads in development, real ads in production
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div 
        ref={adRef}
        className={`google-ad-placeholder ${className}`} 
        style={{ minWidth: `${Math.max(width, 250)}px`, minHeight: `${height}px`, ...style }}
      >
        <div className="ad-placeholder-content">
          <div className="ad-demo-banner">
            <span className="ad-demo-icon">🚀</span>
            <div className="ad-demo-text">
              <strong>Boost Your Crypto Earnings!</strong>
              <p>Join the #1 crypto trading platform</p>
            </div>
            <button className="ad-demo-cta">Learn More</button>
          </div>
          <span className="ad-placeholder-label">Demo Ad - Real ads in production</span>
        </div>
      </div>
    );
  }

  const containerStyle = {
    minWidth: `${Math.max(width, 250)}px`,
    minHeight: `${height}px`,
    width: responsive ? '100%' : `${width}px`,
    height: responsive ? 'auto' : `${height}px`,
    ...style
  };

  const adStyle = {
    display: 'block',
    width: responsive ? '100%' : `${width}px`,
    height: responsive ? 'auto' : `${height}px`,
    minWidth: `${Math.max(width, 250)}px`,
    minHeight: `${height}px`
  };

  return (
    <div 
      ref={adRef}
      className={`google-ad-container ${className}`} 
      style={containerStyle}
    >
      {isVisible && (
        <ins
          className="adsbygoogle"
          style={adStyle}
          data-ad-client="ca-pub-8931942625794122"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive.toString()}
        />
      )}
    </div>
  );
}

// Predefined ad slots for different positions
export const AdSlots = {
  HEADER_BANNER: '1234567890', // Replace with your actual AdSense slot IDs
  SIDEBAR: '2345678901', // Replace with your actual AdSense slot IDs  
  IN_ARTICLE: '3456789012', // Replace with your actual AdSense slot IDs
  FOOTER: '4567890123', // Replace with your actual AdSense slot IDs
  MOBILE_BANNER: '5678901234', // Replace with your actual AdSense slot IDs
  LEADERBOARD: '6789012345', // New leaderboard ad slot
  RECTANGLE: '7890123456', // New rectangle ad slot
  SKYSCRAPER: '8901234567' // New skyscraper ad slot
};

export default GoogleAd;
