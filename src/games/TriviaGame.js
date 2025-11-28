import React, { useState, useEffect } from 'react';
import soundManager from '../utils/soundManager';
import { getRandomQuestions, getTotalQuestionCount } from '../data/questionBank';
import { canPlayGame, recordGameAttempt, getTimeUntilReset } from '../utils/gameAttemptManager';
import './TriviaGame.css';

const TriviaGame = ({ onComplete, onClose, user, difficulty = 'easy' }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  const difficultySettings = {
    easy: { questions: 5, timePerQuestion: 30, pointsPerCorrect: 20 },
    medium: { questions: 8, timePerQuestion: 20, pointsPerCorrect: 30 },
    hard: { questions: 10, timePerQuestion: 15, pointsPerCorrect: 50 }
  };

  const settings = difficultySettings[difficulty];

  useEffect(() => {
    checkAttempts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAttempts = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const info = await canPlayGame(user.id, 'trivia');
    setAttemptInfo(info);
    setLoading(false);
  };

  const startGame = () => {
    // If user is logged in and has attempt info, check if can play
    if (user?.id && attemptInfo && !attemptInfo.canPlay) return;
    
    // Load questions from the comprehensive question bank
    const selectedQuestions = getRandomQuestions(settings.questions, difficulty);
    setQuestions(selectedQuestions);
    setGameStarted(true);
    soundManager.gameStart();
    
    // Log total available questions
    console.log(`Total questions in bank: ${getTotalQuestionCount().toLocaleString()}`);
  };

  useEffect(() => {
    if (questions.length === 0 || gameOver || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return settings.timePerQuestion;
        }
        if (prev <= 5) {
          soundManager.tick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, gameOver, showResult, questions.length]);

  const handleTimeout = () => {
    setShowResult(true);
    setTimeout(() => {
      moveToNext();
    }, 1500);
  };

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return;

    soundManager.click();
    setSelectedAnswer(index);
    const isCorrect = index === questions[currentQuestion].correct;
    
    if (isCorrect) {
      setScore(score + settings.pointsPerCorrect);
      soundManager.correct();
    } else {
      soundManager.wrong();
    }

    setShowResult(true);
    setTimeout(() => {
      moveToNext();
    }, 1500);
  };

  const moveToNext = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(settings.timePerQuestion);
    } else {
      endGame();
    }
  };

  const endGame = async () => {
    setGameOver(true);
    const totalPossible = settings.questions * settings.pointsPerCorrect;
    const isPerfect = score + settings.pointsPerCorrect >= totalPossible;
    
    soundManager.success();

    // Record attempt
    if (user?.id) {
      await recordGameAttempt(user.id, 'trivia', {
        won: true,
        score,
        difficulty
      });
    }
    
    // Call onComplete with won status and score
    if (onComplete) {
      setTimeout(() => {
        onComplete(true, score);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="game-modal">
        <div className="trivia-game">
          <div className="trivia-loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    const timeUntilReset = getTimeUntilReset();
    
    // If no user or no attempt info, allow playing without limits
    if (!user?.id || !attemptInfo) {
      return (
        <div className="game-modal" onClick={onClose}>
          <div className="trivia-game" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={onClose}>✕</button>
            <div className="game-intro">
              <h2>🎯 Trivia Challenge</h2>
              <p>Answer questions to earn points!</p>
              <p>Difficulty: <strong>{difficulty.toUpperCase()}</strong></p>
              <p className="question-count">
                <small>🎯 {getTotalQuestionCount().toLocaleString()}+ questions available</small>
              </p>
              <button onClick={startGame} className="start-game-btn">Start Game</button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="game-modal" onClick={onClose}>
        <div className="trivia-game" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>✕</button>
          <div className="game-intro">
            {attemptInfo.canPlay ? (
              <>
                <h2>🎯 Trivia Challenge</h2>
                <p>Answer questions to earn points!</p>
                <p>Difficulty: <strong>{difficulty.toUpperCase()}</strong></p>
                <div className="attempts-info">
                  <p><strong>Attempts Today:</strong> {attemptInfo.attemptsUsed} / {attemptInfo.dailyLimit}</p>
                  <p><strong>Remaining:</strong> {attemptInfo.attemptsRemaining}</p>
                  <p className="vip-tier"><strong>VIP Tier:</strong> {attemptInfo.vipTier.toUpperCase()}</p>
                  <p className="reset-time">Resets in: {timeUntilReset.formatted}</p>
                </div>
                <p className="question-count">
                  <small>🎯 {getTotalQuestionCount().toLocaleString()}+ questions available</small>
                </p>
                <button onClick={startGame} className="start-game-btn">Start Game</button>
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

  if (questions.length === 0) {
    return <div className="trivia-loading">Loading questions...</div>;
  }

  if (gameOver) {
    const totalPossible = settings.questions * settings.pointsPerCorrect;
    const percentage = Math.round((score / totalPossible) * 100);
    
    return (
      <div className="trivia-game-over">
        <h2>🎉 Quiz Complete!</h2>
        <div className="trivia-final-score">
          <div className="score-value">{score}</div>
          <div className="score-label">Points Earned</div>
        </div>
        <div className="trivia-stats">
          <div className="stat">
            <span className="stat-label">Correct Answers:</span>
            <span className="stat-value">{Math.round(score / settings.pointsPerCorrect)}/{settings.questions}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Accuracy:</span>
            <span className="stat-value">{percentage}%</span>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="game-modal" onClick={onClose}>
      <div className="trivia-game" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <div className="trivia-header">
        <div className="trivia-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">Question {currentQuestion + 1}/{questions.length}</span>
        </div>
        <div className="trivia-timer">
          <span className={`timer ${timeLeft <= 5 ? 'warning' : ''}`}>⏱️ {timeLeft}s</span>
        </div>
        <div className="trivia-score">Score: {score}</div>
      </div>

      <div className="trivia-question">
        <h3>{question.question}</h3>
      </div>

      <div className="trivia-options">
        {question.options.map((option, index) => {
          let className = 'trivia-option';
          if (showResult) {
            if (index === question.correct) {
              className += ' correct';
            } else if (index === selectedAnswer) {
              className += ' incorrect';
            }
          } else if (selectedAnswer === index) {
            className += ' selected';
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
            >
              {option}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default TriviaGame;
