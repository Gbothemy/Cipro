import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import DailyMining from '../components/DailyMining';
import ActivityFeed from '../components/ActivityFeed';
import PuzzleGame from '../games/PuzzleGame';
import SpinWheelGame from '../games/SpinWheelGame';
import MemoryGame from '../games/MemoryGame';
import TriviaGame from '../games/TriviaGame';
import SEOHead from '../components/SEOHead';
import GoogleAd, { AdSlots } from '../components/GoogleAd';
import gameAttemptManager from '../utils/gameAttemptManager';
import './GamePage.css';

function GamePage({ user, updateUser, addNotification }) {
  const [mining, setMining] = useState({});
  const [cooldowns, setCooldowns] = useState({});
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

  const miningModes = [
    { id: 'puzzle', name: 'Puzzle Challenge', icon: '🧩', reward: 50, duration: 2000, cooldown: 30000, expReward: 10, hasGame: true, gameType: 'puzzle' },
    { id: 'spin', name: 'Spin Wheel', icon: '🎰', reward: 100, duration: 3000, cooldown: 60000, expReward: 20, hasGame: true, gameType: 'spin' },
    { id: 'memory', name: 'Memory Match', icon: '🧠', reward: 120, duration: 2500, cooldown: 45000, expReward: 25, hasGame: true, gameType: 'memory' },
    { id: 'trivia', name: 'Trivia Quiz', icon: '❓', reward: 80, duration: 2000, cooldown: 40000, expReward: 15, hasGame: true, gameType: 'trivia' }
  ];

  useEffect(() => {
    // Load cooldowns from localStorage
    const savedCooldowns = localStorage.getItem('miningCooldowns');
    if (savedCooldowns) {
      try {
        const parsed = JSON.parse(savedCooldowns);
        const now = Date.now();
        const activeCooldowns = {};
        
        Object.keys(parsed).forEach(key => {
          if (parsed[key] > now) {
            activeCooldowns[key] = parsed[key];
          }
        });
        
        setCooldowns(activeCooldowns);
      } catch (e) {
        console.error('Error loading cooldowns:', e);
      }
    }

    // Load game attempt limits
    loadGameAttempts();
  }, [user.userId]);

  // Update game attempts timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Only update when tab is visible (performance optimization)
      if (document.visibilityState === 'visible' && gameAttempts.resetTime) {
        const timeUntil = gameAttemptManager.getTimeUntilReset(gameAttempts.resetTime);
        setGameAttempts(prev => ({
          ...prev,
          timeUntilReset: timeUntil.formatted
        }));

        // If reset time has passed, reload attempts
        if (timeUntil.hours === 0 && timeUntil.minutes === 0) {
          loadGameAttempts();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameAttempts.resetTime]);

  const loadGameAttempts = async () => {
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

  useEffect(() => {
    // Save cooldowns to localStorage
    localStorage.setItem('miningCooldowns', JSON.stringify(cooldowns));
    
    // Set up timers for active cooldowns
    const timers = Object.keys(cooldowns).map(key => {
      const remaining = cooldowns[key] - Date.now();
      if (remaining > 0) {
        return setTimeout(() => {
          setCooldowns(prev => {
            const newCooldowns = { ...prev };
            delete newCooldowns[key];
            return newCooldowns;
          });
        }, remaining);
      }
      return null;
    });

    return () => timers.forEach(timer => timer && clearTimeout(timer));
  }, [cooldowns]);

  const startMining = async (mode) => {
    if (mining[mode.id] || cooldowns[mode.id]) return;

    // If it's a game, check daily limits first
    if (mode.hasGame) {
      if (!gameAttempts.canPlay) {
        if (gameAttempts.attemptsRemaining === 0) {
          addNotification(`Daily limit reached! ${gameAttempts.attemptsUsed}/${gameAttempts.dailyLimit} games played. Reset in ${gameAttempts.timeUntilReset}`, 'error');
          return;
        }
      }
      setActiveGame(mode.gameType);
      return;
    }

    // Otherwise, do auto-mining
    setMining({ ...mining, [mode.id]: true });
    addNotification(`Started ${mode.name}!`, 'info');

    setTimeout(() => {
      completeMining(mode, mode.reward);
    }, mode.duration);
  };

  const completeMining = async (mode, earnedPoints) => {
    const newPoints = user.points + earnedPoints;
    const newExp = user.exp + mode.expReward;
    const newCompletedTasks = user.completedTasks + 1;
    
    // Check for level up
    let newLevel = user.vipLevel;
    let finalExp = newExp;
    if (newExp >= user.maxExp) {
      newLevel = user.vipLevel + 1;
      finalExp = newExp - user.maxExp;
      addNotification(`🎉 Level Up! You are now VIP Level ${newLevel}!`, 'success');
    }

    try {
      // Update user in database
      await db.updateUser(user.userId, {
        points: newPoints,
        vipLevel: newLevel,
        exp: finalExp,
        completedTasks: newCompletedTasks,
        dayStreak: user.dayStreak,
        lastClaim: user.lastClaim
      });

      // Record game play
      if (mode.gameType) {
        await db.recordGamePlay(user.userId, mode.gameType);
      }

      // Update task progress for "Play 3 Games" and "Play 20 Games" tasks
      try {
        // Get all tasks
        const allTasks = await db.getTasks();
        const playGamesTasks = allTasks.filter(t => 
          t.task_name.includes('Play') && t.task_name.includes('Games')
        );
        
        // Update progress for each play games task
        for (const task of playGamesTasks) {
          const userTask = await db.getUserTasks(user.userId);
          const existingProgress = userTask.find(ut => ut.task_id === task.id);
          const currentProgress = existingProgress?.progress || 0;
          
          // Increment progress by 1
          await db.updateTaskProgress(user.userId, task.id, currentProgress + 1);
        }
      } catch (taskError) {
        console.error('Error updating task progress:', taskError);
      }

      // Update local state
      updateUser({
        points: newPoints,
        exp: finalExp,
        vipLevel: newLevel,
        completedTasks: newCompletedTasks
      });

      setMining({ ...mining, [mode.id]: false });
      const newCooldowns = { ...cooldowns, [mode.id]: Date.now() + mode.cooldown };
      setCooldowns(newCooldowns);
      addNotification(`+${earnedPoints} points earned!`, 'success');
    } catch (error) {
      console.error('Error completing mining:', error);
      addNotification('Error saving progress. Please try again.', 'error');
    }
  };

  const handleGameComplete = async (won, points) => {
    const mode = miningModes.find(m => m.gameType === activeGame);
    if (mode) {
      // Record the game attempt FIRST
      const recordResult = await gameAttemptManager.recordGameAttempt(user.userId, mode.gameType, {
        won: won,
        score: points,
        difficulty: 'normal'
      });

      if (recordResult.success) {
        // Complete mining and give rewards
        await completeMining(mode, points);

        // Reload game attempts from database to get updated count
        await loadGameAttempts();
      } else {
        addNotification('Error recording game attempt. Please try again.', 'error');
      }
    }
    setActiveGame(null);
  };

  const getCooldownTime = (modeId) => {
    if (!cooldowns[modeId]) return null;
    const remaining = Math.ceil((cooldowns[modeId] - Date.now()) / 1000);
    return remaining > 0 ? remaining : null;
  };

  return (
    <div className="game-page">
      <SEOHead 
        title="🎮 Play Crypto Games & Earn Rewards | Cipro Gaming Platform"
        description="🎮 Play exciting games and earn real cryptocurrency! Choose from Trivia, Memory, Puzzle & Spin Wheel games. Earn SOL, ETH, USDT & USDC rewards daily. Start playing now!"
        keywords="crypto games, play to earn, cryptocurrency games, earn SOL, earn ETH, earn USDT, earn USDC, blockchain games, gaming rewards, crypto mining games, free crypto games, trivia games crypto, memory games crypto, puzzle games crypto"
        url="https://www.ciprohub.site/game"
      />
      <div className="page-header">
        <h1 className="page-title">Game Mining</h1>
        <p className="page-subtitle">Play games to earn Cipro and rewards</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-info">
            <div className="stat-value">{user.points.toLocaleString()}</div>
            <div className="stat-label">Total Cipro</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-info">
            <div className="stat-value">{gameAttempts.attemptsRemaining}/{gameAttempts.dailyLimit}</div>
            <div className="stat-label">Games Left</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <div className="stat-value">{user.dayStreak || 0}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <div className="stat-value">Level {user.vipLevel}</div>
            <div className="stat-label">VIP Status</div>
          </div>
        </div>
      </div>

      {/* Daily Limits Info */}
      {gameAttempts.attemptsRemaining === 0 && (
        <div className="daily-limits-info">
          <div className="limits-card">
            <div className="limits-icon">⏰</div>
            <div className="limits-content">
              <h3>Daily Game Limit Reached</h3>
              <p>You've played {gameAttempts.attemptsUsed}/{gameAttempts.dailyLimit} games today as a {gameAttempts.vipTier} member.</p>
              <p className="reset-time">Games reset in: <strong>{gameAttempts.timeUntilReset}</strong></p>
              {gameAttempts.vipTier !== 'Diamond' && (
                <p className="upgrade-hint">💡 Upgrade your VIP level for more daily games!</p>
              )}
            </div>
          </div>
        </div>
      )}

      <h3 className="section-title">Mining Modes</h3>
      <div className="mining-grid">
        {miningModes && miningModes.length > 0 ? miningModes.map(mode => {
          const cooldownTime = getCooldownTime(mode.id);
          const isOnCooldown = cooldownTime !== null;
          const isMining = mining[mode.id];
          
          return (
            <div key={mode.id} className={`mining-card ${isOnCooldown ? 'cooldown' : ''}`}>
              <div className="mining-icon">{mode.icon}</div>
              <h4>{mode.name}</h4>
              <div className="mining-rewards">
                <p className="reward">+{mode.reward} CIPRO</p>
                <p className="exp-reward">+{mode.expReward} exp</p>
              </div>
              <button 
                className="start-btn"
                onClick={() => startMining(mode)}
                disabled={isMining || isOnCooldown || (mode.hasGame && !gameAttempts.canPlay)}
              >
                {isMining ? 'Mining...' : 
                 isOnCooldown ? `${cooldownTime}s` : 
                 mode.hasGame && !gameAttempts.canPlay ? 'Limit Reached' :
                 mode.hasGame ? 'Play Game' : 'Start'}
              </button>
              {isMining && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ animationDuration: `${mode.duration}ms` }}></div>
                </div>
              )}
              {isOnCooldown && !isMining && (
                <div className="cooldown-overlay">
                  <span className="cooldown-text">⏱️ {cooldownTime}s</span>
                </div>
              )}
            </div>
          );
        }) : <div style={{padding: '40px', textAlign: 'center', color: '#999'}}>Loading mining modes...</div>}
      </div>

      {/* Daily Mining Section */}
      <DailyMining user={user} updateUser={updateUser} addNotification={addNotification} />

      {/* Google AdSense - In-Article */}
      <GoogleAd 
        slot={AdSlots.IN_ARTICLE} 
        format="auto" 
        width={300} 
        height={250}
        style={{ margin: '20px auto', maxWidth: '100%' }}
      />

      {/* Live Activity Feed */}
      <ActivityFeed user={user} maxItems={8} />

      {/* Game Modals */}
      {activeGame === 'puzzle' && (
        <PuzzleGame 
          onComplete={handleGameComplete}
          onClose={() => setActiveGame(null)}
        />
      )}

      {activeGame === 'spin' && (
        <SpinWheelGame 
          onComplete={handleGameComplete}
          onClose={() => setActiveGame(null)}
        />
      )}

      {activeGame === 'memory' && (
        <MemoryGame 
          onComplete={handleGameComplete}
          onClose={() => setActiveGame(null)}
        />
      )}

      {activeGame === 'trivia' && (
        <TriviaGame 
          onComplete={handleGameComplete}
          onClose={() => setActiveGame(null)}
        />
      )}
    </div>
  );
}

export default GamePage;
