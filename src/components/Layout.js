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

  return (
    <div className="app-container">
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification ${notif.type}`}>
            {notif.type === 'success' && '✓ '}
            {notif.type === 'error' && '✗ '}
            {notif.type === 'info' && 'ℹ '}
            {notif.message}
          </div>
        ))}
      </div>
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
            <h1 className="header-title">💎 Cipro</h1>
          </div>
          <div className="header-right">
            <button onClick={toggleTheme} className="theme-toggle" title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={toggleSound} className="sound-toggle" title={soundEnabled ? 'Sound On' : 'Sound Off'}>
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <div className="user-info">
              <div className="user-details">
                <span className="user-name">{user.username}</span>
                <span className="user-points">{user.points.toLocaleString()} CIPRO</span>
              </div>
              <div className="user-avatar">{user.avatar}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="layout-wrapper">
        {/* Desktop Sidebar - Hidden */}
        <aside className="sidebar desktop-only" style={{ display: 'none' }}>
          <div className="sidebar-header">
            <div className="sidebar-avatar">{user.avatar}</div>
            <div className="sidebar-user-info">
              <h3>{user.username}</h3>
              <p>{user.userId}</p>
            </div>
          </div>
          <nav className="sidebar-nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <span className="nav-icon">🎮</span>
              <span className="nav-text">Game Mining</span>
            </Link>
            <Link to="/airdrop" className={location.pathname === '/airdrop' ? 'active' : ''}>
              <span className="nav-icon">🎁</span>
              <span className="nav-text">Airdrop</span>
            </Link>
            <Link to="/referral" className={location.pathname === '/referral' ? 'active' : ''}>
              <span className="nav-icon">💰</span>
              <span className="nav-text">Referral</span>
            </Link>
            <Link to="/leaderboard" className={location.pathname === '/leaderboard' ? 'active' : ''}>
              <span className="nav-icon">🏆</span>
              <span className="nav-text">Leaderboard</span>
            </Link>
            <Link to="/conversion" className={location.pathname === '/conversion' ? 'active' : ''}>
              <span className="nav-icon">🔄</span>
              <span className="nav-text">Convert & Withdraw</span>
            </Link>
            <div className="nav-divider"></div>
            <Link to="/" className="nav-secondary">
              <span className="nav-icon">🧩</span>
              <span className="nav-text">Puzzle Mining</span>
            </Link>
            <Link to="/" className="nav-secondary">
              <span className="nav-icon">📹</span>
              <span className="nav-text">Video Mining</span>
            </Link>
            <Link to="/" className="nav-secondary">
              <span className="nav-icon">🎯</span>
              <span className="nav-text">Mini-Games</span>
            </Link>
            <Link to="/" className="nav-secondary">
              <span className="nav-icon">🎰</span>
              <span className="nav-text">Spin Mining</span>
            </Link>
            <div className="nav-divider"></div>
            <Link to="/" className="nav-secondary">
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </Link>
            <button onClick={onLogout} className="nav-secondary logout-btn">
              <span className="nav-icon">🚪</span>
              <span className="nav-text">Logout</span>
            </button>
          </nav>
        </aside>

        {/* Hamburger Menu - All Views */}
        {menuOpen && (
          <div className="side-menu">
            <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
            <div className="menu-content">
              <div className="menu-header">
                <div className="menu-avatar">{user.avatar}</div>
                <div className="menu-user-info">
                  <h3>{user.username}</h3>
                  <p>{user.userId}</p>
                  {isAdmin && <span className="admin-badge">🛡️ Admin</span>}
                </div>
              </div>
              <nav className="menu-nav">
                {isAdmin ? (
                  // Admin Menu
                  <>
                    <div className="menu-section-title">🛡️ Admin Panel</div>
                    <Link to="/admin" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <button onClick={() => { onLogout(); setMenuOpen(false); }} className="menu-logout-btn">
                      🚪 Logout
                    </button>
                  </>
                ) : (
                  // User Menu
                  <>
                    {/* Account Section */}
                    <div className="menu-section-title">👤 Account</div>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>👤 My Profile</Link>
                    <button onClick={() => { onLogout(); setMenuOpen(false); }} className="menu-logout-btn">
                      🚪 Logout
                    </button>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Earnings & Mining Section */}
                    <div className="menu-section-title">💰 Earnings & Mining</div>
                    <Link to="/" onClick={() => setMenuOpen(false)}>🎮 Game Mining</Link>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Rewards & Bonuses Section */}
                    <div className="menu-section-title">🎁 Rewards & Bonuses</div>
                    <Link to="/daily-rewards" onClick={() => setMenuOpen(false)}>Daily Rewards</Link>
                    <Link to="/tasks" onClick={() => setMenuOpen(false)}>📋 Tasks & Missions</Link>
                    <Link to="/airdrop" onClick={() => setMenuOpen(false)}>Airdrop</Link>
                    <Link to="/referral" onClick={() => setMenuOpen(false)}>Referral</Link>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Finance Section */}
                    <div className="menu-section-title">💳 Finance</div>
                    <Link to="/conversion" onClick={() => setMenuOpen(false)}>Convert & Withdraw</Link>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Community Section */}
                    <div className="menu-section-title">🏆 Community</div>
                    <Link to="/leaderboard" onClick={() => setMenuOpen(false)}>Leaderboard</Link>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Progress & Stats Section */}
                    <div className="menu-section-title">📊 Progress & Stats</div>
                    <Link to="/achievements" onClick={() => setMenuOpen(false)}>Achievements</Link>
                    <Link to="/vip-tiers" onClick={() => setMenuOpen(false)}>💎 VIP Tiers</Link>
                    <Link to="/notifications" onClick={() => setMenuOpen(false)}>🔔 Notifications</Link>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Help & Support Section */}
                    <div className="menu-section-title">❓ Help & Support</div>
                    <Link to="/faq" onClick={() => setMenuOpen(false)}>FAQ</Link>
                    
                  </>
                )}
              </nav>
            </div>
          </div>
        )}

        <main className="main-content">
          {/* Google AdSense - Top Banner */}
          <GoogleAd slot={AdSlots.HEADER_BANNER} format="horizontal" />
          
          {children}
          
          {/* Google AdSense - Footer Banner */}
          <GoogleAd slot={AdSlots.FOOTER} format="horizontal" />
          
          <footer className="footer desktop-only">
            <p>&copy; 2024 Cipro. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Support</a>
            </div>
          </footer>
        </main>
      </div>

      {/* Bottom Navigation - All Screens */}
      {!isAdmin && (
        <nav className="bottom-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            <span className="nav-icon">🎮</span>
            <span className="nav-label">MINING</span>
          </Link>
          <Link to="/tasks" className={location.pathname === '/tasks' ? 'active' : ''}>
            <span className="nav-icon">📋</span>
            <span className="nav-label">TASKS</span>
          </Link>
          <Link to="/leaderboard" className={location.pathname === '/leaderboard' ? 'active' : ''}>
            <span className="nav-icon">🏆</span>
            <span className="nav-label">RANKS</span>
          </Link>
          <Link to="/notifications" className={location.pathname === '/notifications' ? 'active' : ''}>
            <span className="nav-icon">🔔</span>
            <span className="nav-label">ALERTS</span>
          </Link>
          <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">ACCOUNT</span>
          </Link>
        </nav>
      )}
    </div>
  );
}

export default Layout;
