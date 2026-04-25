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
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#0a0a0f' }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '400px',
        background: 'rgba(102,126,234,0.08)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      <div className="relative w-full" style={{ maxWidth: '28rem' }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div 
              className="rounded-xl bg-grad-brand flex items-center justify-center shadow-brand"
              style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                fontSize: '1.125rem',
                transition: 'box-shadow 0.3s'
              }}
            >
              💎
            </div>
            <span className="font-bold text-xl text-white">Cipro</span>
          </Link>
          <p className="text-muted text-sm mt-3">
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account and start earning.'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Tabs */}
          <div className="tabs mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={isLogin ? 'tab tab-active' : 'tab'}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={!isLogin ? 'tab tab-active' : 'tab'}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-col gap-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-light mb-2">Full Name</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-light mb-2">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter username"
                autoComplete="username"
                className="input"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-light mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-light mb-2">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="input"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-light mb-2">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="input"
                />
              </div>
            )}

            {!isLogin && referralCode && (
              <div className="alert-success">
                🎁 Referral code applied: <strong>{referralCode}</strong>
              </div>
            )}

            {error && (
              <div className="alert-error">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="alert-success">
                ✅ {success}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-full py-4 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner spinner-sm" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? '🚀 Sign In' : '🎮 Create Account'
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(17,17,24,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-dim text-center mb-2">Try the demo account</p>
              <button
                onClick={() => setForm((f) => ({ ...f, username: 'DemoPlayer', password: 'Demo1234' }))}
                className="btn-ghost w-full text-xs text-primary"
              >
                Fill demo credentials →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-dim mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-muted" style={{ transition: 'color 0.2s' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-muted" style={{ transition: 'color 0.2s' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="spinner spinner-lg" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
