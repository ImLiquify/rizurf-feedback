import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '../types';

export interface DevUser {
  id: string;
  name: string;
  role: Role;
}

// Dev-only stand-in for gateway login: mirrors database/seed.sql. The
// selected user's id is sent as the X-Mock-User-Id header on every API
// call (see src/api.ts) — this whole mechanism goes away once the real
// Rizurf gateway is wired in.
const devUsers: DevUser[] = [
  { id: 'emp-1', name: 'Alice Nguyen', role: 'employee' },
  { id: 'emp-2', name: 'Bob Santos', role: 'employee' },
  { id: 'emp-3', name: 'Carla Cruz', role: 'employee' },
  { id: 'emp-4', name: 'Diego Reyes', role: 'supervisor' },
  { id: 'emp-5', name: 'Erika Flores', role: 'admin' },
];

interface CurrentUserContextValue {
  currentUser: DevUser;
  allUsers: DevUser[];
  setCurrentUserId: (id: string) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState(devUsers[0].id);

  const value = useMemo<CurrentUserContextValue>(() => {
    const currentUser = devUsers.find((u) => u.id === currentUserId) ?? devUsers[0];
    return { currentUser, allUsers: devUsers, setCurrentUserId };
  }, [currentUserId]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  return ctx;
}
