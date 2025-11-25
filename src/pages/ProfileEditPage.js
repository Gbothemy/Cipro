'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareModal from '../components/ShareModal';
import './ProfileEditPage.css';

function ProfileEditPage({ user, updateUser, addNotification }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email || '',
    avatar: user.avatar
  });
  const [errors, setErrors] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);

  const avatarOptions = ['👤', '👨', '👩', '🧑', '👦', '👧', '🎮', '🎯', '⚡', '🔥', '💎', '⭐', '🏆', '👑', '🚀', '💰'];

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

  const handleAvatarSelect = (avatar) => {
    setFormData({
      ...formData,
      avatar
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Update user profile
    updateUser({
      username: formData.username,
      email: formData.email,
      avatar: formData.avatar
    });

    // Update auth user in localStorage
    const authUser = JSON.parse(localStorage.getItem('authUser'));
    if (authUser) {
      authUser.username = formData.username;
      authUser.email = formData.email;
      authUser.avatar = formData.avatar;
      localStorage.setItem('authUser', JSON.stringify(authUser));
    }

    addNotification('Profile updated successfully!', 'success');
    navigate('/benefit');
  };

  const handleCancel = () => {
    navigate('/benefit');
  };

  return (
    <div className="profile-edit-page">
      <div className="page-header">
        <h1 className="page-title">Edit Profile</h1>
        <p className="page-subtitle">Update your account information</p>
      </div>

      <div className="edit-container">
        <form onSubmit={handleSubmit} className="edit-form">
          {/* Avatar Selection */}
          <div className="form-section">
            <label className="form-label">Choose Avatar</label>
            <div className="avatar-grid">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={`avatar-option ${formData.avatar === avatar ? 'selected' : ''}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div className="form-section">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="Enter your username"
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
            <span className="form-hint">3-20 characters</span>
          </div>

          {/* Email */}
          <div className="form-section">
            <label className="form-label">Email (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
            <span className="form-hint">For account recovery and notifications</span>
          </div>

          {/* User ID (Read-only) */}
          <div className="form-section">
            <label className="form-label">User ID</label>
            <input
              type="text"
              value={user.userId}
              className="form-input readonly"
              readOnly
              disabled
            />
            <span className="form-hint">Your unique identifier (cannot be changed)</span>
          </div>

          {/* Buttons */}
          <div className="form-buttons">
            <button type="button" onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Changes
            </button>
          </div>
        </form>

        {/* Share Button */}
        <div className="share-section">
          <button 
            type="button" 
            onClick={() => setShowShareModal(true)} 
            className="share-profile-btn"
          >
            <span>🎉</span>
            <span>Share My Achievement</span>
          </button>
        </div>

        {/* Account Stats */}
        <div className="account-stats">
          <h3>Account Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Member Since</span>
              <span className="stat-value">Recently</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">VIP Level</span>
              <span className="stat-value">Level {user.vipLevel}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Points</span>
              <span className="stat-value">{user.points.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tasks Completed</span>
              <span className="stat-value">{user.completedTasks}</span>
            </div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareModal 
          user={user} 
          onClose={() => setShowShareModal(false)}
          type="achievement"
        />
      )}
    </div>
  );
}

export default ProfileEditPage;
