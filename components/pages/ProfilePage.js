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
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center text-4xl shadow-brand">
              {editing ? form.avatar : user?.avatar || '👤'}
            </div>
            {user?.vipLevel > 1 && (
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-dark-900 text-xs font-bold px-2 py-0.5 rounded-full">
                VIP {user.vipLevel}
              </div>
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="input-field mb-2 text-lg font-bold"
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{user?.username}</h2>
            )}
            <p className="text-sm text-slate-400">{user?.userId}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="badge-primary">💎 {(user?.points || 0).toLocaleString()} pts</span>
              <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">🔥 {user?.dayStreak || 0} streak</span>
            </div>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={loading}
            className={editing ? 'btn-primary py-2 px-4 text-sm' : 'btn-secondary py-2 px-4 text-sm'}
          >
            {loading ? '...' : editing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Avatar picker */}
        {editing && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <p className="text-sm font-medium text-slate-300 mb-3">Choose Avatar</p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setForm((f) => ({ ...f, avatar: a }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    form.avatar === a ? 'bg-primary/20 border-2 border-primary scale-110' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              className="input-field"
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
        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-brand rounded-full transition-all duration-500" style={{ width: `${vipProgress}%` }} />
        </div>
        <p className="text-xs text-slate-500">{user?.exp || 0} / {user?.maxExp || 1000} XP to next level</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total Points', value: (user?.points || 0).toLocaleString(), icon: '💎' },
          { label: 'Day Streak', value: `${user?.dayStreak || 0} days`, icon: '🔥' },
          { label: 'Tasks Done', value: user?.completedTasks || 0, icon: '✅' },
          { label: 'VIP Level', value: user?.vipLevel || 1, icon: '⭐' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
      >
        🚪 Sign Out
      </button>
    </div>
  );
}
