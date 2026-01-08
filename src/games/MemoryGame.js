import React, { useState, useEffect } from 'react';
import soundManager from '../utils/soundManager';
import { canPlayGame, recordGameAttempt, getTimeUntilReset } from '../utils/gameAttemptManager';
import './GameModal.css';
import './MemoryGame.css';

function MemoryGame({ onComplete, onClose, user }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const emojis = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺'];

  useEffect(() => {
    checkAttempts();
    document.body.classList.add('modal-open');
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    // Cleanup function to prevent memory leaks
    return () => {
      if (document.body.classList.contains('modal-open')) {
        document.body.classList.remove('modal-open');
      }
    };
  }, []);

  const handleClose = () => {
    document.body.classList.remove('modal-open');
    if (onClose) {
      onClose();
    }
  };

  const checkAttempts = async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    try {
      const info = await canPlayGame(user.userId, 'memory');
      setAttemptInfo(info);
    } catch (error) {
      console.error('Error checking game attempts:', error);
      // Set fallback data if checking fails
      setAttemptInfo({
        canPlay: true,
        attemptsUsed: 0,
        attemptsRemaining: 5,
        dailyLimit: 5,
        vipTier: 'Bronze',
        resetTime: null
      });
    } finally {
      setLoading(false);
    }
  };

  const initGame = () => {
    if (user?.userId && attemptInfo && !attemptInfo.canPlay) return;

    const seed = Date.now();
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .sort(() => (seed % 3) - 0.5)
      .map((emoji, index) => ({ id: index, emoji, flipped: false }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameStarted(true);
    setGameComplete(false);
    soundManager.gameStart();
  };

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) {
      return;
    }

    soundManager.click();
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        soundManager.correct();
        setMatched([...matched, ...newFlipped]);
        setFlipped([]);
        
        if (matched.length + 2 === cards.length) {
          setTimeout(() => {
            endGame();
          }, 500);
        }
      } else {
        soundManager.wrong();
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  const endGame = async () => {
    setGameComplete(true);
    soundManager.success();
    
    const points = Math.max(200 - (moves * 5), 50);
    
    if (user?.userId) {
      try {
        await recordGameAttempt(user.userId, 'memory', {
          won: true,
          score: points,
          moves: moves,
          difficulty: 'easy'
        });
      } catch (error) {
        console.error('Error recording game attempt:', error);
        // Continue with game completion even if recording fails
      }
    }

    setTimeout(() => {
      if (onComplete) {
        onComplete(true, points);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🧠 Memory Match</h2>
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
              <h2>🧠 Memory Match</h2>
              <button className="close-btn" onClick={handleClose}>✕</button>
            </div>
            <div className="game-content">
              <div className="game-intro">
                <p>Match all pairs to win!</p>
                <p>Fewer moves = More points!</p>
                <button onClick={initGame} className="start-game-btn">
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
            <h2>🧠 Memory Match</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
            <div className="game-intro">
              {attemptInfo.canPlay ? (
                <>
                  <p>Match all pairs to win!</p>
                  <p>Fewer moves = More points!</p>
                  <div className="attempts-info">
                    <p><strong>Attempts Today:</strong> {attemptInfo.attemptsUsed} / {attemptInfo.dailyLimit}</p>
                    <p><strong>Remaining:</strong> {attemptInfo.attemptsRemaining}</p>
                    <p className="vip-tier"><strong>VIP Tier:</strong> {attemptInfo.vipTier.toUpperCase()}</p>
                    <p className="reset-time">Resets in: {timeUntilReset.formatted}</p>
                  </div>
                  <button onClick={initGame} className="start-game-btn">
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

  if (gameComplete) {
    const points = Math.max(200 - (moves * 5), 50);
    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🧠 Game Complete!</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
            <div className="game-result">
              <div className="result-icon win">🎉</div>
              <h3>Excellent Memory!</h3>
              <p>Moves: {moves}</p>
              <p className="points-earned">You earned {points} points!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-modal">
      <div className="game-container memory-container">
        <div className="game-header">
          <h2>🧠 Memory Match</h2>
          <div className="moves-counter">Moves: {moves}</div>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>
        
        <div className="game-content">
          <div className="cards-grid">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`memory-card ${
                  flipped.includes(index) || matched.includes(index) ? 'flipped' : ''
                } ${matched.includes(index) ? 'matched' : ''}`}
                onClick={() => handleCardClick(index)}
              >
                <div className="card-inner">
                  <div className="card-front">?</div>
                  <div className="card-back">{card.emoji}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryGame;