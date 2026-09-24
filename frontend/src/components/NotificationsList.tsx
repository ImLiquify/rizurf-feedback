import { useEffect, useState } from 'react';
import { getNotifications } from '../api';
import type { NotificationItem } from '../types';
import { IconBell } from './icons';

export function NotificationsList() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getNotifications()
        .then((n) => {
          if (!cancelled) setNotifications(n);
        })
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function toggle() {
    setOpen((o) => !o);
    getNotifications()
      .then(setNotifications)
      .catch(() => {});
  }

  return (
    <div className="notif-wrap">
      <button className="bell-btn" onClick={toggle}>
        <IconBell />
        Notifications
        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          {notifications.length === 0 ? (
            <div className="notif-item muted">No notifications yet.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="notif-item">
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
