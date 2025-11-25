import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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

    // Auto-refresh data every 5 seconds for live updates
    const interval = setInterval(() => {
      loadAllData();
      loadNotifications();
      loadWithdrawalRequests();
      loadLeaderboard();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadAllData = () => {
    try {
      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(key => key.startsWith('rewardGameUser_'));
      
      const allUsers = userKeys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch (e) {
          return null;
        }
      }).filter(u => u !== null);

      // Filter out admin and demo users from statistics
      const realUsers = allUsers.filter(u => 
        !u.userId?.startsWith('ADMIN-') && 
        !u.userId?.startsWith('USR-98765') && // DemoPlayer
        !u.username?.toLowerCase().includes('demo') &&
        !u.username?.toLowerCase().includes('admin')
      );

      setUsers(realUsers);

      // Calculate comprehensive stats (using realUsers only)
      const totalPoints = realUsers.reduce((sum, u) => sum + (u.points || 0), 0);
      const totalTasks = realUsers.reduce((sum, u) => sum + (u.completedTasks || 0), 0);
      const totalTON = realUsers.reduce((sum, u) => sum + (u.balance?.ton || 0), 0);
      const totalCATI = realUsers.reduce((sum, u) => sum + (u.balance?.cati || 0), 0);
      const avgLevel = realUsers.length > 0 
        ? (realUsers.reduce((sum, u) => sum + (u.vipLevel || 1), 0) / realUsers.length).toFixed(1)
        : 0;

      const today = new Date().toDateString();
      const activeToday = realUsers.filter(u => {
        try {
          return localStorage.getItem(`dailyPlays_${u.userId}_${today}`) !== null;
        } catch (e) {
          return false;
        }
      }).length;

      setStats({
        totalUsers: realUsers.length,
        totalPoints,
        totalTasks,
        avgLevel,
        activeToday,
        totalTON: totalTON.toFixed(2),
        totalCATI: totalCATI.toFixed(2),
        topPlayer: realUsers.sort((a, b) => b.points - a.points)[0],
        lastUpdate: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification('Error loading data', 'error');
    }
  };

  const loadNotifications = () => {
    // Load admin notifications (withdrawal requests, reports, etc.)
    const savedNotifications = localStorage.getItem('adminNotifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        setNotifications([]);
      }
    }
  };

  const loadWithdrawalRequests = () => {
    try {
      const requests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
      // Sort by date, newest first
      const sortedRequests = requests.sort((a, b) => 
        new Date(b.requestDate) - new Date(a.requestDate)
      );
      setWithdrawalRequests(sortedRequests);
    } catch (e) {
      setWithdrawalRequests([]);
    }
  };

  const loadLeaderboard = () => {
    try {
      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(key => key.startsWith('rewardGameUser_'));
      
      const allUsers = userKeys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch (e) {
          return null;
        }
      }).filter(u => u !== null);

      // Filter out admin and demo users
      const realUsers = allUsers.filter(u => 
        !u.userId?.startsWith('ADMIN-') && 
        !u.userId?.startsWith('USR-98765') &&
        !u.username?.toLowerCase().includes('demo') &&
        !u.username?.toLowerCase().includes('admin')
      );
      
      // Sort by points
      const pointsLeaderboard = [...realUsers]
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)
        .map((u, index) => ({
          rank: index + 1,
          username: u.username,
          avatar: u.avatar,
          points: u.points,
          vipLevel: u.vipLevel
        }));

      // Sort by earnings (TON)
      const earningsLeaderboard = [...realUsers]
        .sort((a, b) => (b.balance?.ton || 0) - (a.balance?.ton || 0))
        .slice(0, 10)
        .map((u, index) => ({
          rank: index + 1,
          username: u.username,
          avatar: u.avatar,
          earnings: u.balance?.ton || 0,
          currency: 'TON'
        }));

      // Sort by streak
      const streakLeaderboard = [...realUsers]
        .sort((a, b) => (b.dayStreak || 0) - (a.dayStreak || 0))
        .slice(0, 10)
        .map((u, index) => ({
          rank: index + 1,
          username: u.username,
          avatar: u.avatar,
          streak: u.dayStreak || 0,
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

  const handleWithdrawalAction = (requestId, action) => {
    try {
      const requests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
      const requestIndex = requests.findIndex(req => req.id === requestId);
      
      if (requestIndex === -1) {
        addNotification('Withdrawal request not found', 'error');
        return;
      }

      const request = requests[requestIndex];
      
      if (action === 'approved') {
        // Deduct balance from user
        const userKey = `rewardGameUser_${request.userId}`;
        const userData = JSON.parse(localStorage.getItem(userKey));
        
        if (userData) {
          const currency = request.currency.toLowerCase();
          if (userData.balance[currency] >= request.amount) {
            userData.balance[currency] -= request.amount;
            localStorage.setItem(userKey, JSON.stringify(userData));
            
            // Update request status
            requests[requestIndex].status = 'approved';
            requests[requestIndex].processedDate = new Date().toISOString();
            requests[requestIndex].processedBy = user.username;
            
            addNotification(`Withdrawal approved: ${request.amount} ${request.currency}`, 'success');
          } else {
            addNotification('Insufficient user balance', 'error');
            return;
          }
        } else {
          addNotification('User not found', 'error');
          return;
        }
      } else if (action === 'rejected') {
        // Just update status, don't deduct balance
        requests[requestIndex].status = 'rejected';
        requests[requestIndex].processedDate = new Date().toISOString();
        requests[requestIndex].processedBy = user.username;
        requests[requestIndex].rejectionReason = 'Rejected by admin';
        
        addNotification(`Withdrawal rejected: ${request.amount} ${request.currency}`, 'info');
      }
      
      localStorage.setItem('withdrawalRequests', JSON.stringify(requests));
      
      // Remove from admin notifications
      const adminNotifs = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      const updatedNotifs = adminNotifs.filter(notif => notif.id !== requestId);
      localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifs));
      
      loadWithdrawalRequests();
      loadNotifications();
      loadAllData();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      addNotification('Error processing withdrawal', 'error');
    }
  };

  const loadSystemSettings = () => {
    const saved = localStorage.getItem('systemSettings');
    if (saved) {
      try {
        setSystemSettings(JSON.parse(saved));
      } catch (e) {}
    }
  };

  const saveSystemSettings = () => {
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
    addNotification('System settings saved', 'success');
  };

  const handleDeleteUser = (userId) => {
    if (!window.confirm(`Delete user ${userId}? This cannot be undone!`)) return;

    try {
      localStorage.removeItem(`rewardGameUser_${userId}`);
      const keys = Object.keys(localStorage);
      keys.filter(k => k.includes(userId)).forEach(k => localStorage.removeItem(k));

      addNotification('User deleted successfully', 'success');
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
      ton: userData.balance?.ton || 0,
      cati: userData.balance?.cati || 0,
      usdt: userData.balance?.usdt || 0
    });
    setEditMode(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;

    try {
      const updatedUser = {
        ...selectedUser,
        username: editForm.username,
        points: parseInt(editForm.points) || 0,
        vipLevel: parseInt(editForm.vipLevel) || 1,
        completedTasks: parseInt(editForm.completedTasks) || 0,
        balance: {
          ton: parseFloat(editForm.ton) || 0,
          cati: parseFloat(editForm.cati) || 0,
          usdt: parseFloat(editForm.usdt) || 0
        }
      };

      localStorage.setItem(`rewardGameUser_${selectedUser.userId}`, JSON.stringify(updatedUser));
      
      addNotification('User updated successfully', 'success');
      setEditMode(false);
      setSelectedUser(null);
      loadAllData();
    } catch (error) {
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
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
          👥 Users ({users.length})
        </button>
        <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}>
          🏆 Leaderboard
        </button>
        <button className={activeTab === 'withdrawals' ? 'active' : ''} onClick={() => setActiveTab('withdrawals')}>
          💰 Withdrawals ({withdrawalRequests.filter(r => r.status === 'pending').length})
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
                <div className="stat-label">Total Points</div>
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
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalTON} TON</div>
                <div className="stat-label">Total Balance</div>
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
              💎 Give All Users 1000 Points
            </button>
            <button onClick={() => handleBulkAction('resetCooldowns')} className="action-btn bulk">
              ⏰ Reset All Cooldowns
            </button>
          </div>
        </div>
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
                    <th>Points</th>
                    <th>Level</th>
                    <th>TON</th>
                    <th>CATI</th>
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
                      <td>Level {u.vipLevel || 1}</td>
                      <td>{(u.balance?.ton || 0).toFixed(2)}</td>
                      <td>{(u.balance?.cati || 0).toFixed(0)}</td>
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
                <h4>💎 Top Points</h4>
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
                          <small>{player.points.toLocaleString()} pts • VIP {player.vipLevel}</small>
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
                          <small>{player.streak} days • {player.points.toLocaleString()} pts</small>
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
                      <th>Wallet Address</th>
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
                            <small>{request.userId}</small>
                          </div>
                        </td>
                        <td className="amount-cell">{request.amount.toFixed(2)}</td>
                        <td>
                          <span className="currency-badge">{request.currency}</span>
                        </td>
                        <td className="wallet-cell">
                          <code>{request.walletAddress}</code>
                        </td>
                        <td>
                          <span className={`status-badge status-${request.status}`}>
                            {request.status === 'pending' && '⏳ Pending'}
                            {request.status === 'approved' && '✅ Approved'}
                            {request.status === 'rejected' && '❌ Rejected'}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Date(request.requestDate).toLocaleString()}
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
                Points Multiplier:
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
              <label>Points: <input type="number" value={editForm.points} onChange={(e) => setEditForm({...editForm, points: e.target.value})} /></label>
              <label>VIP Level: <input type="number" min="1" max="99" value={editForm.vipLevel} onChange={(e) => setEditForm({...editForm, vipLevel: e.target.value})} /></label>
              <label>Completed Tasks: <input type="number" min="0" value={editForm.completedTasks} onChange={(e) => setEditForm({...editForm, completedTasks: e.target.value})} /></label>
              <label>TON Balance: <input type="number" step="0.01" value={editForm.ton} onChange={(e) => setEditForm({...editForm, ton: e.target.value})} /></label>
              <label>CATI Balance: <input type="number" value={editForm.cati} onChange={(e) => setEditForm({...editForm, cati: e.target.value})} /></label>
              <label>USDT Balance: <input type="number" step="0.01" value={editForm.usdt} onChange={(e) => setEditForm({...editForm, usdt: e.target.value})} /></label>
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
