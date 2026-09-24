import { NavLink, Route, Routes } from 'react-router-dom';
import { useCurrentUser } from './context/CurrentUserContext';
import { UserSwitcher } from './components/UserSwitcher';
import { NotificationsList } from './components/NotificationsList';
import { DirectoryPage } from './pages/DirectoryPage';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { AdminFlagsPage } from './pages/AdminFlagsPage';

function isAdminRole(role: string): boolean {
  return role === 'admin' || role === 'hr';
}

export function App() {
  const { currentUser } = useCurrentUser();

  return (
    <div>
      <header className="topbar">
        <span className="brand">Pulse</span>
        <nav className="topnav">
          <NavLink to="/" end>
            Directory
          </NavLink>
          {isAdminRole(currentUser.role) && <NavLink to="/admin/flags">Admin: Flags</NavLink>}
        </nav>
        <div className="topbar-right">
          <NotificationsList />
          <UserSwitcher />
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<DirectoryPage />} />
          <Route path="/employees/:employeeId" element={<EmployeeProfilePage />} />
          <Route path="/admin/flags" element={<AdminFlagsPage />} />
        </Routes>
      </main>
    </div>
  );
}
