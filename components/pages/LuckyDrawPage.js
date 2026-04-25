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
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Lucky Draw</h1>
        <p className="text-slate-400 mt-1">Use tickets for a chance to win big prizes</p>
      </div>

      {/* Prize pool */}
      <div className="card p-6 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-primary/5" />
        <div className="relative">
          <p className="text-sm text-slate-400 mb-2">Current Prize Pool</p>
          <div className="flex items-center justify-center gap-6 mb-4">
            <div>
              <div className="text-3xl font-black text-amber-400">{(pool.cipro || 0).toLocaleString()}</div>
              <div className="text-xs text-slate-500">CIPRO Points</div>
            </div>
            <div className="text-slate-600">+</div>
            <div>
              <div className="text-3xl font-black text-emerald-400">${pool.usdt || 0}</div>
              <div className="text-xs text-slate-500">USDT</div>
            </div>
          </div>
          <p className="text-xs text-slate-500">{pool.totalTickets || 0} tickets in pool</p>
        </div>
      </div>

      {/* Spin area */}
      <div className="card p-8 mb-6 text-center">
        <div className={`text-8xl mb-6 transition-transform duration-[2000ms] ${spinning ? 'animate-spin' : ''}`}>
          🎰
        </div>
        <div className="mb-4">
          <span className="badge-primary text-sm">🎫 {tickets} ticket{tickets !== 1 ? 's' : ''}</span>
        </div>
        {result && (
          <div className={`mb-4 p-4 rounded-xl border ${result.won ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
            {result.won ? '🎉 You won!' : '😔 Not this time. Try again!'}
          </div>
        )}
        <button
          onClick={handleSpin}
          disabled={tickets < 1 || spinning}
          className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
            tickets < 1 ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'btn-primary hover:scale-105'
          }`}
        >
          {spinning ? '🌀 Drawing...' : tickets < 1 ? 'No Tickets' : '🎰 Draw Now'}
        </button>
        {tickets < 1 && (
          <p className="text-xs text-slate-500 mt-3">Purchase tickets to participate in the lucky draw</p>
        )}
      </div>

      {/* Recent winners */}
      {winners.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white">Recent Winners</h3>
          </div>
          <div className="divide-y divide-white/5">
            {winners.map((w, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xl">{w.avatar || '👤'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{w.username}</p>
                  <p className="text-xs text-slate-500">{new Date(w.draw_date).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-amber-400">
                  {w.usdt_won > 0 ? `$${w.usdt_won} USDT` : `${w.points_won} pts`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
