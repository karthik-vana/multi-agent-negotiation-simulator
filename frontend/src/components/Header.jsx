import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Shield } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Dashboard',
          subtitle: 'Welcome to the Multi-Agent Negotiation Simulator platform'
        };
      case '/scenarios':
        return {
          title: 'Scenarios',
          subtitle: 'Pre-built negotiation contexts and problem templates'
        };
      case '/agents':
        return {
          title: 'Agent Configuration',
          subtitle: 'Define agent roles, negotiation personalities, and boundary constraints'
        };
      case '/arena':
        return {
          title: 'Negotiation Arena',
          subtitle: 'Real-time multi-agent negotiation execution and turn-by-turn reasoning'
        };
      case '/history':
        return {
          title: 'History & Reports',
          subtitle: 'Archived negotiation transcripts, concession curves, and outcome analytics'
        };
      case '/settings':
        return {
          title: 'Settings',
          subtitle: 'Platform parameters, LLM model configuration, and simulation settings'
        };
      default:
        return {
          title: 'Multi-Agent Negotiation Simulator',
          subtitle: 'Autonomous LLM negotiation arena'
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
          <span>Task 1 Layout Ready</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
