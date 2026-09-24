import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { exchangeCode, getSession } from '../api';
import type { Employee } from '../types';

interface CurrentUserContextValue {
  currentUser: Employee;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

// MICROAPP_AUTH.md §4: no login screen, no sign-out button — the gateway
// is the only place either happens. This provider's only job is to (a)
// finish the sign-in code exchange if one is in progress, (b) ask our own
// backend who's signed in, and (c) send the browser to the gateway when
// no one is.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          const user = await exchangeCode(code);
          window.history.replaceState({}, '', window.location.pathname);
          if (!cancelled) setCurrentUser(user);
          return;
        } catch {
          // Fall through to the session check below.
        }
      }

      try {
        const user = await getSession();
        if (!cancelled) setCurrentUser(user);
      } catch {
        if (!cancelled) {
          setRedirecting(true);
          window.location.href = '/api/auth/login';
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!currentUser) {
    return (
      <div className="auth-loading">
        <p className="muted">{redirecting ? 'Redirecting to sign-in…' : 'Loading…'}</p>
      </div>
    );
  }

  return <CurrentUserContext.Provider value={{ currentUser }}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  return ctx;
}
