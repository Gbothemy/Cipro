import React, { useState } from 'react';
import './Tooltip.css';

const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  delay = 200 
}) => {
  const [visible, setVisible] = useState(false);
  const [timer, setTimer] = useState(null);

  const showTooltip = () => {
    const t = setTimeout(() => setVisible(true), delay);
    setTimer(t);
  };

  const hideTooltip = () => {
    if (timer) clearTimeout(timer);
    setVisible(false);
  };

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {visible && (
        <div className={`tooltip tooltip-${position}`}>
          {content}
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
