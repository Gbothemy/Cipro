import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/supabase';
import './ProfilePage.css';

function ProfilePage({ user, updateUser, addNotification, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user.username || '',
    email: user.email || '',
    avatar: user.avatar || '👤'
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Available avatar options
  const avatarOptions = [
    '👤', '👨', '👩', '🧑', '👦', '👧', '👴', '👵', '🧔', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻',
    '🤖', '👽', '🎭', '🎨', '🎯', '🎮', '🎲', '🎪', '🎨', '🎭', '🎪', '🎯', '🎮', '🎲',
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰',
    '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭'
  ];

  useEffect(() => {
    setEditForm({
      username: user.username || '',
      email: user.email || '',
      avatar: user.avatar || '👤'
    });
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!editForm.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (editForm.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (editForm.username.length > 20) {
      newErrors.username = 'Username must not exceed 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(editForm.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation (optional)
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (if changing password)
    if (showPasswordSection) {
      if (!passwordForm.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      
      if (!passwordForm.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (passwordForm.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
        newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
      }
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    console.log('Save profile clicked');
    console.log('Form data:', editForm);
    
    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    console.log('Validation passed, starting save...');
    setLoading(true);

    try {
      const updateData = {
        username: editForm.username,
        email: editForm.email,
        avatar: editForm.avatar,
        points: user.points,
        vipLevel: user.vipLevel,
        exp: user.exp,
        completedTasks: user.completedTasks,
        dayStreak: user.dayStreak,
        lastClaim: user.lastClaim
      };
      
      console.log('Updating user with data:', updateData);
      
      // Update user in database
      await db.updateUser(user.userId, updateData);
      
      console.log('Database update successful');

      // Update local state
      updateUser({
        username: editForm.username,
        email: editForm.email,
        avatar: editForm.avatar
      });

      // Update localStorage
      const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      authUser.username = editForm.username;
      authUser.email = editForm.email;
      authUser.avatar = editForm.avatar;
      localStorage.setItem('authUser', JSON.stringify(authUser));

      console.log('Profile update completed successfully');
      addNotification('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification('Failed to update profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Call the save handler
    await handleSaveProfile();
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: user.username || '',
      email: user.email || '',
      avatar: user.avatar || '👤'
    });
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordSection(false);
    setErrors({});
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authUser');
      addNotification('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  const getTierName = (level) => {
    if (level >= 51) return { name: 'Diamond', icon: '💠', color: '#B9F2FF' };
    if (level >= 31) return { name: 'Platinum', icon: '💎', color: '#E5E4E2' };
    if (level >= 16) return { name: 'Gold', icon: '🥇', color: '#FFD700' };
    if (level >= 6) return { name: 'Silver', icon: '🥈', color: '#C0C0C0' };
    return { name: 'Bronze', icon: '🥉', color: '#CD7F32' };
  };

  const tier = getTierName(user.vipLevel);

  const stats = [
    { label: 'Total Cipro', value: user.points.toLocaleString(), icon: '💎', color: '#667eea' },
    { label: 'VIP Level', value: user.vipLevel, icon: '⭐', color: '#f59e0b' },
    { label: 'Games Played', value: user.completedTasks, icon: '🎮', color: '#10b981' },
    { label: 'Day Streak', value: user.dayStreak, icon: '🔥', color: '#ef4444' },
    { label: 'SOL Balance', value: user.balance?.sol?.toFixed(4) || '0.0000', icon: '◎', color: '#14F195' },
    { label: 'ETH Balance', value: user.balance?.eth?.toFixed(4) || '0.0000', icon: 'Ξ', color: '#627EEA' },
    { label: 'USDT Balance', value: user.balance?.usdt?.toFixed(2) || '0.00', icon: '💵', color: '#26a17b' },
    { label: 'USDC Balance', value: user.balance?.usdc?.toFixed(2) || '0.00', icon: '💵', color: '#2775CA' },
    { label: 'Gift Cipro', value: user.giftPoints || 0, icon: '🎁', color: '#f97316' }
  ];

  const achievements = [
    { id: 1, name: 'First Login', icon: '👋', unlocked: true },
    { id: 2, name: 'Week Warrior', icon: '🔥', unlocked: user.dayStreak >= 7 },
    { id: 3, name: 'Cipro Collector', icon: '💎', unlocked: user.points >= 1000 },
    { id: 4, name: 'Game Master', icon: '🎮', unlocked: user.completedTasks >= 10 },
    { id: 5, name: 'VIP Elite', icon: '⭐', unlocked: user.vipLevel >= 5 },
    { id: 6, name: 'Social Butterfly', icon: '👥', unlocked: false }
  ];

  const recentActivity = [
    { id: 1, action: 'Played Puzzle Game', points: '+50 CIPRO', time: '2 hours ago', icon: '🧩' },
    { id: 2, action: 'Claimed Daily Reward', points: '+100 CIPRO', time: '5 hours ago', icon: '🎁' },
    { id: 3, action: 'Level Up to VIP ' + user.vipLevel, points: '+200 CIPRO', time: '1 day ago', icon: '⭐' },
    { id: 4, action: 'Completed Task', points: '+150 CIPRO', time: '2 days ago', icon: '✅' }
  ];

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-banner" style={{ background: `linear-gradient(135deg, ${tier.color} 0%, #764ba2 100%)` }}>
          <div className="banner-content">
            <div className="profile-avatar-large">{isEditing ? editForm.avatar : user.avatar}</div>
            <div className="profile-info">
              <h1>{isEditing ? editForm.username : user.username}</h1>
              <p className="user-id-display">{user.userId}</p>
              <div className="tier-badge" style={{ background: tier.color }}>
                <span>{tier.icon}</span>
                <span>{tier.name} Tier</span>
              </div>
            </div>
          </div>
          {!isEditing ? (
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="save-profile-btn" 
                onClick={(e) => {
                  console.log('Save button clicked');
                  e.preventDefault();
                  handleSaveProfile();
                }} 
                disabled={loading}
                type="button"
              >
                {loading ? '⏳ Saving...' : '✅ Save'}
              </button>
              <button className="cancel-profile-btn" onClick={handleCancelEdit} disabled={loading}>
                ❌ Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Form - Redesigned */}
      {isEditing && (
        <div className="profile-edit-overlay">
          <div className="profile-edit-modal">
            <div className="edit-modal-header">
              <h2>✨ Edit Your Profile</h2>
              <button 
                className="close-edit-btn" 
                onClick={handleCancelEdit}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <div className="edit-modal-content">
              {/* Live Preview Section */}
              <div className="edit-preview-section">
                <div className="preview-header">
                  <h3>👀 Live Preview</h3>
                  <p>See how your profile will look</p>
                </div>
                <div className="live-preview-card">
                  <div className="preview-banner" style={{ background: `linear-gradient(135deg, ${tier.color} 0%, #764ba2 100%)` }}>
                    <div className="preview-avatar-large">{editForm.avatar}</div>
                    <div className="preview-profile-info">
                      <h3>{editForm.username || 'Your Username'}</h3>
                      <p>{editForm.email || 'your.email@example.com'}</p>
                      <div className="preview-tier-badge" style={{ background: tier.color }}>
                        <span>{tier.icon}</span>
                        <span>{tier.name} Tier</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form Section */}
              <div className="edit-form-section">
                <form onSubmit={handleEditSubmit} className="modern-edit-form">
                  
                  {/* Avatar Selection - Redesigned */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4>🎭 Choose Your Avatar</h4>
                      <p>Pick an avatar that represents you</p>
                    </div>
                    <div className="avatar-selector">
                      <div className="current-avatar">
                        <div className="current-avatar-display">{editForm.avatar}</div>
                        <span>Current</span>
                      </div>
                      <div className="avatar-options-grid">
                        {avatarOptions.slice(0, 20).map((avatar, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`avatar-option-modern ${editForm.avatar === avatar ? 'selected' : ''}`}
                            onClick={() => handleInputChange('avatar', avatar)}
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                      <button 
                        type="button" 
                        className="show-more-avatars"
                        onClick={() => {
                          const grid = document.querySelector('.avatar-options-grid');
                          const isExpanded = grid.classList.contains('expanded');
                          if (isExpanded) {
                            grid.innerHTML = '';
                            avatarOptions.slice(0, 20).forEach((avatar, index) => {
                              const btn = document.createElement('button');
                              btn.type = 'button';
                              btn.className = `avatar-option-modern ${editForm.avatar === avatar ? 'selected' : ''}`;
                              btn.textContent = avatar;
                              btn.onclick = () => handleInputChange('avatar', avatar);
                              grid.appendChild(btn);
                            });
                            grid.classList.remove('expanded');
                            document.querySelector('.show-more-avatars').textContent = 'Show More Avatars';
                          } else {
                            grid.innerHTML = '';
                            avatarOptions.forEach((avatar, index) => {
                              const btn = document.createElement('button');
                              btn.type = 'button';
                              btn.className = `avatar-option-modern ${editForm.avatar === avatar ? 'selected' : ''}`;
                              btn.textContent = avatar;
                              btn.onclick = () => handleInputChange('avatar', avatar);
                              grid.appendChild(btn);
                            });
                            grid.classList.add('expanded');
                            document.querySelector('.show-more-avatars').textContent = 'Show Less';
                          }
                        }}
                      >
                        Show More Avatars
                      </button>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4>👤 Personal Information</h4>
                      <p>Update your basic profile details</p>
                    </div>
                    
                    <div className="input-group">
                      <div className="input-wrapper">
                        <label htmlFor="username" className="modern-label">
                          <span className="label-icon">👤</span>
                          <span className="label-text">Username</span>
                          <span className="required-indicator">*</span>
                        </label>
                        <input
                          type="text"
                          id="username"
                          value={editForm.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className={`modern-input ${errors.username ? 'error' : ''}`}
                          placeholder="Enter your unique username"
                          disabled={loading}
                        />
                        {errors.username && <span className="error-message-modern">{errors.username}</span>}
                        <small className="input-hint">3-20 characters, letters, numbers, and underscores only</small>
                      </div>

                      <div className="input-wrapper">
                        <label htmlFor="email" className="modern-label">
                          <span className="label-icon">📧</span>
                          <span className="label-text">Email Address</span>
                          <span className="optional-indicator">Optional</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={editForm.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`modern-input ${errors.email ? 'error' : ''}`}
                          placeholder="your.email@example.com"
                          disabled={loading}
                        />
                        {errors.email && <span className="error-message-modern">{errors.email}</span>}
                        <small className="input-hint">Used for important notifications and account recovery</small>
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4>🔒 Security Settings</h4>
                      <p>Keep your account secure</p>
                    </div>
                    
                    <div className="security-toggle">
                      <button
                        type="button"
                        className={`toggle-security-btn ${showPasswordSection ? 'active' : ''}`}
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                      >
                        <span className="toggle-icon">🔑</span>
                        <span className="toggle-text">Change Password</span>
                        <span className="toggle-arrow">{showPasswordSection ? '▼' : '▶'}</span>
                      </button>
                    </div>
                    
                    {showPasswordSection && (
                      <div className="password-section-modern">
                        <div className="password-inputs">
                          <div className="input-wrapper">
                            <label htmlFor="currentPassword" className="modern-label">
                              <span className="label-icon">🔐</span>
                              <span className="label-text">Current Password</span>
                            </label>
                            <input
                              type="password"
                              id="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                              className={`modern-input ${errors.currentPassword ? 'error' : ''}`}
                              placeholder="Enter your current password"
                              disabled={loading}
                            />
                            {errors.currentPassword && <span className="error-message-modern">{errors.currentPassword}</span>}
                          </div>

                          <div className="input-wrapper">
                            <label htmlFor="newPassword" className="modern-label">
                              <span className="label-icon">🔑</span>
                              <span className="label-text">New Password</span>
                            </label>
                            <input
                              type="password"
                              id="newPassword"
                              value={passwordForm.newPassword}
                              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                              className={`modern-input ${errors.newPassword ? 'error' : ''}`}
                              placeholder="Enter your new password"
                              disabled={loading}
                            />
                            {errors.newPassword && <span className="error-message-modern">{errors.newPassword}</span>}
                            <small className="input-hint">At least 8 characters with uppercase, lowercase, and number</small>
                          </div>

                          <div className="input-wrapper">
                            <label htmlFor="confirmPassword" className="modern-label">
                              <span className="label-icon">✅</span>
                              <span className="label-text">Confirm New Password</span>
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                              className={`modern-input ${errors.confirmPassword ? 'error' : ''}`}
                              placeholder="Confirm your new password"
                              disabled={loading}
                            />
                            {errors.confirmPassword && <span className="error-message-modern">{errors.confirmPassword}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="edit-modal-footer">
              <button 
                className="cancel-btn-modern" 
                onClick={handleCancelEdit} 
                disabled={loading}
              >
                <span className="btn-icon">❌</span>
                <span>Cancel</span>
              </button>
              <button 
                className="save-btn-modern" 
                onClick={(e) => {
                  console.log('Save button clicked');
                  e.preventDefault();
                  handleSaveProfile();
                }} 
                disabled={loading}
                type="button"
              >
                <span className="btn-icon">{loading ? '⏳' : '✅'}</span>
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP Progress */}
      <div className="vip-progress-card">
        <div className="vip-progress-header">
          <div>
            <h3>VIP Level {user.vipLevel}</h3>
            <p>{user.exp} / {user.maxExp} EXP</p>
          </div>
          <button className="view-tiers-btn" onClick={() => navigate('/vip-tiers')}>
            View All Tiers →
          </button>
        </div>
        <div className="vip-progress-bar">
          <div 
            className="vip-progress-fill" 
            style={{ width: `${(user.exp / user.maxExp) * 100}%` }}
          ></div>
        </div>
        <p className="vip-progress-text">{user.maxExp - user.exp} EXP to next level</p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📈 Statistics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📜 Activity
        </button>
        <button 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🔒 Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid-profile">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card-profile" style={{ borderLeftColor: stat.color }}>
                  <div className="stat-icon-profile" style={{ color: stat.color }}>{stat.icon}</div>
                  <div className="stat-info-profile">
                    <div className="stat-value-profile">{stat.value}</div>
                    <div className="stat-label-profile">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-card" onClick={() => navigate('/game')}>
                  <span className="action-icon">🎮</span>
                  <span className="action-label">Play Games</span>
                </button>
                <button className="action-card" onClick={() => navigate('/tasks')}>
                  <span className="action-icon">📋</span>
                  <span className="action-label">View Tasks</span>
                </button>
                <button className="action-card" onClick={() => navigate('/daily-rewards')}>
                  <span className="action-icon">🎁</span>
                  <span className="action-label">Daily Rewards</span>
                </button>
                <button className="action-card" onClick={() => navigate('/conversion')}>
                  <span className="action-icon">🔄</span>
                  <span className="action-label">Convert Cipro</span>
                </button>
                <button className="action-card" onClick={() => navigate('/referral')}>
                  <span className="action-icon">👥</span>
                  <span className="action-label">Refer Friends</span>
                </button>
                <button className="action-card" onClick={() => navigate('/leaderboard')}>
                  <span className="action-icon">🏆</span>
                  <span className="action-label">Leaderboard</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="stats-tab">
            <div className="stats-section">
              <h3>📊 Earnings Overview</h3>
              <div className="earnings-cards">
                <div className="earning-card">
                  <div className="earning-icon">◎</div>
                  <div className="earning-info">
                    <div className="earning-value">{user.balance?.sol?.toFixed(4) || '0.0000'} SOL</div>
                    <div className="earning-label">Total SOL Earned</div>
                  </div>
                </div>
                <div className="earning-card">
                  <div className="earning-icon">Ξ</div>
                  <div className="earning-info">
                    <div className="earning-value">{user.balance?.eth?.toFixed(4) || '0.0000'} ETH</div>
                    <div className="earning-label">Total ETH Earned</div>
                  </div>
                </div>
                <div className="earning-card">
                  <div className="earning-icon">💵</div>
                  <div className="earning-info">
                    <div className="earning-value">{user.balance?.usdt?.toFixed(2) || '0.00'} USDT</div>
                    <div className="earning-label">Total USDT Earned</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h3>🎮 Gaming Statistics</h3>
              <div className="gaming-stats">
                <div className="gaming-stat">
                  <span className="gaming-stat-label">Total Games Played</span>
                  <span className="gaming-stat-value">{user.completedTasks}</span>
                </div>
                <div className="gaming-stat">
                  <span className="gaming-stat-label">Win Rate</span>
                  <span className="gaming-stat-value">85%</span>
                </div>
                <div className="gaming-stat">
                  <span className="gaming-stat-label">Favorite Game</span>
                  <span className="gaming-stat-value">Puzzle Challenge</span>
                </div>
                <div className="gaming-stat">
                  <span className="gaming-stat-label">Average Cipro/Game</span>
                  <span className="gaming-stat-value">{user.completedTasks > 0 ? Math.floor(user.points / user.completedTasks) : 0}</span>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h3>📅 Activity Statistics</h3>
              <div className="activity-stats">
                <div className="activity-stat">
                  <span className="activity-stat-icon">🔥</span>
                  <div>
                    <div className="activity-stat-value">{user.dayStreak} Days</div>
                    <div className="activity-stat-label">Current Streak</div>
                  </div>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat-icon">📆</span>
                  <div>
                    <div className="activity-stat-value">Recently</div>
                    <div className="activity-stat-label">Member Since</div>
                  </div>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat-icon">⏰</span>
                  <div>
                    <div className="activity-stat-value">{user.lastClaim ? 'Today' : 'Never'}</div>
                    <div className="activity-stat-label">Last Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <div className="achievements-header">
              <h3>🏆 Your Achievements</h3>
              <p>{achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked</p>
            </div>
            <div className="achievements-grid-profile">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card-profile ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon-profile">{achievement.icon}</div>
                  <div className="achievement-name-profile">{achievement.name}</div>
                  {achievement.unlocked && <div className="achievement-badge">✓</div>}
                  {!achievement.unlocked && <div className="achievement-lock">🔒</div>}
                </div>
              ))}
            </div>
            <button className="view-all-achievements-btn" onClick={() => navigate('/achievements')}>
              View All Achievements →
            </button>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="activity-tab">
            <h3>📜 Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <div className="activity-action">{activity.action}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                  <div className="activity-points">{activity.points}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="security-tab">
            <div className="account-security">
              <h3>🔒 Account Security</h3>
              <div className="security-items">
                <div className="security-item">
                  <div className="security-item-info">
                    <div className="security-item-icon">👤</div>
                    <div className="security-item-text">
                      <div className="security-item-title">Username</div>
                      <div className="security-item-desc">Your unique identifier</div>
                    </div>
                  </div>
                  <div className="security-status secure">✓ Set</div>
                </div>

                <div className="security-item">
                  <div className="security-item-info">
                    <div className="security-item-icon">📧</div>
                    <div className="security-item-text">
                      <div className="security-item-title">Email Address</div>
                      <div className="security-item-desc">For account recovery and notifications</div>
                    </div>
                  </div>
                  <div className={`security-status ${user.email ? 'secure' : 'warning'}`}>
                    {user.email ? '✓ Verified' : '⚠ Not Set'}
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-item-info">
                    <div className="security-item-icon">🔑</div>
                    <div className="security-item-text">
                      <div className="security-item-title">Password</div>
                      <div className="security-item-desc">Secure your account access</div>
                    </div>
                  </div>
                  <div className="security-status secure">✓ Protected</div>
                </div>

                <div className="security-item">
                  <div className="security-item-info">
                    <div className="security-item-icon">🛡️</div>
                    <div className="security-item-text">
                      <div className="security-item-title">Account Status</div>
                      <div className="security-item-desc">Your account verification status</div>
                    </div>
                  </div>
                  <div className="security-status secure">✓ Active</div>
                </div>

                <div className="security-item">
                  <div className="security-item-info">
                    <div className="security-item-icon">💎</div>
                    <div className="security-item-text">
                      <div className="security-item-title">VIP Status</div>
                      <div className="security-item-desc">Your current membership level</div>
                    </div>
                  </div>
                  <div className="security-status secure">{tier.icon} {tier.name}</div>
                </div>
              </div>

              <div className="security-tips">
                <h5>🛡️ Security Tips</h5>
                <ul>
                  <li>Use a strong, unique password for your account</li>
                  <li>Add an email address for account recovery</li>
                  <li>Never share your login credentials with anyone</li>
                  <li>Log out from shared or public devices</li>
                  <li>Contact support if you notice suspicious activity</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Actions */}
      <div className="account-actions">
        <button className="action-btn-profile secondary" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? '❌ Cancel Edit' : '✏️ Edit Profile'}
        </button>
        <button className="action-btn-profile secondary" onClick={() => navigate('/notifications')}>
          🔔 Notifications
        </button>
        <button className="action-btn-profile danger" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
