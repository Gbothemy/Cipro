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
        <p className="text-slate-400 mt-1">Unlock better rewards as you level up</p>
      </div>

      {/* Current tier */}
      <div className="card p-5 mb-8 flex items-center gap-4">
        <div className="text-4xl">{TIERS[currentLevel - 1]?.icon || '🥉'}</div>
        <div>
          <p className="text-sm text-slate-400">Your Current Tier</p>
          <p className="text-xl font-bold text-white">{TIERS[currentLevel - 1]?.name || 'Bronze'}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-500">Total Points</p>
          <p className="font-bold text-primary">{(user?.points || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TIERS.map((tier) => {
          const isActive = tier.level === currentLevel;
          const isUnlocked = tier.level <= currentLevel;
          return (
            <div
              key={tier.level}
              className={`card p-5 transition-all duration-300 ${
                isActive ? 'border-primary/40 shadow-brand' : isUnlocked ? 'border-white/10' : 'opacity-60'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                {tier.icon}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white">{tier.name}</h3>
                {isActive && <span className="badge-primary text-xs">Current</span>}
              </div>
              <p className="text-xs text-slate-500 mb-4">{tier.minPoints.toLocaleString()} pts required</p>
              <ul className="space-y-1.5">
                {tier.perks.map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className={isUnlocked ? 'text-emerald-400' : 'text-slate-600'}>✓</span>
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
