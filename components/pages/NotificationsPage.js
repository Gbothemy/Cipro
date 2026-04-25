'use client';
import useStore from '../../app/store/useStore';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, clearNotifications } = useStore();

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Notifications</h1>
          <p className="text-slate-400 mt-1">{notifications.filter((n) => !n.read).length} unread</p>
        </div>
        {notifications.length > 0 && (
          <button onClick={clearNotifications} className="btn-ghost text-sm text-red-400 hover:text-red-300">
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-slate-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`card p-4 cursor-pointer transition-all duration-200 hover:border-white/10 ${!n.read ? 'border-primary/20' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-white/10' : 'bg-primary'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-slate-600 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
