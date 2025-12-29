import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/supabase';
import './AdminLoginPage.css';

function AdminLoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

    if (!formData.username.trim()) {
      newErrors.username = 'Admin username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Default admin credentials
      const DEFAULT_ADMIN = {
        username: 'admin',
        password: 'Admin@123'
      };

      // Check credentials
      if (formData.username.toLowerCase() === DEFAULT_ADMIN.username.toLowerCase() && 
          formData.password === DEFAULT_ADMIN.password) {
        
        // Try to get admin from database, if fails create default admin data
        let adminUser;
        try {
          adminUser = await db.getUser('ADMIN-DEFAULT-001');
          
          if (!adminUser) {
            // Create default admin in database
            adminUser = await db.createUser({
              user_id: 'ADMIN-DEFAULT-001',
              username: 'admin',
              email: 'admin@ciprohub.site',
              avatar: '🛡️',
              is_admin: true
            });
          }
        } catch (dbError) {
          console.error('Database error, using fallback admin:', dbError);
          // Fallback admin data if database fails
          adminUser = {
            userId: 'ADMIN-DEFAULT-001',
            username: 'admin',
            email: 'admin@ciprohub.site',
            avatar: '🛡️',
            isAdmin: true,
            points: 0,
            vipLevel: 99,
            exp: 0,
            maxExp: 1000,
            giftPoints: 0,
            completedTasks: 0,
            dayStreak: 0,
            balance: { ton: 0, cati: 0, usdt: 0 },
            totalEarnings: { ton: 0, cati: 0, usdt: 0 }
          };
        }

        const adminData = {
          ...adminUser,
          isAuthenticated: true,
          isAdmin: true
        };

        console.log('Admin login successful:', adminData); // Debug log
        localStorage.setItem('authUser', JSON.stringify(adminData));
        onLogin(adminData, navigate);
      } else {
        setErrors({ general: 'Invalid admin credentials. Please try again.' });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrors({ general: 'Authentication failed. Please check your credentials.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDefaultLogin = async () => {
    setFormData({
      username: 'admin',
      password: 'Admin@123'
    });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-logo">
            <img 
              src="/ciprohub.png" 
              alt="Cipro Admin" 
              className="logo-image-admin"
              onError={(e) => {
                // Fallback to shield emoji if image fails
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="logo-emoji-fallback" style={{ display: 'none' }}>🛡️</div>
          </div>
          <h1>Admin Portal</h1>
          <p>Secure access for administrators only</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-banner">
              ⚠️ {errors.general}
            </div>
          )}

          <div className="default-credentials">
            <div className="credentials-header">
              <span className="key-icon">🔑</span>
              <strong>Default Admin Credentials</strong>
            </div>
            <div className="credentials-info">
              <div className="credential-item">
                <span className="label">Username:</span>
                <code>admin</code>
              </div>
              <div className="credential-item">
                <span className="label">Password:</span>
                <code>Admin@123</code>
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleDefaultLogin}
              className="use-default-btn"
            >
              Use Default Credentials
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="username">
              <span className="label-icon">👤</span>
              Admin Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter admin username"
              className={errors.username ? 'error' : ''}
              autoComplete="username"
              disabled={isLoading}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span className="label-icon">🔒</span>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter admin password"
              className={errors.password ? 'error' : ''}
              autoComplete="current-password"
              disabled={isLoading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="admin-login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Authenticating...
              </>
            ) : (
              <>
                <span>🛡️</span>
                Login as Admin
              </>
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <button onClick={handleBackToHome} className="back-btn">
            ← Back to Home
          </button>
          <div className="security-notice">
            <span className="security-icon">🔒</span>
            <span>Secure Admin Access</span>
          </div>
        </div>

        <div className="admin-info-box">
          <h3>🔐 Admin Access Information</h3>
          <ul>
            <li>✅ Full system management access</li>
            <li>✅ User management and moderation</li>
            <li>✅ Withdrawal approval system</li>
            <li>✅ Real-time analytics and reports</li>
            <li>✅ System configuration control</li>
          </ul>
        </div>
      </div>

      <div className="admin-background">
        <div className="admin-pattern"></div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
