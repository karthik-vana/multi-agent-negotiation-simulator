import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, ArrowLeft, Bot, Sliders, CheckCircle2, Layers, Sparkles } from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { useSettings } from '../context/SettingsContext';
import { getScenarioById } from '../data/scenarios';

const NegotiationArenaPlaceholder = () => {
  const navigate = useNavigate();
  const { selectedScenarioId, selectedScenario } = useScenario();
  const { t } = useSettings();

  const activeScenario =
    selectedScenario || (selectedScenarioId ? getScenarioById(selectedScenarioId) : null);

  const scenarioKey = activeScenario ? activeScenario.id.replace(/-/g, '_') : '';
  const scenarioName = activeScenario
    ? (t ? (t(`scenario_${scenarioKey}_name`) || activeScenario.name) : activeScenario.name)
    : '';

  return (
    <div className="scenario-selection-page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Top Stepper and Back Navigation */}
      <div className="agent-page-header-row" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => navigate(activeScenario ? '/agents' : '/scenarios')}
          className="btn-back-scenario"
          title="Back to Agent Configuration"
        >
          <ArrowLeft size={16} />
          <span>{activeScenario ? (t ? t('backToAgentConfig') : 'Back to Agent Configuration') : (t ? t('selectScenario') : 'Select Scenario')}</span>
        </button>

        <div className="agent-stepper-pill">
          <Bot size={14} />
          <span>{t ? t('step3Arena') : 'Step 3 of 3 • Autonomous AI vs AI Arena'}</span>
        </div>
      </div>

      {/* Active Scenario Context Banner (if configured) */}
      {activeScenario && (
        <div
          className="active-scenario-banner"
          style={{
            borderLeftColor: activeScenario.accentColor,
            marginBottom: '20px',
          }}
        >
          <div className="scenario-banner-left">
            <div
              className="scenario-banner-icon"
              style={{
                backgroundColor: `${activeScenario.accentColor}18`,
                color: activeScenario.accentColor,
              }}
            >
              <Layers size={20} />
            </div>

            <div className="scenario-banner-info">
              <span className="scenario-banner-label">{t ? t('readyForSimulation') : 'Ready for Simulation Execution'}</span>
              <h2 className="scenario-banner-name">{scenarioName}</h2>
            </div>
          </div>

          <div className="scenario-banner-meta">
            <span className="banner-pill agents-pill">
              <CheckCircle2 size={13} style={{ color: '#10b981' }} />
              {activeScenario.participantCount} {t ? t('configuredAgents') : 'Configured Agents'}
            </span>
            <button
              type="button"
              onClick={() => navigate('/agents')}
              className="btn-reset-defaults"
              title="Edit agent roles and personalities"
            >
              <Sliders size={14} />
              <span>{t ? t('editAgents') : 'Edit Agents'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Under Development Presentation Box */}
      <div className="placeholder-box" style={{ padding: '60px 36px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Under Development Badge */}
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              border: '1px solid rgba(245, 158, 11, 0.28)',
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            <Sparkles size={13} />
            <span>{t ? t('underDevelopment') : 'Under Development'}</span>
          </span>
        </div>

        {/* Icon */}
        <div className="placeholder-icon" style={{ width: '64px', height: '64px', marginBottom: '20px' }}>
          <Swords size={32} />
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
          {t ? t('aiNegotiationArena') : 'AI Negotiation Arena'}
        </h2>

        {/* Description */}
        <p
          style={{
            maxWidth: '580px',
            margin: '0 auto 28px',
            color: 'var(--text-muted)',
            fontSize: '0.96rem',
            lineHeight: 1.6,
          }}
        >
          {t ? t('aiArenaDesc') : "The AI vs AI negotiation engine is under development. Soon, you'll be able to observe autonomous agents exchange offers, evaluate proposals, and work toward mutually acceptable agreements."}
        </p>

        {/* Workflow Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-practice-back"
            onClick={() => navigate('/agents')}
            style={{ textDecoration: 'none' }}
          >
            <Sliders size={16} />
            <span>{t ? t('reviewAgentConfig') : 'Review Agent Configuration'}</span>
          </button>
          <button
            type="button"
            className="btn-practice-back"
            onClick={() => navigate('/scenarios')}
            style={{ textDecoration: 'none' }}
          >
            <Layers size={16} />
            <span>{t ? t('changeScenario') : 'Change Scenario'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NegotiationArenaPlaceholder;
