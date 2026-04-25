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
    <div className="min-h-screen p-6" style={{ background: '#0a0a0f' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="badge-primary">Admin</span>
            <span className="text-sm text-muted">{user?.username}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-8">
          {[
            { label: 'Total Users', value: users.length, icon: '👥' },
            { label: 'Pending Withdrawals', value: pending.length, icon: '⏳' },
            { label: 'Total Withdrawals', value: withdrawals.length, icon: '💸' },
            { label: 'Active Today', value: users.filter((u) => u.lastClaim && new Date(u.lastClaim) > new Date(Date.now() - 86400000)).length, icon: '✅' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs mb-6" style={{ width: 'fit-content' }}>
          {[{ key: 'users', label: '👥 Users' }, { key: 'withdrawals', label: '💸 Withdrawals' }].map((t) => (
            <button 
              key={t.key} 
              onClick={() => setTab(t.key)}
              className={tab === t.key ? 'tab tab-active' : 'tab'}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-12 text-center">
            <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
          </div>
        ) : tab === 'users' ? (
          <div className="card overflow-hidden">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {['User', 'Points', 'VIP', 'Streak', 'Joined'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.userId}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span>{u.avatar || '👤'}</span>
                          <div>
                            <p className="font-medium text-white">{u.username}</p>
                            <p className="text-xs text-dim">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-medium text-primary">{(u.points || 0).toLocaleString()}</td>
                      <td className="text-light">{u.vipLevel || 1}</td>
                      <td className="text-light">{u.dayStreak || 0}</td>
                      <td className="text-dim text-xs">{u.userId?.split('-')[1] ? new Date(parseInt(u.userId.split('-')[1])).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {['User', 'Amount', 'Currency', 'Address', 'Status', 'Actions'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td className="font-medium text-white">{w.username}</td>
                      <td className="text-white">{w.amount}</td>
                      <td className="text-light" style={{ textTransform: 'uppercase' }}>{w.currency}</td>
                      <td className="text-muted text-xs" style={{ fontFamily: 'monospace', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.wallet_address}</td>
                      <td>
                        <span className={`badge text-xs ${
                          w.status === 'approved' ? 'badge-success' :
                          w.status === 'rejected' ? 'badge-error' :
                          'badge-warning'
                        }`}>{w.status}</span>
                      </td>
                      <td>
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => approveWithdrawal(w.id)} className="btn-ghost text-xs text-success">Approve</button>
                            <button onClick={() => rejectWithdrawal(w.id)} className="btn-ghost text-xs text-error">Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {withdrawals.length === 0 && <div className="p-12 text-center text-muted">No withdrawal requests</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
