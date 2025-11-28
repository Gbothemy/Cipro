'use client';

import React, { useState, useRef, useEffect } from 'react';
import soundManager from '../utils/soundManager';
import { canPlayGame, recordGameAttempt, getTimeUntilReset } from '../utils/gameAttemptManager';
import './SpinWheelGame.css';

function SpinWheelGame({ onComplete, onClose, user }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
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

  useEffect(() => {
    checkAttempts();
  }, []);

  const checkAttempts = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const info = await canPlayGame(user.id, 'spinwheel');
    setAttemptInfo(info);
    setLoading(false);
  };

  const startGame = () => {
    // If user is logged in and has attempt info, check if can play
    if (user?.id && attemptInfo && !attemptInfo.canPlay) return;
    setGameStarted(true);
  };

  const spinWheel = async () => {
    if (spinning) return;
    // If user is logged in and has attempt info, check if can play
    if (user?.id && attemptInfo && !attemptInfo.canPlay) return;

    soundManager.spin();
    setSpinning(true);
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[randomIndex];
    
    // Calculate rotation (5 full spins + landing position)
    const segmentAngle = 360 / prizes.length;
    const targetRotation = 360 * 5 + (360 - (randomIndex * segmentAngle + segmentAngle / 2));
    
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${targetRotation}deg)`;
    }

    setTimeout(async () => {
      setSpinning(false);
      soundManager.coin();
      setResult(prize);

      // Record attempt
      if (user?.id) {
        await recordGameAttempt(user.id, 'spinwheel', {
          won: true,
          score: prize.points,
          difficulty: 'easy'
        });
      }

      setTimeout(() => {
        soundManager.success();
        onComplete(true, prize.points);
      }, 2000);
    }, 4000);
  };

  if (loading) {
    return (
      <div className="spin-wheel-game">
        <div className="game-container">
          <div className="game-header">
            <h2>🎰 Spin the Wheel</h2>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          <div className="game-intro">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    const timeUntilReset = getTimeUntilReset();
    
    // If no user or no attempt info, allow playing without limits
    if (!user?.id || !attemptInfo) {
      return (
        <div className="spin-wheel-game">
          <div className="game-container">
            <div className="game-header">
              <h2>🎰 Spin the Wheel</h2>
              <button onClick={onClose} className="close-btn">✕</button>
            </div>
            <div className="game-intro">
              <p>Spin to win points!</p>
              <p>Prizes range from 5 to 200 points!</p>
              <button onClick={startGame} className="start-game-btn">
                Start Game
              </button>
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
          <div className="game-intro">
            {attemptInfo.canPlay ? (
              <>
                <p>Spin to win points!</p>
                <p>Prizes range from 5 to 200 points!</p>
                <div className="attempts-info">
                  <p><strong>Attempts Today:</strong> {attemptInfo.attemptsUsed} / {attemptInfo.dailyLimit}</p>
                  <p><strong>Remaining:</strong> {attemptInfo.attemptsRemaining}</p>
                  <p className="vip-tier"><strong>VIP Tier:</strong> {attemptInfo.vipTier.toUpperCase()}</p>
                  <p className="reset-time">Resets in: {timeUntilReset.formatted}</p>
                </div>
                <button onClick={startGame} className="start-game-btn">
                  Start Game
                </button>
              </>
            ) : (
              <>
                <div className="no-attempts">
                  <h3>❌ No Attempts Remaining</h3>
                  <p>You've used all {attemptInfo.dailyLimit} attempts today.</p>
                  <p className="vip-tier">Current Tier: {attemptInfo.vipTier.toUpperCase()}</p>
                  <p className="reset-time">Resets in: {timeUntilReset.formatted}</p>
                  {attemptInfo.vipTier !== 'diamond' && (
                    <div className="upgrade-prompt">
                      <h4>🌟 Want More Attempts?</h4>
                      <p>Upgrade your VIP tier!</p>
                      <ul className="vip-benefits">
                        <li>🥈 Silver: 10 attempts/day</li>
                        <li>🥇 Gold: 20 attempts/day</li>
                        <li>💎 Platinum: 50 attempts/day</li>
                        <li>💠 Diamond: 100 attempts/day</li>
                      </ul>
                    </div>
                  )}
                </div>
                <button onClick={onClose} className="close-game-btn">Close</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

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
