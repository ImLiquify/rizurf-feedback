import { useEffect, useRef, useState } from 'react';
import type { Employee } from '../types';
import { Avatar } from './Avatar';
import { IconMoon } from './icons';
import { roleLabel } from '../utils';

type Theme = 'light' | 'dark';

// index.html sets data-theme before first paint; this only flips and saves it.
function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));
  function setTheme(t: Theme) {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('theme', t);
    } catch {
      // private mode etc.: the choice just lasts for this page
    }
    setThemeState(t);
  }
  return [theme, setTheme];
}

// The profile at the bottom of the rail; pressing it opens the settings row
// (dark mode) just above it.
export function ProfileMenu({ user }: { user: Employee }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const dark = theme === 'dark';

  return (
    <div className="profile-menu" ref={ref}>
      {open && (
        <div className="profile-menu-panel" id="profile-menu-panel">
          <button type="button" role="switch" aria-checked={dark} className="nav-item theme-switch" onClick={() => setTheme(dark ? 'light' : 'dark')}>
            <span className="nav-icon">
              <IconMoon width={20} height={20} />
            </span>
            <span className="nav-label">Dark mode</span>
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
          </button>
        </div>
      )}
      <button
        type="button"
        className="sidebar-user"
        aria-expanded={open}
        aria-controls="profile-menu-panel"
        aria-label={`${user.name}, settings`}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar name={user.name} photoUrl={user.photoUrl} size={38} />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user.name}</div>
          <div className="sidebar-user-role">{roleLabel(user)}</div>
        </div>
      </button>
    </div>
  );
}
