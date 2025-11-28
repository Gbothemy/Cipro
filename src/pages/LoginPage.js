import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../db/supabase';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  // Get referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setIsLogin(false); // Switch to signup mode
    }
  }, [searchParams]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must not exceed 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Full name validation (registration only)
    if (!isLogin && !formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!isLogin && formData.fullName.length < 2) {
      newErrors.fullName = 'Please enter your full name';
    }

    // Email validation (registration only)
    if (!isLogin && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!isLogin && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation (registration only)
    if (!isLogin && !formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      if (isLogin) {
        // LOGIN
        const users = await db.getAllUsers();
        const existingUser = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase());
        
        if (!existingUser) {
          setErrors({ general: 'Invalid username or password. Please try again.' });
          setIsLoading(false);
          return;
        }

        // In production, verify password hash here
        const userData = {
          ...existingUser,
          isAuthenticated: true
        };

        localStorage.setItem('authUser', JSON.stringify(userData));
        setSuccessMessage('Login successful! Redirecting...');
        
        setTimeout(() => {
          onLogin(userData, navigate);
        }, 1000);
      } else {
        // REGISTER
        const users = await db.getAllUsers();
        const existingUser = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase());
        
        if (existingUser) {
          setErrors({ username: 'This username is already taken. Please choose another.' });
          setIsLoading(false);
          return;
        }

        // Check if email already exists
        const existingEmail = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
        if (existingEmail) {
          setErrors({ email: 'This email is already registered. Please login instead.' });
          setIsLoading(false);
          return;
        }

        // Create new user in database
        const userId = `USR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const avatar = ['👤', '👨', '👩', '🧑', '👦', '👧', '🧔', '👱'][Math.floor(Math.random() * 8)];
        
        const newUser = await db.createUser({
          user_id: userId,
          username: formData.username,
          email: formData.email,
          avatar: avatar,
          is_admin: false,
          referred_by: referralCode || null
        });

        const userData = {
          ...newUser,
          isAuthenticated: true
        };

        localStorage.setItem('authUser', JSON.stringify(userData));
        setSuccessMessage('Account created successfully! Redirecting...');
        
        setTimeout(() => {
          onLogin(userData, navigate);
        }, 1500);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({ general: 'An error occurred. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      // Check if demo user exists
      let demoUser = await db.getUser('USR-DEMO123');
      
      if (!demoUser) {
        // Create demo user if doesn't exist
        await db.createUser({
          user_id: 'USR-DEMO123',
          username: 'DemoPlayer',
          email: 'demo@rewardgame.com',
          avatar: '🎮',
          is_admin: false
        });
      }

      const userData = {
        username: 'DemoPlayer',
        email: 'demo@rewardgame.com',
        userId: 'USR-DEMO123',
        avatar: '🎮',
        isAuthenticated: true
      };
      
      localStorage.setItem('authUser', JSON.stringify(userData));
      onLogin(userData, navigate);
    } catch (error) {
      console.error('Demo login error:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">🎮</div>
          <h1>Cipro Dashboard</h1>
          <p>Play games and earn cryptocurrency rewards</p>
        </div>

        <div className="login-tabs">
          <button 
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={!isLogin ? 'active' : ''}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && (
            <div className="error-banner">
              ⚠️ {errors.general}
            </div>
          )}

          {successMessage && (
            <div className="success-banner">
              ✅ {successMessage}
            </div>
          )}

          {referralCode && !isLogin && (
            <div className="referral-banner">
              🎉 You're signing up with a referral code! You and your friend will both earn rewards!
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={errors.fullName ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>
          )}

          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a unique username"
              className={errors.username ? 'error' : ''}
              disabled={isLoading}
              autoComplete="username"
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
            {!isLogin && !errors.username && <span className="hint-text">3-20 characters, letters, numbers, and underscores only</span>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className={errors.email ? 'error' : ''}
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          )}

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isLogin ? "Enter your password" : "Create a strong password"}
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
            {!isLogin && !errors.password && <span className="hint-text">Min 8 characters with uppercase, lowercase, and number</span>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {isLogin ? 'Logging in...' : 'Creating account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>

          {isLogin && (
            <div className="forgot-password">
              <a href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>
          )}
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button onClick={handleDemoLogin} className="demo-btn" disabled={isLoading}>
          {isLoading ? 'Loading...' : '🎮 Try Demo Account'}
        </button>

        <div className="login-footer">
          <p className="terms-text">
            By {isLogin ? 'logging in' : 'creating an account'}, you agree to our{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          </p>
          {!isLogin && (
            <p className="security-note">
              🔒 Your data is encrypted and secure
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
