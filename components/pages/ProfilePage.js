'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

const AVATARS = ['👤','👨','👩','🧑','🤖','👽','🎮','🎯','🏆','💎','🚀','🌟','😎','🦊','🐉','🎭'];

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, addNotification } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '', avatar: user?.avatar || '👤' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshBalance = async () => {
    setRefreshing(true);
    try {
      const userData = await db.getUser(user.userId);
      if (userData) {
        updateUser(userData);
        addNotification({
          type: 'success',
          title: 'Balance Updated',
          message: 'Your balance has been refreshed',
        });
      }
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to refresh balance',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
    document.cookie = 'cipro-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  const handleSave = async () => {
    if (!form.username.trim() || form.username.length < 3) {
      addNotification({ type: 'error', title: 'Invalid', message: 'Username must be at least 3 characters' });
      return;
    }
    setLoading(true);
    try {
      await db.updateUser(user.userId, { username: form.username, email: form.email, avatar: form.avatar });
      updateUser({ username: form.username, email: form.email, avatar: form.avatar });
      addNotification({ type: 'success', title: 'Saved!', message: 'Profile updated successfully' });
      setEditing(false);
    } catch (e) {
      addNotification({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const vipProgress = ((user?.exp || 0) / (user?.maxExp || 1000)) * 100;

  return (
    <div className="page-container-md">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Profile</h1>
        <p className="text-muted mt-2">Manage your account settings</p>
      </div>

      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div 
              className="rounded-xl bg-grad-brand flex items-center justify-center shadow-brand"
              style={{ width: '5rem', height: '5rem', fontSize: '2.5rem' }}
            >
              {editing ? form.avatar : user?.avatar || '👤'}
            </div>
            {user?.vipLevel > 1 && (
              <div 
                className="absolute text-xs font-bold px-2 rounded-full"
                style={{ 
                  bottom: '-0.5rem', 
                  right: '-0.5rem', 
                  background: '#fbbf24', 
                  color: '#0a0a0f',
                  padding: '0.125rem 0.5rem'
                }}
              >
                VIP {user.vipLevel}
              </div>
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="input mb-2 text-lg font-bold"
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{user?.username}</h2>
            )}
            <p className="text-sm text-muted">{user?.userId}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="badge-primary">💎 {(user?.points || 0).toLocaleString()} pts</span>
              <span className="badge-warning">🔥 {user?.dayStreak || 0} streak</span>
            </div>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={loading}
            className={editing ? 'btn btn-primary py-2 px-4 text-sm' : 'btn btn-secondary py-2 px-4 text-sm'}
          >
            {loading ? '...' : editing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Avatar picker */}
        {editing && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-sm font-medium text-light mb-3">Choose Avatar</p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setForm((f) => ({ ...f, avatar: a }))}
                  className="btn rounded-xl"
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    fontSize: '1.25rem',
                    padding: 0,
                    background: form.avatar === a ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.05)',
                    border: form.avatar === a ? '2px solid #667eea' : '1px solid rgba(255,255,255,0.1)',
                    transform: form.avatar === a ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Email */}
        {editing && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-light mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              className="input"
            />
          </div>
        )}
      </div>

      {/* VIP Progress */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">VIP Progress</h3>
          <span className="badge-primary">Level {user?.vipLevel || 1}</span>
        </div>
        <div className="progress-track mb-2">
          <div className="progress-fill" style={{ width: `${vipProgress}%` }} />
        </div>
        <p className="text-xs text-dim">{user?.exp || 0} / {user?.maxExp || 1000} XP to next level</p>
      </div>

      {/* Stats */}
      <div className="grid-2 mb-6">
        {[
          { label: 'Total Points', value: (user?.points || 0).toLocaleString(), icon: '💎' },
          { label: 'Day Streak', value: `${user?.dayStreak || 0} days`, icon: '🔥' },
          { label: 'Tasks Done', value: user?.completedTasks || 0, icon: '✅' },
          { label: 'VIP Level', value: user?.vipLevel || 1, icon: '⭐' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Deposited Balance */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">💰 Deposited Balance</h3>
          <div className="flex gap-2">
            <button 
              onClick={refreshBalance}
              disabled={refreshing}
              className="btn btn-secondary btn-sm py-2 px-4 text-xs"
            >
              {refreshing ? '⏳' : '🔄'} Refresh
            </button>
            <button 
              onClick={() => router.push('/deposit')}
              className="btn btn-primary btn-sm py-2 px-4 text-xs"
            >
              + Deposit
            </button>
          </div>
        </div>
        <div className="grid-2 gap-3">
          {[
            { label: 'SOL', value: user?.balance?.sol || 0, icon: '◎' },
            { label: 'ETH', value: user?.balance?.eth || 0, icon: 'Ξ' },
            { label: 'USDT', value: user?.balance?.usdt || 0, icon: '₮' },
            { label: 'USDC', value: user?.balance?.usdc || 0, icon: '$' },
          ].map((crypto, i) => (
            <div 
              key={i} 
              className="p-3 rounded-lg"
              style={{ 
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted mb-1">{crypto.label}</p>
                  <p className="font-bold text-white">
                    {crypto.icon} {Number(crypto.value).toFixed(crypto.label === 'USDT' || crypto.label === 'USDC' ? 2 : 4)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg text-center" style={{ background: 'rgba(102,126,234,0.05)', border: '1px solid rgba(102,126,234,0.1)' }}>
          <p className="text-xs text-primary">
            💡 Only deposited funds can be used for VIP upgrades and Lucky Draw tickets
          </p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="btn btn-danger btn-full py-4"
      >
        🚪 Sign Out
      </button>
    </div>
  );
}
