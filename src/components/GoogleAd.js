import React, { useEffect } from 'react';
import './GoogleAd.css';

function GoogleAd({ 
  slot, 
  format = 'auto', 
  responsive = true,
  style = {},
  className = ''
}) {
  useEffect(() => {
    try {
      // Push ad to AdSense
      if (window.adsbygoogle && process.env.NODE_ENV === 'production') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Only show ads in production
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={`google-ad-placeholder ${className}`} style={style}>
        <div className="ad-placeholder-content">
          <span>📢 Google Ad</span>
          <span className="ad-placeholder-text">Ads will appear here in production</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`google-ad-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-8931942625794122"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
}

// Predefined ad slots for different positions
export const AdSlots = {
  HEADER_BANNER: '1234567890', // Replace with your actual slot IDs
  SIDEBAR: '1234567891',
  IN_ARTICLE: '1234567892',
  FOOTER: '1234567893',
  MOBILE_BANNER: '1234567894'
};

export default GoogleAd;
