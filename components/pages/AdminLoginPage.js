'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const users = await db.getAllUsers();
      const admin = users.find(
        (u) => u.username.toLowerCase() === form.username.toLowerCase() && u.isAdmin
      );
      if (!admin) { setError('Invalid admin credentials.'); setLoading(false); return; }
      login(admin);
      document.cookie = `cipro-auth=${encodeURIComponent(JSON.stringify({ userId: admin.userId, isAdmin: true }))}; path=/; max-age=${7 * 24 * 60 * 60}`;
      router.push('/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand mx-auto flex items-center justify-center text-2xl mb-4 shadow-brand">🔐</div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input name="username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input name="password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="input-field" required />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
