'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useStore from '../app/store/useStore';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { path: '/game',         icon: '🎮', label: 'Games' },
  { path: '/tasks',        icon: '📋', label: 'Tasks' },
  { path: '/conversion',   icon: '💳', label: 'Wallet' },
  { path: '/leaderboard',  icon: '🏆', label: 'Leaderboard' },
  { path: '/daily-rewards',icon: '🎁', label: 'Daily' },
  { path: '/referral',     icon: '👥', label: 'Invite' },
  { path: '/achievements', icon: '🎖️', label: 'Achievements' },
  { path: '/profile',      icon: '👤', label: 'Profile' },
  { path: '/faq',          icon: '❓', label: 'Help' },
];

const BOTTOM_NAV = [
  { path: '/game',        icon: '🎮', label: 'Games' },
  { path: '/tasks',       icon: '📋', label: 'Tasks' },
  { path: '/leaderboard', icon: '🏆', label: 'Board' },
  { path: '/conversion',  icon: '💳', label: 'Wallet' },
  { path: '/profile',     icon: '👤', label: 'Profile' },
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    logout();
    document.cookie = 'cipro-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  return (
    <div className={styles.appShell}>
      {/* ── Header ── */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.headerInner}>
          <Link href="/game" className={styles.logo}>
            <div className={styles.logoIcon}>💎</div>
            <span className={styles.logoText}>Cipro</span>
          </Link>

          <nav className={styles.desktopNav}>
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${pathname === item.path ? styles.navLinkActive : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className={styles.headerRight}>
            <div className={styles.pointsBadge}>
              <span>💎</span>
              <span>{(user?.points || 0).toLocaleString()}</span>
            </div>
            <button onClick={() => router.push('/profile')} className={styles.avatarBtn}>
              {user?.avatar || '👤'}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={styles.hamburger}
              aria-label="Toggle menu"
            >
              <span className={`${styles.bar} ${menuOpen ? styles.barTop : ''}`} />
              <span className={`${styles.bar} ${menuOpen ? styles.barMid : ''}`} />
              <span className={`${styles.bar} ${menuOpen ? styles.barBot : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Sidebar ── */}
      {menuOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setMenuOpen(false)}>
          <div className={styles.sidebar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sidebarUser}>
              <div className={styles.sidebarAvatar}>{user?.avatar || '👤'}</div>
              <div>
                <p className={styles.sidebarName}>{user?.username}</p>
                <p className={styles.sidebarPts}>{(user?.points || 0).toLocaleString()} pts</p>
              </div>
            </div>
            <nav className={styles.sidebarNav}>
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`${styles.sidebarLink} ${pathname === item.path ? styles.sidebarLinkActive : ''}`}
                >
                  <span className={styles.sidebarIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className={styles.sidebarFooter}>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className={styles.main}>{children}</main>

      {/* ── Bottom Nav ── */}
      <nav className={styles.bottomNav}>
        {BOTTOM_NAV.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`${styles.bottomNavItem} ${pathname === item.path ? styles.bottomNavActive : ''}`}
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
