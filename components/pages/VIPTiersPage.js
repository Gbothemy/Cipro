'use client';
import useStore from '../../app/store/useStore';

const TIERS = [
  { level: 1, name: 'Bronze', icon: '🥉', color: 'from-amber-700 to-amber-600', minPoints: 0, dailyGames: 5, conversionBonus: '0%', perks: ['5 game attempts/day', 'Standard conversion rate', 'Daily rewards'] },
  { level: 2, name: 'Silver', icon: '🥈', color: 'from-slate-400 to-slate-300', minPoints: 10000, dailyGames: 7, conversionBonus: '5%', perks: ['7 game attempts/day', '5% better conversion', 'Priority support'] },
  { level: 3, name: 'Gold', icon: '🥇', color: 'from-amber-500 to-yellow-400', minPoints: 50000, dailyGames: 10, conversionBonus: '10%', perks: ['10 game attempts/day', '10% better conversion', 'Exclusive tasks'] },
  { level: 4, name: 'Platinum', icon: '💎', color: 'from-cyan-400 to-blue-400', minPoints: 200000, dailyGames: 15, conversionBonus: '15%', perks: ['15 game attempts/day', '15% better conversion', 'Lucky draw tickets'] },
  { level: 5, name: 'Diamond', icon: '👑', color: 'from-purple-400 to-pink-400', minPoints: 1000000, dailyGames: 20, conversionBonus: '20%', perks: ['20 game attempts/day', '20% better conversion', 'VIP-only events'] },
];

export default function VIPTiersPage() {
  const { user } = useStore();
  const currentLevel = user?.vipLevel || 1;

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">VIP Tiers</h1>
        <p className="text-muted mt-2">Unlock better rewards as you level up</p>
      </div>

      {/* Current tier */}
      <div className="card p-5 mb-8 flex items-center gap-4">
        <div style={{ fontSize: '2.5rem' }}>{TIERS[currentLevel - 1]?.icon || '🥉'}</div>
        <div>
          <p className="text-sm text-muted">Your Current Tier</p>
          <p className="text-xl font-bold text-white">{TIERS[currentLevel - 1]?.name || 'Bronze'}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-dim">Total Points</p>
          <p className="font-bold text-primary">{(user?.points || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid-3">
        {TIERS.map((tier) => {
          const isActive = tier.level === currentLevel;
          const isUnlocked = tier.level <= currentLevel;
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
              <p className="text-xs text-dim mb-4">{tier.minPoints.toLocaleString()} pts required</p>
              <ul className="flex-col gap-2">
                {tier.perks.map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted">
                    <span className={isUnlocked ? 'text-success' : 'text-dim'}>✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
