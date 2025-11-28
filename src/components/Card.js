import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  hover = false,
  padding = 'medium',
  shadow = 'medium',
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`
        card 
        ${hover ? 'card-hover' : ''} 
        card-padding-${padding} 
        card-shadow-${shadow}
        ${onClick ? 'card-clickable' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
