import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Shield } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Header = () => {
  const location = useLocation();
  const { t } = useSettings();

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
          title: t ? t('arena') : 'Negotiation Arena',
          subtitle: t ? t('headerSubtitleArena') : 'Real-time multi-agent negotiation execution and turn-by-turn reasoning'
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
      <div className="header-title-group">
        <h1 className="header-page-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>

      <div className="header-actions">
        <div className="header-status-chip">
          <Shield size={14} style={{ color: '#4f46e5' }} />
          <span>{t ? t('statusReady') : 'System Ready'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
