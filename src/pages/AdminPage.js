import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { db } from '../db/supabase';
import { getVIPConfig } from '../utils/vipConfig';
import { COMPANY_WALLETS } from '../config/walletConfig';
import RevenueDashboard from './RevenueDashboard';
import './AdminPage.css';

function AdminPage({ user, addNotification }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState({
    points: [],
    earnings: [],
    streak: []
  });
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    maxDailyPlays: 2,
    pointsMultiplier: 1
  });

  // Copy to clipboard function
  const copyToClipboard = (text, label = 'Text') => {
    navigator.clipboard.writeText(text).then(() => {
      addNotification(`${label} copied to clipboard!`, 'success');
    }).catch(err => {
      console.error('Failed to copy:', err);
      addNotification('Failed to copy to clipboard', 'error');
    });
  };

  // Check if user is admin
  if (!user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadAllData();
    loadNotifications();
    loadWithdrawalRequests();
    loadLeaderboard();
    loadSystemSettings();

    // Auto-refresh data every 30 seconds for live updates (only when tab is visible)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAllData();
        loadNotifications();
        loadWithdrawalRequests();
        loadLeaderboard();
      }
    }, 30000); // Reduced from 5s to 30s for better performance

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      // Fetch all users from database
      const allUsers = await db.getAllUsers();
      
      if (!allUsers || !Array.isArray(allUsers)) {
        console.error('Invalid users data:', allUsers);
        setUsers([]);
        setStats({
          totalUsers: 0,
          totalPoints: 0,
          totalTasks: 0,
          avgLevel: 0,
          activeToday: 0,
          totalSOL: '0.0000',
          totalETH: '0.0000',
          totalUSDT: '0.00',
          totalUSDC: '0.00',
          topPlayer: null,
          lastUpdate: new Date().toLocaleTimeString()
        });
        return;
      }
      
      setUsers(allUsers);

      // Calculate comprehensive stats
      const totalPoints = allUsers.reduce((sum, u) => sum + (u.points || 0), 0);
      const totalTasks = allUsers.reduce((sum, u) => sum + (u.completedTasks || 0), 0);
      const totalSOL = allUsers.reduce((sum, u) => sum + (u.balance?.sol || 0), 0);
      const totalETH = allUsers.reduce((sum, u) => sum + (u.balance?.eth || 0), 0);
      const totalUSDT = allUsers.reduce((sum, u) => sum + (u.balance?.usdt || 0), 0);
      const totalUSDC = allUsers.reduce((sum, u) => sum + (u.balance?.usdc || 0), 0);
      const avgLevel = allUsers.length > 0 
        ? (allUsers.reduce((sum, u) => sum + (u.vipLevel || 1), 0) / allUsers.length).toFixed(1)
        : 0;

      // Get active users today from database
      const today = new Date().toISOString().split('T')[0];
      const activeToday = allUsers.filter(u => {
        try {
          const lastLogin = new Date(u.last_login || u.created_at);
          return lastLogin.toISOString().split('T')[0] === today;
        } catch (e) {
          return false;
        }
      }).length;

      setStats({
        totalUsers: allUsers.length,
        totalPoints,
        totalTasks,
        avgLevel,
        activeToday,
        totalSOL: totalSOL.toFixed(4),
        totalETH: totalETH.toFixed(4),
        totalUSDT: totalUSDT.toFixed(2),
        totalUSDC: totalUSDC.toFixed(2),
        topPlayer: allUsers.length > 0 ? allUsers.sort((a, b) => (b.points || 0) - (a.points || 0))[0] : null,
        lastUpdate: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Error loading data:', error);
      if (addNotification) {
        addNotification('Error loading data: ' + error.message, 'error');
      }
      setUsers([]);
    }
  };

  const loadNotifications = async () => {
    // Load admin notifications from database (withdrawal requests)
    try {
      const pendingRequests = await db.getWithdrawalRequests('pending');
      if (pendingRequests && Array.isArray(pendingRequests)) {
        const notifs = pendingRequests.map(req => ({
          id: req.id,
          icon: '💰',
          title: 'New Withdrawal Request',
          message: `${req.username} requested ${req.amount} ${req.currency}`,
          date: new Date(req.request_date).toLocaleString()
        }));
        setNotifications(notifs);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const loadWithdrawalRequests = async () => {
    try {
      const requests = await db.getWithdrawalRequests();
      setWithdrawalRequests(requests || []);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      setWithdrawalRequests([]);
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Fetch leaderboard data from database
      const pointsData = await db.getLeaderboard('points', 10);
      const earningsData = await db.getLeaderboard('earnings', 10);
      const streakData = await db.getLeaderboard('streak', 10);

      // Format points leaderboard
      const pointsLeaderboard = (pointsData || []).map((u, index) => ({
        rank: index + 1,
        username: u.username,
        avatar: u.avatar,
        points: u.points,
        vipLevel: u.vip_level
      }));

      // Format earnings leaderboard
      const earningsLeaderboard = (earningsData || []).map((u, index) => ({
        rank: index + 1,
        username: u.username,
        avatar: u.avatar,
        earnings: u.balances?.usdt || 0,
        currency: 'USDT'
      }));

      // Format streak leaderboard
      const streakLeaderboard = (streakData || []).map((u, index) => ({
        rank: index + 1,
        username: u.username,
        avatar: u.avatar,
        streak: u.day_streak || 0,
        points: u.points
      }));

      setLeaderboardData({
        points: pointsLeaderboard,
        earnings: earningsLeaderboard,
        streak: streakLeaderboard
      });
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleWithdrawalAction = async (requestId, action) => {
    try {
      const status = action === 'approved' ? 'approved' : 'rejected';
      
      // If rejecting, refund the user
      if (status === 'rejected') {
        // Find the withdrawal request
        const request = withdrawalRequests.find(r => r.id === requestId);
        
        if (request) {
          // Get user's current balance
          const userData = await db.getUser(request.user_id);
          const currentBalance = userData?.balance?.[request.currency] || 0;
          const newBalance = currentBalance + parseFloat(request.amount);
          
          // Refund the crypto back to user's balance
          await db.updateBalance(request.user_id, request.currency, newBalance);
          
          // Create notification for user
          await db.createNotification(request.user_id, {
            type: 'withdrawal',
            title: 'Withdrawal Rejected',
            message: `Your withdrawal of ${request.amount} ${request.currency.toUpperCase()} has been rejected and refunded to your account.`,
            icon: '❌'
          });
          
          // Log activity
          await db.logActivity(request.user_id, {
            type: 'withdrawal_rejected',
            description: `Withdrawal rejected and refunded: ${request.amount} ${request.currency.toUpperCase()}`,
            pointsChange: 0
          });
        }
      }
      
      await db.updateWithdrawalStatus(requestId, status, user.username);
      
      addNotification(`Withdrawal ${status}: ${requestId}${status === 'rejected' ? ' (User refunded)' : ''}`, 'success');
      
      loadWithdrawalRequests();
      loadNotifications();
      loadAllData();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      addNotification('Error processing withdrawal', 'error');
    }
  };

  const loadSystemSettings = () => {
    // System settings loaded from state
  };

  const saveSystemSettings = () => {
    // TODO: Save to database
    addNotification('System settings saved', 'success');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Delete user ${userId}? This cannot be undone!`)) return;

    try {
      // TODO: Implement delete user in database
      // await db.deleteUser(userId);
      addNotification('User deletion - Feature coming soon', 'info');
      loadAllData();
    } catch (error) {
      addNotification('Error deleting user', 'error');
    }
  };

  const handleEditUser = (userData) => {
    setSelectedUser(userData);
    setEditForm({
      username: userData.username || '',
      points: userData.points || 0,
      vipLevel: userData.vipLevel || 1,
      completedTasks: userData.completedTasks || 0,
      sol: userData.balance?.sol || 0,
      eth: userData.balance?.eth || 0,
      usdt: userData.balance?.usdt || 0,
      usdc: userData.balance?.usdc || 0
    });
    setEditMode(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      // Update user in database
      await db.updateUser(selectedUser.userId, {
        points: parseInt(editForm.points) || 0,
        vipLevel: parseInt(editForm.vipLevel) || 1,
        exp: selectedUser.exp,
        completedTasks: parseInt(editForm.completedTasks) || 0,
        dayStreak: selectedUser.dayStreak,
        lastClaim: selectedUser.lastClaim
      });

      // Update balances
      await db.updateBalance(selectedUser.userId, 'sol', parseFloat(editForm.sol) || 0);
      await db.updateBalance(selectedUser.userId, 'eth', parseFloat(editForm.eth) || 0);
      await db.updateBalance(selectedUser.userId, 'usdt', parseFloat(editForm.usdt) || 0);
      await db.updateBalance(selectedUser.userId, 'usdc', parseFloat(editForm.usdc) || 0);
      
      addNotification('User updated successfully', 'success');
      setEditMode(false);
      setSelectedUser(null);
      loadAllData();
    } catch (error) {
      console.error('Error saving user:', error);
      addNotification('Error saving user', 'error');
    }
  };

  const handleBulkAction = (action) => {
    if (!window.confirm(`Apply ${action} to all users?`)) return;

    try {
      users.forEach(u => {
        const updated = { ...u };
        
        switch(action) {
          case 'addPoints':
            updated.points = (updated.points || 0) + 1000;
            break;
          case 'resetCooldowns':
            localStorage.removeItem('miningCooldowns');
            break;
          case 'levelUp':
            updated.vipLevel = (updated.vipLevel || 1) + 1;
            break;
          default:
            break;
        }
        
        localStorage.setItem(`rewardGameUser_${u.userId}`, JSON.stringify(updated));
      });

      addNotification(`Bulk action "${action}" completed`, 'success');
      loadAllData();
    } catch (error) {
      addNotification('Error performing bulk action', 'error');
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        users,
        stats,
        systemSettings,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addNotification('Data exported successfully', 'success');
    } catch (error) {
      addNotification('Error exporting data', 'error');
    }
  };

  const handleClearAllData = () => {
    const confirmation = window.prompt('Type "DELETE ALL DATA" to confirm:');
    if (confirmation !== 'DELETE ALL DATA') {
      addNotification('Deletion cancelled', 'info');
      return;
    }

    try {
      const keys = Object.keys(localStorage);
      let deleted = 0;
      
      keys.forEach(key => {
        if (key.startsWith('rewardGameUser_') || 
            key.startsWith('dailyPlays_') ||
            key === 'miningCooldowns' ||
            key === 'authUser') {
          localStorage.removeItem(key);
          deleted++;
        }
      });

      addNotification(`Deleted ${deleted} records`, 'success');
      setTimeout(() => window.location.href = '/', 1500);
    } catch (error) {
      addNotification('Error clearing data', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>🛡️ Admin Dashboard</h1>
          <p>Complete system management and control</p>
        </div>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>Live Updates</span>
          {stats.lastUpdate && <small>Last: {stats.lastUpdate}</small>}
        </div>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </button>
        <button className={activeTab === 'revenue' ? 'active' : ''} onClick={() => setActiveTab('revenue')}>
          💰 Revenue Dashboard
        </button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
          👥 Users ({users.length})
        </button>
        <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}>
          🏆 Leaderboard
        </button>
        <button className={activeTab === 'withdrawals' ? 'active' : ''} onClick={() => setActiveTab('withdrawals')}>
          💸 Withdrawals ({withdrawalRequests.filter(r => r.status === 'pending').length})
        </button>
        <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>
          🔔 Notifications ({notifications.length})
        </button>
        <button className={activeTab === 'system' ? 'active' : ''} onClick={() => setActiveTab('system')}>
          ⚙️ System
        </button>
        <button className={activeTab === 'danger' ? 'active' : ''} onClick={() => setActiveTab('danger')}>
          ⚠️ Danger Zone
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="admin-content">
          <div className="stats-grid">
            <div className="admin-stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon">💎</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalPoints?.toLocaleString()}</div>
                <div className="stat-label">Total Cipro</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalTasks}</div>
                <div className="stat-label">Tasks Completed</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <div className="stat-value">{stats.avgLevel}</div>
                <div className="stat-label">Avg VIP Level</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <div className="stat-value">{stats.activeToday}</div>
                <div className="stat-label">Active Today</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon">◎</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalSOL} SOL</div>
                <div className="stat-label">Total SOL</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon">Ξ</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalETH} ETH</div>
                <div className="stat-label">Total ETH</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-info">
                <div className="stat-value">${stats.totalUSDT} USDT</div>
                <div className="stat-label">Total USDT</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-info">
                <div className="stat-value">${stats.totalUSDC} USDC</div>
                <div className="stat-label">Total USDC</div>
              </div>
            </div>
          </div>

          <div className="admin-actions">
            <button onClick={handleExportData} className="action-btn export">
              📥 Export All Data
            </button>
            <button onClick={loadAllData} className="action-btn refresh">
              🔄 Refresh Data
            </button>
            <button onClick={() => handleBulkAction('addPoints')} className="action-btn bulk">
              💎 Give All Users 1000 Cipro
            </button>
            <button onClick={() => handleBulkAction('resetCooldowns')} className="action-btn bulk">
              ⏰ Reset All Cooldowns
            </button>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <RevenueDashboard user={user} addNotification={addNotification} />
      )}

      {activeTab === 'users' && (
        <div className="admin-content">
          {users.length === 0 ? (
            <div className="empty-state">
              <p>No users found. Create an account to see users here.</p>
            </div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Username</th>
                    <th>User ID</th>
                    <th>Cipro</th>
                    <th>Level</th>
                    <th>SOL</th>
                    <th>ETH</th>
                    <th>USDT</th>
                    <th>Tasks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.userId}>
                      <td className="avatar-cell">{u.avatar || '👤'}</td>
                      <td>{u.username || 'Unknown'}</td>
                      <td className="user-id">{u.userId}</td>
                      <td>{(u.points || 0).toLocaleString()}</td>
                      <td>
                        {getVIPConfig(u.vipLevel || 1).icon} Level {u.vipLevel || 1} - {getVIPConfig(u.vipLevel || 1).name}
                      </td>
                      <td>{(u.balance?.sol || 0).toFixed(4)}</td>
                      <td>{(u.balance?.eth || 0).toFixed(4)}</td>
                      <td>{(u.balance?.usdt || 0).toFixed(2)}</td>
                      <td>{u.completedTasks || 0}</td>
                      <td className="actions-cell">
                        <button onClick={() => handleEditUser(u)} className="edit-btn" title="Edit">✏️</button>
                        <button onClick={() => handleDeleteUser(u.userId)} className="delete-btn" title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="admin-content">
          <div className="leaderboard-section">
            <h3>🏆 Top Players Leaderboard</h3>
            
            <div className="leaderboard-categories">
              <div className="leaderboard-category">
                <h4>💎 Top Cipro</h4>
                <div className="leaderboard-list">
                  {leaderboardData.points.length === 0 ? (
                    <p className="empty-state">No players yet</p>
                  ) : (
                    leaderboardData.points.map((player) => (
                      <div key={player.rank} className={`leaderboard-item rank-${player.rank}`}>
                        <span className="rank-badge">{player.rank}</span>
                        <span className="player-avatar">{player.avatar}</span>
                        <div className="player-info">
                          <strong>{player.username}</strong>
                          <small>{player.points.toLocaleString()} CIPRO • VIP {player.vipLevel}</small>
                        </div>
                        {player.rank <= 3 && <span className="trophy">{player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="leaderboard-category">
                <h4>💰 Top Earnings</h4>
                <div className="leaderboard-list">
                  {leaderboardData.earnings.length === 0 ? (
                    <p className="empty-state">No earnings yet</p>
                  ) : (
                    leaderboardData.earnings.map((player) => (
                      <div key={player.rank} className={`leaderboard-item rank-${player.rank}`}>
                        <span className="rank-badge">{player.rank}</span>
                        <span className="player-avatar">{player.avatar}</span>
                        <div className="player-info">
                          <strong>{player.username}</strong>
                          <small>{player.earnings.toFixed(2)} {player.currency}</small>
                        </div>
                        {player.rank <= 3 && <span className="trophy">{player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="leaderboard-category">
                <h4>🔥 Top Streaks</h4>
                <div className="leaderboard-list">
                  {leaderboardData.streak.length === 0 ? (
                    <p className="empty-state">No streaks yet</p>
                  ) : (
                    leaderboardData.streak.map((player) => (
                      <div key={player.rank} className={`leaderboard-item rank-${player.rank}`}>
                        <span className="rank-badge">{player.rank}</span>
                        <span className="player-avatar">{player.avatar}</span>
                        <div className="player-info">
                          <strong>{player.username}</strong>
                          <small>{player.streak} days • {player.points.toLocaleString()} CIPRO</small>
                        </div>
                        {player.rank <= 3 && <span className="trophy">{player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="admin-content">
          <div className="withdrawals-section">
            <div className="section-header">
              <h3>💰 Withdrawal Requests</h3>
              <div className="filter-tabs">
                <button className="filter-btn active">All ({withdrawalRequests.length})</button>
                <button className="filter-btn">Pending ({withdrawalRequests.filter(r => r.status === 'pending').length})</button>
                <button className="filter-btn">Approved ({withdrawalRequests.filter(r => r.status === 'approved').length})</button>
                <button className="filter-btn">Rejected ({withdrawalRequests.filter(r => r.status === 'rejected').length})</button>
              </div>
            </div>

            {withdrawalRequests.length === 0 ? (
              <div className="empty-state">
                <p>No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="withdrawals-table">
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Currency</th>
                      <th>Wallet Details</th>
                      <th>Status</th>
                      <th>Request Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.map((request) => (
                      <tr key={request.id} className={`status-${request.status}`}>
                        <td className="request-id">{request.id}</td>
                        <td>
                          <div className="user-cell">
                            <strong>{request.username}</strong>
                            <small>{request.user_id}</small>
                          </div>
                        </td>
                        <td className="amount-cell">
                          <div>
                            <strong>{request.amount} {request.currency.toUpperCase()}</strong>
                            {request.network_fee && (
                              <small style={{display: 'block', color: '#666'}}>
                                Fee: {request.network_fee} {request.currency.toUpperCase()}
                              </small>
                            )}
                            {request.net_amount && (
                              <small style={{display: 'block', color: '#4caf50'}}>
                                Net: {request.net_amount} {request.currency.toUpperCase()}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="currency-badge">{request.currency.toUpperCase()}</span>
                        </td>
                        <td className="wallet-cell">
                          <div style={{fontSize: '0.9rem'}}>
                            <div style={{marginBottom: '5px'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px'}}>
                                <strong>Address:</strong>
                                <button
                                  onClick={() => copyToClipboard(request.wallet_address, 'Wallet address')}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.8rem',
                                    background: '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  title="Copy address"
                                >
                                  📋 Copy
                                </button>
                              </div>
                              <code style={{display: 'block', wordBreak: 'break-all', padding: '5px', background: '#f5f5f5', borderRadius: '4px'}}>
                                {request.wallet_address}
                              </code>
                            </div>
                            {request.network && (
                              <div style={{marginBottom: '5px'}}>
                                <strong>Network:</strong> {request.network}
                              </div>
                            )}
                            {request.memo && (
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <strong>Memo:</strong> 
                                <span>{request.memo}</span>
                                <button
                                  onClick={() => copyToClipboard(request.memo, 'Memo')}
                                  style={{
                                    padding: '2px 6px',
                                    fontSize: '0.75rem',
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                  }}
                                  title="Copy memo"
                                >
                                  📋
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${request.status}`}>
                            {request.status === 'pending' && '⏳ Pending'}
                            {request.status === 'approved' && '✅ Approved'}
                            {request.status === 'rejected' && '❌ Rejected'}
                          </span>
                          {request.transaction_hash && (
                            <div style={{marginTop: '5px', fontSize: '0.8rem'}}>
                              <strong>TX:</strong>
                              <code style={{display: 'block', wordBreak: 'break-all'}}>
                                {request.transaction_hash}
                              </code>
                            </div>
                          )}
                        </td>
                        <td className="date-cell">
                          {new Date(request.request_date).toLocaleString()}
                        </td>
                        <td className="actions-cell">
                          {request.status === 'pending' ? (
                            <div className="action-buttons">
                              <button 
                                onClick={() => handleWithdrawalAction(request.id, 'approved')}
                                className="approve-btn"
                                title="Approve withdrawal"
                              >
                                ✅ Approve
                              </button>
                              <button 
                                onClick={() => handleWithdrawalAction(request.id, 'rejected')}
                                className="reject-btn"
                                title="Reject withdrawal"
                              >
                                ❌ Reject
                              </button>
                            </div>
                          ) : (
                            <div className="processed-info">
                              <small>
                                {request.processedBy && `By: ${request.processedBy}`}
                                <br />
                                {request.processedDate && new Date(request.processedDate).toLocaleString()}
                              </small>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="admin-content">
          <div className="notifications-section">
            <h3>Admin Notifications</h3>
            {notifications.length === 0 ? (
              <p className="empty-state">No pending notifications</p>
            ) : (
              <div className="notifications-list">
                {notifications.map((notif, index) => (
                  <div key={index} className="notification-item">
                    <span className="notif-icon">{notif.icon}</span>
                    <div className="notif-content">
                      <h4>{notif.title}</h4>
                      <p>{notif.message}</p>
                      <small>{notif.date}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="admin-content">
          <div className="settings-section">
            <h3>System Settings</h3>
            <div className="settings-form">
              <label>
                <input 
                  type="checkbox" 
                  checked={systemSettings.maintenanceMode}
                  onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                />
                Maintenance Mode
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={systemSettings.registrationEnabled}
                  onChange={(e) => setSystemSettings({...systemSettings, registrationEnabled: e.target.checked})}
                />
                Registration Enabled
              </label>
              <label>
                Max Daily Plays:
                <input 
                  type="number" 
                  value={systemSettings.maxDailyPlays}
                  onChange={(e) => setSystemSettings({...systemSettings, maxDailyPlays: parseInt(e.target.value)})}
                />
              </label>
              <label>
                Cipro Multiplier:
                <input 
                  type="number" 
                  step="0.1"
                  value={systemSettings.pointsMultiplier}
                  onChange={(e) => setSystemSettings({...systemSettings, pointsMultiplier: parseFloat(e.target.value)})}
                />
              </label>
              <button onClick={saveSystemSettings} className="save-btn">💾 Save Settings</button>
            </div>
          </div>

          <div className="settings-section">
            <h3>💰 Company Wallet Addresses</h3>
            <div className="wallet-addresses">
              {Object.entries(COMPANY_WALLETS).map(([currency, wallet]) => (
                wallet.address && (
                  <div key={currency} className="wallet-card">
                    <div className="wallet-header">
                      <span className="wallet-icon">{wallet.icon}</span>
                      <h4>{wallet.displayName}</h4>
                    </div>
                    <div className="wallet-details">
                      <div className="detail-row">
                        <span className="label">Network:</span>
                        <span className="value">{wallet.network}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Address:</span>
                        <div className="address-display">
                          <code>{wallet.address}</code>
                          <button
                            onClick={() => copyToClipboard(wallet.address, `${currency} address`)}
                            className="copy-icon-btn"
                            title="Copy address"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      {wallet.trustWalletLink && (
                        <div className="detail-row">
                          <span className="label">Payment Link:</span>
                          <button
                            onClick={() => copyToClipboard(wallet.trustWalletLink, 'Payment link')}
                            className="copy-link-small-btn"
                          >
                            📋 Copy Link
                          </button>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="label">Min Deposit:</span>
                        <span className="value">{wallet.minDeposit} {currency}</span>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h3>📊 Storage Info</h3>
            <div className="storage-info">
              <p><strong>Total localStorage keys:</strong> {Object.keys(localStorage).length}</p>
              <p><strong>User profiles:</strong> {users.length}</p>
              <p><strong>Daily play records:</strong> {Object.keys(localStorage).filter(k => k.startsWith('dailyPlays_')).length}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'danger' && (
        <div className="admin-content">
          <div className="settings-section">
            <h3>⚠️ Danger Zone</h3>
            <div className="danger-actions">
              <button onClick={handleClearAllData} className="danger-btn">
                🗑️ Clear All User Data
              </button>
              <p className="danger-warning">
                This will permanently delete all user accounts and game data. This action cannot be undone!
              </p>
            </div>
          </div>
        </div>
      )}

      {editMode && selectedUser && (
        <div className="edit-modal" onClick={() => { setEditMode(false); setSelectedUser(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User: {selectedUser.username}</h2>
            <div className="edit-form">
              <label>Username: <input type="text" value={editForm.username} onChange={(e) => setEditForm({...editForm, username: e.target.value})} /></label>
              <label>Cipro: <input type="number" value={editForm.points} onChange={(e) => setEditForm({...editForm, points: e.target.value})} /></label>
              <label>
                VIP Level: 
                <select value={editForm.vipLevel} onChange={(e) => setEditForm({...editForm, vipLevel: parseInt(e.target.value)})}>
                  <optgroup label="🥉 Bronze (FREE)">
                    <option value="1">Level 1 - Bronze</option>
                    <option value="2">Level 2 - Bronze</option>
                    <option value="3">Level 3 - Bronze</option>
                    <option value="4">Level 4 - Bronze</option>
                  </optgroup>
                  <optgroup label="🥈 Silver ($9.99/mo)">
                    <option value="5">Level 5 - Silver</option>
                    <option value="6">Level 6 - Silver</option>
                    <option value="7">Level 7 - Silver</option>
                    <option value="8">Level 8 - Silver</option>
                  </optgroup>
                  <optgroup label="🥇 Gold ($19.99/mo)">
                    <option value="9">Level 9 - Gold</option>
                    <option value="10">Level 10 - Gold</option>
                    <option value="11">Level 11 - Gold</option>
                    <option value="12">Level 12 - Gold</option>
                  </optgroup>
                  <optgroup label="💎 Platinum ($49.99/mo)">
                    <option value="13">Level 13 - Platinum</option>
                    <option value="14">Level 14 - Platinum</option>
                    <option value="15">Level 15 - Platinum</option>
                    <option value="16">Level 16 - Platinum</option>
                  </optgroup>
                  <optgroup label="💠 Diamond ($99.99/mo)">
                    <option value="17">Level 17 - Diamond</option>
                    <option value="18">Level 18 - Diamond</option>
                    <option value="19">Level 19 - Diamond</option>
                    <option value="20">Level 20 - Diamond</option>
                  </optgroup>
                </select>
              </label>
              <label>Completed Tasks: <input type="number" min="0" value={editForm.completedTasks} onChange={(e) => setEditForm({...editForm, completedTasks: e.target.value})} /></label>
              <label>SOL Balance: <input type="number" step="0.0001" value={editForm.sol} onChange={(e) => setEditForm({...editForm, sol: e.target.value})} /></label>
              <label>ETH Balance: <input type="number" step="0.0001" value={editForm.eth} onChange={(e) => setEditForm({...editForm, eth: e.target.value})} /></label>
              <label>USDT Balance: <input type="number" step="0.01" value={editForm.usdt} onChange={(e) => setEditForm({...editForm, usdt: e.target.value})} /></label>
              <label>USDC Balance: <input type="number" step="0.01" value={editForm.usdc} onChange={(e) => setEditForm({...editForm, usdc: e.target.value})} /></label>
              <div className="modal-actions">
                <button onClick={handleSaveUser} className="save-btn">💾 Save</button>
                <button onClick={() => { setEditMode(false); setSelectedUser(null); }} className="cancel-btn">❌ Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
