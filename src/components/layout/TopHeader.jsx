import { useEffect, useState } from 'react';
import { useRole } from '../../context/RoleContext';
import './TopHeader.css';
// Theme toggle state will be local to this component for simplicity.

const roleOptions = [
  { id: 'employee', label: 'Employee' },
  { id: 'manager', label: 'Manager' },
  { id: 'admin', label: 'Admin' }
];

export function TopHeader() {
  const { currentUser, currentRole } = useRole();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [notificationsUnread] = useState(3);
  const [isDarkMode, setIsDarkMode] = useState(() => (
    localStorage.getItem('pulse-feedback-theme') === 'dark'
  ));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('pulse-feedback-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((isDark) => !isDark);
  };

  return (
    <header className="top-header">
      <div className="top-header-left">
        {/* Placeholder for search */}
        <div className="search-placeholder" />
      </div>

      <div className="top-header-right">
        <div className="role-switcher-wrapper">
          <button 
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="role-switcher-btn"
          >
            {currentRole.toUpperCase()} ▼
          </button>

          {isRoleMenuOpen && (
            <div className="role-menu">
              {roleOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    // In real app, this would switch role context
                    setIsRoleMenuOpen(false);
                  }}
                  className={`role-option ${currentRole === option.id ? 'active' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span aria-hidden="true">{isDarkMode ? '☀' : '☾'}</span>
        </button>

        <button className="notification-btn" aria-label="Notifications">
          🔔
          {notificationsUnread > 0 && (
            <span className="notification-badge">{notificationsUnread}</span>
          )}
        </button>

        <button className="profile-btn" aria-label={`Profile: ${currentUser.name}`}>
          <img src={currentUser.avatar} alt="" />
          <span className="profile-name">{currentUser.name}</span>
        </button>
        {/* Dark mode toggle button
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
          {isDark ? '🌞' : '🌙'}
        </button> */}
      </div>
    </header>
  );
}