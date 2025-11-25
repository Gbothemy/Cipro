'use client';

import React, { useState, useRef } from 'react';
import './SpinWheelGame.css';

function SpinWheelGame({ onComplete, onClose }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const wheelRef = useRef(null);

  const prizes = [
    { label: '10', points: 10, color: '#FF6B6B' },
    { label: '50', points: 50, color: '#4ECDC4' },
    { label: '25', points: 25, color: '#FFE66D' },
    { label: '100', points: 100, color: '#95E1D3' },
    { label: '5', points: 5, color: '#F38181' },
    { label: '75', points: 75, color: '#AA96DA' },
    { label: '15', points: 15, color: '#FCBAD3' },
    { label: '200', points: 200, color: '#A8E6CF' }
  ];

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[randomIndex];
    
    // Calculate rotation (5 full spins + landing position)
    const segmentAngle = 360 / prizes.length;
    const targetRotation = 360 * 5 + (360 - (randomIndex * segmentAngle + segmentAngle / 2));
    
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${targetRotation}deg)`;
    }

    setTimeout(() => {
      setSpinning(false);
      setResult(prize);
      setTimeout(() => {
        onComplete(true, prize.points);
      }, 2000);
    }, 4000);
  };

  if (result) {
    return (
      <div className="spin-wheel-game">
        <div className="game-container">
          <div className="game-header">
            <h2>🎰 Spin Result!</h2>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          <div className="spin-result">
            <div className="result-icon">🎉</div>
            <h3>Congratulations!</h3>
            <p className="result-points">You won {result.points} points!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spin-wheel-game">
      <div className="game-container">
        <div className="game-header">
          <h2>🎰 Spin the Wheel</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="wheel-container">
          <div className="wheel-pointer">▼</div>
          <div ref={wheelRef} className="wheel">
            {prizes.map((prize, index) => (
              <div
                key={index}
                className="wheel-segment"
                style={{
                  transform: `rotate(${(360 / prizes.length) * index}deg)`,
                  backgroundColor: prize.color
                }}
              >
                <span className="prize-label">{prize.label}</span>
              </div>
            ))}
            <div className="wheel-center">SPIN</div>
          </div>
        </div>

        <button 
          onClick={spinWheel} 
          disabled={spinning}
          className="spin-btn"
        >
          {spinning ? 'Spinning...' : 'Spin Now!'}
        </button>
      </div>
    </div>
  );
}

export default SpinWheelGame;
