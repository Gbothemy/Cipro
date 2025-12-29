import React, { useState } from 'react';
import { VIP_LEVELS, getSubscriptionPrice, getYearlySavings, getSavingsPercentage } from '../utils/vipConfig';
import DepositModal from '../components/DepositModal';
import './VIPTiersPage.css';

function VIPTiersPage({ user, addNotification }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or yearly
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  const tiers = [
    {
      id: 1,
      name: 'Bronze',
      levelRange: '1-4',
      icon: '🥉',
      color: '#CD7F32',
      gradient: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
      price: 0,
      isFree: true,
      benefits: VIP_LEVELS[1].benefits
    },
    {
      id: 5,
      name: 'Silver',
      levelRange: '5-8',
      icon: '🥈',
      color: '#C0C0C0',
      gradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
      price: VIP_LEVELS[5].priceMonthly,
      priceYearly: VIP_LEVELS[5].priceYearly,
      requiresSubscription: true,
      benefits: VIP_LEVELS[5].benefits
    },
    {
      id: 9,
      name: 'Gold',
      levelRange: '9-12',
      icon: '🥇',
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      price: VIP_LEVELS[9].priceMonthly,
      priceYearly: VIP_LEVELS[9].priceYearly,
      requiresSubscription: true,
      popular: true,
      benefits: VIP_LEVELS[9].benefits
    },
    {
      id: 13,
      name: 'Platinum',
      levelRange: '13-16',
      icon: '💎',
      color: '#E5E4E2',
      gradient: 'linear-gradient(135deg, #E5E4E2 0%, #B9B9B9 100%)',
      price: VIP_LEVELS[13].priceMonthly,
      priceYearly: VIP_LEVELS[13].priceYearly,
      requiresSubscription: true,
      benefits: VIP_LEVELS[13].benefits
    },
    {
      id: 17,
      name: 'Diamond',
      levelRange: '17-20',
      icon: '💠',
      color: '#B9F2FF',
      gradient: 'linear-gradient(135deg, #B9F2FF 0%, #00CED1 100%)',
      price: VIP_LEVELS[17].priceMonthly,
      priceYearly: VIP_LEVELS[17].priceYearly,
      requiresSubscription: true,
      premium: true,
      benefits: VIP_LEVELS[17].benefits
    }
  ];

  const getCurrentTier = () => {
    const level = user.vipLevel;
    // Determine which tier the user is in based on level ranges
    if (level >= 1 && level <= 4) return tiers[0]; // Bronze
    if (level >= 5 && level <= 8) return tiers[1]; // Silver
    if (level >= 9 && level <= 12) return tiers[2]; // Gold
    if (level >= 13 && level <= 16) return tiers[3]; // Platinum
    if (level >= 17 && level <= 20) return tiers[4]; // Diamond
    return tiers[0]; // Default to Bronze
  };

  const getNextTier = () => {
    const level = user.vipLevel;
    if (level >= 20) return null; // Max level
    if (level >= 17) return null; // Already in Diamond
    if (level >= 13) return tiers[4]; // Next is Diamond
    if (level >= 9) return tiers[3]; // Next is Platinum
    if (level >= 5) return tiers[2]; // Next is Gold
    if (level >= 1) return tiers[1]; // Next is Silver
    return tiers[1]; // Default next tier
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  const handleSubscribe = (tier) => {
    if (tier.isFree) {
      addNotification('Bronze tier is free for everyone!', 'info');
      return;
    }
    
    // Open payment modal for subscription
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

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
            <p>Next Tier: {nextTier.name} (Levels {nextTier.levelRange})</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${((user.vipLevel % 4) / 4) * 100}%`,
                  background: nextTier.gradient
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Billing Cycle Toggle */}
      <div className="billing-toggle">
        <button 
          className={`billing-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button 
          className={`billing-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly
          <span className="save-badge">Save {getSavingsPercentage(2)}%</span>
        </button>
      </div>

      {/* All Tiers */}
      <div className="tiers-grid">
        {tiers.map((tier) => {
          const isCurrentTier = tier.name === currentTier.name;
          const price = billingCycle === 'yearly' ? tier.priceYearly : tier.price;
          const savings = billingCycle === 'yearly' && tier.requiresSubscription ? getYearlySavings(tier.id) : 0;

          return (
            <div 
              key={tier.id} 
              className={`tier-card ${isCurrentTier ? 'current' : ''} ${tier.popular ? 'popular' : ''} ${tier.premium ? 'premium' : ''}`}
              style={{ borderColor: tier.color }}
            >
              {tier.popular && <div className="popular-badge">⭐ MOST POPULAR</div>}
              {tier.premium && <div className="premium-badge">👑 PREMIUM</div>}
              
              <div className="tier-header" style={{ background: tier.gradient }}>
                <div className="tier-icon">{tier.icon}</div>
                <h3>{tier.name}</h3>
                <p className="tier-levels">Levels {tier.levelRange}</p>
                {isCurrentTier && <span className="current-badge">✓ Current Plan</span>}
              </div>

              <div className="tier-pricing">
                {tier.isFree ? (
                  <div className="price-free">
                    <span className="price-amount">FREE</span>
                    <span className="price-period">Forever</span>
                  </div>
                ) : (
                  <div className="price-paid">
                    <span className="price-currency">$</span>
                    <span className="price-amount">{price}</span>
                    <span className="price-period">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                )}
                {savings > 0 && (
                  <div className="savings-text">Save ${savings.toFixed(2)}/year</div>
                )}
              </div>

              <div className="tier-benefits">
                <ul>
                  {tier.benefits.map((benefit, index) => (
                    <li key={index}>
                      <span className="benefit-icon">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                className={`subscribe-btn ${isCurrentTier ? 'current' : ''}`}
                onClick={() => handleSubscribe(tier)}
                disabled={isCurrentTier}
                style={{ 
                  background: isCurrentTier ? '#ccc' : tier.gradient,
                  cursor: isCurrentTier ? 'not-allowed' : 'pointer'
                }}
              >
                {isCurrentTier ? '✓ Current Plan' : tier.isFree ? 'Get Started' : 'Subscribe Now'}
              </button>
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
                <td><strong>Levels</strong></td>
                <td><strong>1-4</strong></td>
                <td><strong>5-8</strong></td>
                <td><strong>9-12</strong></td>
                <td><strong>13-16</strong></td>
                <td><strong>17-20</strong></td>
              </tr>
              <tr>
                <td><strong>Price</strong></td>
                <td><strong>FREE</strong></td>
                <td><strong>${VIP_LEVELS[5].priceMonthly}/mo</strong></td>
                <td><strong>${VIP_LEVELS[9].priceMonthly}/mo</strong></td>
                <td><strong>${VIP_LEVELS[13].priceMonthly}/mo</strong></td>
                <td><strong>${VIP_LEVELS[17].priceMonthly}/mo</strong></td>
              </tr>
              <tr>
                <td>Daily Games</td>
                <td>{VIP_LEVELS[1].dailyGameLimit}</td>
                <td>{VIP_LEVELS[5].dailyGameLimit}</td>
                <td>{VIP_LEVELS[9].dailyGameLimit}</td>
                <td>{VIP_LEVELS[13].dailyGameLimit}</td>
                <td>{VIP_LEVELS[17].dailyGameLimit}</td>
              </tr>
              <tr>
                <td>Mining Rewards</td>
                <td>{VIP_LEVELS[1].miningMultiplier}x</td>
                <td>{VIP_LEVELS[5].miningMultiplier}x</td>
                <td>{VIP_LEVELS[9].miningMultiplier}x</td>
                <td>{VIP_LEVELS[13].miningMultiplier}x</td>
                <td>{VIP_LEVELS[17].miningMultiplier}x</td>
              </tr>
              <tr>
                <td>Withdrawal Fee</td>
                <td>{(VIP_LEVELS[1].withdrawalFee * 100).toFixed(0)}%</td>
                <td>{(VIP_LEVELS[5].withdrawalFee * 100).toFixed(0)}%</td>
                <td>{(VIP_LEVELS[9].withdrawalFee * 100).toFixed(0)}%</td>
                <td>{(VIP_LEVELS[13].withdrawalFee * 100).toFixed(0)}%</td>
                <td>{(VIP_LEVELS[17].withdrawalFee * 100).toFixed(0)}%</td>
              </tr>
              <tr>
                <td>Ad-Free</td>
                <td>❌</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>Monthly Bonus</td>
                <td>-</td>
                <td>-</td>
                <td>5,000 CIPRO</td>
                <td>15,000 CIPRO</td>
                <td>50,000 CIPRO</td>
              </tr>
              <tr>
                <td>Support</td>
                <td>Community</td>
                <td>Priority</td>
                <td>VIP</td>
                <td>Premium 24/7</td>
                <td>Dedicated Manager</td>
              </tr>
              <tr>
                <td>Exclusive Features</td>
                <td>❌</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* How to Get VIP */}
      <div className="level-up-guide">
        <h2>🚀 How to Get VIP Access</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <div className="guide-icon">🆓</div>
            <h3>Bronze (Free)</h3>
            <p>Start earning immediately with our free Bronze tier (Levels 1-4) - no payment required!</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">💳</div>
            <h3>Subscribe</h3>
            <p>Choose Silver, Gold, Platinum, or Diamond subscription for premium benefits</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">💰</div>
            <h3>Save with Yearly</h3>
            <p>Get {getSavingsPercentage(2)}% off when you subscribe annually</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">🎁</div>
            <h3>Exclusive Rewards</h3>
            <p>Premium tiers get monthly CIPRO bonuses and special perks</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="vip-faq">
        <h2>❓ Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Is Bronze really free?</h4>
            <p>Yes! Bronze tier (Levels 1-4) is 100% free forever. No credit card required.</p>
          </div>
          <div className="faq-item">
            <h4>Can I cancel anytime?</h4>
            <p>Absolutely! Cancel your subscription anytime with no penalties.</p>
          </div>
          <div className="faq-item">
            <h4>What happens if I cancel?</h4>
            <p>You'll keep your benefits until the end of your billing period, then return to Bronze tier.</p>
          </div>
          <div className="faq-item">
            <h4>Can I upgrade/downgrade?</h4>
            <p>Yes! Change your tier anytime. Upgrades are immediate, downgrades apply next billing cycle.</p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedTier && (
        <DepositModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedTier(null);
          }}
          user={user}
          addNotification={addNotification}
          subscriptionTier={selectedTier}
          billingCycle={billingCycle}
        />
      )}
    </div>
  );
}

export default VIPTiersPage;
