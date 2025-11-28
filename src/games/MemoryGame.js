'use client';

import React, { useState, useEffect } from 'react';
import soundManager from '../utils/soundManager';
import { canPlayGame, recordGameAttempt, getTimeUntilReset } from '../utils/gameAttemptManager';
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
  }, []);

  const checkAttempts = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const info = await canPlayGame(user.id, 'memory');
    setAttemptInfo(info);
    setLoading(false);
  };

  const initGame = () => {
    // If user is logged in and has attempt info, check if can play
    if (user?.id && attemptInfo && !attemptInfo.canPlay) return;

    // Use timestamp for unique shuffle each time
    const seed = Date.now();
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .sort(() => (seed % 3) - 0.5) // Double shuffle for more randomness
      .map((emoji, index) => ({ id: index, emoji, flipped: false }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameStarted(true);
    setGameComplete(false);
    soundManager.gameStart();
  };

  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      if (cards[first].emoji === cards[second].emoji) {
        soundManager.match();
        setMatched([...matched, first, second]);
        setFlipped([]);
      } else {
        soundManager.wrong();
        setTimeout(() => setFlipped([]), 1000);
      }
      setMoves(moves + 1);
    }
  }, [flipped]);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      handleGameComplete();
    }
  }, [matched]);

  const handleGameComplete = async () => {
    setGameComplete(true);
    soundManager.success();
    const points = Math.max(200 - (moves * 5), 50);

    // Record attempt
    if (user?.id) {
      await recordGameAttempt(user.id, 'memory', {
        won: true,
        score: points,
        difficulty: 'medium'
      });
    }

    setTimeout(() => {
      onComplete(true, points);
    }, 2000);
  };

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) {
      return;
    }
    soundManager.flip();
    setFlipped([...flipped, index]);
  };

  if (loading) {
    return (
      <div className="memory-game">
        <div className="game-container">
          <div className="game-header">
            <h2>🧠 Memory Match</h2>
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
        <div className="memory-game">
          <div className="game-container">
            <div className="game-header">
              <h2>🧠 Memory Match</h2>
              <button onClick={onClose} className="close-btn">✕</button>
            </div>
            <div className="game-intro">
              <p>Match all pairs to win!</p>
              <p>Fewer moves = More points!</p>
              <button onClick={initGame} className="start-game-btn">
                Start Game
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="memory-game">
        <div className="game-container">
          <div className="game-header">
            <h2>🧠 Memory Match</h2>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
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

  if (gameComplete) {
    const points = Math.max(200 - (moves * 5), 50);
    return (
      <div className="memory-game">
        <div className="game-container">
          <div className="game-header">
            <h2>🧠 Game Complete!</h2>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          <div className="game-result">
            <div className="result-icon">🎉</div>
            <h3>Excellent Memory!</h3>
            <p>Moves: {moves}</p>
            <p className="result-points">You earned {points} points!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-game">
      <div className="game-container">
        <div className="game-header">
          <h2>🧠 Memory Match</h2>
          <div className="moves-counter">Moves: {moves}</div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
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
  );
}

export default MemoryGame;
