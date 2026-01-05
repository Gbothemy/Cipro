import React, { useState, useEffect } from 'react';
import soundManager from '../utils/soundManager';
import { getRandomPuzzle, getTotalPuzzleCount } from '../data/puzzleBank';
import { canPlayGame, recordGameAttempt, getTimeUntilReset } from '../utils/gameAttemptManager';
import './GameModal.css';
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
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleClose = () => {
    document.body.classList.remove('modal-open');
    onClose();
  };

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
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    const info = await canPlayGame(user.userId, 'puzzle');
    setAttemptInfo(info);
    setLoading(false);
  };

  const startGame = async () => {
    if (user?.userId && attemptInfo && !attemptInfo.canPlay) {
      return;
    }

    const randomPuzzle = getRandomPuzzle(difficulty);
    setPuzzle(randomPuzzle);
    setGameStarted(true);
    setTimeLeft(30);
    soundManager.gameStart();
  };

  const handleAnswer = (selectedOption) => {
    setUserAnswer(selectedOption);
    const won = selectedOption === puzzle.answer;
    
    if (won) {
      soundManager.correct();
    } else {
      soundManager.wrong();
    }
    
    setTimeout(() => {
      handleGameEnd(won);
    }, 1000);
  };

  const handleGameEnd = async (won) => {
    setGameStarted(false);
    
    if (user?.userId) {
      try {
        await recordGameAttempt(user.userId, 'puzzle', {
          won,
          score: won ? 50 : 10,
          difficulty
        });
      } catch (error) {
        console.error('Error recording game attempt:', error);
      }
    }

    setTimeout(() => {
      onComplete(won, won ? 50 : 10);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🧩 Puzzle Challenge</h2>
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

  if (!gameStarted && !puzzle.type) {
    const timeUntilReset = getTimeUntilReset(attemptInfo?.resetTime);
    
    if (!user?.userId || !attemptInfo) {
      return (
        <div className="game-modal">
          <div className="game-container">
            <div className="game-header">
              <h2>🧩 Puzzle Challenge</h2>
              <button className="close-btn" onClick={handleClose}>✕</button>
            </div>
            <div className="game-content">
              <div className="game-intro">
                <p>Solve puzzles to earn points!</p>
                <p>You have 30 seconds per puzzle.</p>
                <p style={{ color: '#667eea', fontWeight: '600' }}>
                  🎯 {getTotalPuzzleCount().toLocaleString()}+ puzzles available
                </p>
                <button onClick={startGame} className="start-game-btn">
                  Start Puzzle
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
            <h2>🧩 Puzzle Challenge</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
            <div className="game-intro">
              {attemptInfo.canPlay ? (
                <>
                  <p>Solve puzzles to earn points!</p>
                  <p>You have 30 seconds per puzzle.</p>
                  <div className="attempts-info">
                    <p><strong>Attempts Today:</strong> {attemptInfo.attemptsUsed} / {attemptInfo.dailyLimit}</p>
                    <p><strong>Remaining:</strong> {attemptInfo.attemptsRemaining}</p>
                    <p className="vip-tier"><strong>VIP Tier:</strong> {attemptInfo.vipTier.toUpperCase()}</p>
                    <p className="reset-time">Resets in: {timeUntilReset.formatted}</p>
                  </div>
                  <p style={{ color: '#667eea', fontWeight: '600' }}>
                    🎯 {getTotalPuzzleCount().toLocaleString()}+ puzzles available
                  </p>
                  <button onClick={startGame} className="start-game-btn">
                    Start Puzzle
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
                      <p>Upgrade your VIP tier to get more daily attempts!</p>
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

  if (!gameStarted && puzzle.type) {
    const won = userAnswer === puzzle.answer;
    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🧩 Puzzle Complete!</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
            <div className="game-result">
              <div className={`result-icon ${won ? 'win' : ''}`}>
                {won ? '🎉' : '😔'}
              </div>
              <h3>{won ? 'Correct!' : 'Wrong Answer'}</h3>
              <p className="points-earned">You earned {won ? 50 : 10} points!</p>
              <div className="correct-answer">
                <strong>Correct answer:</strong> {puzzle.answer}
              </div>
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
          <h2>🧩 Puzzle Challenge</h2>
          <div className="timer">⏰ {timeLeft}s</div>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>
        
        <div className="game-content">
          <div className="puzzle-content">
            <div className="puzzle-type">{puzzle.type?.toUpperCase()}</div>
            <h3 className="puzzle-question">{puzzle.question}</h3>
            
            <div className="puzzle-options">
              {puzzle.options?.map((option, index) => (
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
    </div>
  );
}

export default PuzzleGame;