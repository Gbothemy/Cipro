import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ 
  current, 
  max, 
  label = '', 
  showPercentage = true,
  color = 'primary',
  size = 'medium',
  animated = true
}) => {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className={`progress-bar-container ${size}`}>
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="progress-track">
        <div 
          className={`progress-fill ${color} ${animated ? 'animated' : ''}`}
          style={{ width: `${percentage}%` }}
        >
          {animated && <div className="progress-shine" />}
        </div>
      </div>
      {!label && showPercentage && (
        <div className="progress-text">{Math.round(percentage)}%</div>
      )}
    </div>
  );
};

export default ProgressBar;
