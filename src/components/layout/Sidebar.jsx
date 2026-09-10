import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const sidebarLinks = [
  { id: 'me', label: 'ME', icon: '⬇️' },
  { id: 'wall', label: 'Employee Wall', icon: '👥' }
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <img src="/assets/logo.png" alt="Rizurf Realty Logo" className="brand-logo-img" style={{ maxHeight: '44px', width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
      </div>

      <nav className="sidebar-nav">
        {sidebarLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => navigate(`/wall`)}
            className={`sidebar-nav-link ${location.pathname.includes(link.id) ? 'active' : ''}`}
          >
            <span>{link.icon}</span>
            {link.label}
          </button>
        ))}

        <div className="sidebar-nav-label">Organization Wall</div>
        <button
          onClick={() => navigate(`/wall`)}
          className="sidebar-nav-link"
        >
          <span>🏢</span>
          Company Suggestions
        </button>
      </nav>
    </aside>
  );
}