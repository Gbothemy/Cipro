import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import CiproLoader from './components/CiproLoader';
// Temporarily comment out PerformanceOptimizer to debug
// import PerformanceOptimizer from './components/PerformanceOptimizer';
import { db } from './db/supabase';
// Temporarily comment out utilities to debug
// import trafficTracker from './utils/trafficTracker';
// import { initializeAnalytics } from './utils/analytics';
// import { initializeSEO } from './utils/seoOptimization';
import './App.css';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const AirdropPage = lazy(() => import('./pages/AirdropPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const LuckyDrawPage = lazy(() => import('./pages/LuckyDrawPage'));
// Benefits page removed as per requirements
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ConversionPage = lazy(() => import('./pages/ConversionPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const DailyRewardsPage = lazy(() => import('./pages/DailyRewardsPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const VIPTiersPage = lazy(() => import('./pages/VIPTiersPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

// Component to track route changes
function RouteTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Track page view on route change - debugging mode
    // trafficTracker.onPageChange(); // Temporarily commented out
    console.log('Route changed to:', location.pathname);
  }, [location]);
  
  return null;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    // Initialize SEO and Analytics with error handling
    try {
      // initializeSEO(); // Temporarily commented out
      // initializeAnalytics({
      //   ga4MeasurementId: process.env.REACT_APP_GA4_MEASUREMENT_ID,
      //   facebookPixelId: process.env.REACT_APP_FACEBOOK_PIXEL_ID
      // }); // Temporarily commented out
      console.log('Analytics initialization skipped for debugging');
    } catch (error) {
      console.error('Error initializing analytics:', error);
    }

    const savedAuthUser = localStorage.getItem('authUser');
    if (savedAuthUser) {
      try {
        const parsedAuthUser = JSON.parse(savedAuthUser);
        setIsAuthenticated(true);
        
        // Update user state with the logged-in user's data
        setUser(prevUser => ({
          ...prevUser,
          userId: parsedAuthUser.userId,
          username: parsedAuthUser.username,
          email: parsedAuthUser.email || '',
          avatar: parsedAuthUser.avatar || '👤'
        }));
        
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
        setUser(prevUser => ({
          ...prevUser,
          ...userData,
          userId: userId // Ensure userId is properly set
        }));
      } else {
        console.log('User not found in database, will be created on next login');
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
    setIsAuthenticated(true);
    
    // Check if user is admin - fix the admin detection logic
    const isAdmin = userData.userId?.startsWith('ADMIN-') || 
                   userData.email?.endsWith('@admin.com') || 
                   userData.email?.endsWith('@ciprohub.site') ||
                   userData.isAdmin === true;
    
    try {
      // Check if user exists in database
      let dbUser = await db.getUser(userData.userId);
      
      if (dbUser) {
        // Existing user - load their data and preserve admin status
        const userWithAdminStatus = { 
          ...dbUser, 
          isAdmin: isAdmin || dbUser.isAdmin,
          userId: userData.userId // Ensure userId is properly set
        };
        setUser(userWithAdminStatus);
        addNotification(`Welcome back, ${userData.username}!`, 'success');
        
        // Update "Daily Login" task progress (only for non-admin users)
        if (!isAdmin) {
          try {
            const allTasks = await db.getTasks('daily');
            const loginTask = allTasks.find(t => t.task_name === 'Daily Login');
            if (loginTask) {
              await db.updateTaskProgress(userData.userId, loginTask.id, 1);
            }
          } catch (taskError) {
            console.error('Error updating login task:', taskError);
          }
        }
      } else {
        // New user - create in database
        const newUser = await db.createUser({
          user_id: userData.userId,
          username: userData.username,
          email: userData.email || '',
          avatar: userData.avatar,
          is_admin: isAdmin
        });
        const userWithAdminStatus = { 
          ...newUser, 
          isAdmin: isAdmin || newUser.isAdmin,
          userId: userData.userId // Ensure userId is properly set
        };
        setUser(userWithAdminStatus);
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
    setIsAuthenticated(false);
    addNotification('Logged out successfully', 'info');
  };

  return (
    <HelmetProvider>
      {/* <PerformanceOptimizer /> Temporarily commented out for debugging */}
      <Router>
        <RouteTracker />
      <Suspense fallback={
        <CiproLoader 
          context="default"
          size="large" 
          message="Loading Cipro Hub..." 
          fullScreen={true}
        />
      }>
        {!isAuthenticated ? (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/admin/login" element={<AdminLoginPage onLogin={handleLogin} />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (() => {
          // Debug logging
          console.log('Routing decision - User:', user);
          console.log('Is Admin?', user?.isAdmin);
          return user?.isAdmin;
        })() ? (
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
              <Route path="/lucky-draw" element={<LuckyDrawPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              {/* Benefits page removed */}
              <Route path="/leaderboard" element={<LeaderboardPage user={user} />} />
              <Route path="/conversion" element={<ConversionPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/daily-rewards" element={<DailyRewardsPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/achievements" element={<AchievementsPage user={user} addNotification={addNotification} />} />
              <Route path="/vip-tiers" element={<VIPTiersPage user={user} addNotification={addNotification} />} />
              <Route path="/notifications" element={<NotificationsPage user={user} addNotification={addNotification} />} />
              <Route path="/tasks" element={<TasksPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
              <Route path="/profile" element={<ProfilePage user={user} updateUser={updateUser} addNotification={addNotification} onLogout={handleLogout} />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        )}
      </Suspense>
    </Router>
    </HelmetProvider>
  );
}

export default App;
