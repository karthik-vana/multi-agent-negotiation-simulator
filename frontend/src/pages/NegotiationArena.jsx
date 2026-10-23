import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Swords,
  Play,
  Pause,
  RotateCcw,
  StepForward,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Sliders,
  MessageSquare,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { useSettings } from '../context/SettingsContext';
import { useNegotiation, STATUS } from '../context/NegotiationContext';
import { getScenarioById } from '../data/scenarios';
import { validateNegotiationConfig } from '../utils/configurationValidator';
import './NegotiationArena.css';

/* -------------------------------------------------------------------------- */
/* Helper Functions                                                           */
/* -------------------------------------------------------------------------- */

const AGENT_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706'];

function getAgentInitials(name = '') {
  if (!name) return 'AG';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatParamLabel(key = '') {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function formatParamValue(val) {
  if (typeof val === 'number') {
    return val >= 1000 ? `$${val.toLocaleString()}` : String(val);
  }
  return String(val ?? '—');
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const NegotiationArena = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useSettings();
  const {
    selectedScenarioId,
    selectedScenario,
    agentPersonalities,
  } = useScenario();

  const {
    status,
    currentRound,
    maxRounds,
    conversationHistory,
    activeAgent,
    agents,
    scenario,
    agreementTerms,
    terminationReason,
    isTerminated,
    isAutoRunning,
    initNegotiation,
    startNegotiation,
    pauseNegotiation,
    stepOneTurn,
    resetNegotiation,
  } = useNegotiation();

  const conversationEndRef = useRef(null);

  // 1. Resolve configuration from route state or Context fallback
  const resolvedConfig = useMemo(() => {
    // If state was provided by AgentConfiguration navigation
    if (location.state?.negotiationConfig) {
      return location.state.negotiationConfig;
    }

    // Fallback: build from ScenarioContext
    const activeScen =
      selectedScenario || (selectedScenarioId ? getScenarioById(selectedScenarioId) : null);
    if (!activeScen) return null;

    const scopedPersonalities = {};
    if (activeScen.agents) {
      activeScen.agents.forEach((agent) => {
        scopedPersonalities[agent.id] =
          agentPersonalities[agent.id] || agent.defaultPersonality;
      });
    }

    const validation = validateNegotiationConfig(activeScen, scopedPersonalities);
    return validation.isValid ? validation.validatedConfig : null;
  }, [location.state, selectedScenario, selectedScenarioId, agentPersonalities]);

  // 2. Initialize orchestrator on mount or when config changes
  useEffect(() => {
    if (resolvedConfig) {
      // Only re-init if scenario changed or status is idle
      if (!scenario || scenario.id !== resolvedConfig.scenarioId) {
        initNegotiation(resolvedConfig);
      }
    }
  }, [resolvedConfig, scenario, initNegotiation]);

  // 3. Auto-scroll conversation timeline as turns are added
  useEffect(() => {
    if (conversationHistory.length > 0) {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory.length]);

  // If no scenario configured at all, show empty fallback
  if (!resolvedConfig && !scenario) {
    return (
      <div className="negotiation-arena-page">
        <div className="arena-no-config">
          <div className="arena-no-config-icon">
            <AlertTriangle size={28} />
          </div>
          <h2>{t ? t('noActiveSimulation') : 'No Active Negotiation Configured'}</h2>
          <p>
            {t
              ? t('noActiveSimulationDesc')
              : 'Please select a scenario and configure agent personalities before launching the simulation arena.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/scenarios')}
            className="arena-ctrl-btn arena-ctrl-btn--primary"
          >
            <Layers size={16} />
            <span>{t ? t('selectScenario') : 'Select Scenario'}</span>
          </button>
        </div>
      </div>
    );
  }

  const activeScen = scenario || resolvedConfig?.scenario;
  const currentAgents = agents.length > 0 ? agents : resolvedConfig?.agents || [];
  const scenarioKey = activeScen?.id ? activeScen.id.replace(/-/g, '_') : '';
  const scenarioName = activeScen
    ? (t ? (t(`scenario_${scenarioKey}_name`) || activeScen.name) : activeScen.name)
    : 'Negotiation Arena';

  return (
    <div className="negotiation-arena-page">
      {/* Navigation Header */}
      <div className="agent-page-header-row" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => navigate('/agents')}
          className="btn-back-scenario"
          title="Back to Agent Configuration"
        >
          <ArrowLeft size={16} />
          <span>{t ? t('backToAgentConfig') : 'Back to Agent Configuration'}</span>
        </button>

        <div className="agent-stepper-pill">
          <Bot size={14} />
          <span>{t ? t('step3Arena') : 'Step 3 of 3 • Autonomous AI vs AI Arena'}</span>
        </div>
      </div>

      {/* Top Header Bar */}
      <div className="arena-header-bar">
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            {scenarioName}
          </h1>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {activeScen?.category || 'Autonomous AI Simulation'} • {activeScen?.estimatedRounds || `${maxRounds} Rounds Max`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="arena-round-badge">
            <Clock size={14} style={{ color: 'var(--primary)' }} />
            <span>
              Round {currentRound || 0} of {maxRounds}
            </span>
          </div>

          <div className={`arena-status-badge arena-status-badge--${status}`}>
            <span className="arena-status-dot" />
            <span>
              {status === STATUS.IDLE && 'Ready'}
              {status === STATUS.RUNNING && 'In Progress'}
              {status === STATUS.PAUSED && 'Paused'}
              {status === STATUS.AGREED && 'Deal Agreed'}
              {status === STATUS.REJECTED && 'Breakdown'}
              {status === STATUS.MAX_ROUNDS && 'Max Rounds'}
            </span>
          </div>
        </div>
      </div>

      {/* Agent Cards Row */}
      <div className="arena-agents-row">
        {currentAgents.map((agent, index) => {
          const isActive = status === STATUS.RUNNING && activeAgent?.id === agent.id;
          const personality = agent.personality || agent.defaultPersonality;
          const color = AGENT_COLORS[index % AGENT_COLORS.length];

          return (
            <div
              key={agent.id}
              className={`arena-agent-panel ${isActive ? 'arena-agent-panel--active' : ''}`}
            >
              <div className="arena-agent-panel-header">
                <div
                  className="arena-agent-avatar"
                  style={{ backgroundColor: color }}
                >
                  {getAgentInitials(agent.name || agent.role)}
                </div>

                <div className="arena-agent-meta">
                  <div className="arena-agent-name">{agent.name || agent.role}</div>
                  <div className="arena-agent-role">{agent.role}</div>
                </div>

                <span className="arena-agent-personality-pill">
                  {personality}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                <strong>Goal:</strong> {agent.primaryGoal}
              </div>

              {isActive && (
                <div className="arena-active-indicator">
                  <span className="arena-active-dot" />
                  <span>Formulating response...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="arena-controls-bar">
        {status === STATUS.IDLE && (
          <button
            type="button"
            onClick={startNegotiation}
            className="arena-ctrl-btn arena-ctrl-btn--primary"
            id="btn-start-negotiation"
          >
            <Play size={16} />
            <span>Start Negotiation</span>
          </button>
        )}

        {status === STATUS.RUNNING && (
          <button
            type="button"
            onClick={pauseNegotiation}
            className="arena-ctrl-btn"
            id="btn-pause-negotiation"
          >
            <Pause size={16} />
            <span>Pause</span>
          </button>
        )}

        {status === STATUS.PAUSED && (
          <button
            type="button"
            onClick={startNegotiation}
            className="arena-ctrl-btn arena-ctrl-btn--primary"
            id="btn-resume-negotiation"
          >
            <Play size={16} />
            <span>Resume</span>
          </button>
        )}

        <button
          type="button"
          onClick={stepOneTurn}
          disabled={status === STATUS.RUNNING || isTerminated}
          className="arena-ctrl-btn"
          id="btn-step-turn"
          title="Advance exactly one turn"
        >
          <StepForward size={16} />
          <span>Step (1 Turn)</span>
        </button>

        <button
          type="button"
          onClick={resetNegotiation}
          disabled={status === STATUS.IDLE}
          className="arena-ctrl-btn"
          id="btn-reset-negotiation"
          title="Reset negotiation to beginning"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/agents')}
          className="arena-ctrl-btn"
          title="Edit agent personalities"
        >
          <Sliders size={16} />
          <span>Edit Agents</span>
        </button>
      </div>

      {/* Outcome Panel (if terminated) */}
      {isTerminated && (
        <div className={`arena-outcome-panel arena-outcome-panel--${status}`}>
          <div className="arena-outcome-header">
            <div className={`arena-outcome-icon arena-outcome-icon--${status}`}>
              {status === STATUS.AGREED && <CheckCircle2 size={24} />}
              {status === STATUS.REJECTED && <XCircle size={24} />}
              {status === STATUS.MAX_ROUNDS && <AlertTriangle size={24} />}
            </div>

            <div>
              <div className="arena-outcome-title">
                {status === STATUS.AGREED && 'Agreement Reached!'}
                {status === STATUS.REJECTED && 'Negotiation Breakdown'}
                {status === STATUS.MAX_ROUNDS && 'Max Rounds Limit Reached'}
              </div>
              <div className="arena-outcome-reason">{terminationReason}</div>
            </div>
          </div>

          {status === STATUS.AGREED && agreementTerms && (
            <div>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '10px',
                  color: 'var(--text-main)',
                }}
              >
                Final Agreed Terms:
              </div>
              <div className="arena-outcome-terms">
                {Object.entries(agreementTerms).map(([key, val]) => (
                  <div key={key} className="arena-outcome-term-item">
                    <span className="arena-outcome-term-label">{formatParamLabel(key)}:</span>
                    <span className="arena-outcome-term-value">{formatParamValue(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conversation Timeline */}
      <div className="arena-conversation-wrap">
        <div className="arena-conversation-header">
          <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
          <span>Conversation History ({conversationHistory.length} turns)</span>
        </div>

        <div className="arena-conversation-list">
          {conversationHistory.length === 0 ? (
            <div className="arena-conversation-empty">
              <Swords size={36} style={{ opacity: 0.35, marginBottom: '8px' }} />
              <div>Negotiation has not started yet.</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Click <strong>"Start Negotiation"</strong> to let the AI agents interact autonomously, or <strong>"Step"</strong> to observe turn by turn.
              </div>
            </div>
          ) : (
            conversationHistory.map((turn, i) => {
              const agentIndex = currentAgents.findIndex((a) => a.id === turn.agentId);
              const color = AGENT_COLORS[(agentIndex >= 0 ? agentIndex : 0) % AGENT_COLORS.length];

              return (
                <div key={turn.id || i} className="arena-turn-entry">
                  <div
                    className="arena-turn-avatar"
                    style={{ backgroundColor: color }}
                  >
                    {getAgentInitials(turn.agentName)}
                  </div>

                  <div className="arena-turn-body">
                    <div className="arena-turn-header">
                      <span className="arena-turn-agent-name">{turn.agentName}</span>
                      <span className={`arena-turn-action-pill arena-turn-action-pill--${turn.action}`}>
                        {turn.action.replace('_', ' ')}
                      </span>
                      <span className="arena-turn-round-label">
                        Round {turn.round} • Turn #{turn.turnNumber}
                      </span>
                    </div>

                    <div className="arena-turn-message">{turn.message}</div>

                    {turn.offer && Object.keys(turn.offer).length > 0 && (
                      <div className="arena-turn-offer-grid">
                        {Object.entries(turn.offer).map(([key, val]) => (
                          <div key={key} className="arena-offer-item">
                            <span className="arena-offer-label">{formatParamLabel(key)}:</span>
                            <span className="arena-offer-value">{formatParamValue(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={conversationEndRef} />
        </div>
      </div>
    </div>
  );
};

export default NegotiationArena;
