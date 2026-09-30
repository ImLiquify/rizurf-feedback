import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../api';
import type { NotificationItem } from '../types';
import { IconBell, IconClose } from './icons';
import { timeAgo } from '../utils';

const TOAST_MS = 5000;
const POLL_MS = 10000;
export const NOTIFICATIONS_ARRIVED = 'rizurf:notifications-arrived';

export function NotificationsList() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Ids already on screen once; null until the first load, whose unread
  // backlog shows on the badge rather than as a burst of banners.
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Every request pays the gateway session check, so poll one small list and
    // only while the tab is visible (RIZURF_PERFORMANCE_CHANGES.md §7).
    function load() {
      if (document.visibilityState !== 'visible') return;
      getNotifications()
        .then((all) => {
          if (cancelled) return;
          const fresh = all.filter((n) => !n.read);
          if (seen.current) {
            const arrived = fresh.filter((n) => !seen.current!.has(n.id));
            if (arrived.length) {
              setToasts((t) => [...arrived, ...t].slice(0, 3));
              // Pages showing reviews reload themselves, so new feedback appears without a refresh.
              window.dispatchEvent(new Event(NOTIFICATIONS_ARRIVED));
            }
            // Browsers may block sound until the page has been clicked once; then it's silent, not an error.
            if (arrived.some((n) => n.type === 'review_received')) new Audio('/notification.wav').play().catch(() => {});
          }
          seen.current = new Set(all.map((n) => n.id));
          setUnread(fresh);
        })
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, POLL_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  // Close on a press anywhere outside the bell and its panel, or on Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((n) => n.id !== id)), []);

  // Opening a notification marks it read (here and on the gateway's app
  // icon) and takes you to the review it is about.
  function openNotification(n: NotificationItem) {
    setOpen(false);
    dismissToast(n.id);
    setUnread((list) => list.filter((x) => x.id !== n.id));
    markNotificationRead(n.id).catch(() => {});
    if (n.link) navigate(n.link);
  }

  const count = unread.length;

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        className="bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <IconBell width={20} height={20} />
        {count > 0 && <span className="badge">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Unread notifications">
          <div className="notif-head">Notifications</div>
          {count === 0 ? (
            <div className="notif-empty">You're all caught up.</div>
          ) : (
            unread.map((n) => (
              <button key={n.id} className="notif-item" onClick={() => openNotification(n)}>
                <span>{n.message}</span>
                <time className="notif-time" dateTime={n.createdAt}>
                  {timeAgo(n.createdAt)}
                </time>
              </button>
            ))
          )}
        </div>
      )}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((n) => (
          <Toast key={n.id} item={n} onOpen={() => openNotification(n)} onDismiss={dismissToast} />
        ))}
      </div>
    </div>
  );
}

interface ToastProps {
  item: NotificationItem;
  onOpen: () => void;
  onDismiss: (id: string) => void;
}

function Toast({ item, onOpen, onDismiss }: ToastProps) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onDismiss(item.id), TOAST_MS);
    return () => clearTimeout(timer);
  }, [paused, onDismiss, item.id]);

  return (
    <div className="toast" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <button className="toast-body" onClick={onOpen}>
        <IconBell width={16} height={16} className="toast-icon" />
        <span>{item.message}</span>
      </button>
      <button className="toast-close" onClick={() => onDismiss(item.id)} aria-label="Dismiss">
        <IconClose width={14} height={14} />
      </button>
    </div>
  );
}
