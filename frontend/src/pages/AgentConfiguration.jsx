import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Play,
  Layers,
} from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { getScenarioById } from '../data/scenarios';
import { validateNegotiationConfig } from '../utils/configurationValidator';
import AgentCard from '../components/AgentCard';

const AgentConfiguration = () => {
  const navigate = useNavigate();
  const {
    selectedScenarioId,
    selectedScenario,
    agentPersonalities,
    updateAgentPersonality,
    resetAgentPersonalities
  } = useScenario();

  const [notification, setNotification] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  // Fallback scenario if none selected (helps during direct development/testing)
  const activeScenario =
    selectedScenario || getScenarioById(selectedScenarioId) || getScenarioById('vendor-pricing');

  useEffect(() => {
    if (!activeScenario) {
      navigate('/scenarios', { replace: true });
    }
  }, [activeScenario, navigate]);

  if (!activeScenario) {
    return null;
  }

  const handlePersonalityChange = (agentId, personality) => {
    updateAgentPersonality(agentId, personality);
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    setNotification(`Updated agent personality to ${personality}.`);
    setTimeout(() => setNotification(''), 2500);
  };

  const handleReset = () => {
    resetAgentPersonalities();
    setValidationErrors([]);
    setNotification('Restored all agents to default scenario personalities.');
    setTimeout(() => setNotification(''), 2500);
  };

  const handleStartNegotiation = () => {
    // Validate current configuration at execution time
    const validation = validateNegotiationConfig(activeScenario, agentPersonalities);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    // Hand over structured, validated configuration to the downstream Orchestrator / Arena
    navigate('/arena', {
      state: {
        scenarioId: validation.validatedConfig.scenarioId,
        scenario: validation.validatedConfig.scenario,
        agents: validation.validatedConfig.agents,
        agentPersonalities: { ...agentPersonalities },
        negotiationConfig: validation.validatedConfig,
      }
    });
  };

  // Pre-validate configuration to reflect real-time readiness
  const currentValidation = validateNegotiationConfig(activeScenario, agentPersonalities);

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
          <span>Change Scenario</span>
        </button>

        <div className="agent-stepper-pill">
          <Sliders size={14} />
          <span>Step 2 of 3 • Agent Role & Personality Configuration</span>
        </div>
      </div>

      {/* Page Title & Context Description */}
      <div className="agent-page-title-group">
        <h1 className="agent-page-title">Configure Negotiating Agents</h1>
        <p className="agent-page-subtitle">
          Review the participating stakeholder roles, primary objectives, and strict boundary constraints loaded
          dynamically for <strong>{activeScenario.name}</strong>. Customize each agent's behavioral personality below
          to model realistic negotiation dynamics before initiating the session.
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
            <span className="scenario-banner-label">Active Scenario Context</span>
            <h2 className="scenario-banner-name">{activeScenario.name}</h2>
          </div>
        </div>

        <div className="scenario-banner-meta">
          <span className="banner-pill category-pill">{activeScenario.category}</span>
          <span className="banner-pill agents-pill">
            {activeScenario.participantCount} Participating Agents
          </span>
          <span className="banner-pill rounds-pill">{activeScenario.estimatedRounds}</span>

          <button
            type="button"
            onClick={handleReset}
            className="btn-reset-defaults"
            title="Reset all agent personalities to defaults"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Validation Warning Alert (if user attempts to start with invalid configuration) */}
      {validationErrors.length > 0 && (
        <div className="scenario-alert scenario-alert-warning" role="alert" style={{ marginBottom: '24px' }}>
          <AlertCircle size={20} className="alert-icon" style={{ color: '#ef4444' }} />
          <div className="alert-content">
            <strong style={{ color: '#ef4444' }}>Configuration Validation Failed:</strong>
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              {validationErrors.map((err, idx) => (
                <li key={idx} style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {err}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
          {currentValidation.isValid ? (
            <CheckCircle2 size={20} className="validation-success-icon" />
          ) : (
            <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
          )}
          <div>
            <h4 className="validation-title">
              {currentValidation.isValid
                ? 'Configuration Validated & Ready for Simulation'
                : 'Configuration Incomplete'}
            </h4>
            <p className="validation-desc">
              {currentValidation.isValid
                ? `All ${activeScenario.participantCount} agent roles are parameter-mapped with bounded goals, operational constraints, and active negotiation personalities. Ready to initialize the Orchestrator Agent.`
                : currentValidation.errors[0] || 'Please complete all required fields and select valid agent personalities.'}
            </p>
          </div>
        </div>

        <div className="validation-action-group">
          <button
            type="button"
            id="start-negotiation-btn"
            onClick={handleStartNegotiation}
            className={`btn-start-negotiation ${!currentValidation.isValid ? 'disabled' : ''}`}
            title={
              currentValidation.isValid
                ? 'Launch live negotiation simulation with current agent configuration'
                : currentValidation.errors.join('; ')
            }
          >
            <Play size={16} className="play-icon" />
            <span>Start Negotiation Arena</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentConfiguration;
