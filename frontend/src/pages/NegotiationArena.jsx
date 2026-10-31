import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ChevronRight,
  Bot,
  Info,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Mic,
  Send,
  Lightbulb,
  Sparkles,
  User,
} from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { getScenarioById, SCENARIOS } from '../data/scenarios';
import AgentFaceAvatar from '../components/AgentFaceAvatar';
import {
  startSimulation,
  getSimulationState,
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
  const location = useLocation();
  const { selectedScenarioId, selectedScenario, agentPersonalities } = useScenario();
  const { t } = useSettings();
  const { currentUser } = useAuth();

  // Active scenario strictly locked to selection
  const currentScenarioId =
    location.state?.scenarioId ||
    selectedScenarioId ||
    'vendor-pricing';

  const effectivePersonalities = {
    ...(agentPersonalities || {}),
    ...(location.state?.agentPersonalities || {}),
  };

  const scenarioMeta =
    location.state?.scenario ||
    selectedScenario ||
    getScenarioById(currentScenarioId) ||
    SCENARIOS[0];

  // Simulation State: always enter in full screen mode by default
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen] = useState(true);
  const [turnRunning, setTurnRunning] = useState(false);

  // Practice Mode detection: strictly true ONLY when entering Practice Mode flow
  const isPracticeMode = Boolean(
    location.state?.isPractice === true ||
    location.state?.mode === 'practice' ||
    location.search.includes('practice')
  );

  // New UI state
  const [aiCoachEnabled, setAiCoachEnabled] = useState(true);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [practiceMessage, setPracticeMessage] = useState('');
  const handleSendPracticeMessage = () => {
    if (!practiceMessage.trim()) return;
    console.log('[Practice] Message sent:', practiceMessage);
    setPracticeMessage('');
  };

  const transcriptEndRef = useRef(null);
  const timerRef = useRef(null);
  const simulationRef = useRef(null);

  useEffect(() => {
    simulationRef.current = simulation;
  }, [simulation]);

  // 1. Initialize Simulation on mount or scenario change (restoring active session if returning from report)
  useEffect(() => {
    let isMounted = true;

    async function initArena() {
      setLoading(true);
      try {
        // ONLY restore session if returning from report via "Back to Negotiation Arena"
        const isFromReport = location.state?.restoreSession === true || Boolean(sessionStorage.getItem('viewing_report_sim_id'));
        const reportSimId = location.state?.simId || sessionStorage.getItem('viewing_report_sim_id');

        if (isFromReport && reportSimId) {
          sessionStorage.removeItem('viewing_report_sim_id');
          try {
            const existingSim = await getSimulationState(reportSimId);
            if (isMounted && existingSim && existingSim.id) {
              setSimulation(existingSim);
              setIsPaused(true);
              setLoading(false);
              return;
            }
          } catch (restoreErr) {
            console.warn('Could not restore previous report simulation:', restoreErr);
          }
        }

        // Clean up session storage so any normal visit starts a fresh conversation
        sessionStorage.removeItem('active_arena_sim_id');
        sessionStorage.removeItem('viewing_report_sim_id');

        const customAgents = scenarioMeta?.agents?.map((a) => ({
          id: a.id,
          role: a.role,
          name: a.name,
          goal: a.primaryGoal || a.goal,
          personality: effectivePersonalities?.[a.id] || a.personality || a.defaultPersonality || 'Collaborative',
        }));
        const simData = await startSimulation(
          currentScenarioId,
          customAgents,
          null,
          currentUser?.email || null,
          currentUser?.uid || null
        );
        if (isMounted && simData) {
          setSimulation(simData);
          setIsPaused(false);
          if (simData.id) {
            sessionStorage.setItem('active_arena_sim_id', simData.id);
          }
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
      if (!allowExitRef.current && simulationRef.current) {
        const cur = simulationRef.current;
        const isFin = (cur.status === 'COMPLETED' || cur.status === 'AGREEMENT_REACHED' || cur.status === 'DEADLOCK') && Boolean(cur.agreement);
        if (!isFin && cur.id && cur.status !== 'LEFT_IN_BETWEEN') {
          endSimulation(cur.id, 'User left in between before completion').catch(() => {});
        }
        sessionStorage.removeItem('active_arena_sim_id');
        sessionStorage.removeItem('viewing_report_sim_id');
      }
    };
  }, [currentScenarioId, selectedScenario, agentPersonalities, location.state]);

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

  // Status Helpers
  const isDeadlock = simulation?.status === 'DEADLOCK';
  const isCompleted = simulation?.status === 'COMPLETED' || simulation?.status === 'AGREEMENT_REACHED';
  const isTerminated = isDeadlock || isCompleted;
  const isReallyPaused = isPaused && !isTerminated;

  const [showExitWarning, setShowExitWarning] = useState(false);
  const allowExitRef = useRef(false);

  // Exit guard: lock browser back button in Arena until simulation is explicitly ended
  useEffect(() => {
    window.history.pushState({ arenaLocked: true }, '', window.location.href);

    const handlePopState = () => {
      if (!allowExitRef.current && !isTerminated) {
        window.history.pushState({ arenaLocked: true }, '', window.location.href);
        setShowExitWarning(true);
        setTimeout(() => setShowExitWarning(false), 3500);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isTerminated]);

  // Handle Controls
  const handleTogglePause = async () => {
    if (!simulation || isTerminated) return;
    if (isPaused) {
      setIsPaused(false);
      await resumeSimulation(simulation.id);
    } else {
      setIsPaused(true);
      await pauseSimulation(simulation.id);
    }
  };

  // End simulation: clear active session, do NOT show report in arena, redirect directly to Scenario Selection
  const handleEndSimulation = async () => {
    sessionStorage.removeItem('active_arena_sim_id');
    allowExitRef.current = true;
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const isAlreadyFinished = (isCompleted || isDeadlock || simulation?.status === 'COMPLETED' || simulation?.status === 'AGREEMENT_REACHED' || simulation?.status === 'DEADLOCK') && Boolean(simulation?.agreement);
    if (simulation?.id && !isAlreadyFinished) {
      try {
        await endSimulation(simulation.id, 'User left in between before completion');
      } catch (err) {
        console.warn('Failed to end simulation cleanly:', err);
      }
    }
    navigate('/scenarios');
  };

  // Direct navigation to negotiation report (includes ?from=arena so report page has a "Back to Negotiation Arena" button)
  const handleViewReport = () => {
    allowExitRef.current = true;
    if (simulation?.id) {
      sessionStorage.setItem('viewing_report_sim_id', simulation.id);
      navigate(`/history?id=${simulation.id}&from=arena`);
    } else {
      navigate('/history?from=arena');
    }
  };

  const handleRestart = async () => {
    sessionStorage.removeItem('active_arena_sim_id');
    setLoading(true);
    setIsPaused(false);
    try {
      const customAgents = scenarioMeta?.agents?.map((a) => ({
        id: a.id,
        role: a.role,
        name: a.name,
        goal: a.primaryGoal || a.goal,
        personality: effectivePersonalities?.[a.id] || a.personality || a.defaultPersonality || 'Collaborative',
      }));
      const restarted = await startSimulation(
        currentScenarioId,
        customAgents,
        null,
        currentUser?.email || null,
        currentUser?.uid || null
      );
      if (restarted) {
        setSimulation(restarted);
        if (restarted.id) {
          sessionStorage.setItem('active_arena_sim_id', restarted.id);
        }
      }
    } catch (err) {
      console.warn('Restart failed, restarting fresh:', err);
      const fresh = await startSimulation(
        currentScenarioId,
        null,
        null,
        currentUser?.email || null,
        currentUser?.uid || null
      );
      if (fresh) {
        setSimulation(fresh);
        if (fresh.id) {
          sessionStorage.setItem('active_arena_sim_id', fresh.id);
        }
      }
    } finally {
      setLoading(false);
    }
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

  const simulationAgents = simulation?.agents || [];
  const activeAgentsList = (scenarioMeta?.agents || simulationAgents).map((metaAgent, idx) => {
    const simAgent =
      simulationAgents.find(
        (a) => a.id === metaAgent.id || a.role?.toLowerCase() === metaAgent.role?.toLowerCase()
      ) ||
      simulationAgents[idx] ||
      {};

    const agentId = metaAgent.id || simAgent.id || (idx === 0 ? 'job-candidate' : 'hiring-director');
    const configuredPersonality =
      effectivePersonalities?.[agentId] ||
      effectivePersonalities?.[metaAgent.id] ||
      (idx === 0
        ? (effectivePersonalities?.['job-candidate'] || effectivePersonalities?.['buyer-procurement'] || effectivePersonalities?.['department-a'])
        : (effectivePersonalities?.['hiring-director'] || effectivePersonalities?.['vendor-sales'] || effectivePersonalities?.['department-b'])) ||
      simAgent.personality ||
      metaAgent.personality ||
      metaAgent.defaultPersonality ||
      'Collaborative';

    return {
      ...metaAgent,
      ...simAgent,
      id: agentId,
      name: simAgent.name || metaAgent.name || metaAgent.role,
      role: simAgent.role || metaAgent.role,
      goal: simAgent.goal || metaAgent.primaryGoal || metaAgent.goal,
      personality: configuredPersonality,
      current_offer: simAgent.current_offer || (currentScenarioId === 'job-offer' ? (idx === 0 ? 175000 : 152000) : currentScenarioId === 'project-budget' ? (idx === 0 ? 450000 : (idx === 1 ? 350000 : 300000)) : (idx === 0 ? 95000 : 110000)),
      stance: simAgent.stance || (idx === 0 ? 'Seeking agreement' : 'Evaluating terms'),
      progress_percent: simAgent.progress_percent || 50,
    };
  });

  const buyerAgent = activeAgentsList[0] || {};
  const sellerAgent = activeAgentsList[1] || {};

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

      {/* Exit Warning Toast when user tries to go back without ending simulation */}
      {showExitWarning && (
        <div className="arena-exit-toast">
          <AlertCircle size={18} />
          <span>Active negotiation in progress. Click <strong>End Simulation</strong> to exit to Scenario Selection.</span>
        </div>
      )}

      {/* In-page Negotiation Outcome Message (NO popup modal, NO Scenario Selection button) */}
      {isTerminated && (
        <div className={`arena-outcome-banner ${isDeadlock ? 'banner-deadlock' : 'banner-completed'}`}>
          <div className="arena-outcome-banner-left">
            {isDeadlock ? (
              <AlertCircle size={22} className="outcome-banner-icon text-danger" />
            ) : (
              <CheckCircle2 size={22} className="outcome-banner-icon text-success" />
            )}
            <div className="arena-outcome-banner-text">
              <span className="outcome-banner-title">
                {isDeadlock ? 'Deadlock Detected' : 'Agreement Reached'}
              </span>
              <span className="outcome-banner-desc">
                {isDeadlock
                  ? `Negotiation reached an impasse in Round ${currentRound}. You can inspect the negotiation report below.`
                  : `Negotiation successfully completed in Round ${currentRound} of ${maxRounds}. You can inspect the negotiation report below.`}
              </span>
            </div>
          </div>
          <div className="arena-outcome-banner-actions">
            <button
              type="button"
              className="btn-banner-report"
              onClick={handleViewReport}
              title="Show full negotiation audit report"
            >
              <FileText size={16} />
              <span>Show Negotiation Report</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================
          2. Top Control Bar (Scenario, Status, Round Indicator, Buttons)
          ======================================================================== */}
      <div className="arena-control-bar">
        {/* Scenario Display Pill (Not a dropdown) */}
        <div className="arena-scenario-dropdown-wrap">
          <div className="arena-scenario-selector" title="Active Scenario">
            <div className="arena-scenario-tag">
              <span className="arena-scenario-label">Scenario</span>
            </div>
            <div className="arena-scenario-current">
              <LayoutGrid size={15} className="arena-grid-icon" />
              <span className="arena-scenario-name">{currentScenarioObj.title}</span>
            </div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="arena-status-card">
          <div className="arena-status-indicator">
            <span
              className={`arena-pulse-dot ${
                isDeadlock
                  ? 'deadlock'
                  : isCompleted
                  ? 'completed'
                  : isReallyPaused
                  ? 'paused'
                  : 'live'
              }`}
            />
            <span
              className={`arena-status-text ${
                isDeadlock
                  ? 'status-deadlock'
                  : isCompleted
                  ? 'status-completed'
                  : isReallyPaused
                  ? 'status-paused'
                  : 'status-live'
              }`}
            >
              {isDeadlock
                ? 'DEADLOCK DETECTED'
                : isCompleted
                ? 'AGREEMENT REACHED'
                : isReallyPaused
                ? 'SIMULATION PAUSED'
                : 'LIVE SIMULATION'}
            </span>
          </div>
          <span className="arena-status-subtext">
            {isDeadlock
              ? 'Negotiation reached an impasse'
              : isCompleted
              ? 'Consensus finalized successfully'
              : isReallyPaused
              ? 'Waiting for user action'
              : 'AI agents are negotiating'}
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
          {!isTerminated && (
            <button
              type="button"
              className={`btn-arena-pause ${isReallyPaused ? 'paused' : ''}`}
              onClick={handleTogglePause}
              title={isReallyPaused ? 'Resume simulation' : 'Pause simulation'}
            >
              {isReallyPaused ? <Play size={15} /> : <Pause size={15} />}
              <span>{isReallyPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn-arena-end"
            onClick={handleEndSimulation}
            title="End simulation and return to Scenario Selection"
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
                    {(() => {
                      let turnIdx = 0;
                      return msgs.map((msg) => {
                        const isOrchestrator = msg.sender_type === 'ORCHESTRATOR';

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

                        const isBuyerExplicit =
                          msg.sender_role?.toLowerCase().includes('buyer') ||
                          msg.sender_role?.toLowerCase().includes('candidate');
                        const isSellerExplicit =
                          msg.sender_role?.toLowerCase().includes('seller') ||
                          msg.sender_role?.toLowerCase().includes('vendor') ||
                          msg.sender_role?.toLowerCase().includes('recruiter') ||
                          msg.sender_role?.toLowerCase().includes('hr');

                        let isBuyerMsg = false;
                        if (isBuyerExplicit) {
                          isBuyerMsg = true;
                        } else if (isSellerExplicit) {
                          isBuyerMsg = false;
                        } else {
                          isBuyerMsg = (turnIdx % 2 === 0);
                        }
                        turnIdx++;

                        const activeAgentForMsg = isBuyerMsg ? activeAgentsList[0] : activeAgentsList[1];
                        const displayPersonality = activeAgentForMsg?.personality || msg.personality || (isBuyerMsg ? 'Collaborative' : 'Collaborative');
                        const personalityClass = (displayPersonality || '').toLowerCase().includes('aggressive')
                          ? 'aggressive'
                          : (displayPersonality || '').toLowerCase().includes('risk')
                          ? 'risk-averse'
                          : 'collaborative';

                        return (
                          <div
                            key={msg.id}
                            className={`arena-chat-row ${isBuyerMsg ? 'buyer-row' : 'seller-row'}`}
                          >
                            {/* Buyer Avatar on Left */}
                            {isBuyerMsg && (
                              <div className="arena-avatar-container buyer-avatar">
                                <AgentFaceAvatar
                                  agentId={activeAgentsList[0]?.id}
                                  personality={displayPersonality}
                                  role={activeAgentsList[0]?.role || "Buyer"}
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
                                    <span className={`arena-agent-personality ${personalityClass}`}>
                                      {displayPersonality}
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
                                    <span className={`arena-agent-personality ${personalityClass}`}>
                                      {displayPersonality}
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
                                  agentId={activeAgentsList[1]?.id}
                                  personality={activeAgentsList[1]?.personality || msg.personality || 'Aggressive'}
                                  role={activeAgentsList[1]?.role || "Seller"}
                                  size={44}
                                />
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Bottom Info Bar (only shown in pure automated simulation mode) */}
          {!isPracticeMode && (
            <div className="arena-transcript-footer">
              <Info size={15} className="arena-footer-info-icon" />
              <span>
                Simulation is running — AI agents are negotiating automatically. No manual input is required.
              </span>
            </div>
          )}

          {/* Practice Mode Input Panel (matches reference design) */}
          {isPracticeMode && (
            <div className="arena-practice-input-panel">
              <div className="arena-practice-input-header">
                <div className="arena-practice-input-title">
                  <User size={16} className="arena-user-icon" />
                  <span>Your Message (Practice Mode)</span>
                </div>
                <button className="arena-practice-coach-link" type="button">
                  <Lightbulb size={14} className="arena-coach-bulb" />
                  <span>Get real-time coaching suggestions from AI Coach</span>
                  <ChevronRight size={14} />
                </button>
              </div>
              <textarea
                className="arena-practice-textarea"
                placeholder="Type your message to the agent..."
                value={practiceMessage}
                onChange={(e) => setPracticeMessage(e.target.value)}
                maxLength={1000}
                rows={3}
              />
              <div className="arena-practice-input-bottom">
                <button className="arena-practice-mic-btn" type="button" title="Record voice message">
                  <Mic size={18} />
                </button>
                <div className="arena-practice-voice-wrap">
                  <div className="arena-audio-waves">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="arena-practice-voice-hint">Click to record voice message</span>
                </div>
                <div className="arena-practice-input-spacer" />
                <span className="arena-practice-char-count">{practiceMessage.length}/1000</span>
                <button className="arena-practice-send-btn" type="button" onClick={handleSendPracticeMessage}>
                  <Send size={15} />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Agent Status & Negotiation Metrics */}
        <div className="arena-sidebar-col">
          {/* AI Coach Card (Practice Mode Only) */}
          {isPracticeMode && (
          <div className="arena-coach-card">
            <div className="arena-coach-header">
              <div className="arena-coach-left">
                <div className="arena-coach-icon-wrap">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="arena-coach-title">AI Coach</h3>
                  <p className="arena-coach-desc">Get real-time suggestions, strategy tips, and feedback based on the negotiation context.</p>
                </div>
              </div>
              <div className="arena-coach-toggle-wrap">
                <button
                  type="button"
                  className={`arena-coach-toggle ${aiCoachEnabled ? 'on' : 'off'}`}
                  onClick={() => setAiCoachEnabled((p) => !p)}
                  title={aiCoachEnabled ? 'Disable AI Coach' : 'Enable AI Coach'}
                  aria-label="Toggle AI Coach"
                >
                  <span className="arena-toggle-knob" />
                </button>
                <Sparkles size={15} className="arena-coach-sparkle" />
              </div>
            </div>
          </div>
          )}

          {/* Agent Status Card */}
          <div className="arena-side-card">
            <div className="arena-side-card-header">
              <Users size={17} className="arena-card-header-icon" />
              <h2 className="arena-card-title">Agent Status</h2>
            </div>

            <div className="arena-agents-list">
              {activeAgentsList.map((agent, idx) => {
                const isFirst = idx === 0;
                const rolePillClass = (agent.personality || '').toLowerCase().includes('aggressive')
                  ? 'aggressive'
                  : (agent.personality || '').toLowerCase().includes('risk')
                  ? 'risk-averse'
                  : 'collaborative';
                const offerVal = agent.current_offer || (isFirst ? 9000 : 10000);
                const stanceVal = agent.stance || (isFirst ? 'Seeking agreement' : 'Holding firm');
                const progressVal = agent.progress_percent || (isFirst ? 70 : 60);

                return (
                  <div key={agent.id || `agent-item-${idx}`} className="arena-agent-item-card">
                    <div className="arena-agent-item-top">
                      <div className="arena-agent-avatar-small">
                        <AgentFaceAvatar
                          agentId={agent.id}
                          personality={agent.personality}
                          role={agent.role}
                          size={42}
                        />
                      </div>
                      <div className="arena-agent-item-id">
                        <div className="arena-agent-item-name-row">
                          <span className="arena-agent-main-role">{agent.name || agent.role}</span>
                          <span className={`arena-role-pill ${rolePillClass}`}>
                            {agent.personality || (isFirst ? 'Collaborative' : 'Aggressive')}
                          </span>
                        </div>
                        <span className="arena-agent-active-badge">Active</span>
                      </div>
                    </div>

                    <p className="arena-agent-goal-text">
                      Goal: {agent.goal || (isFirst ? 'Get best price with good terms' : 'Maximize profit with stable demand')}
                    </p>

                    <div className="arena-agent-offer-stance-row">
                      <div className="arena-agent-stat-col">
                        <span className="arena-stat-label">CURRENT OFFER</span>
                        <span className={`arena-stat-value ${isFirst ? 'buyer-val' : 'seller-val'}`}>
                          ₹{Number(offerVal).toLocaleString()}
                          {currentScenarioId === 'vendor-pricing' && (
                            <span className="arena-stat-unit"> per unit</span>
                          )}
                        </span>
                      </div>
                      <div className="arena-agent-stat-col align-right">
                        <span className="arena-stat-label">{isPracticeMode ? 'STANCE' : 'Stance'}</span>
                        <span
                          className={`arena-stat-stance ${isFirst ? 'buyer-stance' : 'seller-stance'}`}
                          title={stanceVal}
                        >
                          {stanceVal}{isPracticeMode ? <span className="arena-stance-pct"> {progressVal}%</span> : ''}
                        </span>
                      </div>
                    </div>

                    <div className="arena-agent-progress-wrap">
                      <div
                        className={`arena-agent-progress-bar ${isFirst ? 'buyer-progress' : 'seller-progress'}`}
                        style={{ width: `${progressVal}%` }}
                      />
                      {!isPracticeMode && (
                        <span className="arena-progress-percent-label">
                          {progressVal}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Negotiation Metrics Card */}
          <div className="arena-side-card">
            <div
              className={`arena-side-card-header ${isPracticeMode ? 'clickable' : ''}`}
              onClick={() => isPracticeMode && setMetricsExpanded((p) => !p)}
            >
              <div className="arena-side-card-header-left">
                <BarChart3 size={17} className="arena-card-header-icon" />
                <h2 className="arena-card-title">Negotiation Metrics</h2>
              </div>
              {isPracticeMode && (
                <ChevronDown size={18} className={`arena-metrics-chevron ${metricsExpanded ? 'rotated' : ''}`} />
              )}
            </div>

            {(!isPracticeMode || metricsExpanded) && <div className="arena-metrics-grid">
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
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NegotiationArena;
