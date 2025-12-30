import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import DailyMining from '../components/DailyMining';
import ActivityFeed from '../components/ActivityFeed';
import GameDisplay from '../components/GameDisplay';
import CiproLoader from '../components/CiproLoader';
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
  }, [user.userId]);

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
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <div className="stat-value">{user.completedTasks || 0}</div>
            <div className="stat-label">Tasks Done</div>
          </div>
        </div>
      </div>

      {/* Enhanced Game Display with Daily Limits */}
      <GameDisplay 
        user={user}
        updateUser={updateUser}
        addNotification={addNotification}
        gameType="all"
        displayMode="grid"
        showStats={true}
        embedded={false}
      />

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
    </div>
  );
}

export default GamePage;
