import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Header = ({ isMobileNavOpen, onToggleMobileNav }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useSettings();

  const isHome = location.pathname === '/';

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: t ? t('dashboard') : 'Dashboard',
          subtitle: t ? t('headerSubtitleDashboard') : 'Welcome to the Multi-Agent Negotiation Simulator platform'
        };
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

        {/* Back Button (visible when not on dashboard) */}
        {!isHome && (
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

        {/* Direct Back to Dashboard Navigation Button with Large Icon */}
        <button
          type="button"
          className={`header-icon-action-btn header-dashboard-btn ${isHome ? 'active' : ''}`}
          onClick={() => navigate('/')}
          title={t ? t('backToDashboard') : 'Back to Dashboard'}
          aria-label={t ? t('backToDashboard') : 'Back to Dashboard'}
        >
          <LayoutDashboard size={22} strokeWidth={2.2} />
          <span className="header-dashboard-label">
            {t ? (isHome ? t('dashboard') : t('backToDashboard')) : (isHome ? 'Dashboard' : 'Dashboard')}
          </span>
        </button>
      </div>

      <div className="header-title-group">
        <h1 className="header-page-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>
    </header>
  );
};

export default Header;

