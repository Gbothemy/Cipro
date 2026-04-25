'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

export default function LuckyDrawPage() {
  const { user, addNotification } = useStore();
  const [tickets, setTickets] = useState(0);
  const [pool, setPool] = useState({ cipro: 50000, usdt: 20, totalTickets: 0 });
  const [winners, setWinners] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

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
          <div className="flex items-center justify-center gap-6 mb-4">
            <div>
              <div className="text-3xl font-black" style={{ color: '#fbbf24' }}>{(pool.cipro || 0).toLocaleString()}</div>
              <div className="text-xs text-dim">CIPRO Points</div>
            </div>
            <div className="text-dim">+</div>
            <div>
              <div className="text-3xl font-black text-success">${pool.usdt || 0}</div>
              <div className="text-xs text-dim">USDT</div>
            </div>
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
        {tickets < 1 && (
          <p className="text-xs text-dim mt-3">Purchase tickets to participate in the lucky draw</p>
        )}
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
