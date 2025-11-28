import React from 'react';
import './Badge.css';

const Badge = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  icon = null,
  pulse = false,
  glow = false
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${pulse ? 'badge-pulse' : ''} ${glow ? 'badge-glow' : ''}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
