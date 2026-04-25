'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import useStore from '../../app/store/useStore';
import { db } from '../../lib/apiClient';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useStore();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', fullName: '' });
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) { setReferralCode(ref); setIsLogin(false); }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.username.trim()) return 'Username is required';
    if (form.username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Username: letters, numbers, underscores only';
    if (!form.password) return 'Password is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (!isLogin) {
      if (!form.email.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address';
      if (form.password !== form.confirmPassword) return 'Passwords do not match';
    }
    return null;
  };

  const setAuthCookie = (userData) => {
    const value = JSON.stringify({ userId: userData.userId, isAdmin: userData.isAdmin });
    document.cookie = `cipro-auth=${encodeURIComponent(value)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Demo account shortcut
        if (form.username === 'DemoPlayer') {
          const demoUser = {
            userId: 'USR-DEMO123', username: 'DemoPlayer', email: 'demo@cipro.com',
            avatar: '🎮', isAdmin: false, points: 5000, vipLevel: 1,
            balance: { sol: 0, eth: 0, usdt: 0, usdc: 0 },
          };
          login(demoUser);
          setAuthCookie(demoUser);
          router.push('/game');
          return;
        }

        const users = await db.getAllUsers();
        const found = users.find((u) => u.username.toLowerCase() === form.username.toLowerCase());
        if (!found) { setError('Invalid username or password.'); setLoading(false); return; }

        login(found);
        setAuthCookie(found);
        router.push(found.isAdmin ? '/admin' : '/game');
      } else {
        // Register
        const users = await db.getAllUsers();
        const exists = users.find((u) => u.username.toLowerCase() === form.username.toLowerCase());
        if (exists) { setError('Username already taken.'); setLoading(false); return; }

        const userId = `USR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const newUser = await db.createUser({
          user_id: userId,
          username: form.username,
          email: form.email,
          avatar: '👤',
          is_admin: false,
          referred_by: referralCode || null,
        });

        if (!newUser) { setError('Registration failed. Please try again.'); setLoading(false); return; }

        setSuccess('Account created! Signing you in...');
        login(newUser);
        setAuthCookie(newUser);
        setTimeout(() => router.push('/game'), 800);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-lg shadow-brand group-hover:shadow-brand-lg transition-shadow">
              💎
            </div>
            <span className="font-bold text-xl text-white">Cipro</span>
          </Link>
          <p className="text-slate-400 text-sm mt-3">
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account and start earning.'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Tabs */}
          <div className="flex bg-dark-800/60 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isLogin ? 'bg-primary text-white shadow-brand' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                !isLogin ? 'bg-primary text-white shadow-brand' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter username"
                autoComplete="username"
                className="input-field"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="input-field"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="input-field"
                />
              </div>
            )}

            {!isLogin && referralCode && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <span className="text-emerald-400">🎁</span>
                <span className="text-sm text-emerald-400">Referral code applied: <strong>{referralCode}</strong></span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="text-red-400 text-sm">⚠️ {error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <span className="text-emerald-400 text-sm">✅ {success}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? '🚀 Sign In' : '🎮 Create Account'
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 p-4 bg-dark-800/60 rounded-xl border border-white/5">
              <p className="text-xs text-slate-500 text-center mb-2">Try the demo account</p>
              <button
                onClick={() => setForm((f) => ({ ...f, username: 'DemoPlayer', password: 'Demo1234' }))}
                className="w-full text-xs text-primary hover:text-primary-light transition-colors"
              >
                Fill demo credentials →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
