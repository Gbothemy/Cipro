import React, { useState, useEffect } from 'react';
import './TriviaGame.css';

const TriviaGame = ({ onComplete, onClose, difficulty = 'easy' }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const difficultySettings = {
    easy: { questions: 5, timePerQuestion: 30, pointsPerCorrect: 20 },
    medium: { questions: 8, timePerQuestion: 20, pointsPerCorrect: 30 },
    hard: { questions: 10, timePerQuestion: 15, pointsPerCorrect: 50 }
  };

  const settings = difficultySettings[difficulty];

  const triviaQuestions = {
    easy: [
      { question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correct: 1 },
      { question: 'What color is the sky?', options: ['Red', 'Blue', 'Green', 'Yellow'], correct: 1 },
      { question: 'How many days in a week?', options: ['5', '6', '7', '8'], correct: 2 },
      { question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correct: 2 },
      { question: 'How many legs does a spider have?', options: ['6', '8', '10', '12'], correct: 1 },
      { question: 'What is 10 - 5?', options: ['3', '4', '5', '6'], correct: 2 },
      { question: 'Which animal says "meow"?', options: ['Dog', 'Cat', 'Cow', 'Bird'], correct: 1 },
      { question: 'What comes after Monday?', options: ['Sunday', 'Tuesday', 'Wednesday', 'Thursday'], correct: 1 }
    ],
    medium: [
      { question: 'What is the largest planet?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correct: 2 },
      { question: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Monet'], correct: 1 },
      { question: 'What is H2O?', options: ['Oxygen', 'Water', 'Hydrogen', 'Carbon'], correct: 1 },
      { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correct: 2 },
      { question: 'What year did WWII end?', options: ['1943', '1944', '1945', '1946'], correct: 2 },
      { question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correct: 0 },
      { question: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], correct: 1 },
      { question: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], correct: 2 }
    ],
    hard: [
      { question: 'What is the Planck constant?', options: ['6.626×10⁻³⁴', '3.14×10⁻³⁴', '9.81×10⁻³⁴', '1.602×10⁻³⁴'], correct: 0 },
      { question: 'Who discovered penicillin?', options: ['Einstein', 'Fleming', 'Curie', 'Newton'], correct: 1 },
      { question: 'What is the capital of Kazakhstan?', options: ['Almaty', 'Astana', 'Bishkek', 'Tashkent'], correct: 1 },
      { question: 'In what year was Bitcoin created?', options: ['2007', '2008', '2009', '2010'], correct: 2 },
      { question: 'What is the atomic number of Gold?', options: ['47', '79', '82', '92'], correct: 1 },
      { question: 'Who wrote "1984"?', options: ['Huxley', 'Orwell', 'Bradbury', 'Asimov'], correct: 1 },
      { question: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correct: 1 },
      { question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], correct: 2 },
      { question: 'Who painted "The Starry Night"?', options: ['Monet', 'Van Gogh', 'Picasso', 'Dali'], correct: 1 },
      { question: 'What is the chemical symbol for Silver?', options: ['Si', 'Ag', 'Au', 'Al'], correct: 1 }
    ]
  };

  useEffect(() => {
    const selectedQuestions = [...triviaQuestions[difficulty]]
      .sort(() => Math.random() - 0.5)
      .slice(0, settings.questions);
    setQuestions(selectedQuestions);
  }, [difficulty]);

  useEffect(() => {
    if (questions.length === 0 || gameOver || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return settings.timePerQuestion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, gameOver, showResult, questions]);

  const handleTimeout = () => {
    setShowResult(true);
    setTimeout(() => {
      moveToNext();
    }, 1500);
  };

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(index);
    const isCorrect = index === questions[currentQuestion].correct;
    
    if (isCorrect) {
      setScore(score + settings.pointsPerCorrect);
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

  const endGame = () => {
    setGameOver(true);
    const totalPossible = settings.questions * settings.pointsPerCorrect;
    const isPerfect = score + settings.pointsPerCorrect >= totalPossible;
    
    // Call onComplete with won status and score
    if (onComplete) {
      setTimeout(() => {
        onComplete(true, score);
      }, 2000);
    }
  };

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
