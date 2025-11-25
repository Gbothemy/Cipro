import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      // Create admin user data
      const adminData = {
        username: formData.username,
        email: `${formData.username.toLowerCase()}@admin.com`,
        userId: `ADMIN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        avatar: '🛡️',
        isAuthenticated: true,
        isAdmin: true
      };

      // Save to localStorage
      localStorage.setItem('authUser', JSON.stringify(adminData));
      
      // Call parent login handler
      onLogin(adminData, navigate);
      
      setIsLoading(false);
    }, 500);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-logo">🛡️</div>
          <h1>Admin Portal</h1>
          <p>Secure access for administrators only</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
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
