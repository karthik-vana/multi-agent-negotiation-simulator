import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Swords,
  Pause,
  Play,
  Square,
  RotateCcw,
  FileText,
  Maximize2,
  Minimize2,
  Users,
  BarChart3,
  ChevronDown,
  Bot,
  Info,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
} from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { useSettings } from '../context/SettingsContext';
import AgentFaceAvatar from '../components/AgentFaceAvatar';
import {
  startSimulation,
  stepSimulation,
  pauseSimulation,
  resumeSimulation,
  restartSimulation,
  endSimulation,
} from '../services/simulationApi';
import './NegotiationArena.css';

const SCENARIO_OPTIONS = [
  { id: 'vendor-pricing', title: 'Vendor Pricing Negotiation', maxRounds: 10 },
  { id: 'job-offer', title: 'Job Offer Negotiation', maxRounds: 8 },
  { id: 'project-budget', title: 'Project Budget Allocation', maxRounds: 12 },
];

const NegotiationArena = () => {
  const navigate = useNavigate();
  const { selectedScenarioId } = useScenario();
  const { t } = useSettings();

  // Active scenario
  const [currentScenarioId, setCurrentScenarioId] = useState(
    selectedScenarioId || 'vendor-pricing'
  );
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false);

  // Simulation State
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [turnRunning, setTurnRunning] = useState(false);

  const transcriptEndRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Initialize Simulation on mount or scenario change
  useEffect(() => {
    let isMounted = true;

    async function initArena() {
      setLoading(true);
      try {
        const simData = await startSimulation(currentScenarioId);
        if (isMounted && simData) {
          setSimulation(simData);
          setIsPaused(false);
        }
      } catch (err) {
        console.error('Failed to init simulation:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initArena();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentScenarioId]);

  // 2. Real-time turn progression timer (runs every 3.5 seconds when active)
  useEffect(() => {
    if (!simulation || isPaused || simulation.status !== 'RUNNING') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(async () => {
      if (turnRunning) return;

      setTurnRunning(true);
      try {
        const updated = await stepSimulation(simulation.id);
        if (updated) {
          setSimulation(updated);
          if (updated.status !== 'RUNNING') {
            setIsPaused(true);
            clearInterval(timerRef.current);
          }
        }
      } catch (err) {
        console.warn('Error taking turn:', err);
      } finally {
        setTurnRunning(false);
      }
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simulation?.id, simulation?.status, isPaused, turnRunning]);

  // 3. Auto-scroll transcript to bottom on new messages
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulation?.messages?.length]);

  // Handle Controls
  const handleTogglePause = async () => {
    if (!simulation) return;
    if (isPaused) {
      setIsPaused(false);
      await resumeSimulation(simulation.id);
    } else {
      setIsPaused(true);
      await pauseSimulation(simulation.id);
    }
  };

  const handleEndSimulation = async () => {
    if (!simulation) return;
    setIsPaused(true);
    const updated = await endSimulation(simulation.id);
    if (updated) setSimulation(updated);
  };

  const handleRestart = async () => {
    setLoading(true);
    setIsPaused(false);
    try {
      const restarted = await restartSimulation(simulation?.id || currentScenarioId);
      if (restarted) setSimulation(restarted);
    } catch (err) {
      console.warn('Restart failed, restarting fresh:', err);
      const fresh = await startSimulation(currentScenarioId);
      if (fresh) setSimulation(fresh);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScenario = (id) => {
    setCurrentScenarioId(id);
    setScenarioDropdownOpen(false);
  };

  // Group messages by round
  const groupedMessages = (simulation?.messages || []).reduce((acc, msg) => {
    const r = msg.round_number || 1;
    if (!acc[r]) acc[r] = [];
    acc[r].push(msg);
    return acc;
  }, {});

  const currentScenarioObj =
    SCENARIO_OPTIONS.find((s) => s.id === currentScenarioId) || SCENARIO_OPTIONS[0];

  const agents = simulation?.agents || [];
  const buyerAgent = agents[0] || {
    role: 'Buyer',
    personality: 'Collaborative',
    goal: 'Get best price with good terms',
    current_offer: 9000,
    stance: 'Seeking agreement',
    progress_percent: 70,
  };
  const sellerAgent = agents[1] || {
    role: 'Seller',
    personality: 'Aggressive',
    goal: 'Maximize profit with stable demand',
    current_offer: 10000,
    stance: 'Holding firm',
    progress_percent: 60,
  };

  const currentRound = simulation?.current_round || 1;
  const maxRounds = simulation?.max_rounds || currentScenarioObj.maxRounds || 10;
  const roundProgress = Math.min(100, Math.round((currentRound / maxRounds) * 100));
  const offersCount = simulation?.offers?.length || 4;
  const currentGap = simulation?.current_gap || 1000;
  const agreementLikelihood = simulation?.agreement_likelihood || 68;

  return (
    <div className={`arena-page-wrapper ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* ========================================================================
          1. Header Section
          ======================================================================== */}
      <div className="arena-header">
        <div className="arena-header-left">
          <div className="arena-header-icon-box">
            <Swords size={22} className="arena-header-icon" />
          </div>
          <div>
            <h1 className="arena-title">Negotiation Arena</h1>
            <p className="arena-subtitle">Watch AI agents negotiate in real time</p>
          </div>
        </div>
      </div>

      {/* ========================================================================
          2. Top Control Bar (Scenario, Status, Round Indicator, Buttons)
          ======================================================================== */}
      <div className="arena-control-bar">
        {/* Scenario Selector Dropdown */}
        <div className="arena-scenario-dropdown-wrap">
          <div
            className="arena-scenario-selector"
            onClick={() => setScenarioDropdownOpen(!scenarioDropdownOpen)}
          >
            <div className="arena-scenario-tag">
              <span className="arena-scenario-label">Scenario</span>
            </div>
            <div className="arena-scenario-current">
              <LayoutGrid size={15} className="arena-grid-icon" />
              <span className="arena-scenario-name">{currentScenarioObj.title}</span>
              <ChevronDown size={14} className="arena-chevron" />
            </div>
          </div>

          {scenarioDropdownOpen && (
            <div className="arena-dropdown-popover">
              {SCENARIO_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  className={`arena-dropdown-item ${opt.id === currentScenarioId ? 'active' : ''}`}
                  onClick={() => handleSelectScenario(opt.id)}
                >
                  <span>{opt.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Status Badge */}
        <div className="arena-status-card">
          <div className="arena-status-indicator">
            <span className={`arena-pulse-dot ${isPaused ? 'paused' : 'live'}`} />
            <span className="arena-status-text">
              {isPaused ? 'SIMULATION PAUSED' : 'LIVE SIMULATION'}
            </span>
          </div>
          <span className="arena-status-subtext">
            {isPaused ? 'Waiting for user action' : 'AI agents are negotiating'}
          </span>
        </div>

        {/* Round Progress Indicator */}
        <div className="arena-round-card">
          <div className="arena-round-top">
            <div className="arena-round-target-icon">
              <div className="arena-target-dot" />
            </div>
            <div className="arena-round-label-wrap">
              <span className="arena-round-label">ROUND</span>
              <span className="arena-round-counter">
                {String(currentRound).padStart(2, '0')} / {String(maxRounds).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="arena-round-progress-track">
            <div
              className="arena-round-progress-bar"
              style={{ width: `${roundProgress}%` }}
            />
          </div>
        </div>

        {/* Simulation Control Buttons */}
        <div className="arena-actions-group">
          <button
            type="button"
            className={`btn-arena-pause ${isPaused ? 'paused' : ''}`}
            onClick={handleTogglePause}
            title={isPaused ? 'Resume simulation' : 'Pause simulation'}
          >
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            type="button"
            className="btn-arena-end"
            onClick={handleEndSimulation}
            title="End simulation"
          >
            <Square size={14} />
            <span>End Simulation</span>
          </button>

          <button
            type="button"
            className="btn-arena-restart"
            onClick={handleRestart}
            title="Restart from round 1"
          >
            <RotateCcw size={14} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* ========================================================================
          3. Main Arena Grid: Left Transcript & Right Status/Metrics
          ======================================================================== */}
      <div className="arena-main-grid">
        {/* LEFT COLUMN: Negotiation Transcript */}
        <div className="arena-transcript-card">
          {/* Card Header */}
          <div className="arena-transcript-header">
            <div className="arena-transcript-title-wrap">
              <FileText size={18} className="arena-card-header-icon" />
              <h2 className="arena-card-title">Negotiation Transcript</h2>
            </div>
            <div className="arena-transcript-header-right">
              <span className="arena-live-pill">
                <span className="arena-live-pill-dot" />
                <span>Live</span>
              </span>
              <button
                type="button"
                className="btn-transcript-expand"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div className="arena-transcript-body">
            {Object.keys(groupedMessages).length === 0 ? (
              <div className="arena-transcript-empty">
                <Bot size={32} />
                <p>Starting simulation and connecting to AI agents...</p>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([roundNum, msgs]) => (
                <div key={`round-${roundNum}`} className="arena-round-group">
                  {/* Round Divider Pill */}
                  <div className="arena-round-divider">
                    <span className="arena-round-pill">Round {roundNum}</span>
                  </div>

                  {/* Messages inside this round */}
                  <div className="arena-messages-stream">
                    {msgs.map((msg) => {
                      const isOrchestrator = msg.sender_type === 'ORCHESTRATOR';
                      const isBuyerMsg =
                        !isOrchestrator &&
                        (msg.sender_role?.toLowerCase().includes('buyer') ||
                          msg.sender_role?.toLowerCase().includes('candidate'));

                      if (isOrchestrator) {
                        return (
                          <div key={msg.id} className="arena-orchestrator-row">
                            <div className="arena-orchestrator-box">
                              <div className="arena-orchestrator-avatar">
                                <Bot size={18} />
                              </div>
                              <div className="arena-orchestrator-content">
                                <div className="arena-orchestrator-header">
                                  <span className="arena-orchestrator-name">
                                    {msg.sender_name || 'Orchestrator Agent'}
                                  </span>
                                  <span className="arena-timestamp">
                                    {msg.timestamp_label || '10:24 AM'}
                                  </span>
                                </div>
                                <p className="arena-orchestrator-text">{msg.message}</p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`arena-chat-row ${isBuyerMsg ? 'buyer-row' : 'seller-row'}`}
                        >
                          {/* Buyer Avatar on Left */}
                          {isBuyerMsg && (
                            <div className="arena-avatar-container buyer-avatar">
                              <AgentFaceAvatar
                                personality={msg.personality || 'Collaborative'}
                                role="Buyer"
                                size={44}
                              />
                            </div>
                          )}

                          {/* Message Bubble + Attached Offer */}
                          <div className={`arena-bubble-wrapper ${isBuyerMsg ? 'buyer' : 'seller'}`}>
                            {/* Message Meta Info Header */}
                            <div className="arena-bubble-meta">
                              {isBuyerMsg ? (
                                <>
                                  <span className="arena-agent-name">{msg.sender_role}</span>
                                  <span className="arena-meta-bullet">•</span>
                                  <span className="arena-agent-personality collaborative">
                                    {msg.personality || 'Collaborative'}
                                  </span>
                                  <span className="arena-meta-spacer" />
                                  <span className="arena-timestamp">
                                    {msg.timestamp_label || '10:21 AM'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="arena-timestamp">
                                    {msg.timestamp_label || '10:22 AM'}
                                  </span>
                                  <span className="arena-meta-spacer" />
                                  <span className="arena-agent-name">{msg.sender_role}</span>
                                  <span className="arena-meta-bullet">•</span>
                                  <span className="arena-agent-personality aggressive">
                                    {msg.personality || 'Aggressive'}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Bubble Content Row (Text + Offer badge) */}
                            <div className="arena-bubble-content-row">
                              {/* Attached Offer Badge for Seller (Placed on left of text) */}
                              {!isBuyerMsg && msg.offer_value && (
                                <div className="arena-attached-offer seller-offer">
                                  <span>Offer: ₹{Number(msg.offer_value).toLocaleString()}</span>
                                </div>
                              )}

                              <div className={`arena-speech-bubble ${isBuyerMsg ? 'buyer-bubble' : 'seller-bubble'}`}>
                                <p className="arena-bubble-text">{msg.message}</p>
                              </div>

                              {/* Attached Offer Badge for Buyer (Placed on right of text) */}
                              {isBuyerMsg && msg.offer_value && (
                                <div className="arena-attached-offer buyer-offer">
                                  <span>Offer: ₹{Number(msg.offer_value).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Seller Avatar on Right */}
                          {!isBuyerMsg && (
                            <div className="arena-avatar-container seller-avatar">
                              <AgentFaceAvatar
                                personality={msg.personality || 'Aggressive'}
                                role="Seller"
                                size={44}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Bottom Info Bar */}
          <div className="arena-transcript-footer">
            <Info size={15} className="arena-footer-info-icon" />
            <span>
              Simulation is running — AI agents are negotiating automatically. No manual input is required.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Agent Status & Negotiation Metrics */}
        <div className="arena-sidebar-col">
          {/* Agent Status Card */}
          <div className="arena-side-card">
            <div className="arena-side-card-header">
              <Users size={17} className="arena-card-header-icon" />
              <h2 className="arena-card-title">Agent Status</h2>
            </div>

            <div className="arena-agents-list">
              {/* Agent 1: Buyer */}
              <div className="arena-agent-item-card">
                <div className="arena-agent-item-top">
                  <div className="arena-agent-avatar-small">
                    <AgentFaceAvatar
                      personality={buyerAgent.personality || 'Collaborative'}
                      role="Buyer"
                      size={42}
                    />
                  </div>
                  <div className="arena-agent-item-id">
                    <div className="arena-agent-item-name-row">
                      <span className="arena-agent-main-role">{buyerAgent.role}</span>
                      <span className="arena-role-pill collaborative">
                        {buyerAgent.personality || 'Collaborative'}
                      </span>
                    </div>
                    <span className="arena-agent-active-badge">Active</span>
                  </div>
                </div>

                <p className="arena-agent-goal-text">
                  Goal: {buyerAgent.goal || 'Get best price with good terms'}
                </p>

                <div className="arena-agent-offer-stance-row">
                  <div className="arena-agent-stat-col">
                    <span className="arena-stat-label">Current offer</span>
                    <span className="arena-stat-value buyer-val">
                      ₹{Number(buyerAgent.current_offer || 9000).toLocaleString()} per unit
                    </span>
                  </div>
                  <div className="arena-agent-stat-col align-right">
                    <span className="arena-stat-label">Stance</span>
                    <span className="arena-stat-stance buyer-stance">
                      {buyerAgent.stance || 'Seeking agreement'}
                    </span>
                  </div>
                </div>

                <div className="arena-agent-progress-wrap">
                  <div
                    className="arena-agent-progress-bar buyer-progress"
                    style={{ width: `${buyerAgent.progress_percent || 70}%` }}
                  />
                  <span className="arena-progress-percent-label">
                    {buyerAgent.progress_percent || 70}%
                  </span>
                </div>
              </div>

              {/* Agent 2: Seller */}
              <div className="arena-agent-item-card">
                <div className="arena-agent-item-top">
                  <div className="arena-agent-avatar-small">
                    <AgentFaceAvatar
                      personality={sellerAgent.personality || 'Aggressive'}
                      role="Seller"
                      size={42}
                    />
                  </div>
                  <div className="arena-agent-item-id">
                    <div className="arena-agent-item-name-row">
                      <span className="arena-agent-main-role">{sellerAgent.role}</span>
                      <span className="arena-role-pill aggressive">
                        {sellerAgent.personality || 'Aggressive'}
                      </span>
                    </div>
                    <span className="arena-agent-active-badge">Active</span>
                  </div>
                </div>

                <p className="arena-agent-goal-text">
                  Goal: {sellerAgent.goal || 'Maximize profit with stable demand'}
                </p>

                <div className="arena-agent-offer-stance-row">
                  <div className="arena-agent-stat-col">
                    <span className="arena-stat-label">Current offer</span>
                    <span className="arena-stat-value seller-val">
                      ₹{Number(sellerAgent.current_offer || 10000).toLocaleString()} per unit
                    </span>
                  </div>
                  <div className="arena-agent-stat-col align-right">
                    <span className="arena-stat-label">Stance</span>
                    <span className="arena-stat-stance seller-stance">
                      {sellerAgent.stance || 'Holding firm'}
                    </span>
                  </div>
                </div>

                <div className="arena-agent-progress-wrap">
                  <div
                    className="arena-agent-progress-bar seller-progress"
                    style={{ width: `${sellerAgent.progress_percent || 60}%` }}
                  />
                  <span className="arena-progress-percent-label">
                    {sellerAgent.progress_percent || 60}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Negotiation Metrics Card */}
          <div className="arena-side-card">
            <div className="arena-side-card-header">
              <BarChart3 size={17} className="arena-card-header-icon" />
              <h2 className="arena-card-title">Negotiation Metrics</h2>
            </div>

            <div className="arena-metrics-grid">
              {/* Metric 1: Current Round */}
              <div className="arena-metric-box">
                <span className="arena-metric-label">Current Round</span>
                <span className="arena-metric-number">
                  {currentRound} / {maxRounds}
                </span>
                <div className="arena-metric-bar-track">
                  <div
                    className="arena-metric-bar-fill blue-fill"
                    style={{ width: `${roundProgress}%` }}
                  />
                </div>
              </div>

              {/* Metric 2: Offers Exchanged */}
              <div className="arena-metric-box">
                <span className="arena-metric-label">Offers Exchanged</span>
                <span className="arena-metric-number">{offersCount}</span>
                <div className="arena-metric-bar-track">
                  <div
                    className="arena-metric-bar-fill purple-fill"
                    style={{ width: `${Math.min(100, offersCount * 22)}%` }}
                  />
                </div>
              </div>

              {/* Metric 3: Current Gap */}
              <div className="arena-metric-box">
                <span className="arena-metric-label">Current Gap</span>
                <span className="arena-metric-number gap-number">
                  ₹{Number(currentGap).toLocaleString()}
                </span>
                <div className="arena-metric-bar-track">
                  <div
                    className="arena-metric-bar-fill red-fill"
                    style={{ width: `${Math.min(100, Math.max(15, currentGap / 30))}%` }}
                  />
                </div>
              </div>

              {/* Metric 4: Agreement Likelihood */}
              <div className="arena-metric-box">
                <span className="arena-metric-label">Agreement Likelihood</span>
                <span className="arena-metric-number green-number">
                  {agreementLikelihood}%
                </span>
                <div className="arena-metric-bar-track">
                  <div
                    className="arena-metric-bar-fill green-fill"
                    style={{ width: `${agreementLikelihood}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NegotiationArena;
