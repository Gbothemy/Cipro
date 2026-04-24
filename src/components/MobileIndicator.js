import React, { useState, useEffect } from 'react';
import './MobileIndicator.css';

const MobileIndicator = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="mobile-indicator">
      <div className="mobile-indicator-content">
        <span className="mobile-icon">📱</span>
        <span className="mobile-text">Mobile Optimized</span>
      </div>
    </div>
  );
};

export default MobileIndicator;
