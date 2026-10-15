import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Play,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { useSettings } from '../context/SettingsContext';
import { getScenarioById } from '../data/scenarios';
import AgentCard from '../components/AgentCard';

const AgentConfiguration = () => {
  const navigate = useNavigate();
  const {
    selectedScenarioId,
    selectedScenario,
    agentPersonalities,
    updateAgentPersonality,
    resetAgentPersonalities,
    lastDraftSaved,
    discardDraft,
  } = useScenario();
  const { t } = useSettings();

  const [notification, setNotification] = useState('');

  // Fallback scenario if none selected (helps during direct development/testing)
  const activeScenario = selectedScenario || getScenarioById('vendor-pricing');

  const handlePersonalityChange = (agentId, personality) => {
    updateAgentPersonality(agentId, personality);
    setNotification(`Updated agent personality.`);
    setTimeout(() => setNotification(''), 2500);
  };

  const handleReset = () => {
    resetAgentPersonalities();
    discardDraft?.();
    setNotification('Restored all agents to default scenario personalities.');
    setTimeout(() => setNotification(''), 2500);
  };

  const handleStartNegotiation = () => {
    // Clear draft as it is promoted to active negotiation session
    discardDraft?.();
    // Navigate to Arena with full configured state
    navigate('/arena', {
      state: {
        scenarioId: activeScenario.id,
        scenario: activeScenario,
        agentPersonalities: agentPersonalities
      }
    });
  };

  const scenarioKey = activeScenario.id.replace(/-/g, '_');
  const scenarioName = t ? (t(`scenario_${scenarioKey}_name`) || activeScenario.name) : activeScenario.name;
  const scenarioCategory = t ? (t(`scenario_${scenarioKey}_category`) || activeScenario.category) : activeScenario.category;

  return (
    <div className="agent-configuration-page">
      {/* Top Navigation Bar with Back Action & Stepper */}
      <div className="agent-page-header-row">
        <button
          type="button"
          onClick={() => navigate('/scenarios')}
          className="btn-back-scenario"
          title="Back to Scenario Selection"
        >
          <ArrowLeft size={16} />
          <span>{t ? t('changeScenario') : 'Change Scenario'}</span>
        </button>

        <div className="agent-stepper-pill">
          <Sliders size={14} />
          <span>{t ? t('step2AgentConfig') : 'Step 2 of 3 • Agent Role & Personality Configuration'}</span>
        </div>
      </div>

      {/* Page Title & Context Description */}
      <div className="agent-page-title-group">
        <h1 className="agent-page-title">{t ? t('configureAgentsTitle') : 'Configure Negotiating Agents'}</h1>
        <p className="agent-page-subtitle">
          {t ? t('configureAgentsSubtitle') : `Review the participating stakeholder roles, primary objectives, and strict boundary constraints loaded dynamically for ${scenarioName}. Customize each agent's behavioral personality below to model realistic negotiation dynamics before initiating the session.`}
        </p>
      </div>

      {/* Active Scenario Context Banner */}
      <div
        className="active-scenario-banner"
        style={{
          borderLeftColor: activeScenario.accentColor
        }}
      >
        <div className="scenario-banner-left">
          <div
            className="scenario-banner-icon"
            style={{
              backgroundColor: `${activeScenario.accentColor}18`,
              color: activeScenario.accentColor
            }}
          >
            <Layers size={20} />
          </div>

          <div className="scenario-banner-info">
            <span className="scenario-banner-label">{t ? t('activeScenarioContext') : 'Active Scenario Context'}</span>
            <h2 className="scenario-banner-name">{scenarioName}</h2>
          </div>
        </div>

        <div className="scenario-banner-meta">
          <span className="banner-pill category-pill">{scenarioCategory}</span>
          <span className="banner-pill agents-pill">
            {activeScenario.participantCount} {t ? t('participatingAgents') : 'Participating Agents'}
          </span>
          <span className="banner-pill rounds-pill">{activeScenario.estimatedRounds}</span>

          <button
            type="button"
            onClick={handleReset}
            className="btn-reset-defaults"
            title="Reset all agent personalities to defaults"
          >
            <RotateCcw size={14} />
            <span>{t ? t('resetDefaults') : 'Reset Defaults'}</span>
          </button>
        </div>
      </div>

      {/* Quick Status Notification Toast */}
      {notification && (
        <div className="agent-config-toast" role="status">
          <CheckCircle2 size={16} className="toast-icon" />
          <span>{notification}</span>
        </div>
      )}

      {/* Responsive Grid of Agent Role Cards */}
      <div className="agent-cards-grid" id="agent-cards-grid">
        {activeScenario.agents?.map((agent) => {
          const currentPersonality =
            agentPersonalities[agent.id] || agent.defaultPersonality;

          return (
            <AgentCard
              key={agent.id}
              agent={agent}
              currentPersonality={currentPersonality}
              onPersonalityChange={handlePersonalityChange}
              scenarioAccent={activeScenario.accentColor}
            />
          );
        })}
      </div>

      {/* Dynamic Validation & Handover Status Box */}
      <div className="agent-validation-banner">
        <div className="validation-status-group">
          <CheckCircle2 size={20} className="validation-success-icon" />
          <div>
            <h4 className="validation-title">
              {t ? t('configValidatedTitle') : 'Configuration Validated & Ready for Simulation'}
            </h4>
            <p className="validation-desc">
              {t ? t('configValidatedDesc') : `All ${activeScenario.participantCount} agent roles are parameter-mapped with bounded goals, operational constraints, and active negotiation personalities. Ready to initialize the Orchestrator Agent.`}
            </p>
          </div>
        </div>

        <div className="validation-action-group">
          <button
            type="button"
            id="start-negotiation-btn"
            onClick={handleStartNegotiation}
            className="btn-start-negotiation"
          >
            <Play size={16} className="play-icon" />
            <span>{t ? t('startNegotiationArena') : 'Start Negotiation Arena'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentConfiguration;
