'use client';

import React, { useState, useEffect } from 'react';
import soundManager from '../utils/soundManager';
import './MemoryGame.css';

function MemoryGame({ onComplete, onClose }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const emojis = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺'];

  const initGame = () => {
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
      setGameComplete(true);
      soundManager.success();
      const points = Math.max(200 - (moves * 5), 50);
      setTimeout(() => {
        onComplete(true, points);
      }, 2000);
    }
  }, [matched]);

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) {
      return;
    }
    soundManager.flip();
    setFlipped([...flipped, index]);
  };

  if (!gameStarted) {
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
