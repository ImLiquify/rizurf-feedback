import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useCurrentUser } from './context/CurrentUserContext';
import { NOTIFICATIONS_ARRIVED, NotificationsList } from './components/NotificationsList';
import { getEmployeeReviews } from './api';
import { Avatar } from './components/Avatar';
import { ProfileMenu } from './components/ProfileMenu';
import { IconFlag, IconGrid, IconMenu, IconUsers } from './components/icons';
import { DirectoryPage } from './pages/DirectoryPage';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { AdminFlagsPage } from './pages/AdminFlagsPage';
import { AdminWallPage } from './pages/AdminWallPage';
import { AdminWallEmployeePage } from './pages/AdminWallEmployeePage';
import { AWAITING_REPLY, MePage } from './pages/MePage';

const GATEWAY = 'https://web-omega-two-47.vercel.app';

function isAdminRole(role: string): boolean {
  return role === 'admin' || role === 'hr';
}

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/me')) return 'Me';
  if (pathname.startsWith('/employees/')) return 'Profile';
  if (pathname.startsWith('/admin/flags')) return 'Flags';
  if (pathname.startsWith('/admin/wall')) return 'Employee Wall';
  return 'Directory';
}

// Shell per RIZURF_UI_STANDARD.md §2: 4px top line, 56px icon rail that
// widens over the page on hover, 65px top bar, drawer below 1000px.
export function App() {
  const { currentUser } = useCurrentUser();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navClass = ({ isActive }: { isActive: boolean }) => 'nav-item' + (isActive ? ' active' : '');
  const close = () => setDrawerOpen(false);

  // Reviews about me still waiting for my reply: the same number as the Me
  // page's "About me" badge, which reports its own count as it changes.
  const [awaitingReply, setAwaitingReply] = useState(0);
  useEffect(() => {
    const load = () =>
      getEmployeeReviews(currentUser.id)
        .then((d) => setAwaitingReply(d.reviews.filter((r) => !r.reply).length))
        .catch(() => {});
    const onCount = (e: Event) => setAwaitingReply((e as CustomEvent<number>).detail);
    load();
    window.addEventListener(NOTIFICATIONS_ARRIVED, load);
    window.addEventListener(AWAITING_REPLY, onCount);
    return () => {
      window.removeEventListener(NOTIFICATIONS_ARRIVED, load);
      window.removeEventListener(AWAITING_REPLY, onCount);
    };
  }, [currentUser.id]);

  return (
    <>
      <div className="top-accent" aria-hidden="true" />
      <div className="shell">
        <div className={'backdrop' + (drawerOpen ? ' open' : '')} aria-hidden="true" onClick={close} />

        <aside className={'sidebar' + (drawerOpen ? ' open' : '')}>
          <div className="sidebar-brand">
            <img className="brand-icon" src={`${GATEWAY}/logo-icon.png`} alt="Rizurf" />
            <img className="brand-full" src={`${GATEWAY}/logo.png`} alt="Rizurf Realty" />
          </div>
          <nav className="nav">
            <NavLink to="/me" className={navClass} onClick={close}>
              <span className="nav-icon">
                <Avatar name={currentUser.name} photoUrl={currentUser.photoUrl} size={24} />
                {awaitingReply > 0 && <span className="nav-dot" aria-hidden="true" />}
              </span>
              <span className="nav-label">Me</span>
              {awaitingReply > 0 && (
                <span className="badge nav-count" title="Waiting for your reply" aria-label={`${awaitingReply} waiting for your reply`}>
                  {awaitingReply > 99 ? '99+' : awaitingReply}
                </span>
              )}
            </NavLink>
            <NavLink to="/directory" className={navClass} onClick={close}>
              <span className="nav-icon"><IconUsers width={22} height={22} strokeWidth={2.2} /></span>
              <span className="nav-label">Directory</span>
            </NavLink>
            {isAdminRole(currentUser.role) && (
              <>
                <div className="nav-rule" role="separator" />
                <NavLink to="/admin/flags" className={navClass} onClick={close}>
                  <span className="nav-icon"><IconFlag width={22} height={22} strokeWidth={2.2} /></span>
                  <span className="nav-label">Flags</span>
                </NavLink>
                <NavLink to="/admin/wall" className={navClass} onClick={close}>
                  <span className="nav-icon"><IconGrid width={22} height={22} strokeWidth={2.2} /></span>
                  <span className="nav-label">Employee Wall</span>
                </NavLink>
              </>
            )}
          </nav>
          <ProfileMenu user={currentUser} />
        </aside>

        <div className="main">
          <header className="topbar">
            <button className="burger" type="button" aria-label="Toggle navigation" onClick={() => setDrawerOpen((o) => !o)}>
              <IconMenu width={20} height={20} />
            </button>
            <span className="crumb">
              <span className="crumb-root">Rizurf Feedback / </span>
              <b>{pageTitle(pathname)}</b>
            </span>
            <div className="topbar-right">
              <NotificationsList />
            </div>
          </header>
          <main className="content">
            <Routes>
              <Route path="/" element={<Navigate to="/me" replace />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/me" element={<MePage />} />
              <Route path="/employees/:employeeId" element={<EmployeeProfilePage />} />
              <Route path="/admin/flags" element={<AdminFlagsPage />} />
              <Route path="/admin/wall" element={<AdminWallPage />} />
              <Route path="/admin/wall/:employeeId" element={<AdminWallEmployeePage />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}
