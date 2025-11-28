import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <div className="skeleton skeleton-card" />;
      case 'text':
        return <div className="skeleton skeleton-text" />;
      case 'title':
        return <div className="skeleton skeleton-title" />;
      case 'avatar':
        return <div className="skeleton skeleton-avatar" />;
      case 'button':
        return <div className="skeleton skeleton-button" />;
      case 'game':
        return (
          <div className="skeleton-game">
            <div className="skeleton skeleton-game-icon" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-button" />
          </div>
        );
      default:
        return <div className="skeleton" />;
    }
  };

  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{renderSkeleton()}</React.Fragment>
      ))}
    </div>
  );
};

export default SkeletonLoader;
