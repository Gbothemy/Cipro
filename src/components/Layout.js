import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import soundManager from '../utils/soundManager';
import themeManager from '../utils/themeManager';
import GoogleAd, { AdSlots } from './GoogleAd';
import './Layout.css';

function Layout({ children, user, notifications = [], onLogout, isAdmin = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled);
  const [isDarkMode, setIsDarkMode] = useState(themeManager.isDark());
  const [logoError, setLogoError] = useState(false);
  const [logoRetryCount, setLogoRetryCount] = useState(0);
  const location = useLocation();

  const toggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
    if (newState) {
      soundManager.click();
    }
  };

  const toggleTheme = () => {
    const newTheme = themeManager.toggle();
    setIsDarkMode(newTheme === 'dark');
    document.body.classList.toggle('dark-mode', newTheme === 'dark');
  };

  const navigationItems = [
    { path: '/', icon: '🎮', label: 'Mining', section: 'main' },
    { path: '/tasks', icon: '📋', label: 'Tasks', section: 'main' },
    { path: '/daily-rewards', icon: '🎁', label: 'Rewards', section: 'main' },
    { path: '/lucky-draw', icon: '🎰', label: 'Lucky Draw', section: 'earn' },
    { path: '/airdrop', icon: '🪂', label: 'Airdrop', section: 'earn' },
    { path: '/referral', icon: '👥', label: 'Referral', section: 'earn' },
    { path: '/conversion', icon: '💳', label: 'Wallet', section: 'wallet' },
    { path: '/leaderboard', icon: '🏆', label: 'Leaderboard', section: 'community' },
    { path: '/achievements', icon: '🎖️', label: 'Achievements', section: 'community' },
    { path: '/vip-tiers', icon: '💎', label: 'VIP', section: 'community' },
    { path: '/profile', icon: '👤', label: 'Profile', section: 'account' },
    { path: '/notifications', icon: '🔔', label: 'Notifications', section: 'account' },
    { path: '/faq', icon: '❓', label: 'FAQ', section: 'account' }
  ];

  const getActiveSection = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname);
    return currentItem?.section || 'main';
  };

  return (
    <div className="app-container">
      {/* Enhanced Notifications */}
      <div className="notifications-container">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification notification-${notif.type}`}>
            <div className="notification-icon">
              {notif.type === 'success' && '✅'}
              {notif.type === 'error' && '❌'}
              {notif.type === 'info' && 'ℹ️'}
              {notif.type === 'warning' && '⚠️'}
            </div>
            <div className="notification-content">
              <div className="notification-message">{notif.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Header */}
      <header className="modern-header">
        <div className="header-container">
          {/* Left Section */}
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`hamburger ${menuOpen ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            
            <Link to="/" className="brand-logo">
              {!logoError ? (
                <img 
                  src={`/ciprohub.png?v=${logoRetryCount}`}
                  alt="CIPRO" 
                  className="logo-img"
                  onError={() => setLogoError(true)}
                  onLoad={() => setLogoError(false)}
                />
              ) : (
                <div className="logo-fallback">
                  <span className="logo-text">CIPRO</span>
                  <span className="logo-tagline">Gaming</span>
                </div>
              )}
            </Link>
          </div>

          {/* Center Section - Desktop Navigation */}
          <nav className="desktop-nav">
            <div className="nav-sections">
              <div className="nav-section">
                <Link 
                  to="/" 
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  <span className="nav-icon">🎮</span>
                  <span className="nav-text">Mining</span>
                </Link>
                <Link 
                  to="/tasks" 
                  className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}
                >
                  <span className="nav-icon">📋</span>
                  <span className="nav-text">Tasks</span>
                </Link>
                <Link 
                  to="/lucky-draw" 
                  className={`nav-link ${location.pathname === '/lucky-draw' ? 'active' : ''}`}
                >
                  <span className="nav-icon">🎰</span>
                  <span className="nav-text">Lucky Draw</span>
                </Link>
                <Link 
                  to="/leaderboard" 
                  className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
                >
                  <span className="nav-icon">🏆</span>
                  <span className="nav-text">Leaderboard</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* Right Section */}
          <div className="header-right">
            <div className="user-balance">
              <div className="balance-item">
                <span className="balance-icon">💎</span>
                <span className="balance-value">{user.points.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="header-controls">
              <button 
                onClick={toggleTheme} 
                className="control-btn theme-btn"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <button 
                onClick={toggleSound} 
                className="control-btn sound-btn"
                aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>

            <div className="user-profile">
              <div className="user-avatar">{user.avatar}</div>
              <div className="user-info">
                <div className="user-name">{user.username}</div>
                <div className="user-level">Level {user.vipLevel}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="layout-wrapper">
        {/* Modern Sidebar Menu */}
        <div className={`modern-sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>
          <div className="sidebar-content">
            {/* Sidebar Header */}
            <div className="sidebar-header">
              <div className="sidebar-user">
                <div className="sidebar-avatar">{user.avatar}</div>
                <div className="sidebar-user-info">
                  <h3 className="sidebar-username">{user.username}</h3>
                  <p className="sidebar-user-id">ID: {user.userId.slice(-6)}</p>
                  <div className="sidebar-user-stats">
                    <div className="stat-item">
                      <span className="stat-icon">💎</span>
                      <span className="stat-value">{user.points.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">⭐</span>
                      <span className="stat-value">Level {user.vipLevel}</span>
                    </div>
                  </div>
                  {isAdmin && <div className="admin-badge">🛡️ Admin</div>}
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="sidebar-nav">
              {isAdmin ? (
                // Admin Navigation
                <>
                  <div className="nav-section">
                    <div className="nav-section-title">Admin Panel</div>
                    <Link 
                      to="/admin" 
                      className="nav-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">🛡️</span>
                      <span className="nav-item-text">Dashboard</span>
                    </Link>
                  </div>
                  <div className="nav-section">
                    <button 
                      onClick={() => { onLogout(); setMenuOpen(false); }} 
                      className="nav-item logout-item"
                    >
                      <span className="nav-item-icon">🚪</span>
                      <span className="nav-item-text">Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                // User Navigation
                <>
                  {/* Main Features */}
                  <div className="nav-section">
                    <div className="nav-section-title">Main Features</div>
                    <Link 
                      to="/" 
                      className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">🎮</span>
                      <span className="nav-item-text">Mining Games</span>
                      <span className="nav-item-badge">Hot</span>
                    </Link>
                    <Link 
                      to="/tasks" 
                      className={`nav-item ${location.pathname === '/tasks' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">📋</span>
                      <span className="nav-item-text">Daily Tasks</span>
                    </Link>
                    <Link 
                      to="/daily-rewards" 
                      className={`nav-item ${location.pathname === '/daily-rewards' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">🎁</span>
                      <span className="nav-item-text">Daily Rewards</span>
                    </Link>
                  </div>

                  {/* Earn More */}
                  <div className="nav-section">
                    <div className="nav-section-title">Earn More</div>
                    <Link 
                      to="/lucky-draw" 
                      className={`nav-item ${location.pathname === '/lucky-draw' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">🎰</span>
                      <span className="nav-item-text">Lucky Draw</span>
                      <span className="nav-item-badge new">New</span>
                    </Link>
                    <Link 
                      to="/airdrop" 
                      className={`nav-item ${location.pathname === '/airdrop' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">🪂</span>
                      <span className="nav-item-text">Airdrop</span>
                    </Link>
                    <Link 
                      to="/referral" 
                      className={`nav-item ${location.pathname === '/referral' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">👥</span>
                      <span className="nav-item-text">Referral Program</span>
                    </Link>
                  </div>

                  {/* Wallet & Finance */}
                  <div className="nav-section">
                    <div className="nav-section-title">Wallet</div>
                    <Link 
                      to="/conversion" 
                      className={`nav-item ${location.pathname === '/conversion' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">💳</span>
                      <span className="nav-item-text">Convert & Withdraw</span>
                    </Link>
                  </div>

                  {/* Community */}
                  <div className="nav-section">
                    <div className="nav-section-title">Community</div>
                    <Link 
                      to="/leaderboard" 
                      className={`nav-item ${location.pathname === '/leaderboard' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">🏆</span>
                      <span className="nav-item-text">Leaderboard</span>
                    </Link>
                    <Link 
                      to="/achievements" 
                      className={`nav-item ${location.pathname === '/achievements' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">🎖️</span>
                      <span className="nav-item-text">Achievements</span>
                    </Link>
                    <Link 
                      to="/vip-tiers" 
                      className={`nav-item ${location.pathname === '/vip-tiers' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">💎</span>
                      <span className="nav-item-text">VIP Tiers</span>
                    </Link>
                  </div>

                  {/* Account & Settings */}
                  <div className="nav-section">
                    <div className="nav-section-title">Account</div>
                    <Link 
                      to="/profile" 
                      className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">👤</span>
                      <span className="nav-item-text">My Profile</span>
                    </Link>
                    <Link 
                      to="/notifications" 
                      className={`nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">🔔</span>
                      <span className="nav-item-text">Notifications</span>
                      {notifications.length > 0 && (
                        <span className="nav-item-count">{notifications.length}</span>
                      )}
                    </Link>
                    <Link 
                      to="/faq" 
                      className={`nav-item ${location.pathname === '/faq' ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="nav-item-icon">❓</span>
                      <span className="nav-item-text">Help & FAQ</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="nav-section">
                    <button 
                      onClick={() => { onLogout(); setMenuOpen(false); }} 
                      className="nav-item logout-item"
                    >
                      <span className="nav-item-icon">🚪</span>
                      <span className="nav-item-text">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>

        <main className="main-content">
          {/* Google AdSense - Top Banner */}
          <GoogleAd 
            slot={AdSlots.HEADER_BANNER} 
            format="auto" 
            width={728} 
            height={90}
            style={{ maxWidth: '100%' }}
          />
          
          {children}
          
          {/* Google AdSense - Footer Banner */}
          <GoogleAd 
            slot={AdSlots.FOOTER} 
            format="auto" 
            width={728} 
            height={90}
            style={{ maxWidth: '100%' }}
          />
          
          <footer className="app-footer">
            <div className="footer-content">
              <div className="footer-brand">
                <div className="footer-logo">
                  <img 
                    src={`${process.env.PUBLIC_URL}/ciprohub.png`}
                    alt="Cipro"
                    className="footer-logo-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="footer-logo-text" style={{ display: 'none' }}>
                    <span className="footer-logo-name">CIPRO</span>
                    <span className="footer-logo-tagline">CRYPTO GAMING</span>
                  </div>
                </div>
                <p className="footer-description">
                  Play games and earn real cryptocurrency rewards including SOL, ETH, USDT, and USDC. 
                  Join thousands of players earning daily!
                </p>
                <div className="footer-social">
                  <a href="https://twitter.com/CiproGaming" target="_blank" rel="noopener noreferrer" title="Twitter">
                    🐦
                  </a>
                  <a href="https://discord.gg/cipro" target="_blank" rel="noopener noreferrer" title="Discord">
                    💬
                  </a>
                  <a href="https://t.me/CiproGaming" target="_blank" rel="noopener noreferrer" title="Telegram">
                    📱
                  </a>
                </div>
              </div>
              
              <div className="footer-links-section">
                <div className="footer-column">
                  <h4>Platform</h4>
                  <Link to="/">Mining Games</Link>
                  <Link to="/tasks">Daily Tasks</Link>
                  <Link to="/leaderboard">Leaderboard</Link>
                  <Link to="/achievements">Achievements</Link>
                </div>
                
                <div className="footer-column">
                  <h4>Earn</h4>
                  <Link to="/referral">Referral Program</Link>
                  <Link to="/airdrop">Airdrops</Link>
                  <Link to="/vip-tiers">VIP Tiers</Link>
                  <Link to="/conversion">Withdraw</Link>
                </div>
                
                <div className="footer-column">
                  <h4>Support</h4>
                  <Link to="/faq">FAQ</Link>
                  <Link to="/support">Help Center</Link>
                  <Link to="/about">About Us</Link>
                  <a href="mailto:support@ciprohub.site">Contact</a>
                </div>
                
                <div className="footer-column">
                  <h4>Legal</h4>
                  <Link to="/privacy">Privacy Policy</Link>
                  <Link to="/terms">Terms of Service</Link>
                  <Link to="/legal">Legal</Link>
                  <a href="/sitemap.xml" target="_blank">Sitemap</a>
                </div>
              </div>
            </div>
            
            <div className="footer-bottom">
              <div className="footer-bottom-content">
                <p>&copy; 2024 Cipro. All rights reserved.</p>
                <div className="footer-badges">
                  <span className="footer-badge">🔒 Secure</span>
                  <span className="footer-badge">⚡ Fast</span>
                  <span className="footer-badge">🎮 Fun</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Modern Bottom Navigation */}
      {!isAdmin && (
        <nav className="modern-bottom-nav">
          <Link 
            to="/" 
            className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <span className="nav-item-icon">🎮</span>
              <span className="nav-item-label">Mining</span>
            </div>
            {location.pathname === '/' && <div className="nav-item-indicator"></div>}
          </Link>
          
          <Link 
            to="/tasks" 
            className={`bottom-nav-item ${location.pathname === '/tasks' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <span className="nav-item-icon">📋</span>
              <span className="nav-item-label">Tasks</span>
            </div>
            {location.pathname === '/tasks' && <div className="nav-item-indicator"></div>}
          </Link>
          
          <Link 
            to="/lucky-draw" 
            className={`bottom-nav-item ${location.pathname === '/lucky-draw' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <span className="nav-item-icon">🎰</span>
              <span className="nav-item-label">Lucky</span>
            </div>
            {location.pathname === '/lucky-draw' && <div className="nav-item-indicator"></div>}
          </Link>
          
          <Link 
            to="/leaderboard" 
            className={`bottom-nav-item ${location.pathname === '/leaderboard' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <span className="nav-item-icon">🏆</span>
              <span className="nav-item-label">Ranks</span>
            </div>
            {location.pathname === '/leaderboard' && <div className="nav-item-indicator"></div>}
          </Link>
          
          <Link 
            to="/profile" 
            className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <span className="nav-item-icon">👤</span>
              <span className="nav-item-label">Profile</span>
            </div>
            {location.pathname === '/profile' && <div className="nav-item-indicator"></div>}
          </Link>
        </nav>
      )}
    </div>
  );
}

export default Layout;
