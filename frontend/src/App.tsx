import { useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useCurrentUser } from './context/CurrentUserContext';
import { NotificationsList } from './components/NotificationsList';
import { Avatar } from './components/Avatar';
import { IconFlag, IconGrid, IconMenu, IconUsers } from './components/icons';
import { DirectoryPage } from './pages/DirectoryPage';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { AdminFlagsPage } from './pages/AdminFlagsPage';
import { AdminWallPage } from './pages/AdminWallPage';
import { MePage } from './pages/MePage';
import { QuickSearch } from './components/QuickSearch';

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
              <span className="nav-icon"><Avatar name={currentUser.name} photoUrl={currentUser.photoUrl} size={24} /></span>
              <span className="nav-label">Me</span>
            </NavLink>
            <NavLink to="/" end className={navClass} onClick={close}>
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
          <div className="sidebar-user">
            <Avatar name={currentUser.name} photoUrl={currentUser.photoUrl} size={38} />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser.name}</div>
              <div className="sidebar-user-role">{currentUser.role}</div>
            </div>
          </div>
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
              <QuickSearch />
              <NotificationsList />
            </div>
          </header>
          <main className="content">
            <Routes>
              <Route path="/" element={<DirectoryPage />} />
              <Route path="/me" element={<MePage />} />
              <Route path="/employees/:employeeId" element={<EmployeeProfilePage />} />
              <Route path="/admin/flags" element={<AdminFlagsPage />} />
              <Route path="/admin/wall" element={<AdminWallPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}
