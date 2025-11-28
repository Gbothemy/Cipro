import React from 'react';
import './VIPTiersPage.css';

function VIPTiersPage({ user }) {
  const tiers = [
    {
      id: 1,
      name: 'Bronze',
      level: '1-5',
      icon: '🥉',
      color: '#CD7F32',
      gradient: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
      benefits: [
        'Basic game access',
        'Standard cooldowns',
        'Base conversion rate: 10,000 CIPRO = 1 CATI',
        'Community support',
        '1x bonus multiplier',
        'Access to public events'
      ]
    },
    {
      id: 2,
      name: 'Silver',
      level: '6-15',
      icon: '🥈',
      color: '#C0C0C0',
      gradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
      benefits: [
        'All Bronze benefits',
        '10% reduced cooldowns',
        'Better conversion: 9,500 CIPRO = 1 CATI',
        'Priority email support',
        '1.2x bonus multiplier',
        'Silver-tier events access',
        'Exclusive Silver badge'
      ]
    },
    {
      id: 3,
      name: 'Gold',
      level: '16-30',
      icon: '🥇',
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      benefits: [
        'All Silver benefits',
        '25% reduced cooldowns',
        'Premium conversion: 9,000 CIPRO = 1 CATI',
        'Priority chat support',
        '1.5x bonus multiplier',
        'Gold-tier exclusive games',
        'VIP Gold events',
        'Custom profile themes'
      ]
    },
    {
      id: 4,
      name: 'Platinum',
      level: '31-50',
      icon: '💎',
      color: '#E5E4E2',
      gradient: 'linear-gradient(135deg, #E5E4E2 0%, #B9B9B9 100%)',
      benefits: [
        'All Gold benefits',
        '40% reduced cooldowns',
        'Elite conversion: 8,500 CIPRO = 1 CATI',
        '24/7 priority support',
        '2x bonus multiplier',
        'Platinum exclusive games',
        'VIP Platinum tournaments',
        'Early access to new features',
        'Personalized rewards'
      ]
    },
    {
      id: 5,
      name: 'Diamond',
      level: '51+',
      icon: '💠',
      color: '#B9F2FF',
      gradient: 'linear-gradient(135deg, #B9F2FF 0%, #00CED1 100%)',
      benefits: [
        'All Platinum benefits',
        '60% reduced cooldowns',
        'Ultimate conversion: 8,000 CIPRO = 1 CATI',
        'Dedicated VIP manager',
        '3x bonus multiplier',
        'Diamond exclusive games',
        'VIP Diamond championships',
        'Beta testing privileges',
        'Custom game modes',
        'Exclusive Diamond lounge',
        'Monthly bonus packages'
      ]
    }
  ];

  const getCurrentTier = () => {
    const level = user.vipLevel;
    if (level >= 51) return tiers[4];
    if (level >= 31) return tiers[3];
    if (level >= 16) return tiers[2];
    if (level >= 6) return tiers[1];
    return tiers[0];
  };

  const getNextTier = () => {
    const level = user.vipLevel;
    if (level >= 51) return null;
    if (level >= 31) return tiers[4];
    if (level >= 16) return tiers[3];
    if (level >= 6) return tiers[2];
    if (level >= 1) return tiers[1];
    return tiers[0];
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  return (
    <div className="vip-tiers-page">
      <div className="page-header">
        <h1 className="page-title">💎 VIP Tiers</h1>
        <p className="page-subtitle">Unlock exclusive benefits as you level up</p>
      </div>

      {/* Current Tier Card */}
      <div className="current-tier-card" style={{ background: currentTier.gradient }}>
        <div className="current-tier-content">
          <div className="current-tier-icon">{currentTier.icon}</div>
          <div className="current-tier-info">
            <h2>Your Current Tier</h2>
            <h3>{currentTier.name}</h3>
            <p>VIP Level {user.vipLevel}</p>
          </div>
        </div>
        {nextTier && (
          <div className="next-tier-info">
            <p>Next Tier: {nextTier.name} (Level {nextTier.level.split('-')[0]})</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${((user.vipLevel % 10) / 10) * 100}%`,
                  background: nextTier.gradient
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* All Tiers */}
      <div className="tiers-grid">
        {tiers.map((tier) => {
          const isCurrentTier = tier.name === currentTier.name;
          const isUnlocked = user.vipLevel >= parseInt(tier.level.split('-')[0]);

          return (
            <div 
              key={tier.id} 
              className={`tier-card ${isCurrentTier ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}
              style={{ borderColor: tier.color }}
            >
              <div className="tier-header" style={{ background: tier.gradient }}>
                <div className="tier-icon">{tier.icon}</div>
                <h3>{tier.name}</h3>
                <p className="tier-level">Level {tier.level}</p>
                {isCurrentTier && <span className="current-badge">Current</span>}
                {!isUnlocked && <span className="locked-badge">🔒 Locked</span>}
              </div>

              <div className="tier-benefits">
                <h4>Benefits:</h4>
                <ul>
                  {tier.benefits.map((benefit, index) => (
                    <li key={index}>
                      <span className="benefit-icon">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Benefits Comparison */}
      <div className="benefits-comparison">
        <h2>📊 Benefits Comparison</h2>
        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>🥉 Bronze</th>
                <th>🥈 Silver</th>
                <th>🥇 Gold</th>
                <th>💎 Platinum</th>
                <th>💠 Diamond</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cooldown Reduction</td>
                <td>0%</td>
                <td>10%</td>
                <td>25%</td>
                <td>40%</td>
                <td>60%</td>
              </tr>
              <tr>
                <td>Conversion Rate</td>
                <td>10,000:1</td>
                <td>9,500:1</td>
                <td>9,000:1</td>
                <td>8,500:1</td>
                <td>8,000:1</td>
              </tr>
              <tr>
                <td>Bonus Multiplier</td>
                <td>1x</td>
                <td>1.2x</td>
                <td>1.5x</td>
                <td>2x</td>
                <td>3x</td>
              </tr>
              <tr>
                <td>Support Priority</td>
                <td>Community</td>
                <td>Email</td>
                <td>Chat</td>
                <td>24/7</td>
                <td>VIP Manager</td>
              </tr>
              <tr>
                <td>Exclusive Games</td>
                <td>❌</td>
                <td>❌</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>VIP Events</td>
                <td>Public</td>
                <td>Silver</td>
                <td>Gold</td>
                <td>Platinum</td>
                <td>Diamond</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* How to Level Up */}
      <div className="level-up-guide">
        <h2>🚀 How to Level Up</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <div className="guide-icon">🎮</div>
            <h3>Play Games</h3>
            <p>Complete mining tasks to earn experience Cipro</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">🎯</div>
            <h3>Complete Tasks</h3>
            <p>Finish daily challenges and achievements</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">🔥</div>
            <h3>Maintain Streaks</h3>
            <p>Login daily to keep your streak alive</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">👥</div>
            <h3>Refer Friends</h3>
            <p>Invite friends to earn bonus experience</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VIPTiersPage;
