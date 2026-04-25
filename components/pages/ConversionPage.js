'use client';
import { useState, useEffect } from 'react';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const RATES = { sol: 1400000, eth: 33000000, usdt: 10000, usdc: 10000 };
const MIN_WITHDRAW = { sol: 0.1, eth: 0.005, usdt: 5, usdc: 5 };
const CURRENCY_INFO = {
  sol: { name: 'Solana', icon: '◎', color: '#14F195', network: 'Solana' },
  eth: { name: 'Ethereum', icon: 'Ξ', color: '#627EEA', network: 'ERC-20' },
  usdt: { name: 'Tether', icon: '₮', color: '#26A17B', network: 'TRC-20' },
  usdc: { name: 'USD Coin', icon: '$', color: '#2775CA', network: 'ERC-20' },
};

export default function ConversionPage() {
  const { user, updateUser, addNotification } = useStore();
  const [tab, setTab] = useState('convert');
  const [currency, setCurrency] = useState('usdt');
  const [convertAmt, setConvertAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [address, setAddress] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.userId) db.getConversionHistory(user.userId).then(setHistory).catch(() => {});
  }, [user?.userId]);

  const points = user?.points || 0;
  const balance = user?.balance || {};
  const rate = RATES[currency];
  const convertedAmount = convertAmt ? (parseInt(convertAmt) / rate).toFixed(6) : '0';
  const minPoints = rate * MIN_WITHDRAW[currency];

  const handleConvert = async () => {
    const pts = parseInt(convertAmt);
    if (!pts || pts < minPoints) {
      addNotification({ type: 'error', title: 'Invalid Amount', message: `Minimum ${minPoints.toLocaleString()} points` });
      return;
    }
    if (pts > points) {
      addNotification({ type: 'error', title: 'Insufficient Points', message: 'Not enough points' });
      return;
    }
    setLoading(true);
    try {
      const amount = pts / rate;
      await db.recordConversion(user.userId, { points: pts, currency, amount, rate });
      const newBalance = { ...balance, [currency]: (balance[currency] || 0) + amount };
      const newPoints = points - pts;
      await db.updateUser(user.userId, { points: newPoints });
      await db.updateBalance(user.userId, currency, newBalance[currency]);
      updateUser({ points: newPoints, balance: newBalance });
      addNotification({ type: 'success', title: 'Converted!', message: `${pts.toLocaleString()} pts → ${amount.toFixed(6)} ${currency.toUpperCase()}` });
      setConvertAmt('');
      db.getConversionHistory(user.userId).then(setHistory).catch(() => {});
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmt);
    if (!amt || amt < MIN_WITHDRAW[currency]) {
      addNotification({ type: 'error', title: 'Invalid Amount', message: `Minimum ${MIN_WITHDRAW[currency]} ${currency.toUpperCase()}` });
      return;
    }
    if (amt > (balance[currency] || 0)) {
      addNotification({ type: 'error', title: 'Insufficient Balance', message: 'Not enough balance' });
      return;
    }
    if (!address.trim()) {
      addNotification({ type: 'error', title: 'Missing Address', message: 'Enter your wallet address' });
      return;
    }
    setLoading(true);
    try {
      const id = `WD-${Date.now()}`;
      await db.createWithdrawalRequest({
        id, user_id: user.userId, username: user.username,
        currency, amount: amt, wallet_address: address,
        network: CURRENCY_INFO[currency].network, status: 'pending',
      });
      addNotification({ type: 'success', title: 'Withdrawal Submitted', message: 'Your request is being processed (1-3 business days)' });
      setWithdrawAmt('');
      setAddress('');
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Wallet</h1>
        <p className="text-slate-400 mt-1">Convert points to crypto and withdraw</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Object.entries(CURRENCY_INFO).map(([key, info]) => (
          <div key={key} className="card p-4 text-center">
            <div className="text-2xl mb-1" style={{ color: info.color }}>{info.icon}</div>
            <div className="font-bold text-white text-sm">{(balance[key] || 0).toFixed(4)}</div>
            <div className="text-xs text-slate-500">{info.name}</div>
          </div>
        ))}
      </div>

      {/* Points balance */}
      <div className="card p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl">💎</div>
          <div>
            <p className="text-sm text-slate-400">Available Points</p>
            <p className="text-2xl font-black text-white">{points.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">≈ USD Value</p>
          <p className="font-bold text-emerald-400">${(points / 10000).toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-800/60 rounded-xl p-1 mb-6">
        {[{ key: 'convert', label: '🔄 Convert' }, { key: 'withdraw', label: '💸 Withdraw' }, { key: 'history', label: '📋 History' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === t.key ? 'bg-primary text-white shadow-brand' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Convert tab */}
      {tab === 'convert' && (
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Currency</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CURRENCY_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setCurrency(key)}
                  className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                    currency === key ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-lg" style={{ color: info.color }}>{info.icon}</div>
                  <div className="text-xs text-slate-400 mt-1">{key.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Points to Convert</label>
            <input
              type="number"
              value={convertAmt}
              onChange={(e) => setConvertAmt(e.target.value)}
              placeholder={`Min: ${minPoints.toLocaleString()} pts`}
              className="input-field"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Rate: {rate.toLocaleString()} pts = 1 {currency.toUpperCase()} · You get: <span className="text-primary font-medium">{convertedAmount} {currency.toUpperCase()}</span>
            </p>
          </div>
          <button onClick={handleConvert} disabled={loading} className="btn-primary w-full py-3.5">
            {loading ? 'Converting...' : `Convert to ${currency.toUpperCase()}`}
          </button>
        </div>
      )}

      {/* Withdraw tab */}
      {tab === 'withdraw' && (
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CURRENCY_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setCurrency(key)}
                  className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                    currency === key ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-lg" style={{ color: info.color }}>{info.icon}</div>
                  <div className="text-xs text-slate-400 mt-1">{key.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
            <input
              type="number"
              value={withdrawAmt}
              onChange={(e) => setWithdrawAmt(e.target.value)}
              placeholder={`Min: ${MIN_WITHDRAW[currency]} ${currency.toUpperCase()}`}
              className="input-field"
            />
            <p className="text-xs text-slate-500 mt-1.5">Available: {(balance[currency] || 0).toFixed(6)} {currency.toUpperCase()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Wallet Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={`Your ${CURRENCY_INFO[currency].network} address`}
              className="input-field font-mono text-sm"
            />
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400">
            ⚠️ Withdrawals are processed within 1-3 business days. Double-check your address.
          </div>
          <button onClick={handleWithdraw} disabled={loading} className="btn-primary w-full py-3.5">
            {loading ? 'Submitting...' : 'Submit Withdrawal'}
          </button>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="card overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No conversions yet</div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-white">{(h.points_converted || 0).toLocaleString()} pts → {h.currency?.toUpperCase()}</p>
                    <p className="text-xs text-slate-500">{new Date(h.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-emerald-400 text-sm">+{parseFloat(h.amount_received || 0).toFixed(6)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
