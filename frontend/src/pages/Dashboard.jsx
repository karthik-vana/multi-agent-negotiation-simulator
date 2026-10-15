import React from 'react';
import { Bot, Sliders, Play, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Dashboard = () => {
  const { t } = useSettings();

  return (
    <div>
      {/* Welcome & Overview Card */}
      <div className="content-card">
        <h2 className="card-title">
          {t ? t('dashboardWelcomeTitle') : 'Welcome to Multi-Agent Negotiation Simulator'}
        </h2>
        <p className="card-description">
          {t ? t('dashboardWelcomeDesc') : 'An autonomous AI-powered simulation and training platform designed to study multi-stakeholder negotiation dynamics. Autonomous LLM agents represent conflicting parties with customized goals, constraints, and distinct behavioral personalities.'}
        </p>

        {/* Introductory Workflow Card */}
        <div className="intro-grid">
          <div className="intro-item">
            <div className="intro-item-title">
              <Sliders size={16} style={{ color: '#4f46e5' }} />
              <span>{t ? t('workflowStep1Title') : '1. Scenario Selection'}</span>
            </div>
            <p className="intro-item-desc">
              {t ? t('workflowStep1Desc') : 'Select predefined negotiation templates (such as vendor pricing, job offers, or budget allocations) to initialize context and boundary conditions.'}
            </p>
          </div>

          <div className="intro-item">
            <div className="intro-item-title">
              <Bot size={16} style={{ color: '#06b6d4' }} />
              <span>{t ? t('workflowStep2Title') : '2. Agent Configuration'}</span>
            </div>
            <p className="intro-item-desc">
              {t ? t('workflowStep2Desc') : 'Review participating stakeholder roles and configure behavioral personalities (Aggressive, Collaborative, or Risk-Averse).'}
            </p>
          </div>

          <div className="intro-item">
            <div className="intro-item-title">
              <Play size={16} style={{ color: '#10b981' }} />
              <span>{t ? t('workflowStep3Title') : '3. Live Negotiation Arena'}</span>
            </div>
            <p className="intro-item-desc">
              {t ? t('workflowStep3Desc') : 'Observe autonomous AI-vs-AI turn-taking and concessions, or step in directly to negotiate in Practice Mode.'}
            </p>
          </div>
        </div>
      </div>

      {/* Verification Card */}
      <div className="content-card" style={{ borderLeft: '4px solid #4f46e5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            {t ? t('dashboardFoundationTitle') : 'Task 1: Shared Application Foundation Established'}
          </h3>
        </div>
        <p className="card-description" style={{ fontSize: '0.88rem' }}>
          {t ? t('dashboardFoundationDesc') : 'This dashboard verifies the shared application layout, navigation shell, responsive sidebar, and global styling system. All downstream feature modules can now be implemented inside their designated placeholder routes without structural conflicts.'}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
