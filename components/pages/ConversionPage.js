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
  const [activeReferralCount, setActiveReferralCount] = useState(0);

  useEffect(() => {
    if (user?.userId) {
      db.getConversionHistory(user.userId).then(setHistory).catch(() => {});
      db.getReferralStats(user.userId).then((stats) => setActiveReferralCount(stats.activeReferrals || 0)).catch(() => {});
    }
  }, [user?.userId]);

  const hasActiveVip = Number(user?.vipLevel || 1) >= 2
    && user?.vipSubscriptionEnd
    && new Date(user.vipSubscriptionEnd) > new Date();
  const withdrawalUnlocked = Boolean(hasActiveVip) && activeReferralCount >= 5;

  const points = user?.points || 0;
  const balance = {
    sol: Number(user?.earnedBalance?.sol || 0),
    eth: Number(user?.earnedBalance?.eth || 0),
    usdt: Number(user?.earnedBalance?.usdt || 0),
    usdc: Number(user?.earnedBalance?.usdc || 0),
  };
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
      const result = await db.convertPoints(user.userId, pts, currency);
      const amount = result.amount;
      updateUser(result.user);
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
      await db.createWithdrawalRequest({
        user_id: user.userId,
        currency, amount: amt, wallet_address: address,
        network: CURRENCY_INFO[currency].network,
      });
      updateUser(await db.getUser(user.userId));
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
    <div className="page-container-md">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Wallet</h1>
        <p className="text-muted mt-2">Convert points to crypto and withdraw</p>
      </div>

      {/* Balance cards */}
      <div className="grid-4 mb-8">
        {Object.entries(CURRENCY_INFO).map(([key, info]) => (
          <div key={key} className="card p-4 text-center">
            <div className="text-2xl mb-2" style={{ color: info.color }}>{info.icon}</div>
            <div className="font-bold text-white text-sm">{Number(balance[key] || 0).toFixed(4)}</div>
            <div className="text-xs text-dim">{info.name}</div>
          </div>
        ))}
      </div>

      {/* Points balance */}
      <div className="card p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="rounded-xl flex items-center justify-center"
            style={{
              width: '3rem',
              height: '3rem',
              background: 'rgba(102,126,234,0.15)',
              fontSize: '1.5rem'
            }}
          >💎</div>
          <div>
            <p className="text-sm text-muted">Available Points</p>
            <p className="text-2xl font-black text-white">{points.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-dim">≈ USD Value</p>
          <p className="font-bold text-success">${(points / 10000).toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {[{ key: 'convert', label: '🔄 Convert' }, { key: 'withdraw', label: '💸 Withdraw' }, { key: 'history', label: '📋 History' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={tab === t.key ? 'tab tab-active' : 'tab'}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Convert tab */}
      {tab === 'convert' && (
        <div className="card p-6 flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-light mb-2">Select Currency</label>
            <div className="grid-4">
              {Object.entries(CURRENCY_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setCurrency(key)}
                  className="btn p-3 text-center"
                  style={{
                    borderColor: currency === key ? 'rgba(102,126,234,0.5)' : 'rgba(255,255,255,0.1)',
                    background: currency === key ? 'rgba(102,126,234,0.1)' : 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div className="text-lg" style={{ color: info.color }}>{info.icon}</div>
                  <div className="text-xs text-muted mt-1">{key.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-light mb-2">Points to Convert</label>
            <input
              type="number"
              value={convertAmt}
              onChange={(e) => setConvertAmt(e.target.value)}
              placeholder={`Min: ${minPoints.toLocaleString()} pts`}
              className="input"
            />
            <p className="text-xs text-dim mt-2">
              Rate: {rate.toLocaleString()} pts = 1 {currency.toUpperCase()} · You get: <span className="text-primary font-medium">{convertedAmount} {currency.toUpperCase()}</span>
            </p>
          </div>
          <button onClick={handleConvert} disabled={loading} className="btn btn-primary btn-full py-4">
            {loading ? 'Converting...' : `Convert to ${currency.toUpperCase()}`}
          </button>
        </div>
      )}

      {/* Withdraw tab */}
      {tab === 'withdraw' && (
        <div className="card p-6 flex-col gap-5">
          {!withdrawalUnlocked && (
            <div className="alert-warning">
              🔒 Withdrawals require an active VIP subscription and 5 active invited users ({activeReferralCount}/5 active).
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-light mb-2">Currency</label>
            <div className="grid-4">
              {Object.entries(CURRENCY_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setCurrency(key)}
                  className="btn p-3 text-center"
                  style={{
                    borderColor: currency === key ? 'rgba(102,126,234,0.5)' : 'rgba(255,255,255,0.1)',
                    background: currency === key ? 'rgba(102,126,234,0.1)' : 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div className="text-lg" style={{ color: info.color }}>{info.icon}</div>
                  <div className="text-xs text-muted mt-1">{key.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-light mb-2">Amount</label>
            <input
              type="number"
              value={withdrawAmt}
              onChange={(e) => setWithdrawAmt(e.target.value)}
              placeholder={`Min: ${MIN_WITHDRAW[currency]} ${currency.toUpperCase()}`}
              className="input"
            />
            <p className="text-xs text-dim mt-2">Available: {Number(balance[currency] || 0).toFixed(6)} {currency.toUpperCase()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-light mb-2">Wallet Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={`Your ${CURRENCY_INFO[currency].network} address`}
              className="input"
              style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            />
          </div>
          <div className="alert-warning">
            ⚠️ Withdrawals are processed within 1-3 business days. Double-check your address.
          </div>
          <button onClick={handleWithdraw} disabled={loading || !withdrawalUnlocked} className="btn btn-primary btn-full py-4">
            {loading ? 'Submitting...' : 'Submit Withdrawal'}
          </button>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="card overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center text-muted">No conversions yet</div>
          ) : (
            <div>
              {history.map((h, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{(h.points_converted || 0).toLocaleString()} pts → {h.currency?.toUpperCase()}</p>
                    <p className="text-xs text-dim">{new Date(h.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-success text-sm">+{parseFloat(h.amount_received || 0).toFixed(6)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
