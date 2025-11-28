'use client';

import React, { useState, useEffect } from 'react';
import soundManager from '../utils/soundManager';
import { getRandomPuzzle, getTotalPuzzleCount } from '../data/puzzleBank';
import { canPlayGame, recordGameAttempt, getTimeUntilReset } from '../utils/gameAttemptManager';
import './PuzzleGame.css';

function PuzzleGame({ onComplete, onClose, user, difficulty = 'easy' }) {
  const [puzzle, setPuzzle] = useState({});
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAttempts();
  }, []);

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      if (timeLeft <= 5) {
        soundManager.tick();
      }
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleGameEnd(false);
    }
  }, [timeLeft, gameStarted]);

  const checkAttempts = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const info = await canPlayGame(user.id, 'puzzle');
    setAttemptInfo(info);
    setLoading(false);
  };

  const startGame = async () => {
    // If user is logged in and has attempt info, check if can play
    if (user?.id && attemptInfo && !attemptInfo.canPlay) {
      return;
    }

    const randomPuzzle = getRandomPuzzle(difficulty);
    setPuzzle(randomPuzzle);
    setGameStarted(true);
    setTimeLeft(30);
    soundManager.gameStart();
  };

  const handleAnswer = (answer) => {
    soundManager.click();
    setUserAnswer(answer);
    const isCorrect = answer === puzzle.answer;
    if (isCorrect) {
      soundManager.correct();
    } else {
      soundManager.wrong();
    }
    handleGameEnd(isCorrect);
  };

  const handleGameEnd = async (won) => {
    setGameStarted(false);
    if (won) {
      soundManager.success();
    }

    // Record attempt
    if (user?.id) {
      await recordGameAttempt(user.id, 'puzzle', {
        won,
        score: won ? 50 : 10,
        difficulty
      });
    }

    setTimeout(() => {
      onComplete(won, won ? 50 : 10);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="puzzle-game">
        <div className="game-container">
          <div className="game-header">
            <h2>🧩 Puzzle Challenge</h2>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          <div className="game-intro">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!gameStarted && !puzzle.type) {
    const timeUntilReset = getTimeUntilReset(attemptInfo?.resetTime);
    
    // If no user or no attempt info, allow playing without limits
    if (!user?.id || !attemptInfo) {
      return (
        <div className="puzzle-game">
          <div className="game-container">
            <div className="game-header">
              <h2>🧩 Puzzle Challenge</h2>
              <button onClick={onClose} className="close-btn">✕</button>
            </div>
            <div className="game-intro">
              <p>Solve puzzles to earn points!</p>
              <p>You have 30 seconds per puzzle.</p>
              <p className="puzzle-count">
                <small>🎯 {getTotalPuzzleCount().toLocaleString()}+ puzzles available</small>
              </p>
              <button onClick={startGame} className="start-game-btn">
                Start Puzzle
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="puzzle-game">
        <div className="game-container">
          <div className="game-header">
            <h2>🧩 Puzzle Challenge</h2>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          <div className="game-intro">
            {attemptInfo.canPlay ? (
              <>
                <p>Solve puzzles to earn points!</p>
                <p>You have 30 seconds per puzzle.</p>
                <div className="attempts-info">
                  <p>
                    <strong>Attempts Today:</strong> {attemptInfo.attemptsUsed} / {attemptInfo.dailyLimit}
                  </p>
                  <p>
                    <strong>Remaining:</strong> {attemptInfo.attemptsRemaining}
                  </p>
                  <p className="vip-tier">
                    <strong>VIP Tier:</strong> {attemptInfo.vipTier.toUpperCase()}
                  </p>
                  <p className="reset-time">
                    Resets in: {timeUntilReset.formatted}
                  </p>
                </div>
                <p className="puzzle-count">
                  <small>🎯 {getTotalPuzzleCount().toLocaleString()}+ puzzles available</small>
                </p>
                <button onClick={startGame} className="start-game-btn">
                  Start Puzzle
                </button>
              </>
            ) : (
              <>
                <div className="no-attempts">
                  <h3>❌ No Attempts Remaining</h3>
                  <p>You've used all {attemptInfo.dailyLimit} attempts today.</p>
                  <p className="vip-tier">Current Tier: {attemptInfo.vipTier.toUpperCase()}</p>
                  <p className="reset-time">
                    Resets in: {timeUntilReset.formatted}
                  </p>
                  {attemptInfo.vipTier !== 'diamond' && (
                    <div className="upgrade-prompt">
                      <h4>🌟 Want More Attempts?</h4>
                      <p>Upgrade your VIP tier to get more daily attempts!</p>
                      <ul className="vip-benefits">
                        <li>🥈 Silver: 10 attempts/day</li>
                        <li>🥇 Gold: 20 attempts/day</li>
                        <li>💎 Platinum: 50 attempts/day</li>
                        <li>💠 Diamond: 100 attempts/day</li>
                      </ul>
                    </div>
                  )}
                </div>
                <button onClick={onClose} className="close-game-btn">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!gameStarted && puzzle.type) {
    const won = userAnswer === puzzle.answer;
    return (
      <div className="puzzle-game">
        <div className="game-container">
          <div className="game-header">
            <h2>🧩 Puzzle Complete!</h2>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          <div className="game-result">
            <div className={`result-icon ${won ? 'win' : 'lose'}`}>
              {won ? '🎉' : '😔'}
            </div>
            <h3>{won ? 'Correct!' : 'Wrong Answer'}</h3>
            <p>You earned {won ? 50 : 10} points!</p>
            <p>Correct answer: {puzzle.answer}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="puzzle-game">
      <div className="game-container">
        <div className="game-header">
          <h2>🧩 Puzzle Challenge</h2>
          <div className="timer">⏰ {timeLeft}s</div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="puzzle-content">
          <div className="puzzle-type">{puzzle.type.toUpperCase()}</div>
          <h3 className="puzzle-question">{puzzle.question}</h3>
          
          <div className="puzzle-options">
            {puzzle.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className="option-btn"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PuzzleGame;
