import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  GraduationCap,
  FileText,
  Settings,
  Search,
  LogOut,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useScenario } from '../context/ScenarioContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { t } = useSettings();
  const { selectedScenarioId } = useScenario();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Active status for the 3-step Simulation Mode workflow
  const isSimulationActive = ['/scenarios', '/agents', '/arena', '/simulation'].includes(location.pathname);

  // Search state and indexing
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const MODULES = [
    {
      name: t ? t('dashboard') : 'Dashboard',
      path: '/',
      section: t ? t('mainMenu') : 'Main Menu',
      icon: LayoutDashboard,
      keywords: ['home', 'overview', 'summary', 'workspace', 'start']
    },
    {
      name: t ? t('simulationMode') : 'Simulation Mode',
      path: '/scenarios',
      section: t ? t('mainMenu') : 'Main Menu',
      icon: Bot,
      keywords: ['simulation', 'mode', 'scenarios', 'agents', 'arena', 'ai vs ai', 'autonomous', 'vendor', 'pricing', 'job offer', 'budget']
    },
    {
      name: t ? t('practiceMode') : 'Practice Mode',
      path: '/practice',
      section: t ? t('mainMenu') : 'Main Menu',
      icon: GraduationCap,
      keywords: ['practice', 'opponent', 'human vs ai', 'skills', 'training', 'learn', 'interactive']
    },
    {
      name: t ? t('history') : 'History & Reports',
      path: '/history',
      section: t ? t('mainMenu') : 'Main Menu',
      icon: FileText,
      keywords: ['analytics', 'outcome', 'metrics', 'concession', 'curves', 'archive']
    },
    {
      name: t ? t('profileAndSettings') : 'Profile & Settings',
      path: '/settings',
      section: t ? t('mainMenu') : 'Main Menu',
      icon: Settings,
      keywords: ['profile', 'settings', 'account', 'avatar', 'preferences', 'appearance', 'language', 'theme']
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
    if (onClose) onClose();
    if (path === '/agents' && !selectedScenarioId) {
      navigate('/scenarios', {
        state: {
          error: t ? t('pleaseSelectScenario') : 'Please select a negotiation scenario before proceeding to agent configuration.'
        }
      });
    } else {
      navigate(path);
    }
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
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div
          className="brand-wrapper"
          onClick={() => {
            if (onClose) onClose();
            navigate('/');
          }}
          style={{ cursor: 'pointer' }}
          title="Go to Dashboard"
        >
          <img src="/logo.png" alt="Negotiator AI" className="brand-logo" />
          <div className="brand-title">Negotiator AI</div>
        </div>

        {/* Mobile Close Button (shown on mobile screens) */}
        <button
          type="button"
          className="sidebar-mobile-close-btn"
          onClick={onClose}
          aria-label="Close navigation"
          title="Close menu"
        >
          <X size={24} strokeWidth={2.2} />
        </button>
      </div>

      {/* Interactive Search Input with Dropdown */}
      <div className="sidebar-search" ref={searchContainerRef}>
        <Search size={16} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder={t ? t('searchPlaceholder') : 'Search modules...'}
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
            <X size={14} />
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
                    <Icon size={18} className="search-result-icon" />
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
        {/* Only one main menu heading */}
        <div className="nav-section-title">{t ? t('mainMenu') : 'Main Menu'}</div>

        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={22} className="nav-icon" />
          <span>{t ? t('dashboard') : 'Dashboard'}</span>
          <span className="nav-badge">{t ? t('overview') : 'Overview'}</span>
        </NavLink>

        <NavLink
          to="/scenarios"
          onClick={onClose}
          className={`nav-link ${isSimulationActive ? 'active' : ''}`}
          title={t ? t('simulationModeDesc') : 'Watch AI agents negotiate autonomously.'}
        >
          <Bot size={22} className="nav-icon" />
          <span>{t ? t('simulationMode') : 'Simulation Mode'}</span>
        </NavLink>

        <NavLink
          to="/practice"
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          title={t ? t('practiceModeDesc') : 'Practice negotiation skills with an AI opponent.'}
        >
          <GraduationCap size={22} className="nav-icon" />
          <span>{t ? t('practiceMode') : 'Practice Mode'}</span>
        </NavLink>

        <NavLink
          to="/history"
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={22} className="nav-icon" />
          <span>{t ? t('history') : 'History & Reports'}</span>
        </NavLink>

        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={22} className="nav-icon" />
          <span>{t ? t('settings') : 'Settings'}</span>
        </NavLink>
      </nav>

      {/* Bottom Profile Footer */}
      <div className="sidebar-footer">
        <div
          className="user-card"
          onClick={() => {
            if (onClose) onClose();
            navigate('/settings');
          }}
          style={{ cursor: 'pointer' }}
          title="Open Profile & Settings"
        >
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
              {t ? t('logoutTitle') : 'Are you sure you want to log out?'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              {t ? t('logoutDesc') : 'You will be signed out of your current session and redirected to the login screen.'}
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
                {t ? t('cancel') : 'Cancel'}
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
                {t ? t('yesSignOut') : 'Yes, Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>


  );
};

export default Sidebar;
