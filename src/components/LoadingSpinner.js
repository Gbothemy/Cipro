import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = '', type = 'spinner' }) => {
  if (type === 'logo') {
    return (
      <div className="loading-spinner-container">
        <div className={`loading-logo loading-logo-${size}`}>
          <img 
            src="/cipro-logo.svg" 
            alt="Cipro Loading" 
            className="logo-spinner"
            onError={(e) => {
              // Fallback to PNG if SVG fails
              e.target.src = "/ciprohub.png";
            }}
          />
          <div className="logo-pulse-ring"></div>
          <div className="logo-pulse-ring-2"></div>
        </div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    );
  }

  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner loading-spinner-${size}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
