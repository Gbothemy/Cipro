import React, { useState, useRef, useEffect } from 'react';
import soundManager from '../utils/soundManager';
import { canPlayGame, recordGameAttempt, getTimeUntilReset } from '../utils/gameAttemptManager';
import './GameModal.css';
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
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleClose = () => {
    document.body.classList.remove('modal-open');
    onClose();
  };

  const checkAttempts = async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    const info = await canPlayGame(user.userId, 'spinwheel');
    setAttemptInfo(info);
    setLoading(false);
  };

  const startGame = () => {
    if (user?.userId && attemptInfo && !attemptInfo.canPlay) return;
    setGameStarted(true);
  };

  const spinWheel = async () => {
    if (spinning) return;
    
    if (user?.userId && attemptInfo && !attemptInfo.canPlay) return;

    setSpinning(true);
    soundManager.spin();

    const randomIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[randomIndex];
    const rotation = 360 * 5 + (randomIndex * (360 / prizes.length));

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${rotation}deg)`;
    }

    setTimeout(async () => {
      setSpinning(false);
      setResult(prize);

      if (user?.userId) {
        try {
          await recordGameAttempt(user.userId, 'spinwheel', {
            won: true,
            score: prize.points,
            difficulty: 'easy'
          });
        } catch (error) {
          console.error('Error recording game attempt:', error);
        }
      }

      setTimeout(() => {
        soundManager.success();
        onComplete(true, prize.points);
      }, 2000);
    }, 4000);
  };

  if (loading) {
    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🎰 Spin the Wheel</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
            <div className="game-intro">
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    const timeUntilReset = getTimeUntilReset(attemptInfo?.resetTime);
    
    if (!user?.userId || !attemptInfo) {
      return (
        <div className="game-modal">
          <div className="game-container">
            <div className="game-header">
              <h2>🎰 Spin the Wheel</h2>
              <button className="close-btn" onClick={handleClose}>✕</button>
            </div>
            <div className="game-content">
              <div className="game-intro">
                <p>Spin to win points!</p>
                <p>Prizes range from 5 to 200 points!</p>
                <button onClick={startGame} className="start-game-btn">
                  Start Game
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🎰 Spin the Wheel</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
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
                  <button onClick={handleClose} className="start-game-btn">Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🎰 Spin Result!</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
            <div className="game-result">
              <div className="result-icon win">🎉</div>
              <h3>Congratulations!</h3>
              <p className="points-earned">You won {result.points} points!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-modal">
      <div className="game-container">
        <div className="game-header">
          <h2>🎰 Spin the Wheel</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>
        
        <div className="game-content">
          <div className="wheel-section">
            <div className="wheel-pointer">▼</div>
            <div className="wheel-container">
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
          </div>

          <button 
            onClick={spinWheel} 
            disabled={spinning}
            className={`spin-btn ${spinning ? 'spinning' : ''}`}
          >
            {spinning ? 'Spinning...' : 'Spin Now!'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpinWheelGame;