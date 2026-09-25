import { NavLink, Route, Routes } from 'react-router-dom';
import { useCurrentUser } from './context/CurrentUserContext';
import { NotificationsList } from './components/NotificationsList';
import { DirectoryPage } from './pages/DirectoryPage';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { AdminFlagsPage } from './pages/AdminFlagsPage';
import { AdminWallPage } from './pages/AdminWallPage';
import { initials } from './utils';

function isAdminRole(role: string): boolean {
  return role === 'admin' || role === 'hr';
}

export function App() {
  const { currentUser } = useCurrentUser();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">R</span>
          Rizurf Feedback
        </div>

        <div className="sidebar-section-label">Main menu</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => 'sidebar-nav-item' + (isActive ? ' active' : '')}>
            Directory
          </NavLink>
          {isAdminRole(currentUser.role) && (
            <NavLink to="/admin/flags" className={({ isActive }) => 'sidebar-nav-item' + (isActive ? ' active' : '')}>
              Admin: Flags
            </NavLink>
          )}
          {isAdminRole(currentUser.role) && (
            <NavLink to="/admin/wall" className={({ isActive }) => 'sidebar-nav-item' + (isActive ? ' active' : '')}>
              Employee Wall
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-identity">
            <span className="sidebar-avatar">{initials(currentUser.name)}</span>
            <div>
              <div className="sidebar-identity-name">{currentUser.name}</div>
              <div className="sidebar-identity-role">{currentUser.role}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="content">
        <div className="content-topbar">
          <div className="content-topbar-spacer" />
          <NotificationsList />
        </div>
        <main>
          <Routes>
            <Route path="/" element={<DirectoryPage />} />
            <Route path="/employees/:employeeId" element={<EmployeeProfilePage />} />
            <Route path="/admin/flags" element={<AdminFlagsPage />} />
            <Route path="/admin/wall" element={<AdminWallPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
