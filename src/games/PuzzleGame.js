'use client';

import React, { useState, useEffect } from 'react';
import './PuzzleGame.css';

function PuzzleGame({ onComplete, onClose }) {
  const [puzzle, setPuzzle] = useState({});
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);

  const puzzleTypes = [
    {
      type: 'math',
      question: 'What is 15 + 27?',
      answer: '42',
      options: ['40', '42', '44', '46']
    },
    {
      type: 'math',
      question: 'What is 8 × 7?',
      answer: '56',
      options: ['54', '56', '58', '60']
    },
    {
      type: 'logic',
      question: 'If all cats are animals, and some animals are pets, then:',
      answer: 'Some cats might be pets',
      options: ['All cats are pets', 'Some cats might be pets', 'No cats are pets', 'All pets are cats']
    },
    {
      type: 'pattern',
      question: 'What comes next: 2, 4, 8, 16, ?',
      answer: '32',
      options: ['24', '28', '32', '36']
    },
    {
      type: 'word',
      question: 'Which word is the odd one out?',
      answer: 'Car',
      options: ['Apple', 'Banana', 'Orange', 'Car']
    }
  ];

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleGameEnd(false);
    }
  }, [timeLeft, gameStarted]);

  const startGame = () => {
    const randomPuzzle = puzzleTypes[Math.floor(Math.random() * puzzleTypes.length)];
    setPuzzle(randomPuzzle);
    setGameStarted(true);
    setTimeLeft(30);
  };

  const handleAnswer = (answer) => {
    setUserAnswer(answer);
    const isCorrect = answer === puzzle.answer;
    handleGameEnd(isCorrect);
  };

  const handleGameEnd = (won) => {
    setGameStarted(false);
    setTimeout(() => {
      onComplete(won, won ? 50 : 10);
    }, 1000);
  };

  if (!gameStarted && !puzzle.type) {
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
            <button onClick={startGame} className="start-game-btn">
              Start Puzzle
            </button>
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
