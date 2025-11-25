import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import GamePage from './pages/GamePage';
import AirdropPage from './pages/AirdropPage';
import ReferralPage from './pages/ReferralPage';
import BenefitPage from './pages/BenefitPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfileEditPage from './pages/ProfileEditPage';
import ConversionPage from './pages/ConversionPage';
import AdminPage from './pages/AdminPage';
import './App.css';

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
      ton: 0,
      cati: 0,
      usdt: 0
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
      ton: 0,
      cati: 0,
      usdt: 0
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
        
        // Load user game data
        const savedUser = localStorage.getItem(`rewardGameUser_${parsedAuthUser.userId}`);
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser({
            ...parsedUser,
            username: parsedAuthUser.username,
            userId: parsedAuthUser.userId,
            avatar: parsedAuthUser.avatar,
            email: parsedAuthUser.email
          });
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  // Save user data to localStorage whenever it changes (per user)
  useEffect(() => {
    if (user.userId) {
      localStorage.setItem(`rewardGameUser_${user.userId}`, JSON.stringify(user));
    }
  }, [user]);

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

  const handleLogin = (userData, navigate) => {
    setAuthUser(userData);
    setIsAuthenticated(true);
    
    // Check if user is admin
    const isAdmin = userData.userId?.startsWith('ADMIN-') || userData.email?.endsWith('@admin.com');
    
    // Load saved game data if exists, otherwise start fresh
    const savedUser = localStorage.getItem(`rewardGameUser_${userData.userId}`);
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser({
        ...parsedUser,
        username: userData.username,
        userId: userData.userId,
        avatar: userData.avatar,
        email: userData.email,
        isAdmin: isAdmin
      });
      addNotification(`Welcome back, ${userData.username}!`, 'success');
    } else {
      // New user - start from zero
      setUser({
        username: userData.username,
        userId: userData.userId,
        avatar: userData.avatar,
        email: userData.email || '',
        isAdmin: isAdmin,
        balance: { ton: 0, cati: 0, usdt: 0 },
        points: 0,
        vipLevel: 1,
        exp: 0,
        maxExp: 1000,
        giftPoints: 0,
        completedTasks: 0,
        dayStreak: 0,
        lastClaim: null,
        totalEarnings: { ton: 0, cati: 0, usdt: 0 }
      });
      addNotification(`Welcome to Reward Game, ${userData.username}!`, 'success');
    }
    
    // Redirect admins to admin panel, regular users to game page
    if (navigate) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/game');
      }
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
      {!isAuthenticated ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/admin/login" element={<AdminLoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout user={user} notifications={notifications} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<GamePage user={user} updateUser={updateUser} addNotification={addNotification} />} />
            <Route path="/game" element={<GamePage user={user} updateUser={updateUser} addNotification={addNotification} />} />
            <Route path="/airdrop" element={<AirdropPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
            <Route path="/referral" element={<ReferralPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
            <Route path="/benefit" element={<BenefitPage user={user} updateUser={updateUser} addNotification={addNotification} onLogout={handleLogout} />} />
            <Route path="/leaderboard" element={<LeaderboardPage user={user} />} />
            <Route path="/profile/edit" element={<ProfileEditPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
            <Route path="/conversion" element={<ConversionPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
            <Route path="/admin" element={<AdminPage user={user} updateUser={updateUser} addNotification={addNotification} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;
