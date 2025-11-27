import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import Achievements from '../components/Achievements';
import PuzzleGame from '../games/PuzzleGame';
import SpinWheelGame from '../games/SpinWheelGame';
import MemoryGame from '../games/MemoryGame';
import GoogleAd, { AdSlots } from '../components/GoogleAd';
import './GamePage.css';

function GamePage({ user, updateUser, addNotification }) {
  const [mining, setMining] = useState({});
  const [cooldowns, setCooldowns] = useState({});
  const [activeGame, setActiveGame] = useState(null);

  const miningModes = [
    { id: 'puzzle', name: 'Puzzle Challenge', icon: '🧩', reward: 50, duration: 2000, cooldown: 30000, expReward: 10, hasGame: true, gameType: 'puzzle' },
    { id: 'spin', name: 'Spin Wheel', icon: '🎰', reward: 100, duration: 3000, cooldown: 60000, expReward: 20, hasGame: true, gameType: 'spin' },
    { id: 'memory', name: 'Memory Match', icon: '🧠', reward: 120, duration: 2500, cooldown: 45000, expReward: 25, hasGame: true, gameType: 'memory' }
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
  }, []);

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

  const startMining = (mode) => {
    if (mining[mode.id] || cooldowns[mode.id]) return;

    // If it's a game, open the game modal
    if (mode.hasGame) {
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

  const handleGameComplete = (won, points) => {
    const mode = miningModes.find(m => m.gameType === activeGame);
    if (mode) {
      completeMining(mode, points);
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
      <div className="page-header">
        <h1 className="page-title">Game Mining</h1>
        <p className="page-subtitle">Play games to earn points and rewards</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-info">
            <div className="stat-value">{user.points.toLocaleString()}</div>
            <div className="stat-label">Total Points</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <div className="stat-value">{user.completedTasks}</div>
            <div className="stat-label">Completed Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <div className="stat-value">7</div>
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
                <p className="reward">+{mode.reward} pts</p>
                <p className="exp-reward">+{mode.expReward} exp</p>
              </div>
              <button 
                className="start-btn"
                onClick={() => startMining(mode)}
                disabled={isMining || isOnCooldown}
              >
                {isMining ? 'Mining...' : isOnCooldown ? `${cooldownTime}s` : mode.hasGame ? 'Play Game' : 'Start'}
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

      {/* Google AdSense - In-Article */}
      <GoogleAd slot={AdSlots.IN_ARTICLE} format="fluid" />

      <Achievements user={user} />

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
    </div>
  );
}

export default GamePage;
