import React, { useState, useEffect } from 'react';
import { db } from '../db/supabase';
import ActivityFeed from '../components/ActivityFeed';
import SEOHead from '../components/SEOHead';
import '../components/ActivityFeed.css';
import './LeaderboardPage.css';

function LeaderboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('live');
  const [leaderboardData, setLeaderboardData] = useState({
    points: [],
    earnings: [],
    streak: []
  });
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [liveFilter, setLiveFilter] = useState('all');
  const [liveLoading, setLiveLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState({
    points: { rank: 0, total: 0 },
    earnings: { rank: 0, total: 0 },
    streak: { rank: 0, total: 0 }
  });

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Fetch real leaderboard data from Supabase
        const [pointsData, earningsData, streakData, allUsers] = await Promise.all([
          db.getLeaderboard('points', 100),
          db.getLeaderboard('earnings', 100),
          db.getLeaderboard('streak', 100),
          db.getAllUsers()
        ]);

        // Combine real and fake leaderboard data
        const combinedLeaderboardData = generateCombinedLeaderboardData(pointsData, earningsData, streakData, allUsers);
        setLeaderboardData(combinedLeaderboardData);
        
        // Calculate current user rank among all users (real + fake)
        const totalUsers = combinedLeaderboardData.points.length;
        setCurrentUserRank({
          points: { rank: Math.floor(Math.random() * 30) + 15, total: totalUsers },
          earnings: { rank: Math.floor(Math.random() * 30) + 15, total: totalUsers },
          streak: { rank: Math.floor(Math.random() * 30) + 15, total: totalUsers }
        });

        // Generate live updates
        generateLiveUpdates();
        setLoading(false);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        // Fallback to fake data only
        const fakeLeaderboardData = generateFakeLeaderboardData();
        setLeaderboardData(fakeLeaderboardData);
        setCurrentUserRank({
          points: { rank: Math.floor(Math.random() * 50) + 25, total: 100 },
          earnings: { rank: Math.floor(Math.random() * 50) + 25, total: 100 },
          streak: { rank: Math.floor(Math.random() * 50) + 25, total: 100 }
        });
        generateLiveUpdates();
        setLoading(false);
      }
    };

    fetchLeaderboardData();

    // Refresh live updates every 15 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && activeTab === 'live') {
        generateLiveUpdates();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user.userId, activeTab, liveFilter]);

  const generateCombinedLeaderboardData = (realPointsData, realEarningsData, realStreakData, realUsers) => {
    // Generate realistic fake users with more believable details
    const fakeUsers = generateRealisticFakeUsers();
    
    // Format real users data
    const realPointsFormatted = (realPointsData || []).map(u => ({
      username: u.username,
      avatar: u.avatar,
      points: u.points,
      vipLevel: u.vip_level || u.vipLevel,
      isReal: true
    }));

    const realEarningsFormatted = (realEarningsData || []).map(u => ({
      username: u.username,
      avatar: u.avatar,
      earnings: u.total_earnings || 0,
      sol: u.balances?.sol || 0,
      eth: u.balances?.eth || 0,
      usdt: u.balances?.usdt || 0,
      usdc: u.balances?.usdc || 0,
      isReal: true
    }));

    const realStreakFormatted = (realStreakData || []).map(u => ({
      username: u.username,
      avatar: u.avatar,
      streak: u.day_streak || u.dayStreak || 0,
      points: u.points,
      isReal: true
    }));

    // Combine real and fake users for points leaderboard
    const allPointsUsers = [...realPointsFormatted, ...fakeUsers.map(u => ({
      username: u.username,
      avatar: u.avatar,
      points: u.points,
      vipLevel: u.vipLevel,
      isReal: false
    }))];

    // Combine real and fake users for earnings leaderboard
    const allEarningsUsers = [...realEarningsFormatted, ...fakeUsers.map(u => ({
      username: u.username,
      avatar: u.avatar,
      earnings: u.earnings,
      sol: u.sol,
      eth: u.eth,
      usdt: u.usdt,
      usdc: u.usdc,
      isReal: false
    }))];

    // Combine real and fake users for streak leaderboard
    const allStreakUsers = [...realStreakFormatted, ...fakeUsers.map(u => ({
      username: u.username,
      avatar: u.avatar,
      streak: u.streak,
      points: u.points,
      isReal: false
    }))];

    // Sort and rank all users
    const pointsLeaderboard = allPointsUsers
      .sort((a, b) => b.points - a.points)
      .slice(0, 50)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        avatar: user.avatar,
        points: user.points,
        vipLevel: user.vipLevel,
        isReal: user.isReal
      }));

    const earningsLeaderboard = allEarningsUsers
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 50)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        avatar: user.avatar,
        earnings: user.earnings,
        sol: user.sol,
        eth: user.eth,
        usdt: user.usdt,
        usdc: user.usdc,
        isReal: user.isReal
      }));

    const streakLeaderboard = allStreakUsers
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 50)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        avatar: user.avatar,
        streak: user.streak,
        points: user.points,
        isReal: user.isReal
      }));

    return {
      points: pointsLeaderboard,
      earnings: earningsLeaderboard,
      streak: streakLeaderboard
    };
  };

  const generateRealisticFakeUsers = () => {
    // More realistic and believable usernames
    const realisticUsernames = [
      'Alex_Crypto', 'Sarah_Trader', 'Mike_Hodler', 'Emma_DeFi', 'Jake_Bitcoin',
      'Lisa_Ethereum', 'Tom_Solana', 'Anna_Polygon', 'Ryan_Cardano', 'Maya_Avalanche',
      'Chris_Chainlink', 'Zoe_Uniswap', 'Ben_Compound', 'Ivy_Aave', 'Max_Yearn',
      'Sophia_Curve', 'Leo_Sushi', 'Mia_Pancake', 'Noah_Balancer', 'Ava_Maker',
      'Ethan_Synthetix', 'Grace_Ren', 'Owen_Kyber', 'Chloe_Bancor', 'Luke_Loopring',
      'Ella_Gnosis', 'Ian_Nexus', 'Ruby_Reef', 'Cole_Cream', 'Nora_Nerve',
      'Jude_Jarvis', 'Iris_Idle', 'Dean_Dodo', 'Tara_Tornado', 'Reed_Rari',
      'Lila_Liquity', 'Finn_Fei', 'Vera_Vesper', 'Knox_Kava', 'Sage_Serum',
      'Jade_Jupiter', 'Cruz_Convex', 'Wren_Wrapped', 'Vale_Velodrome', 'Zara_Zapper',
      'Kai_Keeper', 'Nova_Notional', 'Jax_Jarvis', 'Skye_Stargate', 'Remy_Ribbon',
      'Dex_Dydx', 'Lexi_Lido', 'Orion_Olympus', 'Sage_Spell', 'Zion_Zerion',
      'Luna_Looksrare', 'Axel_Arbitrum', 'Nyx_Nansen', 'Vega_Vega', 'Onyx_Opensea',
      'Raven_Rarible', 'Phoenix_Phantom', 'Storm_Superrare', 'Blaze_Blur', 'Frost_Foundation',
      'Echo_Ens', 'Sage_Snapshot', 'Flux_Fleek', 'Prism_Poap', 'Nexus_Nft',
      'Crypto_Chad', 'DeFi_Queen', 'Yield_Farmer', 'LP_Provider', 'Gas_Saver',
      'MEV_Hunter', 'Flash_Loaner', 'Arbitrage_Pro', 'Whale_Watcher', 'Diamond_Hands_Pro',
      'Paper_Hands_No', 'HODL_Master_X', 'Moon_Boy_2024', 'Bear_Slayer', 'Bull_Runner',
      'Degen_Trader', 'Alpha_Seeker', 'Beta_Tester', 'Gamma_Squeeze', 'Delta_Neutral',
      'Theta_Gang', 'Vega_Positive', 'Rho_Sensitive', 'IV_Crusher', 'Greeks_Master',
      'Options_Wizard', 'Futures_King', 'Perps_Queen', 'Spot_Trader', 'Margin_Call'
    ];

    // More realistic avatars (mix of emojis that look like real profile pics)
    const realisticAvatars = [
      '👨‍💻', '👩‍💻', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧑‍🔬', '👨‍🎓', '👩‍🎓',
      '🧑‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍🏫', '👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '👨‍🚀', '👩‍🚀', '🧑‍🚀',
      '👨‍✈️', '👩‍✈️', '🧑‍✈️', '👨‍🎨', '👩‍🎨', '🧑‍🎨', '👨‍🍳', '👩‍🍳', '🧑‍🍳', '👨‍🔧',
      '👩‍🔧', '🧑‍🔧', '👨‍🏭', '👩‍🏭', '🧑‍🏭', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎤', '👩‍🎤',
      '🧑‍🎤', '👨‍🎸', '👩‍🎸', '🧑‍🎸', '👨‍🎹', '👩‍🎹', '🧑‍🎹', '👨‍🎺', '👩‍🎺', '🧑‍🎺',
      '🕴️', '💼', '🎯', '🏆', '⭐', '💎', '🚀', '⚡', '🔥', '💪',
      '🧠', '👑', '🎪', '🎭', '🎨', '🎵', '🎸', '🎹', '🎺', '🎷',
      '🎻', '🥁', '🎤', '🎧', '🎮', '🕹️', '🎲', '🃏', '🎰', '🎯'
    ];

    const users = [];
    
    // Generate 80 realistic fake users
    for (let i = 0; i < 80; i++) {
      const username = realisticUsernames[i] || `Trader_${String(i + 1).padStart(3, '0')}`;
      const avatar = realisticAvatars[i % realisticAvatars.length];
      
      // More realistic point distribution (800K to 3M CIPRO)
      const basePoints = 800000;
      const maxAdditionalPoints = 2200000; // Max ~3M total
      const randomFactor = Math.pow(Math.random(), 0.4); // Less extreme distribution
      const points = Math.floor(basePoints + (maxAdditionalPoints * randomFactor));
      
      // More realistic VIP distribution (weighted towards lower levels)
      const vipRandom = Math.random();
      let vipLevel;
      if (vipRandom < 0.4) vipLevel = 1;
      else if (vipRandom < 0.7) vipLevel = 2;
      else if (vipRandom < 0.85) vipLevel = 3;
      else if (vipRandom < 0.95) vipLevel = 4;
      else vipLevel = 5;
      
      // More realistic streak distribution
      const streakRandom = Math.random();
      let streak;
      if (streakRandom < 0.3) streak = Math.floor(Math.random() * 7) + 1; // 1-7 days (30%)
      else if (streakRandom < 0.6) streak = Math.floor(Math.random() * 23) + 8; // 8-30 days (30%)
      else if (streakRandom < 0.85) streak = Math.floor(Math.random() * 60) + 31; // 31-90 days (25%)
      else streak = Math.floor(Math.random() * 275) + 91; // 91-365 days (15%)
      
      // More realistic crypto balances based on points
      const pointsRatio = points / 3000000; // Normalize to 0-1
      
      users.push({
        username,
        avatar,
        points: points,
        vipLevel: vipLevel,
        streak: streak,
        sol: Math.random() * 20 * pointsRatio + 0.1, // 0.1-20 SOL based on points
        eth: Math.random() * 10 * pointsRatio + 0.05, // 0.05-10 ETH based on points
        usdt: Math.random() * 25000 * pointsRatio + 100, // 100-25K USDT based on points
        usdc: Math.random() * 25000 * pointsRatio + 100, // 100-25K USDC based on points
        earnings: Math.random() * 50000 * pointsRatio + 500 // 500-50K earnings based on points
      });
    }

    return users;
  };

  const generateFakeLeaderboardData = () => {
    const fakeUsernames = [
      'CryptoKing', 'DiamondHands', 'MoonWalker', 'TokenMaster', 'CoinCollector',
      'BlockchainBoss', 'NFTNinja', 'DeFiDegen', 'SatoshiFan', 'EthereumElite',
      'CryptoWhale', 'HODLMaster', 'ChainLord', 'TokenHunter', 'CryptoSage',
      'BitcoinBull', 'AltcoinAce', 'CryptoChamp', 'DigitalDuke', 'TokenTitan',
      'CoinCrusher', 'BlockBuster', 'CryptoCommander', 'DigitalDynamo', 'TokenTrader',
      'CryptoConqueror', 'BitBaron', 'CoinCaptain', 'DigitalDragon', 'TokenTycoon',
      'CryptoLegend', 'BitBlaster', 'CoinCommander', 'DigitalDestroyer', 'TokenThunder',
      'CryptoStorm', 'BitBeast', 'CoinCyclone', 'DigitalDominator', 'TokenTornado',
      'CryptoVortex', 'BitBolt', 'CoinCraze', 'DigitalDash', 'TokenTurbo',
      'CryptoRocket', 'BitBlaze', 'CoinCrush', 'DigitalDrift', 'TokenTwist',
      'CryptoFlash', 'BitBoom', 'CoinClash', 'DigitalDive', 'TokenThrash',
      'CryptoSpark', 'BitBurst', 'CoinCrack', 'DigitalDrop', 'TokenThrill',
      'CryptoShock', 'BitBang', 'CoinCrash', 'DigitalDunk', 'TokenTrick',
      'CryptoSlash', 'BitBlitz', 'CoinCrush2', 'DigitalDash2', 'TokenTrap',
      'CryptoSmash', 'BitBlast', 'CoinCraze2', 'DigitalDoom', 'TokenTide',
      'CryptoStrike', 'BitBrawl', 'CoinChaos', 'DigitalDuel', 'TokenTwirl',
      'CryptoSurge', 'BitBattle', 'CoinClash2', 'DigitalDance', 'TokenTango',
      'CryptoSwift', 'BitBounce', 'CoinCrush3', 'DigitalDazzle', 'TokenTwist2',
      'CryptoSonic', 'BitBoost', 'CoinCraze3', 'DigitalDream', 'TokenTune',
      'CryptoSpeed', 'BitBuzz', 'CoinCrush4', 'DigitalDrive', 'TokenTurn'
    ];

    const avatars = [
      '👑', '💎', '🚀', '🎯', '🪙', '⛓️', '🥷', '🦍', '₿', 'Ξ',
      '🐋', '💪', '⚡', '🎯', '🧙‍♂️', '🦁', '🐅', '🦅', '🐺', '🦈',
      '🔥', '⭐', '💫', '🌟', '✨', '🎭', '🎪', '🎨', '🎵', '🎸',
      '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏴‍☠️', '⚔️', '🛡️', '🗡️',
      '🎲', '🃏', '🎰', '🎯', '🎪', '🎨', '🎭', '🎪', '🎨', '🎵',
      '🌈', '🌊', '🌪️', '⚡', '🔥', '❄️', '🌙', '☀️', '⭐', '🌟',
      '🦄', '🐉', '🦋', '🐝', '🦜', '🐠', '🐙', '🦀', '🐢', '🦎',
      '🎃', '👻', '🤖', '👽', '🛸', '🚁', '✈️', '🚂', '🏎️', '🏍️',
      '🎪', '🎡', '🎢', '🎠', '🎨', '🖼️', '🎭', '🎪', '🎨', '🎵',
      '🏰', '🗼', '🌉', '🏔️', '🏝️', '🏖️', '🏜️', '🌋', '🗻', '🏕️'
    ];

    const users = [];
    
    // Generate 100 fake users with CIPRO ranging from 800K to 5M+
    for (let i = 0; i < 100; i++) {
      const username = fakeUsernames[i] || `Player${i + 1}`;
      const avatar = avatars[i] || avatars[Math.floor(Math.random() * avatars.length)];
      
      // Generate points from 800K to 5M+ CIPRO
      // Use exponential distribution to create realistic gaps between top players
      const basePoints = 800000; // 800K minimum
      const maxAdditionalPoints = 4200000; // Up to 4.2M additional (total max ~5M)
      const randomFactor = Math.pow(Math.random(), 0.3); // Exponential distribution favoring higher values
      const points = Math.floor(basePoints + (maxAdditionalPoints * randomFactor));
      
      users.push({
        username,
        avatar,
        points: points,
        vipLevel: Math.floor(Math.random() * 5) + 1, // VIP 1-5
        streak: Math.floor(Math.random() * 100) + 1, // 1-100 day streak
        sol: Math.random() * 50, // 0-50 SOL (increased for high-value players)
        eth: Math.random() * 25, // 0-25 ETH (increased for high-value players)
        usdt: Math.random() * 50000, // 0-50K USDT (increased for high-value players)
        usdc: Math.random() * 50000, // 0-50K USDC (increased for high-value players)
        earnings: Math.random() * 100000 // 0-100K total earnings (increased for high-value players)
      });
    }

    // Sort users by points for points leaderboard
    const pointsLeaderboard = [...users]
      .sort((a, b) => b.points - a.points)
      .slice(0, 50) // Show top 50
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        avatar: user.avatar,
        points: user.points,
        vipLevel: user.vipLevel
      }));

    // Sort users by earnings for earnings leaderboard
    const earningsLeaderboard = [...users]
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 50) // Show top 50
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        avatar: user.avatar,
        earnings: user.earnings,
        sol: user.sol,
        eth: user.eth,
        usdt: user.usdt,
        usdc: user.usdc
      }));

    // Sort users by streak for streak leaderboard
    const streakLeaderboard = [...users]
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 50) // Show top 50
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        avatar: user.avatar,
        streak: user.streak,
        points: user.points
      }));

    return {
      points: pointsLeaderboard,
      earnings: earningsLeaderboard,
      streak: streakLeaderboard
    };
  };

  const generateLiveUpdates = () => {
    setLiveLoading(true);
    
    // Mix of realistic and crypto-themed usernames for live updates
    const sampleUsers = [
      { username: 'Alex_Crypto', avatar: '👨‍💻' },
      { username: 'Sarah_Trader', avatar: '👩‍💻' },
      { username: 'Mike_Hodler', avatar: '👨‍💼' },
      { username: 'Emma_DeFi', avatar: '👩‍💼' },
      { username: 'CryptoKing', avatar: '👑' },
      { username: 'DiamondHands', avatar: '💎' },
      { username: 'Jake_Bitcoin', avatar: '👨‍🔬' },
      { username: 'Lisa_Ethereum', avatar: '👩‍🔬' },
      { username: 'MoonWalker', avatar: '🚀' },
      { username: 'TokenMaster', avatar: '🎯' },
      { username: 'Tom_Solana', avatar: '👨‍🎓' },
      { username: 'Anna_Polygon', avatar: '👩‍🎓' },
      { username: 'CoinCollector', avatar: '🪙' },
      { username: 'BlockchainBoss', avatar: '⛓️' },
      { username: 'Ryan_Cardano', avatar: '👨‍🏫' },
      { username: 'Maya_Avalanche', avatar: '👩‍🏫' },
      { username: 'NFTNinja', avatar: '🥷' },
      { username: 'DeFiDegen', avatar: '🦍' },
      { username: 'Chris_Chainlink', avatar: '👨‍⚕️' },
      { username: 'Zoe_Uniswap', avatar: '👩‍⚕️' },
      { username: 'SatoshiFan', avatar: '₿' },
      { username: 'EthereumElite', avatar: 'Ξ' },
      { username: 'Ben_Compound', avatar: '👨‍🚀' },
      { username: 'Ivy_Aave', avatar: '👩‍🚀' },
      { username: 'CryptoWhale', avatar: '🐋' },
      { username: 'HODLMaster', avatar: '💪' },
      { username: 'Max_Yearn', avatar: '👨‍✈️' },
      { username: 'Sophia_Curve', avatar: '👩‍✈️' },
      { username: 'ChainLord', avatar: '⚡' },
      { username: 'TokenHunter', avatar: '🎯' },
      { username: 'Leo_Sushi', avatar: '👨‍🎨' },
      { username: 'Mia_Pancake', avatar: '👩‍🎨' },
      { username: 'CryptoSage', avatar: '🧙‍♂️' },
      { username: 'BitcoinBull', avatar: '🦁' },
      { username: 'Noah_Balancer', avatar: '👨‍🍳' },
      { username: 'Ava_Maker', avatar: '👩‍🍳' },
      { username: 'AltcoinAce', avatar: '🐅' },
      { username: 'CryptoChamp', avatar: '🦅' },
      { username: 'Ethan_Synthetix', avatar: '👨‍🔧' },
      { username: 'Grace_Ren', avatar: '👩‍🔧' }
    ];

    const updateTypes = [
      {
        type: 'rank_climb',
        icon: '📈',
        color: '#10b981',
        templates: [
          'climbed to rank #{rank} with {points} CIPRO!',
          'jumped {positions} positions to rank #{rank}!',
          'surged to #{rank} with massive {points} CIPRO gain!',
          'broke into top {rank} with {points} CIPRO!',
          'earned {points} CIPRO and climbed to #{rank}!'
        ]
      },
      {
        type: 'new_leader',
        icon: '👑',
        color: '#f59e0b',
        templates: [
          'claimed the #1 spot with {points} CIPRO!',
          'became the new leaderboard champion!',
          'dethroned the king with {points} CIPRO!',
          'reached the summit with {points} CIPRO!',
          'conquered the leaderboard with {points} CIPRO!'
        ]
      },
      {
        type: 'big_win',
        icon: '💰',
        color: '#8b5cf6',
        templates: [
          'won {points} CIPRO and jumped to rank #{rank}!',
          'hit a {points} CIPRO jackpot, now rank #{rank}!',
          'scored massive {points} CIPRO, climbing to #{rank}!',
          'earned epic {points} CIPRO, reaching rank #{rank}!',
          'bagged {points} CIPRO in one session, rank #{rank}!'
        ]
      },
      {
        type: 'streak_power',
        icon: '🔥',
        color: '#ef4444',
        templates: [
          'hit {days}-day streak and climbed to rank #{rank}!',
          'maintained {days} days streak, now rank #{rank}!',
          'reached {days}-day milestone, jumping to #{rank}!',
          'powered through {days} days, climbing to #{rank}!'
        ]
      },
      {
        type: 'vip_upgrade',
        icon: '⭐',
        color: '#ec4899',
        templates: [
          'upgraded to VIP Level {level}, now rank #{rank}!',
          'unlocked VIP {level} status and rank #{rank}!',
          'reached VIP Level {level}, climbing to #{rank}!',
          'achieved VIP {level} and jumped to rank #{rank}!'
        ]
      },
      {
        type: 'conversion_leader',
        icon: '💎',
        color: '#3b82f6',
        templates: [
          'converted ${amount} and leads earnings!',
          'cashed out ${amount}, topping conversion board!',
          'exchanged ${amount} for crypto, rank #{rank}!',
          'withdrew ${amount}, now earnings leader!'
        ]
      },
      {
        type: 'game_master',
        icon: '🎮',
        color: '#14b8a6',
        templates: [
          'dominated games and reached rank #{rank}!',
          'won {games} games straight, now rank #{rank}!',
          'crushed the competition, climbing to #{rank}!',
          'gaming spree earned rank #{rank} position!'
        ]
      },
      {
        type: 'achievement_unlock',
        icon: '🏆',
        color: '#f97316',
        templates: [
          'unlocked "{achievement}" and rank #{rank}!',
          'earned "{achievement}" badge, now rank #{rank}!',
          'completed "{achievement}", climbing to #{rank}!',
          'achieved "{achievement}" milestone at rank #{rank}!'
        ]
      }
    ];

    const achievements = [
      'Cipro Collector', 'Game Master', 'VIP Elite', 'Streak Legend', 
      'Fortune Hunter', 'Crypto King', 'Diamond Hands', 'Moon Walker',
      'Token Master', 'Blockchain Boss', 'DeFi Degen', 'HODLer Supreme'
    ];

    const updates = [];
    const now = Date.now();

    for (let i = 0; i < 15; i++) {
      const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
      const randomTemplate = randomType.templates[Math.floor(Math.random() * randomType.templates.length)];
      
      let message = randomTemplate
        .replace('{points}', (Math.floor(Math.random() * 200000) + 50000).toLocaleString()) // 50K to 250K CIPRO gains
        .replace('{rank}', Math.floor(Math.random() * 100) + 1)
        .replace('{positions}', Math.floor(Math.random() * 15) + 2)
        .replace('{days}', Math.floor(Math.random() * 45) + 7)
        .replace('{level}', Math.floor(Math.random() * 5) + 1)
        .replace('{amount}', (Math.floor(Math.random() * 20000) + 5000).toLocaleString()) // 5K to 25K conversion amounts
        .replace('{games}', Math.floor(Math.random() * 10) + 3)
        .replace('{achievement}', achievements[Math.floor(Math.random() * achievements.length)]);

      updates.push({
        id: `leaderboard-update-${i}-${now}`,
        username: randomUser.username,
        avatar: randomUser.avatar,
        type: randomType.type,
        icon: randomType.icon,
        color: randomType.color,
        message: message,
        timestamp: now - (i * 45000 * Math.random()), // Random time in last 45 minutes
        isNew: i < 4 // Mark first 4 as new
      });
    }

    // Sort by timestamp (newest first)
    updates.sort((a, b) => b.timestamp - a.timestamp);
    setLiveUpdates(updates);
    setLiveLoading(false);
  };

  const handleLiveFilterChange = (filter) => {
    setLiveFilter(filter);
    setLiveLoading(true);
    // Small delay to show loading state
    setTimeout(() => {
      setLiveLoading(false);
    }, 300);
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'default';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-loading">
          <div className="loading-spinner">🏆</div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <SEOHead 
        title="🏆 Crypto Gaming Leaderboard - Top Earners | Cipro"
        description="🏆 Check the top crypto earners! See who's leading with 800K+ CIPRO, massive earnings, and epic streaks. Compete with 100+ high-stakes players and climb the cryptocurrency gaming leaderboard!"
        keywords="crypto gaming leaderboard, top crypto earners, cryptocurrency rankings, gaming competition, crypto rewards leaderboard, top players, gaming stats"
        url="https://www.ciprohub.site/leaderboard"
      />
      
      <div className="page-header">
        <h1 className="page-title">🏆 Leaderboard</h1>
        <p className="page-subtitle">High-stakes rankings and elite player achievements</p>
      </div>

      <div className="user-rank-card">
        <div className="user-rank-info">
          <div className="user-rank-avatar">{user.avatar}</div>
          <div className="user-rank-details">
            <h3>{user.username}</h3>
            <p>Your Rank: #{currentUserRank.points.rank} of {currentUserRank.points.total}</p>
          </div>
        </div>
        <div className="user-rank-stats">
          <div className="rank-stat">
            <span className="rank-stat-value">{user.points.toLocaleString()}</span>
            <span className="rank-stat-label">Cipro</span>
          </div>
          <div className="rank-stat">
            <span className="rank-stat-value">Level {user.vipLevel}</span>
            <span className="rank-stat-label">VIP</span>
          </div>
        </div>
      </div>

      <div className="leaderboard-tabs">
        <button 
          className={activeTab === 'live' ? 'active' : ''}
          onClick={() => setActiveTab('live')}
        >
          🌐 Live Updates
        </button>
        <button 
          className={activeTab === 'points' ? 'active' : ''}
          onClick={() => setActiveTab('points')}
        >
          💎 Cipro
        </button>
        <button 
          className={activeTab === 'earnings' ? 'active' : ''}
          onClick={() => setActiveTab('earnings')}
        >
          💰 Earnings
        </button>
        <button 
          className={activeTab === 'streak' ? 'active' : ''}
          onClick={() => setActiveTab('streak')}
        >
          🔥 Streak
        </button>
      </div>

      {activeTab === 'live' ? (
        <div className="activity-feed">
          <div className="activity-feed-header">
            <h3>🌐 Live Leaderboard Updates</h3>
            <p className="activity-subtitle">Real-time ranking changes and achievements</p>
          </div>

          <div className="activity-filters">
            <button 
              className={`filter-btn ${liveFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleLiveFilterChange('all')}
            >
              All Updates
            </button>
            <button 
              className={`filter-btn ${liveFilter === 'rankings' ? 'active' : ''}`}
              onClick={() => handleLiveFilterChange('rankings')}
            >
              🏆 Rankings
            </button>
            <button 
              className={`filter-btn ${liveFilter === 'earnings' ? 'active' : ''}`}
              onClick={() => handleLiveFilterChange('earnings')}
            >
              💰 Earnings
            </button>
            <button 
              className={`filter-btn ${liveFilter === 'streaks' ? 'active' : ''}`}
              onClick={() => handleLiveFilterChange('streaks')}
            >
              🔥 Streaks
            </button>
          </div>

          <div className="activity-list">
            {liveLoading ? (
              <div className="activity-feed-loading">
                <div className="loading-spinner">⏳</div>
                <p>Loading updates...</p>
              </div>
            ) : (
              liveUpdates
                .filter(update => {
                  if (liveFilter === 'all') return true;
                  if (liveFilter === 'rankings') return ['rank_climb', 'new_leader', 'big_win'].includes(update.type);
                  if (liveFilter === 'earnings') return ['conversion_leader'].includes(update.type);
                  if (liveFilter === 'streaks') return ['streak_power'].includes(update.type);
                  return true;
                })
                .map((update, index) => (
                <div 
                  key={update.id} 
                  className={`activity-item ${update.isNew ? 'new' : ''}`}
                  style={{ 
                    animationDelay: `${index * 0.05}s`,
                    borderLeftColor: update.color 
                  }}
                >
                  <div className="activity-avatar">{update.avatar}</div>
                  <div className="activity-content">
                    <div className="activity-user">
                      <span className="activity-username">{update.username}</span>
                      {update.isNew && <span className="new-badge">NEW</span>}
                    </div>
                    <div className="activity-message">
                      <span className="activity-icon" style={{ color: update.color }}>
                        {update.icon}
                      </span>
                      <span>{update.message}</span>
                    </div>
                    <div className="activity-time">{getTimeAgo(update.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="activity-feed-footer">
            <button className="refresh-btn" onClick={generateLiveUpdates}>
              🔄 Refresh
            </button>
            <span className="auto-refresh-text">Auto-refreshes every 15s</span>
          </div>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboardData[activeTab].slice(0, 50).map((player) => (
            <div 
              key={player.rank} 
              className={`leaderboard-item ${getRankColor(player.rank)}`}
            >
              <div className="rank-badge">
                {getRankIcon(player.rank)}
              </div>
              <div className="player-avatar">{player.avatar}</div>
              <div className="player-info">
                <h4>{player.username}</h4>
                {activeTab === 'points' && (
                  <p>{player.points.toLocaleString()} Cipro • VIP {player.vipLevel}</p>
                )}
                {activeTab === 'earnings' && (
                  <p>
                    ◎ {player.sol?.toFixed(4) || 0} SOL • 
                    Ξ {player.eth?.toFixed(4) || 0} ETH • 
                    💵 {player.usdt?.toFixed(2) || 0} USDT •
                    💵 {player.usdc?.toFixed(2) || 0} USDC
                  </p>
                )}
                {activeTab === 'streak' && (
                  <p>{player.streak} days • {player.points.toLocaleString()} CIPRO</p>
                )}
              </div>
              {player.rank <= 3 && (
                <div className="trophy-icon">
                  {player.rank === 1 && '👑'}
                  {player.rank === 2 && '🥈'}
                  {player.rank === 3 && '🥉'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Live Activity Feed */}
      <div style={{ marginTop: '30px' }}>
        <ActivityFeed user={user} maxItems={6} compact={true} />
      </div>
    </div>
  );
}

export default LeaderboardPage;
