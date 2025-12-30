import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = '', type = 'spinner' }) => {
  if (type === 'logo') {
    return (
      <div className="loading-spinner-container">
        <div className={`loading-logo loading-logo-${size}`}>
          <img 
            src="/ciprohub.png" 
            alt="Cipro Loading" 
            className="logo-spinner"
          />
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
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
