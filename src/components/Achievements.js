import React from 'react';
import './Achievements.css';

function Achievements({ user }) {
  const achievements = [
    {
      id: 1,
      name: 'First Steps',
      description: 'Complete your first mining task',
      icon: '🎯',
      unlocked: user.completedTasks >= 1,
      progress: Math.min(user.completedTasks, 1),
      max: 1
    },
    {
      id: 2,
      name: 'Task Master',
      description: 'Complete 10 mining tasks',
      icon: '⭐',
      unlocked: user.completedTasks >= 10,
      progress: Math.min(user.completedTasks, 10),
      max: 10
    },
    {
      id: 3,
      name: 'Dedicated Miner',
      description: 'Complete 50 mining tasks',
      icon: '💎',
      unlocked: user.completedTasks >= 50,
      progress: Math.min(user.completedTasks, 50),
      max: 50
    },
    {
      id: 4,
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      unlocked: user.dayStreak >= 7,
      progress: Math.min(user.dayStreak, 7),
      max: 7
    },
    {
      id: 5,
      name: 'Point Collector',
      description: 'Earn 10,000 points',
      icon: '💰',
      unlocked: user.points >= 10000,
      progress: Math.min(user.points, 10000),
      max: 10000
    },
    {
      id: 6,
      name: 'VIP Elite',
      description: 'Reach VIP Level 5',
      icon: '👑',
      unlocked: user.vipLevel >= 5,
      progress: Math.min(user.vipLevel, 5),
      max: 5
    }
  ];

  return (
    <div className="achievements-section">
      <h3 className="section-title">Achievements</h3>
      <div className="achievements-grid">
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
          >
            <div className="achievement-icon">{achievement.icon}</div>
            <div className="achievement-info">
              <h4>{achievement.name}</h4>
              <p>{achievement.description}</p>
              {!achievement.unlocked && (
                <div className="achievement-progress">
                  <div className="achievement-progress-bar">
                    <div 
                      className="achievement-progress-fill" 
                      style={{ width: `${(achievement.progress / achievement.max) * 100}%` }}
                    ></div>
                  </div>
                  <span className="achievement-progress-text">
                    {achievement.progress} / {achievement.max}
                  </span>
                </div>
              )}
              {achievement.unlocked && (
                <span className="unlocked-badge">✓ Unlocked</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Achievements;
