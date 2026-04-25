'use client';
import { useState } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const TIERS = [
  { level: 1, name: 'Bronze', icon: '🥉', color: 'from-amber-700 to-amber-600', minPoints: 0, priceUSDT: 0, dailyGames: 5, conversionBonus: '0%', perks: ['5 game attempts/day', 'Standard conversion rate', 'Daily rewards'] },
  { level: 2, name: 'Silver', icon: '🥈', color: 'from-slate-400 to-slate-300', minPoints: 10000, priceUSDT: 5, dailyGames: 7, conversionBonus: '5%', perks: ['7 game attempts/day', '5% better conversion', 'Priority support'] },
  { level: 3, name: 'Gold', icon: '🥇', color: 'from-amber-500 to-yellow-400', minPoints: 50000, priceUSDT: 15, dailyGames: 10, conversionBonus: '10%', perks: ['10 game attempts/day', '10% better conversion', 'Exclusive tasks'] },
  { level: 4, name: 'Platinum', icon: '💎', color: 'from-cyan-400 to-blue-400', minPoints: 200000, priceUSDT: 40, dailyGames: 15, conversionBonus: '15%', perks: ['15 game attempts/day', '15% better conversion', 'Lucky draw tickets'] },
  { level: 5, name: 'Diamond', icon: '👑', color: 'from-purple-400 to-pink-400', minPoints: 1000000, priceUSDT: 100, dailyGames: 20, conversionBonus: '20%', perks: ['20 game attempts/day', '20% better conversion', 'VIP-only events'] },
];

const CRYPTO_RATES = {
  sol: 100,    // 1 SOL = $100
  eth: 2000,   // 1 ETH = $2000
  usdt: 1,     // 1 USDT = $1
  usdc: 1,     // 1 USDC = $1
};

const CRYPTO_INFO = {
  sol: { name: 'Solana', icon: '◎', color: '#14F195' },
  eth: { name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
  usdt: { name: 'Tether', icon: '₮', color: '#26A17B' },
  usdc: { name: 'USD Coin', icon: '$', color: '#2775CA' },
};

export default function VIPTiersPage() {
  const { user, updateUser, addNotification } = useStore();
  const [purchasing, setPurchasing] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const currentLevel = user?.vipLevel || 1;

  const handlePurchase = async (tier, currency) => {
    if (!user?.userId || tier.level <= currentLevel) return;
    
    const priceInCurrency = tier.priceUSDT / CRYPTO_RATES[currency];
    const userBalance = Number(user?.balance?.[currency] || 0);
    
    if (userBalance < priceInCurrency) {
      addNotification({
        type: 'error',
        title: 'Insufficient Balance',
        message: `You need ${priceInCurrency.toFixed(4)} ${currency.toUpperCase()}. Go to Wallet to add funds.`,
      });
      return;
    }

    setPurchasing(tier.level);
    setShowPaymentModal(false);
    
    try {
      // Deduct crypto and upgrade VIP level
      await db.updateBalance(user.userId, currency, userBalance - priceInCurrency);
      const updatedUser = await db.updateUser(user.userId, {
        vipLevel: tier.level,
      });
      
      updateUser({
        ...updatedUser,
        balance: { ...user.balance, [currency]: userBalance - priceInCurrency }
      });
      
      addNotification({
        type: 'success',
        title: '🎉 VIP Upgraded!',
        message: `You are now ${tier.name} tier! Paid ${priceInCurrency.toFixed(4)} ${currency.toUpperCase()}`,
      });
    } catch (error) {
      console.error(error);
      addNotification({
        type: 'error',
        title: 'Upgrade Failed',
        message: error.message || 'Failed to upgrade VIP tier',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const openPaymentModal = (tier) => {
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">VIP Tiers</h1>
        <p className="text-muted mt-2">Unlock better rewards as you level up or purchase instantly with crypto</p>
      </div>

      {/* Current tier */}
      <div className="card p-5 mb-8 flex items-center gap-4">
        <div style={{ fontSize: '2.5rem' }}>{TIERS[currentLevel - 1]?.icon || '🥉'}</div>
        <div>
          <p className="text-sm text-muted">Your Current Tier</p>
          <p className="text-xl font-bold text-white">{TIERS[currentLevel - 1]?.name || 'Bronze'}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-dim">Wallet Balance</p>
          <div className="flex gap-2 text-xs">
            <span style={{ color: CRYPTO_INFO.sol.color }}>{Number(user?.balance?.sol || 0).toFixed(2)} SOL</span>
            <span style={{ color: CRYPTO_INFO.eth.color }}>{Number(user?.balance?.eth || 0).toFixed(4)} ETH</span>
          </div>
        </div>
      </div>

      <div className="grid-3">
        {TIERS.map((tier) => {
          const isActive = tier.level === currentLevel;
          const isUnlocked = tier.level <= currentLevel;
          const isPurchasing = purchasing === tier.level;
          
          return (
            <div
              key={tier.level}
              className="card p-5"
              style={{
                borderColor: isActive ? 'rgba(102,126,234,0.4)' : isUnlocked ? 'rgba(255,255,255,0.1)' : undefined,
                opacity: isUnlocked ? 1 : 0.6,
                boxShadow: isActive ? '0 4px 20px rgba(102,126,234,0.4)' : undefined,
                transition: 'all 0.3s'
              }}
            >
              <div 
                className="rounded-xl flex items-center justify-center shadow-lg mb-4"
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  fontSize: '1.5rem',
                  background: `linear-gradient(135deg, ${tier.color.includes('amber-700') ? '#b45309, #d97706' : tier.color.includes('slate') ? '#94a3b8, #cbd5e1' : tier.color.includes('amber-500') ? '#f59e0b, #fbbf24' : tier.color.includes('cyan') ? '#22d3ee, #3b82f6' : '#a78bfa, #ec4899'})`
                }}
              >
                {tier.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-white">{tier.name}</h3>
                {isActive && <span className="badge-primary text-xs">Current</span>}
              </div>
              <p className="text-xs text-dim mb-4">
                {tier.level === 1 ? 'Free tier' : `$${tier.priceUSDT} USD`}
              </p>
              <ul className="flex-col gap-2 mb-4">
                {tier.perks.map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted">
                    <span className={isUnlocked ? 'text-success' : 'text-dim'}>✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
              
              {tier.level > currentLevel && (
                <button
                  onClick={() => openPaymentModal(tier)}
                  disabled={isPurchasing}
                  className="btn btn-primary w-full text-sm"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {isPurchasing ? '⏳ Processing...' : `💳 Buy with Crypto`}
                </button>
              )}
              
              {isActive && (
                <div className="text-center text-xs text-success font-medium">
                  ✓ Active
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedTier && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setShowPaymentModal(false)}
        >
          <div 
            className="card p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Choose Payment Method</h3>
            <p className="text-sm text-muted mb-6">
              Upgrade to {selectedTier.name} tier for ${selectedTier.priceUSDT}
            </p>
            
            <div className="grid gap-3">
              {Object.entries(CRYPTO_INFO).map(([currency, info]) => {
                const priceInCurrency = selectedTier.priceUSDT / CRYPTO_RATES[currency];
                const userBalance = Number(user?.balance?.[currency] || 0);
                const canAfford = userBalance >= priceInCurrency;
                
                return (
                  <button
                    key={currency}
                    onClick={() => handlePurchase(selectedTier, currency)}
                    disabled={!canAfford}
                    className={canAfford ? 'btn btn-primary flex items-center justify-between p-4' : 'btn flex items-center justify-between p-4 opacity-50 cursor-not-allowed'}
                    style={{ 
                      borderRadius: '0.75rem',
                      background: canAfford ? undefined : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '1.5rem', color: info.color }}>{info.icon}</span>
                      <div className="text-left">
                        <p className="font-semibold text-white">{info.name}</p>
                        <p className="text-xs text-dim">Balance: {userBalance.toFixed(4)}</p>
                      </div>
                    </div>
                    <span className="font-bold" style={{ color: canAfford ? info.color : 'var(--text-dim)' }}>
                      {priceInCurrency.toFixed(4)}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setShowPaymentModal(false)}
              className="btn w-full mt-4 text-sm"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="card p-5 mt-6">
        <h3 className="font-semibold text-white mb-3">How to Upgrade</h3>
        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">💳</span>
            <div>
              <p className="text-sm font-medium text-white">Purchase with Crypto</p>
              <p className="text-xs text-dim">Buy VIP tiers instantly with SOL, ETH, USDT, or USDC</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🎰</span>
            <div>
              <p className="text-sm font-medium text-white">Win in Lucky Draw</p>
              <p className="text-xs text-dim">Get a free VIP upgrade by winning the lucky draw</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">💰</span>
            <div>
              <p className="text-sm font-medium text-white">Add Funds</p>
              <p className="text-xs text-dim">Convert points to crypto or deposit directly to your wallet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
