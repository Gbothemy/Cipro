import React, { useState, useEffect } from 'react';
import { db } from '../db/neon';
import './NotificationsPage.css';

function NotificationsPage({ user, addNotification }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadNotifications();
  }, [user.userId]);

  const loadNotifications = async () => {
    try {
      const data = await db.getNotifications(user.userId);
      
      // Format notifications for display
      const formattedNotifications = data.map(notif => ({
        id: notif.id,
        type: notif.notification_type,
        icon: notif.icon || getDefaultIcon(notif.notification_type),
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.created_at),
        read: notif.is_read
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      addNotification('Failed to load notifications', 'error');
    }
  };

  const getDefaultIcon = (type) => {
    const icons = {
      success: '✅',
      achievement: '🏆',
      level: '⭐',
      referral: '👥',
      event: '🎉',
      info: 'ℹ️',
      task: '📋',
      withdrawal: '💰'
    };
    return icons[type] || 'ℹ️';
  };

  const markAsRead = async (id) => {
    try {
      await db.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      addNotification('Marked as read', 'success');
    } catch (error) {
      console.error('Error marking as read:', error);
      addNotification('Failed to mark as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notif => db.markNotificationAsRead(notif.id))
      );
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      addNotification('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      addNotification('Failed to mark all as read', 'error');
    }
  };

  const deleteNotificationItem = async (id) => {
    try {
      await db.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      addNotification('Notification deleted', 'info');
    } catch (error) {
      console.error('Error deleting notification:', error);
      addNotification('Failed to delete notification', 'error');
    }
  };

  const clearAll = async () => {
    if (window.confirm('Clear all notifications?')) {
      try {
        await Promise.all(
          notifications.map(notif => db.deleteNotification(notif.id))
        );
        setNotifications([]);
        addNotification('All notifications cleared', 'info');
      } catch (error) {
        console.error('Error clearing notifications:', error);
        addNotification('Failed to clear notifications', 'error');
      }
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'read') return notifications.filter(n => n.read);
    return notifications;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1 className="page-title">🔔 Notifications</h1>
        <p className="page-subtitle">Stay updated with your activities</p>
      </div>

      {/* Stats */}
      <div className="notification-stats">
        <div className="stat-card">
          <div className="stat-icon">📬</div>
          <div className="stat-info">
            <div className="stat-value">{notifications.length}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <div className="stat-value">{unreadCount}</div>
            <div className="stat-label">Unread</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{notifications.length - unreadCount}</div>
            <div className="stat-label">Read</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="notification-filters">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>
        <div className="action-buttons">
          {unreadCount > 0 && (
            <button className="action-btn" onClick={markAllAsRead}>
              ✓ Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="action-btn danger" onClick={clearAll}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              className={`notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}`}
            >
              <div className="notification-icon">{notif.icon}</div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notif.title}</h4>
                  <span className="notification-time">{getTimeAgo(notif.timestamp)}</span>
                </div>
                <p className="notification-message">{notif.message}</p>
              </div>
              <div className="notification-actions">
                {!notif.read && (
                  <button
                    className="action-icon-btn"
                    onClick={() => markAsRead(notif.id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="action-icon-btn delete"
                  onClick={() => deleteNotificationItem(notif.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Preferences */}
      <div className="notification-preferences">
        <h3>📋 Notification Preferences</h3>
        <div className="preferences-grid">
          <label className="preference-item">
            <input type="checkbox" defaultChecked />
            <span>Withdrawal updates</span>
          </label>
          <label className="preference-item">
            <input type="checkbox" defaultChecked />
            <span>Achievement unlocks</span>
          </label>
          <label className="preference-item">
            <input type="checkbox" defaultChecked />
            <span>Level up notifications</span>
          </label>
          <label className="preference-item">
            <input type="checkbox" defaultChecked />
            <span>Referral earnings</span>
          </label>
          <label className="preference-item">
            <input type="checkbox" defaultChecked />
            <span>Special events</span>
          </label>
          <label className="preference-item">
            <input type="checkbox" />
            <span>Email notifications</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
