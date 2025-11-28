import React, { useEffect, useState } from 'react';
import './ConfettiEffect.css';

const ConfettiEffect = ({ active = false, duration = 3000 }) => {
  const [particles, setParticles] = useState([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (active) {
      setIsActive(true);
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: ['#667eea', '#764ba2', '#f093fb', '#48bb78', '#ed8936'][Math.floor(Math.random() * 5)]
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!isActive) return null;

  return (
    <div className="confetti-container">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="confetti-particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            backgroundColor: particle.color
          }}
        />
      ))}
    </div>
  );
};

export default ConfettiEffect;
