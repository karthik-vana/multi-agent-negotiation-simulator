import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Users,
  Swords,
  FileText,
  Settings,
  Search,
  LogOut,
  Sun,
  Moon,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const navigate = useNavigate();

  // Theme Toggle: persists in localStorage and applies data-theme attribute
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Search state and indexing
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const MODULES = [
    {
      name: 'Dashboard',
      path: '/',
      section: 'Main Menu',
      icon: LayoutDashboard,
      keywords: ['home', 'overview', 'summary', 'workspace', 'start']
    },
    {
      name: 'Scenarios',
      path: '/scenarios',
      section: 'Main Menu',
      icon: Layers,
      keywords: ['vendor', 'pricing', 'job offer', 'budget', 'allocation', 'templates']
    },
    {
      name: 'Agent Configuration',
      path: '/agents',
      section: 'Main Menu',
      icon: Users,
      keywords: ['personality', 'aggressive', 'collaborative', 'risk-averse', 'persona', 'roles', 'goals', 'constraints']
    },
    {
      name: 'Negotiation Arena',
      path: '/arena',
      section: 'Simulation',
      icon: Swords,
      keywords: ['chat', 'transcript', 'live', 'turns', 'simulation', 'practice']
    },
    {
      name: 'History & Reports',
      path: '/history',
      section: 'Simulation',
      icon: FileText,
      keywords: ['analytics', 'outcome', 'metrics', 'concession', 'curves', 'archive']
    },
    {
      name: 'Settings',
      path: '/settings',
      section: 'System',
      icon: Settings,
      keywords: ['config', 'firebase', 'llm', 'preferences', 'keys']
    }
  ];

  const searchResults = searchQuery.trim()
    ? MODULES.filter((m) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          m.name.toLowerCase().includes(q) ||
          m.section.toLowerCase().includes(q) ||
          m.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
    : [];

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectModule = (path) => {
    navigate(path);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const getInitials = () => {
    if (currentUser?.displayName) {
      const parts = currentUser.displayName.trim().split(' ');
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }
    return 'TL';
  };

  const displayName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Team Lead');
  const displayEmail = currentUser?.email || 'lead@simulator.ai';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <img src="/favicon.svg" alt="Negotiator AI" className="brand-logo" />
          <div className="brand-title">Negotiator AI</div>
        </div>

        {/* Working Theme Pill Toggle */}
        <button
          type="button"
          className="theme-pill-toggle"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          onClick={toggleTheme}
          aria-label="Toggle light/dark theme"
        >
          <div className="theme-toggle-knob">
            {theme === 'light' ? <Sun size={11} /> : <Moon size={11} />}
          </div>
        </button>
      </div>

      {/* Interactive Search Input with Dropdown */}
      <div className="sidebar-search" ref={searchContainerRef}>
        <Search size={15} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder="Search modules..."
          className="sidebar-search-input"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsSearchOpen(false);
            }
            if (e.key === 'Enter' && searchResults.length > 0) {
              handleSelectModule(searchResults[0].path);
            }
          }}
        />
        {searchQuery && (
          <button
            type="button"
            className="sidebar-search-clear"
            onClick={() => {
              setSearchQuery('');
              setIsSearchOpen(false);
            }}
            title="Clear search"
          >
            <X size={13} />
          </button>
        )}

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div className="search-results-dropdown">
            {searchResults.length > 0 ? (
              searchResults.map((mod) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.path}
                    className="search-result-item"
                    onClick={() => handleSelectModule(mod.path)}
                  >
                    <Icon size={16} className="search-result-icon" />
                    <div className="search-result-info">
                      <span className="search-result-title">{mod.name}</span>
                      <span className="search-result-section">{mod.section}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="search-no-results">
                No modules found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">

        {/* Section 1: Main Menu */}
        <div className="nav-section-title">Main Menu</div>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} className="nav-icon" />
          <span>Dashboard</span>
          <span className="nav-badge">Overview</span>
        </NavLink>

        <NavLink
          to="/scenarios"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Layers size={18} className="nav-icon" />
          <span>Scenarios</span>
          <span className="nav-badge">3</span>
        </NavLink>

        <NavLink
          to="/agents"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} className="nav-icon" />
          <span>Agent Configuration</span>
        </NavLink>

        {/* Section 2: Negotiation Execution */}
        <div className="nav-section-title">Simulation</div>

        <NavLink
          to="/arena"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Swords size={18} className="nav-icon" />
          <span>Negotiation Arena</span>
          <span className="nav-badge nav-badge-pill">Live</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} className="nav-icon" />
          <span>History & Reports</span>
        </NavLink>

        {/* Section 3: System */}
        <div className="nav-section-title">System</div>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} className="nav-icon" />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Bottom Profile Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-profile">
            <div className="avatar-wrapper">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={displayName}
                  className="user-avatar"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="user-avatar">{getInitials()}</div>
              )}
              <span className="online-dot" />
            </div>
            <div className="user-details" style={{ maxWidth: '140px', overflow: 'hidden' }}>
              <span className="user-name" title={displayName} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <span className="user-email" title={displayEmail} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {displayEmail}
              </span>
            </div>
          </div>
          <button
            className="user-action-btn"
            title="Sign Out"
            type="button"
            onClick={() => setShowConfirmLogout(true)}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowConfirmLogout(false)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '20px',
              maxWidth: '380px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
              Are you sure you want to log out?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              You will be signed out of your current session and redirected to the login screen.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onClick={() => setShowConfirmLogout(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                  transition: 'background 0.2s',
                }}
                onClick={async () => {
                  setShowConfirmLogout(false);
                  await logout();
                }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>


  );
};

export default Sidebar;
