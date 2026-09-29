import { useEffect, useState } from 'react';
import { getNotifications, markNotificationsRead } from '../api';
import type { NotificationItem } from '../types';
import { IconBell } from './icons';

export function NotificationsList() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Every request pays the gateway session check, so poll gently and only
    // while the tab is visible (RIZURF_PERFORMANCE_CHANGES.md §7).
    function load() {
      if (document.visibilityState !== 'visible') return;
      getNotifications()
        .then((n) => {
          if (!cancelled) setNotifications(n);
        })
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 45000);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  // Opening the panel marks everything read (here and on the gateway's app
  // icon); the new ones stay highlighted until the panel closes.
  function toggle() {
    if (open) {
      setOpen(false);
      setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      return;
    }
    setOpen(true);
    if (unread > 0) markNotificationsRead().catch(() => {});
  }

  function when(iso: string): string {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  return (
    <div className="notif-wrap">
      <button className="bell-btn" onClick={toggle} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open}>
        <IconBell />
        <span className="bell-label">Notifications</span>
        {unread > 0 && <span className="badge">{unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          {notifications.length === 0 ? (
            <div className="notif-item muted">No notifications yet.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={'notif-item' + (n.read ? '' : ' unread')}>
                <span>{n.message}</span>
                <time className="notif-time" dateTime={n.createdAt}>
                  {when(n.createdAt)}
                </time>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
