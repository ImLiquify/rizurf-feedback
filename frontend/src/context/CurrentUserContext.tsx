import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { exchangeCode, getSession } from '../api';
import type { Employee } from '../types';

interface CurrentUserContextValue {
  currentUser: Employee;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

// MICROAPP_AUTH.md §4: no login screen, no sign-out button — the gateway
// is the only place either happens. This provider's only job is to (a)
// finish the sign-in code exchange if one is in progress, then (b) ask our
// own backend who's signed in. A 401 from either call is handled once,
// centrally, in api.ts's request() (redirect to the gateway) — it never
// rejects on a 401, so the catches below only ever see other failures
// (a bad/expired code, or this app's own API being unreachable).
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        } catch (err) {
          // Stop here: falling through to the session check would 401,
          // bounce to the gateway, get a fresh code and fail again forever.
          window.history.replaceState({}, '', window.location.pathname);
          if (!cancelled) setError(err instanceof Error ? err.message : 'Sign-in failed.');
          return;
        }
      }

      try {
        const user = await getSession();
        if (!cancelled) setCurrentUser(user);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not reach the server.');
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
        <p className="muted">{error ? `Couldn't sign you in: ${error}` : 'Loading…'}</p>
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
