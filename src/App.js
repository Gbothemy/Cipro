import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { db } from './db/supabase';
import './App.css';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const AirdropPage = lazy(() => import('./pages/AirdropPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
// Benefits page removed as per requirements
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'));
const ConversionPage = lazy(() => import('./pages/ConversionPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const DailyRewardsPage = lazy(() => import('./pages/DailyRewardsPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const VIPTiersPage = lazy(() => import('./pages/VIPTiersPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [user, setUser] = useState({
    username: 'Player123',
    userId: 'USR-98765',
    avatar: '👤',
    email: '',
    isAdmin: false,
    balance: {
      sol: 0,
      eth: 0,
      usdt: 0,
      usdc: 0
    },
    points: 0,
    vipLevel: 1,
    exp: 0,
    maxExp: 1000,
    giftPoints: 0,
    completedTasks: 0,
    dayStreak: 0,
    lastClaim: null,
    totalEarnings: {
      sol: 0,
      eth: 0,
      usdt: 0,
      usdc: 0
    }
  });

  const [notifications, setNotifications] = useState([]);

  // Check authentication on mount and restore session
  useEffect(() => {
    const savedAuthUser = localStorage.getItem('authUser');
    if (savedAuthUser) {
      try {
        const parsedAuthUser = JSON.parse(savedAuthUser);
        setAuthUser(parsedAuthUser);
        setIsAuthenticated(true);
        
        // Load user data from Supabase
        loadUserFromDatabase(parsedAuthUser.userId).catch(err => {
          console.error('Failed to load user from database:', err);
        });
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  // Load user data from Supabase
  const loadUserFromDatabase = async (userId) => {
    try {
      const userData = await db.getUser(userId);
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user from database:', error);
    }
  };

  // Note: User data is saved to database by individual pages when actions occur
  // This prevents excessive database writes on every state change

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const handleLogin = async (userData, navigate) => {
    setAuthUser(userData);
    setIsAuthenticated(true);
    
    // Check if user is admin
    const isAdmin = userData.userId?.startsWith('ADMIN-') || userData.email?.endsWith('@admin.com');
    
    try {
      // Check if user exists in database
      let dbUser = await db.getUser(userData.userId);
      
      if (dbUser) {
        // Existing user - load their data
        setUser(dbUser);
        addNotification(`Welcome back, ${userData.username}!`, 'success');
      } else {
        // New user - create in database
        const newUser = await db.createUser({
          user_id: userData.userId,
          username: userData.username,
          email: userData.email || '',
          avatar: userData.avatar,
          is_admin: isAdmin
        });
        setUser(newUser);
        addNotification(`Welcome to Cipro, ${userData.username}!`, 'success');
      }
      
      // Redirect admins to admin panel, regular users to game page
      if (navigate) {
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/game');
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      addNotification('Error loading user data', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    setAuthUser(null);
    setIsAuthenticated(false);
    addNotification('Logged out successfully', 'info');
  };

  return (
    <Router>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>Loading...</div>}>
        {!isAuthenticated ? (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/admin/login" element={<AdminLoginPage onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : user.isAdmin ? (
          // Admin Layout - Only Admin Panel
          <Layout user={user} notifications={notifications} onLogout={handleLogout} isAdmin={true}>
            <Routes>
              <Route path="/admin" element={<AdminPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Layout>
        ) : (
          // User Layout - Full Dashboard
          <Layout user={user} notifications={notifications} onLogout={handleLogout} isAdmin={false}>
            <Routes>
              <Route path="/" element={<GamePage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/game" element={<GamePage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/airdrop" element={<AirdropPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/referral" element={<ReferralPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              {/* Benefits page removed */}
              <Route path="/leaderboard" element={<LeaderboardPage user={user} />} />
              <Route path="/profile/edit" element={<ProfileEditPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/conversion" element={<ConversionPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/daily-rewards" element={<DailyRewardsPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/achievements" element={<AchievementsPage user={user} addNotification={addNotification} />} />
              <Route path="/vip-tiers" element={<VIPTiersPage user={user} />} />
              <Route path="/notifications" element={<NotificationsPage user={user} addNotification={addNotification} />} />
              <Route path="/tasks" element={<TasksPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/profile" element={<ProfilePage user={user} updateUser={updateUser} addNotification={addNotification} onLogout={handleLogout} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        )}
      </Suspense>
    </Router>
  );
}

export default App;
