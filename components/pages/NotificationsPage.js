'use client';
import useStore from '../../app/store/useStore';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, clearNotifications } = useStore();

  return (
    <div className="page-container-md">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Notifications</h1>
          <p className="text-muted mt-2">{notifications.filter((n) => !n.read).length} unread</p>
        </div>
        {notifications.length > 0 && (
          <button onClick={clearNotifications} className="btn-ghost text-sm text-error">
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <p className="text-muted">No notifications yet</p>
        </div>
      ) : (
        <div className="flex-col gap-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className="card p-4 cursor-pointer"
              style={{
                borderColor: !n.read ? 'rgba(102,126,234,0.2)' : undefined,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = !n.read ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.06)'}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="rounded-full flex-shrink-0"
                  style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    marginTop: '0.5rem',
                    background: n.read ? 'rgba(255,255,255,0.1)' : '#667eea'
                  }}
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${n.read ? 'text-muted' : 'text-white'}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-dim mt-1">{n.message}</p>}
                  <p className="text-xs text-dim mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
