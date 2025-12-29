import React, { useState, useEffect } from 'react';
import PuzzleGame from '../games/PuzzleGame';
import SpinWheelGame from '../games/SpinWheelGame';
import MemoryGame from '../games/MemoryGame';
import TriviaGame from '../games/TriviaGame';
import gameAttemptManager from '../utils/gameAttemptManager';
import './GameDisplay.css';

const GameDisplay = ({ 
  user, 
  updateUser, 
  addNotification, 
  gameType = 'all', // 'all', 'puzzle', 'spin', 'memory', 'trivia'
  displayMode = 'grid', // 'grid', 'list', 'carousel'
  showStats = true,
  maxGames = null,
  embedded = false // If true, games play inline instead of modal
}) => {
  const [activeGame, setActiveGame] = useState(null);
  const [gameAttempts, setGameAttempts] = useState({
    canPlay: true,
    attemptsUsed: 0,
    attemptsRemaining: 5,
    dailyLimit: 5,
    vipTier: 'Bronze',
    resetTime: null,
    timeUntilReset: 'Loading...'
  });

  const allGames = [
    {
      id: 'puzzle',
      name: 'Puzzle Challenge',
      icon: '🧩',
      description: 'Solve puzzles to earn points',
      reward: { min: 30, max: 80 },
      difficulty: 'Medium',
      duration: '2-3 min',
      category: 'Logic',
      color: '#FF6B6B'
    },
    {
      id: 'spin',
      name: 'Spin Wheel',
      icon: '🎰',
      description: 'Spin the wheel for instant rewards',
      reward: { min: 5, max: 200 },
      difficulty: 'Easy',
      duration: '30 sec',
      category: 'Luck',
      color: '#4ECDC4'
    },
    {
      id: 'memory',
      name: 'Memory Match',
      icon: '🧠',
      description: 'Match cards to test your memory',
      reward: { min: 40, max: 120 },
      difficulty: 'Hard',
      duration: '3-5 min',
      category: 'Memory',
      color: '#FFE66D'
    },
    {
      id: 'trivia',
      name: 'Trivia Quiz',
      icon: '❓',
      description: 'Answer questions to win points',
      reward: { min: 20, max: 100 },
      difficulty: 'Medium',
      duration: '2-4 min',
      category: 'Knowledge',
      color: '#95E1D3'
    }
  ];

  // Filter games based on gameType prop
  const displayGames = gameType === 'all' 
    ? allGames 
    : allGames.filter(game => game.id === gameType);

  // Limit games if maxGames is specified
  const games = maxGames ? displayGames.slice(0, maxGames) : displayGames;

  useEffect(() => {
    loadGameAttempts();
  }, [user?.userId]);

  const loadGameAttempts = async () => {
    if (!user?.userId) return;
    
    try {
      const attemptData = await gameAttemptManager.canPlayGame(user.userId, 'puzzle');
      const timeUntil = gameAttemptManager.getTimeUntilReset(attemptData.resetTime);
      
      setGameAttempts({
        ...attemptData,
        timeUntilReset: timeUntil.formatted
      });
    } catch (error) {
      console.error('Error loading game attempts:', error);
    }
  };

  const handleGameStart = (gameId) => {
    if (!gameAttempts.canPlay && user?.userId) {
      addNotification(`Daily limit reached! Reset in ${gameAttempts.timeUntilReset}`, 'error');
      return;
    }
    setActiveGame(gameId);
  };

  const handleGameComplete = async (won, points) => {
    if (!user?.userId) {
      addNotification(`Game completed! You earned ${points} points!`, 'success');
      setActiveGame(null);
      return;
    }

    try {
      // Record the game attempt
      const recordResult = await gameAttemptManager.recordGameAttempt(user.userId, activeGame, {
        won: won,
        score: points,
        difficulty: 'normal'
      });

      if (recordResult.success) {
        // Update user points
        const newPoints = user.points + points;
        const newExp = user.exp + Math.floor(points / 5); // 1 exp per 5 points
        const newCompletedTasks = user.completedTasks + 1;
        
        // Update user in database
        await updateUser({
          points: newPoints,
          exp: newExp,
          completedTasks: newCompletedTasks
        });

        // Reload game attempts
        await loadGameAttempts();
        
        addNotification(`🎉 Game completed! +${points} points earned!`, 'success');
      } else {
        addNotification('Error recording game. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error completing game:', error);
      addNotification('Error saving progress. Please try again.', 'error');
    }
    
    setActiveGame(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderGameCard = (game) => (
    <div key={game.id} className={`game-card ${displayMode}`} style={{ '--game-color': game.color }}>
      <div className="game-card-header">
        <div className="game-icon">{game.icon}</div>
        <div className="game-info">
          <h3 className="game-name">{game.name}</h3>
          <p className="game-description">{game.description}</p>
        </div>
      </div>
      
      <div className="game-details">
        <div className="game-stat">
          <span className="stat-label">Reward:</span>
          <span className="stat-value">{game.reward.min}-{game.reward.max} pts</span>
        </div>
        <div className="game-stat">
          <span className="stat-label">Duration:</span>
          <span className="stat-value">{game.duration}</span>
        </div>
        <div className="game-stat">
          <span className="stat-label">Difficulty:</span>
          <span 
            className="stat-value difficulty" 
            style={{ color: getDifficultyColor(game.difficulty) }}
          >
            {game.difficulty}
          </span>
        </div>
        <div className="game-stat">
          <span className="stat-label">Category:</span>
          <span className="stat-value">{game.category}</span>
        </div>
      </div>

      <button 
        className="play-game-btn"
        onClick={() => handleGameStart(game.id)}
        disabled={!gameAttempts.canPlay && user?.userId}
      >
        {!gameAttempts.canPlay && user?.userId ? 'Limit Reached' : 'Play Now'}
      </button>
    </div>
  );

  const renderGameGrid = () => (
    <div className={`games-grid ${displayMode}`}>
      {games.map(renderGameCard)}
    </div>
  );

  const renderGameList = () => (
    <div className="games-list">
      {games.map(game => (
        <div key={game.id} className="game-list-item">
          <div className="game-list-icon">{game.icon}</div>
          <div className="game-list-content">
            <h4>{game.name}</h4>
            <p>{game.description}</p>
            <div className="game-list-meta">
              <span className="reward">{game.reward.min}-{game.reward.max} pts</span>
              <span className="duration">{game.duration}</span>
              <span 
                className="difficulty" 
                style={{ color: getDifficultyColor(game.difficulty) }}
              >
                {game.difficulty}
              </span>
            </div>
          </div>
          <button 
            className="play-btn-small"
            onClick={() => handleGameStart(game.id)}
            disabled={!gameAttempts.canPlay && user?.userId}
          >
            Play
          </button>
        </div>
      ))}
    </div>
  );

  const renderGameCarousel = () => (
    <div className="games-carousel">
      <div className="carousel-container">
        {games.map(renderGameCard)}
      </div>
    </div>
  );

  const renderGameComponent = () => {
    const gameProps = {
      onComplete: handleGameComplete,
      onClose: () => setActiveGame(null),
      user: user
    };

    switch (activeGame) {
      case 'puzzle':
        return <PuzzleGame {...gameProps} />;
      case 'spin':
        return <SpinWheelGame {...gameProps} />;
      case 'memory':
        return <MemoryGame {...gameProps} />;
      case 'trivia':
        return <TriviaGame {...gameProps} />;
      default:
        return null;
    }
  };

  return (
    <div className={`game-display ${embedded ? 'embedded' : ''}`}>
      {showStats && user?.userId && (
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-icon">🎮</span>
            <span className="stat-text">
              {gameAttempts.attemptsRemaining}/{gameAttempts.dailyLimit} games left
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⏰</span>
            <span className="stat-text">
              Reset in: {gameAttempts.timeUntilReset}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <span className="stat-text">
              VIP {gameAttempts.vipTier}
            </span>
          </div>
        </div>
      )}

      {displayMode === 'grid' && renderGameGrid()}
      {displayMode === 'list' && renderGameList()}
      {displayMode === 'carousel' && renderGameCarousel()}

      {/* Game Modal/Embedded Display */}
      {activeGame && (
        <div className={embedded ? 'embedded-game' : 'game-modal'}>
          {renderGameComponent()}
        </div>
      )}
    </div>
  );
};

export default GameDisplay;