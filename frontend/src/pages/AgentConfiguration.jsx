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
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { getScenarioById } from '../data/scenarios';
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

  // Fallback scenario if none selected (helps during direct development/testing)
  const activeScenario =
  selectedScenario || getScenarioById(selectedScenarioId);

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
    setNotification(`Updated agent personality to ${personality}.`);
    setTimeout(() => setNotification(''), 2500);
  };

  const handleReset = () => {
    resetAgentPersonalities();
    setNotification('Restored all agents to default scenario personalities.');
    setTimeout(() => setNotification(''), 2500);
  };

  
const handleStartNegotiation = () => {
  const configuredAgents = activeScenario.agents.map((agent) => ({
    ...agent,
    personality:
      agentPersonalities[agent.id] || agent.defaultPersonality
  }));

  navigate('/arena', {
    state: {
      scenarioId: activeScenario.id,
      scenario: activeScenario,
      agents: configuredAgents,
      agentPersonalities: { ...agentPersonalities }
    }
  });
};

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
              Agent Configuration Ready
            </h4>
            <p className="validation-desc">
              Review the selected agents, their goals, constraints, and negotiation personalities before continuing to the next step.
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
            <span>Start Negotiation Arena</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentConfiguration;
