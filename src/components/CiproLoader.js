import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import './CiproLoader.css';

const CiproLoader = ({ 
  context = 'default', 
  size = 'medium', 
  message = '', 
  fullScreen = false,
  overlay = false 
}) => {
  // Context-specific configurations
  const contextConfig = {
    default: {
      message: message || 'Loading...',
      className: 'default'
    },
    gaming: {
      message: message || 'Preparing your games...',
      className: 'gaming'
    },
    mining: {
      message: message || 'Initializing mining...',
      className: 'mining'
    },
    profile: {
      message: message || 'Loading profile...',
      className: 'profile'
    },
    leaderboard: {
      message: message || 'Fetching rankings...',
      className: 'default'
    },
    vip: {
      message: message || 'Loading VIP benefits...',
      className: 'vip'
    },
    conversion: {
      message: message || 'Processing conversion...',
      className: 'conversion'
    },
    withdrawal: {
      message: message || 'Processing withdrawal...',
      className: 'withdrawal'
    }
  };

  const config = contextConfig[context] || contextConfig.default;

  const loaderContent = (
    <div className={`cipro-loader ${config.className}`}>
      <LoadingSpinner 
        type="logo" 
        size={size} 
        message={config.message}
      />
      {context === 'gaming' && (
        <div className="gaming-hints">
          <p className="hint">💡 Tip: Higher VIP tiers get more daily games!</p>
        </div>
      )}
      {context === 'mining' && (
        <div className="mining-stats">
          <div className="mining-indicator">
            <span className="mining-dot"></span>
            <span className="mining-dot"></span>
            <span className="mining-dot"></span>
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="cipro-loader-fullscreen">
        {loaderContent}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="cipro-loader-overlay">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default CiproLoader;