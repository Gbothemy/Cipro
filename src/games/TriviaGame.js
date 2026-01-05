import React, { useState, useEffect } from 'react';
import soundManager from '../utils/soundManager';
import { getRandomQuestions, getTotalQuestionCount } from '../data/questionBank';
import { canPlayGame, recordGameAttempt, getTimeUntilReset } from '../utils/gameAttemptManager';
import './GameModal.css';
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

    try {
      const info = await canPlayGame(user.userId, 'trivia');
      setAttemptInfo(info);
    } catch (error) {
      console.error('Error checking attempts:', error);
    }
    setLoading(false);
  };

  const startGame = () => {
    if (user?.userId && attemptInfo && !attemptInfo.canPlay) return;
    
    const selectedQuestions = getRandomQuestions(settings.questions, difficulty);
    console.log('Selected questions:', selectedQuestions); // Debug log
    setQuestions(selectedQuestions);
    setGameStarted(true);
    setTimeLeft(settings.timePerQuestion);
    soundManager.gameStart();
  };

  useEffect(() => {
    if (!gameStarted || gameOver || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(-1); // Time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, showResult, currentQuestion]);

  const handleAnswer = (answerIndex) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    const question = questions[currentQuestion];
    const isCorrect = answerIndex === question.correct;
    
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
    if (currentQuestion + 1 >= questions.length) {
      endGame();
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(settings.timePerQuestion);
    }
  };

  const endGame = async () => {
    setGameOver(true);
    soundManager.gameOver();

    if (user?.userId) {
      try {
        await recordGameAttempt(user.userId, 'trivia', {
          score,
          questionsAnswered: currentQuestion + 1,
          difficulty
        });
      } catch (error) {
        console.error('Error recording game attempt:', error);
      }
    }

    setTimeout(() => {
      onComplete(true, score);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🎯 Trivia Challenge</h2>
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
              <h2>🎯 Trivia Challenge</h2>
              <button className="close-btn" onClick={handleClose}>✕</button>
            </div>
            <div className="game-content">
              <div className="game-intro">
                <p>Test your knowledge and earn points!</p>
                <p>Difficulty: <strong>{difficulty.toUpperCase()}</strong></p>
                <p>Questions: <strong>{settings.questions}</strong> | Time: <strong>{settings.timePerQuestion}s each</strong></p>
                <p style={{ color: '#667eea', fontWeight: '600' }}>
                  🎯 {getTotalQuestionCount().toLocaleString()}+ questions available
                </p>
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
            <h2>🎯 Trivia Challenge</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
            <div className="game-intro">
              {attemptInfo.canPlay ? (
                <>
                  <p>Test your knowledge and earn points!</p>
                  <p>Difficulty: <strong>{difficulty.toUpperCase()}</strong></p>
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

  if (gameOver) {
    const percentage = Math.round((score / (settings.questions * settings.pointsPerCorrect)) * 100);
    let performance = 'needs-improvement';
    if (percentage >= 90) performance = 'excellent';
    else if (percentage >= 70) performance = 'good';
    else if (percentage >= 50) performance = 'okay';

    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🎯 Game Complete!</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
            <div className="game-result">
              <div className="result-icon win">🎉</div>
              <h3>Excellent Work!</h3>
              <p className="points-earned">You scored {score} points!</p>
              <p>Accuracy: {percentage}%</p>
              <div className={`performance-badge ${performance}`}>
                {performance === 'excellent' && '🏆 Excellent!'}
                {performance === 'good' && '👍 Good Job!'}
                {performance === 'okay' && '👌 Not Bad!'}
                {performance === 'needs-improvement' && '📚 Keep Learning!'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for questions and current question
  if (!questions || questions.length === 0 || !questions[currentQuestion]) {
    return (
      <div className="game-modal">
        <div className="game-container">
          <div className="game-header">
            <h2>🎯 Trivia Challenge</h2>
            <button className="close-btn" onClick={handleClose}>✕</button>
          </div>
          <div className="game-content">
            <div className="game-intro">
              <p>Loading questions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  console.log('Current question:', question); // Debug log

  return (
    <div className="game-modal">
      <div className="game-container">
        <div className="game-header">
          <h2>🎯 Trivia Challenge</h2>
          <div className="timer">⏰ {timeLeft}s</div>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>
        
        <div className="game-content">
          <div className="trivia-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p>Question {currentQuestion + 1} of {questions.length}</p>
          </div>

          <div className="question-section">
            <div className="question-container">
              <h3 className="question-text">{question.question}</h3>
            </div>
            
            <div className="answers-section">
              <div className="answers-grid">
                {(question.answers || question.options) && (question.answers || question.options).map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={`answer-option ${
                      selectedAnswer !== null
                        ? index === question.correct
                          ? 'correct'
                          : index === selectedAnswer
                          ? 'incorrect'
                          : ''
                        : ''
                    }`}
                    disabled={selectedAnswer !== null}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-text">{answer}</span>
                    {selectedAnswer !== null && index === question.correct && (
                      <span className="correct-indicator">✓</span>
                    )}
                    {selectedAnswer !== null && index === selectedAnswer && index !== question.correct && (
                      <span className="incorrect-indicator">✗</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriviaGame;