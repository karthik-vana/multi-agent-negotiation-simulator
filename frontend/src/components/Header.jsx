import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const Header = ({ isMobileNavOpen, onToggleMobileNav }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useSettings();
  const { currentUser } = useAuth();

  const isHome = location.pathname === '/';
  const isArena = location.pathname === '/arena';

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/': {
        const userDisplayName =
          currentUser?.displayName ||
          (currentUser?.email ? currentUser.email.split('@')[0] : null) ||
          'Negotiator';
        return {
          title: `Welcome, ${userDisplayName} 👋`,
          subtitle: t
            ? t('headerSubtitleDashboard')
            : 'Welcome to the Multi-Agent Negotiation Simulator platform',
        };
      }
      case '/scenarios':
        return {
          title: t ? t('scenarios') : 'Scenarios',
          subtitle: t ? t('headerSubtitleScenarios') : 'Pre-built negotiation contexts and problem templates'
        };
      case '/agents':
        return {
          title: t ? t('agentConfig') : 'Agent Configuration',
          subtitle: t ? t('headerSubtitleAgents') : 'Define agent roles, negotiation personalities, and boundary constraints'
        };
      case '/arena':
        return {
          title: t ? t('aiNegotiationArena') : 'AI Negotiation Arena',
          subtitle: t ? t('headerSubtitleArena') : 'Autonomous AI vs AI negotiation execution'
        };
      case '/practice':
        return {
          title: t ? t('practiceMode') : 'Practice Mode',
          subtitle: t ? t('headerSubtitlePractice') : 'Practice negotiation skills with an AI opponent'
        };
      case '/history':
        return {
          title: t ? t('history') : 'History & Reports',
          subtitle: t ? t('headerSubtitleHistory') : 'Archived negotiation transcripts, concession curves, and outcome analytics'
        };
      case '/analytics':
        return {
          title: 'Negotiation Analytics',
          subtitle: 'Audit telemetry, behavioral tactics, and scenario outcome distributions'
        };
      case '/strategy-library':
      case '/strategy_library':
        return {
          title: 'Strategy Library',
          subtitle: 'Tactical negotiation frameworks, principled blueprints, and Gemini AI assistant'
        };
      case '/profile':
      case '/settings':
        return {
          title: t ? t('profileAndSettings') : 'Profile & Settings',
          subtitle: t ? t('headerSubtitleSettings') : 'Manage your profile details, application preferences, and system configuration.'
        };
      default:
        return {
          title: 'Negotiator AI',
          subtitle: t ? t('headerSubtitleDefault') : 'Autonomous LLM negotiation arena'
        };
    }
  };

  const { title, subtitle } = getPageMeta();

  return (
    <header className="app-header">
      <div className="header-nav-controls">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          className="header-mobile-toggle-btn"
          onClick={onToggleMobileNav}
          aria-label={isMobileNavOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
          title={isMobileNavOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileNavOpen ? <X size={26} strokeWidth={2.2} /> : <Menu size={26} strokeWidth={2.2} />}
        </button>

        {/* Back Button (hidden on dashboard and arena) */}
        {!isHome && !isArena && (
          <button
            type="button"
            className="header-icon-action-btn header-back-btn"
            onClick={() => navigate(-1)}
            title="Go Back"
            aria-label="Go Back"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
        )}
      </div>

      <div className="header-title-group">
        <h1 className="header-page-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>
    </header>
  );
};

export default Header;
