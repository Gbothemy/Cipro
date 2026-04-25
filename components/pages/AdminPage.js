'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useStore();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) { router.replace('/game'); return; }
    loadData();
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      const [u, w] = await Promise.all([db.getAllUsers(), db.getWithdrawalRequests()]);
      setUsers(u);
      setWithdrawals(w);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const approveWithdrawal = async (id) => {
    try {
      await db.updateWithdrawalStatus(id, 'approved', user.userId);
      setWithdrawals((prev) => prev.map((w) => w.id === id ? { ...w, status: 'approved' } : w));
    } catch (e) { console.error(e); }
  };

  const rejectWithdrawal = async (id) => {
    try {
      await db.updateWithdrawalStatus(id, 'rejected', user.userId);
      setWithdrawals((prev) => prev.map((w) => w.id === id ? { ...w, status: 'rejected' } : w));
    } catch (e) { console.error(e); }
  };

  const pending = withdrawals.filter((w) => w.status === 'pending');

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="badge-primary">Admin</span>
            <span className="text-sm text-slate-400">{user?.username}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: users.length, icon: '👥' },
            { label: 'Pending Withdrawals', value: pending.length, icon: '⏳' },
            { label: 'Total Withdrawals', value: withdrawals.length, icon: '💸' },
            { label: 'Active Today', value: users.filter((u) => u.lastClaim && new Date(u.lastClaim) > new Date(Date.now() - 86400000)).length, icon: '✅' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-dark-800/60 rounded-xl p-1 mb-6 w-fit">
          {[{ key: 'users', label: '👥 Users' }, { key: 'withdrawals', label: '💸 Withdrawals' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t.key ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : tab === 'users' ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5 text-left">
                  {['User', 'Points', 'VIP', 'Streak', 'Joined'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.userId} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span>{u.avatar || '👤'}</span>
                          <div>
                            <p className="font-medium text-white">{u.username}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-medium text-primary">{(u.points || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-300">{u.vipLevel || 1}</td>
                      <td className="px-5 py-3 text-slate-300">{u.dayStreak || 0}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{u.userId?.split('-')[1] ? new Date(parseInt(u.userId.split('-')[1])).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5 text-left">
                  {['User', 'Amount', 'Currency', 'Address', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{w.username}</td>
                      <td className="px-5 py-3 text-white">{w.amount}</td>
                      <td className="px-5 py-3 text-slate-300 uppercase">{w.currency}</td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs max-w-[120px] truncate">{w.wallet_address}</td>
                      <td className="px-5 py-3">
                        <span className={`badge text-xs ${
                          w.status === 'approved' ? 'badge-success' :
                          w.status === 'rejected' ? 'badge-error' :
                          'badge-warning'
                        }`}>{w.status}</span>
                      </td>
                      <td className="px-5 py-3">
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => approveWithdrawal(w.id)} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">Approve</button>
                            <button onClick={() => rejectWithdrawal(w.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {withdrawals.length === 0 && <div className="p-12 text-center text-slate-400">No withdrawal requests</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
