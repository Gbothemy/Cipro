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
            <div className="header-logo">
              {!logoError ? (
                <img 
                  src="/ciprohub.png"
                  alt="CIPRO" 
                  className="logo-image"
                  onError={(e) => {
                    console.log('Direct path failed, trying with PUBLIC_URL');
                    if (!e.target.src.includes('PUBLIC_URL')) {
                      e.target.src = `${process.env.PUBLIC_URL}/ciprohub.png`;
                    } else if (!e.target.src.includes('.svg')) {
                      e.target.src = `${process.env.PUBLIC_URL}/cipro-logo.svg`;
                    } else if (!e.target.src.includes('backup')) {
                      e.target.src = `${process.env.PUBLIC_URL}/cipro-logo-backup.svg`;
                    } else {
                      console.log('All logo attempts failed, using text fallback');
                      setLogoError(true);
                    }
                  }}
                  onLoad={() => {
                    console.log('Logo loaded successfully');
                  }}
                />
              ) : (
                <div className="logo-text-container">
                  <span className="logo-text">CIPRO</span>
                  <span className="logo-subtitle">CRYPTO GAMING</span>
                </div>
              )}
            </div>
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

        {/* Hamburger Menu - All Views */}
        {menuOpen && (
          <div className="side-menu">
            <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
            <div className="menu-content">
              <div className="menu-header">
                <div className="menu-logo">
                  <img 
                    src={`${process.env.PUBLIC_URL}/ciprohub.png`}
                    alt="Cipro"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
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
                    {/* Main Features */}
                    <div className="menu-section-title">⭐ Main</div>
                    <Link to="/" onClick={() => setMenuOpen(false)}>🎮 Mining Games</Link>
                    <Link to="/tasks" onClick={() => setMenuOpen(false)}>📋 Tasks</Link>
                    <Link to="/daily-rewards" onClick={() => setMenuOpen(false)}>🎁 Daily Rewards</Link>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Earn More */}
                    <div className="menu-section-title">💰 Earn More</div>
                    <Link to="/airdrop" onClick={() => setMenuOpen(false)}>🎁 Airdrop</Link>
                    <Link to="/referral" onClick={() => setMenuOpen(false)}>👥 Referral</Link>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Wallet */}
                    <div className="menu-section-title">💳 Wallet</div>
                    <Link to="/conversion" onClick={() => setMenuOpen(false)}>🔄 Convert & Withdraw</Link>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Community & Progress */}
                    <div className="menu-section-title">🏆 Community</div>
                    <Link to="/leaderboard" onClick={() => setMenuOpen(false)}>🏆 Leaderboard</Link>
                    <Link to="/achievements" onClick={() => setMenuOpen(false)}>🎖️ Achievements</Link>
                    <Link to="/vip-tiers" onClick={() => setMenuOpen(false)}>💎 VIP Tiers</Link>
                    
                    <div className="nav-divider"></div>
                    
                    {/* Account & Settings */}
                    <div className="menu-section-title">⚙️ Settings</div>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>👤 My Profile</Link>
                    <Link to="/notifications" onClick={() => setMenuOpen(false)}>🔔 Notifications</Link>
                    <Link to="/faq" onClick={() => setMenuOpen(false)}>❓ FAQ</Link>
                    <button onClick={() => { onLogout(); setMenuOpen(false); }} className="menu-logout-btn">
                      🚪 Logout
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        )}

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
