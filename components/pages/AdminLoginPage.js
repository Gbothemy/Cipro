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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
      <div className="w-full" style={{ maxWidth: '24rem' }}>
        <div className="text-center mb-8">
          <div 
            className="rounded-xl bg-grad-brand flex items-center justify-center shadow-brand"
            style={{ 
              width: '3.5rem', 
              height: '3.5rem', 
              margin: '0 auto 1rem',
              fontSize: '1.5rem'
            }}
          >🔐</div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-light mb-2">Username</label>
              <input 
                name="username" 
                value={form.username} 
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} 
                className="input" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light mb-2">Password</label>
              <input 
                name="password" 
                type="password" 
                value={form.password} 
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} 
                className="input" 
                required 
              />
            </div>
            {error && <p className="text-error text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary btn-full py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
