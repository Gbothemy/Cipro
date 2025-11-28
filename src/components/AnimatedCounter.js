import React, { useEffect, useState } from 'react';
import './AnimatedCounter.css';

const AnimatedCounter = ({ 
  value, 
  duration = 1000, 
  prefix = '', 
  suffix = '',
  decimals = 0,
  className = ''
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;
    const startValue = count;
    const endValue = value;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = startValue + (endValue - startValue) * easeOutQuart;
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  const formattedValue = count.toFixed(decimals);

  return (
    <span className={`animated-counter ${className}`}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export default AnimatedCounter;
