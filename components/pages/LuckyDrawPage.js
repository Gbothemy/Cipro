'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

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

export default function LuckyDrawPage() {
  const { user, updateUser, addNotification } = useStore();
  const [tickets, setTickets] = useState(0);
  const [pool, setPool] = useState({ cipro: 50000, usdt: 20, totalTickets: 0 });
  const [winners, setWinners] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const TICKET_PRICE = 1; // $1 USD per ticket

  useEffect(() => {
    if (user?.userId) loadData();
  }, [user?.userId]);

  const loadData = async () => {
    try {
      const [t, p, w] = await Promise.all([
        db.getUserLuckyDrawTickets(user.userId),
        db.getCurrentPrizePool(),
        db.getRecentLuckyDrawWinners(5),
      ]);
      setTickets(t);
      setPool(p);
      setWinners(w);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpin = async () => {
    if (tickets < 1 || spinning) return;
    setSpinning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await db.participateInLuckyDraw ? { won: false } : { won: false };
      setResult(res);
      if (res.won) {
        addNotification({ type: 'success', title: '🎉 You Won!', message: `Prize: ${JSON.stringify(res.winnings)}` });
      } else {
        addNotification({ type: 'info', title: 'Better luck next time!', message: 'Try again with more tickets' });
      }
      setTickets((t) => Math.max(0, t - 1));
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setSpinning(false);
    }
  };

  const handlePurchaseTickets = async (quantity) => {
    if (!user?.userId || purchasing) return;
    
    const cost = quantity * TICKET_PRICE;
    const userBalance = Number(user?.balance?.usdt || 0);
    
    if (userBalance < cost) {
      addNotification({
        type: 'error',
        title: 'Insufficient Balance',
        message: `You need $${cost} USDT. Go to Wallet to add funds.`,
      });
      return;
    }

    setPurchasing(true);
    try {
      // Deduct USDT and add tickets (this would be a real API call)
      await db.updateBalance(user.userId, 'usdt', userBalance - cost);
      
      updateUser({
        ...user,
        balance: { ...user.balance, usdt: userBalance - cost }
      });
      
      setTickets(tickets + quantity);
      
      addNotification({
        type: 'success',
        title: '🎫 Tickets Purchased!',
        message: `You bought ${quantity} ticket${quantity > 1 ? 's' : ''} for $${cost} USDT`,
      });
    } catch (error) {
      console.error(error);
      addNotification({
        type: 'error',
        title: 'Purchase Failed',
        message: error.message || 'Failed to purchase tickets',
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="page-container page-container-md">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Lucky Draw</h1>
        <p className="text-muted mt-1">Use tickets for a chance to win big prizes</p>
      </div>

      {/* Prize pool */}
      <div className="card p-6 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.05), rgba(139,92,246,0.05))' }} />
        <div className="relative">
          <p className="text-sm text-muted mb-2">Current Prize Pool</p>
          <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
            <div>
              <div className="text-3xl font-black" style={{ color: '#fbbf24' }}>{(pool.cipro || 0).toLocaleString()}</div>
              <div className="text-xs text-dim">CIPRO Points</div>
            </div>
            <div className="text-dim">+</div>
            <div>
              <div className="text-3xl font-black text-success">${pool.usdt || 0}</div>
              <div className="text-xs text-dim">USDT</div>
            </div>
            {pool.vipUpgrade && (
              <>
                <div className="text-dim">+</div>
                <div>
                  <div className="text-3xl font-black" style={{ color: '#8b5cf6' }}>👑</div>
                  <div className="text-xs text-dim">VIP Upgrade</div>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-dim">{pool.totalTickets || 0} tickets in pool</p>
        </div>
      </div>

      {/* Spin area */}
      <div className="card p-8 mb-6 text-center">
        <div className={`mb-6 ${spinning ? 'animate-spin' : ''}`} style={{ fontSize: '5rem', transition: 'transform 2000ms' }}>
          🎰
        </div>
        <div className="mb-4">
          <span className="badge-primary text-sm">🎫 {tickets} ticket{tickets !== 1 ? 's' : ''}</span>
        </div>
        {result && (
          <div 
            className="mb-4 p-4 rounded-xl border"
            style={result.won ? {
              background: 'rgba(16,185,129,0.1)',
              borderColor: 'rgba(16,185,129,0.3)',
              color: '#34d399'
            } : {
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'var(--text-muted)'
            }}
          >
            {result.won ? '🎉 You won!' : '😔 Not this time. Try again!'}
          </div>
        )}
        <button
          onClick={handleSpin}
          disabled={tickets < 1 || spinning}
          className={tickets < 1 ? 'btn opacity-50 cursor-not-allowed' : 'btn btn-primary'}
          style={tickets < 1 ? {
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-dim)',
            padding: '1rem 2.5rem',
            fontSize: '1.125rem',
            borderRadius: '1rem'
          } : {
            padding: '1rem 2.5rem',
            fontSize: '1.125rem',
            borderRadius: '1rem'
          }}
        >
          {spinning ? '🌀 Drawing...' : tickets < 1 ? 'No Tickets' : '🎰 Draw Now'}
        </button>
      </div>

      {/* Purchase Tickets */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">💳 Buy Tickets</h3>
        <p className="text-sm text-muted mb-4">Purchase tickets with USDT for instant draws</p>
        
        <div className="grid gap-3">
          <button
            onClick={() => handlePurchaseTickets(1)}
            disabled={purchasing}
            className="btn btn-primary flex items-center justify-between p-4"
            style={{ borderRadius: '0.75rem' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎫</span>
              <div className="text-left">
                <p className="font-semibold">1 Ticket</p>
                <p className="text-xs opacity-75">Single draw</p>
              </div>
            </div>
            <span className="font-bold">${TICKET_PRICE}</span>
          </button>

          <button
            onClick={() => handlePurchaseTickets(5)}
            disabled={purchasing}
            className="btn btn-primary flex items-center justify-between p-4"
            style={{ borderRadius: '0.75rem' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎫🎫</span>
              <div className="text-left">
                <p className="font-semibold">5 Tickets</p>
                <p className="text-xs opacity-75">Better odds</p>
              </div>
            </div>
            <span className="font-bold">${TICKET_PRICE * 5}</span>
          </button>

          <button
            onClick={() => handlePurchaseTickets(10)}
            disabled={purchasing}
            className="btn btn-primary flex items-center justify-between p-4"
            style={{ 
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: '2px solid rgba(139,92,246,0.3)'
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎫🎫🎫</span>
              <div className="text-left">
                <p className="font-semibold">10 Tickets</p>
                <p className="text-xs opacity-75">Best value!</p>
              </div>
            </div>
            <span className="font-bold">${TICKET_PRICE * 10}</span>
          </button>
        </div>

        <div className="mt-4 p-3 rounded-lg text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-xs text-success">
            💰 Your Balance: ${Number(user?.balance?.usdt || 0).toFixed(2)} USDT
          </p>
        </div>
      </div>

      {/* How to get tickets */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">How to Get Tickets</h3>
        <div className="grid gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-2xl">🎮</span>
            <div>
              <p className="text-sm font-medium text-white">Play Games</p>
              <p className="text-xs text-dim">Earn 1 ticket for every 5 games played</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-medium text-white">Complete Tasks</p>
              <p className="text-xs text-dim">Get tickets as rewards for completing daily tasks</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-sm font-medium text-white">Refer Friends</p>
              <p className="text-xs text-dim">Receive 3 tickets for each friend who joins</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-sm font-medium text-white">VIP Benefits</p>
              <p className="text-xs text-dim">Higher VIP levels get bonus tickets daily</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prize info */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">Possible Prizes</h3>
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <span className="text-sm font-medium text-white">CIPRO Points</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>1,000 - 50,000</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💵</span>
              <span className="text-sm font-medium text-white">USDT</span>
            </div>
            <span className="text-sm font-bold text-success">$1 - $20</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">👑</span>
              <span className="text-sm font-medium text-white">VIP Upgrade</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#8b5cf6' }}>+1 Level</span>
          </div>
        </div>
      </div>

      {/* VIP Upgrade Benefits */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">👑</span>
          <h3 className="font-semibold text-white">VIP Upgrade Benefits</h3>
        </div>
        <p className="text-sm text-muted mb-4">Win a VIP upgrade to instantly level up and unlock exclusive benefits!</p>
        
        <div className="grid gap-3">
          <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(185,147,86,0.1), rgba(185,147,86,0.05))' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🥉</span>
              <span className="font-semibold text-white text-sm">Bronze → Silver</span>
            </div>
            <ul className="flex-col gap-1 text-xs text-muted ml-7">
              <li>• 5 → 7 game attempts per day</li>
              <li>• 0% → 5% conversion bonus</li>
              <li>• Priority support access</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(203,213,225,0.1), rgba(203,213,225,0.05))' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🥈</span>
              <span className="font-semibold text-white text-sm">Silver → Gold</span>
            </div>
            <ul className="flex-col gap-1 text-xs text-muted ml-7">
              <li>• 7 → 10 game attempts per day</li>
              <li>• 5% → 10% conversion bonus</li>
              <li>• Exclusive tasks unlocked</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.05))' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🥇</span>
              <span className="font-semibold text-white text-sm">Gold → Platinum</span>
            </div>
            <ul className="flex-col gap-1 text-xs text-muted ml-7">
              <li>• 10 → 15 game attempts per day</li>
              <li>• 10% → 15% conversion bonus</li>
              <li>• Free lucky draw tickets</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(34,211,238,0.05))' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💎</span>
              <span className="font-semibold text-white text-sm">Platinum → Diamond</span>
            </div>
            <ul className="flex-col gap-1 text-xs text-muted ml-7">
              <li>• 15 → 20 game attempts per day</li>
              <li>• 15% → 20% conversion bonus</li>
              <li>• VIP-only exclusive events</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg text-center" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <p className="text-xs" style={{ color: '#a78bfa' }}>
            💡 VIP upgrades are instant and permanent! View all tiers in the VIP section.
          </p>
        </div>
      </div>

      {/* Recent winners */}
      {winners.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="font-semibold text-white">Recent Winners</h3>
          </div>
          <div>
            {winners.map((w, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 px-5 py-3"
                style={{ borderBottom: i < winners.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                <span className="text-xl">{w.avatar || '👤'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{w.username}</p>
                  <p className="text-xs text-dim">{new Date(w.draw_date).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>
                  {w.usdt_won > 0 ? `${w.usdt_won} USDT` : `${w.points_won} pts`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
