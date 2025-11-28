import React from 'react';
import haptics from '../utils/haptics';
import soundManager from '../utils/soundManager';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  ripple = true,
  onClick,
  className = '',
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled || loading) return;
    
    // Haptic feedback
    haptics.light();
    
    // Sound feedback
    soundManager.click();
    
    // Call onClick handler
    if (onClick) onClick(e);
  };

  return (
    <button
      className={`
        btn 
        btn-${variant} 
        btn-${size} 
        ${fullWidth ? 'btn-full-width' : ''} 
        ${ripple ? 'ripple' : ''} 
        ${loading ? 'btn-loading' : ''} 
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {!loading && icon && iconPosition === 'left' && (
        <span className="btn-icon btn-icon-left">{icon}</span>
      )}
      <span className="btn-text">{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="btn-icon btn-icon-right">{icon}</span>
      )}
    </button>
  );
};

export default Button;
