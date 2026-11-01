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
  ArrowRightLeft,
  Coins,
  MessageSquare,
  XCircle,
  Loader2,
  Tag,
  UserCheck,
  RotateCw,
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

/**
 * Determines the live stance category dynamically: 'Firm' | 'Compromising' | 'Cautious'
 */
const getDynamicStanceCategory = (agent, sim, isFirst) => {
  if (!agent) return 'Firm';

  // 1. If negotiation has ended with an agreement
  const isCompleted = sim?.status === 'COMPLETED' || sim?.status === 'AGREEMENT_REACHED';
  if (isCompleted && Boolean(sim?.agreement)) {
    return 'Agreed';
  }
  if (sim?.status === 'DEADLOCK') {
    return 'Firm';
  }

  // 2. Count actual offers made by this specific agent in the transcript
  const agentRoleLower = (agent.role || '').toLowerCase();
  const agentNameLower = (agent.name || '').toLowerCase();
  const agentOffers = (sim?.messages || []).filter(
    (m) =>
      (m.sender_type === 'AGENT' || m.sender_type === 'HUMAN') &&
      m.offer_value &&
      (
        (m.sender_role && m.sender_role.toLowerCase() === agentRoleLower) ||
        (m.sender_name && m.sender_name.toLowerCase() === agentNameLower)
      )
  );

  // If the agent has made 0 offers yet, they have not conceded anything -> Firm
  if (agentOffers.length === 0) {
    return 'Firm';
  }

  // If the agent has made only 1 opening offer -> Firm
  if (agentOffers.length === 1) {
    return 'Firm';
  }

  // If 2+ offers, check concession from opening offer
  const initialOffer = Number(agentOffers[0].offer_value);
  const latestOffer = Number(agentOffers[agentOffers.length - 1].offer_value);
  const concessionAmount = Math.abs(latestOffer - initialOffer);

  // If agent made a meaningful concession (> 1% shift toward counterpart) -> Compromising
  if (concessionAmount > initialOffer * 0.01) {
    return 'Compromising';
  }

  // If near round limit -> Cautious
  const round = sim?.current_round || 1;
  const maxR = sim?.max_rounds || 10;
  if (round >= maxR - 2) {
    return 'Cautious';
  }

  return 'Firm';
};

/**
 * Formats agent titles cleanly with role/title in brackets across all 3 scenarios:
 * e.g. "Buyer (Procurement Director)" in transcript, "Procurement Director (Buyer)" in Agent Status
 */
const getFormattedAgentTitle = (agentOrMsg, target = 'transcript') => {
  if (!agentOrMsg) return '';
  const role = (agentOrMsg.role || agentOrMsg.sender_role || '').trim();
  const name = (agentOrMsg.name || agentOrMsg.sender_name || '').trim();
  const title = (agentOrMsg.title || '').trim();

  const combined = `${role} ${name} ${title}`.toLowerCase();

  let canonicalRole = role || 'Participant';
  let canonicalName = name || title || role;

  if (combined.includes('buyer') || combined.includes('procurement') || combined.includes('purchasing')) {
    canonicalRole = 'Buyer';
    canonicalName = 'Procurement Director';
  } else if (combined.includes('seller') || combined.includes('vendor') || combined.includes('supplier') || combined.includes('sales')) {
    canonicalRole = 'Seller';
    canonicalName = 'Sales Account Executive';
  } else if (combined.includes('recruiter') || combined.includes('hiring') || combined.includes('talent')) {
    canonicalRole = 'Recruiter';
    canonicalName = 'Hiring Director';
  } else if (combined.includes('candidate') || combined.includes('applicant') || combined.includes('interviewee')) {
    canonicalRole = 'Candidate';
    canonicalName = 'Job Candidate';
  } else if (combined.includes('engineering') || combined.includes('lead software') || combined.includes('department a') || combined.includes('infrastructure')) {
    canonicalRole = 'Engineering Lead';
    canonicalName = 'VP of Engineering';
  } else if (combined.includes('product')) {
    canonicalRole = 'Product AI Lead';
    canonicalName = 'Head of Product AI';
  } else if (combined.includes('marketing') || combined.includes('growth') || combined.includes('department b')) {
    canonicalRole = 'Marketing Lead';
    canonicalName = 'Chief Marketing Officer';
  }

  if (target === 'transcript') {
    return `${canonicalRole} (${canonicalName})`;
  }
  // Agent Status cards: "Procurement Director (Buyer)"
  return `${canonicalName} (${canonicalRole})`;
};

/**
 * Normalizes legacy or raw orchestrator announcement text to canonical role/title formatting
 */
const formatOrchestratorMessage = (text) => {
  if (!text) return '';
  return text
    .replace(/Purchasing Manager vs Sales Representative/gi, 'Buyer (Procurement Director) vs Seller (Sales Account Executive)')
    .replace(/Awaiting opening move from Purchasing Manager/gi, 'Awaiting opening move from Buyer (Procurement Director)')
    .replace(/Hiring Manager vs Job Candidate/gi, 'Recruiter (Hiring Director) vs Candidate (Job Candidate)')
    .replace(/Hiring Recruiter vs Job Candidate/gi, 'Recruiter (Hiring Director) vs Candidate (Job Candidate)')
    .replace(/Awaiting opening move from Hiring Manager/gi, 'Awaiting opening move from Recruiter (Hiring Director)')
    .replace(/Awaiting opening move from Hiring Recruiter/gi, 'Awaiting opening move from Recruiter (Hiring Director)')
    .replace(/Department A Representative vs Department B Representative/gi, 'Engineering Lead (VP of Engineering) vs Marketing Lead (Chief Marketing Officer)');
};

/**
 * Renders an action badge pill: 'OFFER' | 'COUNTER_OFFER' | 'ACCEPT' | 'REJECT'
 * Strictly guarantees ONLY the very first offer in the negotiation transcript is labeled OPENING OFFER
 */
const renderActionBadge = (actionStr, msg = null, allMessages = []) => {
  let act = (actionStr || '').toUpperCase().trim();
  if (act === 'OPENING_OFFER' || act === 'OPENING OFFER') act = 'OFFER';
  if (act === 'COUNTER' || act === 'COUNTER OFFER') act = 'COUNTER_OFFER';

  // Strict guard: The very first message with an offer is ALWAYS the OPENING OFFER.
  // All subsequent messages with offers are ALWAYS COUNTER-OFFER.
  if (msg && Array.isArray(allMessages) && allMessages.length > 0) {
    const firstOfferMsg = allMessages.find(
      (m) => (m.sender_type === 'AGENT' || m.sender_type === 'HUMAN') && m.offer_value !== undefined && m.offer_value !== null
    );
    if (firstOfferMsg) {
      const isFirstOffer = (msg === firstOfferMsg) || (msg.id && firstOfferMsg.id && msg.id === firstOfferMsg.id);
      if (isFirstOffer) {
        act = 'OFFER';
      } else if (act === 'OFFER') {
        act = 'COUNTER_OFFER';
      }
    }
  }

  if (act === 'ACCEPT') {
    return (
      <span className="arena-action-badge action-accept">
        <CheckCircle2 size={11} /> ACCEPT
      </span>
    );
  }
  if (act === 'REJECT') {
    return (
      <span className="arena-action-badge action-reject">
        <XCircle size={11} /> REJECT
      </span>
    );
  }
  if (act === 'COUNTER_OFFER') {
    return (
      <span className="arena-action-badge action-counter">
        <ArrowRightLeft size={11} /> COUNTER-OFFER
      </span>
    );
  }
  if (act === 'OFFER') {
    return (
      <span className="arena-action-badge action-offer">
        <Tag size={11} /> OPENING OFFER
      </span>
    );
  }
  return null;
};

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
  const [practiceOfferValue, setPracticeOfferValue] = useState('');
  const [showPracticeReportModal, setShowPracticeReportModal] = useState(false);

  // Turn state helpers for Practice Mode
  const getActiveTurnAgent = (sim) => {
    if (!sim || !sim.agents || sim.agents.length === 0) return null;
    const currentRoundMessages = (sim.messages || []).filter(
      (m) => m.round_number === sim.current_round && (m.sender_type === 'AGENT' || m.sender_type === 'HUMAN')
    );
    const activeIndex = currentRoundMessages.length % sim.agents.length;
    return sim.agents[activeIndex];
  };

  const activeTurnAgent = getActiveTurnAgent(simulation);
  const isHumanTurn = Boolean(
    isPracticeMode &&
    simulation?.status === 'RUNNING' &&
    (activeTurnAgent?.personality === 'Human' ||
      activeTurnAgent?.is_human === true ||
      activeTurnAgent?.id === location.state?.userRoleAgentId)
  );

  const isAiOpponentTurn = Boolean(
    isPracticeMode &&
    simulation?.status === 'RUNNING' &&
    !isPaused &&
    activeTurnAgent &&
    !isHumanTurn
  );

  // Auto-sync default offer value when human turn activates
  useEffect(() => {
    if (activeTurnAgent && (!practiceOfferValue || practiceOfferValue === '')) {
      const defaultOffer =
        activeTurnAgent.current_offer ||
        activeTurnAgent.target_value ||
        (currentScenarioId === 'vendor-pricing' ? 10000 : 165000);
      setPracticeOfferValue(String(defaultOffer));
    }
  }, [activeTurnAgent?.id, activeTurnAgent?.current_offer, currentScenarioId]);

  /**
   * Dispatches human negotiation actions: COUNTER_OFFER, ACCEPT, or REJECT
   */
  // Opening move detection: true when no agent or human has put forward an offer yet
  const activeOffersCount = (simulation?.messages || []).filter(
    (m) => (m.sender_type === 'AGENT' || m.sender_type === 'HUMAN') && m.offer_value
  ).length;
  const isOpeningMove = activeOffersCount === 0;

  const handleHumanAction = async (actionType = 'COUNTER_OFFER') => {
    if (turnRunning || !simulation?.id || simulation.status !== 'RUNNING') {
      return;
    }

    const text = practiceMessage.trim();
    let numericOffer = null;

    if (actionType === 'ACCEPT') {
      // Find counterpart's latest proposed offer in messages or counterpart agent
      const lastCounterpartOfferMsg = [...(simulation.messages || [])]
        .reverse()
        .find((m) => m.sender_type !== 'ORCHESTRATOR' && m.offer_value);
      numericOffer = lastCounterpartOfferMsg?.offer_value || activeTurnAgent?.current_offer || 165000;
    } else {
      const cleanInput = String(practiceOfferValue).replace(/[^0-9.]/g, '');
      if (cleanInput && !isNaN(Number(cleanInput))) {
        numericOffer = Number(cleanInput);
      } else {
        // Fallback to text parsing
        const kMatch = text.match(/(?:₹|\$)?\s*(\d+(?:\.\d+)?)\s*(?:k|lac|lakh)/i);
        if (kMatch) {
          const val = parseFloat(kMatch[1]);
          numericOffer =
            kMatch[0].toLowerCase().includes('lac') || kMatch[0].toLowerCase().includes('lakh')
              ? Math.round(val * 100000)
              : Math.round(val * 1000);
        } else {
          const numMatch = text.replace(/,/g, '').match(/(?:₹|\$)?\s*(\d{4,9})/);
          numericOffer = numMatch ? parseInt(numMatch[1], 10) : (activeTurnAgent?.current_offer || 165000);
        }
      }
    }

    const effectiveAction = isOpeningMove && actionType === 'COUNTER_OFFER' ? 'OFFER' : actionType;

    let finalMessage = text;
    if (!finalMessage) {
      if (effectiveAction === 'ACCEPT') {
        finalMessage = `I agree to your proposal of ₹${Number(numericOffer).toLocaleString()}. We have reached a mutually acceptable agreement.`;
      } else if (effectiveAction === 'REJECT') {
        finalMessage = `I cannot accept these terms as they do not meet my minimum reservation boundaries. I must conclude our negotiation.`;
      } else if (isOpeningMove) {
        const myRole = (humanAgent?.role || '').toLowerCase();
        if (myRole.includes('recruiter') || myRole.includes('hiring') || myRole.includes('director')) {
          finalMessage = `We are pleased to extend an initial opening offer of ₹${Number(numericOffer).toLocaleString()} base salary along with competitive equity and full benefits.`;
        } else if (myRole.includes('buyer') || myRole.includes('purchasing') || myRole.includes('procurement')) {
          finalMessage = `We are pleased to propose an opening purchase offer of ₹${Number(numericOffer).toLocaleString()} per unit for our project requirements.`;
        } else if (myRole.includes('candidate')) {
          finalMessage = `Thank you for considering my application. I propose an opening base salary of ₹${Number(numericOffer).toLocaleString()} with standard hybrid flexibility.`;
        } else if (myRole.includes('engineering') || myRole.includes('infrastructure')) {
          finalMessage = `I would like to propose an opening infrastructure budget allocation of ₹${Number(numericOffer).toLocaleString()}.`;
        } else {
          finalMessage = `I would like to table an opening proposal of ₹${Number(numericOffer).toLocaleString()} considering our project requirements.`;
        }
      } else {
        const myRole = (humanAgent?.role || '').toLowerCase();
        if (myRole.includes('candidate')) {
          finalMessage = `Based on my specialized engineering experience and market benchmarks, I propose a counter-offer of ₹${Number(numericOffer).toLocaleString()} base compensation.`;
        } else if (myRole.includes('recruiter') || myRole.includes('hiring') || myRole.includes('talent')) {
          finalMessage = `We have reviewed our departmental bands and can enhance our compensation package to ₹${Number(numericOffer).toLocaleString()} base.`;
        } else if (myRole.includes('buyer') || myRole.includes('procurement') || myRole.includes('purchasing')) {
          finalMessage = `Considering our procurement constraints, I propose a counter-offer of ₹${Number(numericOffer).toLocaleString()} per unit.`;
        } else if (myRole.includes('seller') || myRole.includes('sales') || myRole.includes('vendor')) {
          finalMessage = `To protect commercial delivery while meeting you halfway, our revised offer is ₹${Number(numericOffer).toLocaleString()}.`;
        } else {
          finalMessage = `I would like to propose a counter-offer of ₹${Number(numericOffer).toLocaleString()} considering our project requirements.`;
        }
      }
    }

    setPracticeMessage('');
    setTurnRunning(true);

    try {
      const updated = await stepSimulation(simulation.id, {
        message: finalMessage,
        offer_value: numericOffer,
        action: effectiveAction,
      });
      if (updated) {
        setSimulation(updated);
        if (updated.status !== 'RUNNING') {
          setIsPaused(true);
        }
      }
    } catch (err) {
      console.error(`Error submitting ${actionType} turn:`, err);
    } finally {
      setTurnRunning(false);
    }
  };

  const handleSendPracticeMessage = () => handleHumanAction('COUNTER_OFFER');

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

        const agentsList = scenarioMeta?.agents || scenarioMeta?.roles || [];
        const customAgents = agentsList.map((a) => {
          const personality =
            effectivePersonalities?.[a.id] ||
            (isPracticeMode && a.id === location.state?.userRoleAgentId ? 'Human' : null) ||
            a.personality ||
            a.defaultPersonality ||
            'Collaborative';
          return {
            id: a.id,
            role: a.role || a.name,
            name: a.name,
            goal: a.primaryGoal || a.goal,
            personality,
            is_human: personality === 'Human' || a.id === location.state?.userRoleAgentId,
          };
        });
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

  // 2. Real-time turn progression timer (runs every 3.5 seconds in Simulation Mode ONLY)
  useEffect(() => {
    if (!simulation || isPaused || simulation.status !== 'RUNNING') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // In Practice Mode, DO NOT run automatic timer! Progression is strictly driven by the human user.
    if (isPracticeMode) {
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
  }, [simulation?.id, simulation?.status, isPaused, turnRunning, isPracticeMode]);

  // 2.1 AI Opponent auto-counter in Practice Mode (triggers after user takes turn)
  useEffect(() => {
    if (!isPracticeMode || !isAiOpponentTurn || turnRunning || !simulation?.id) {
      return;
    }

    const aiTimeout = setTimeout(async () => {
      setTurnRunning(true);
      try {
        const updated = await stepSimulation(simulation.id);
        if (updated) {
          setSimulation(updated);
          if (updated.status !== 'RUNNING') {
            setIsPaused(true);
          }
        }
      } catch (err) {
        console.warn('AI opponent step error in practice mode:', err);
      } finally {
        setTurnRunning(false);
      }
    }, 1400);

    return () => clearTimeout(aiTimeout);
  }, [isPracticeMode, isAiOpponentTurn, turnRunning, simulation?.id, simulation?.messages?.length]);

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
    if (isPracticeMode) {
      setShowPracticeReportModal(true);
      return;
    }
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
      const agentsList = scenarioMeta?.agents || scenarioMeta?.roles || [];
      const customAgents = agentsList.map((a) => {
        const personality =
          effectivePersonalities?.[a.id] ||
          (isPracticeMode && a.id === location.state?.userRoleAgentId ? 'Human' : null) ||
          a.personality ||
          a.defaultPersonality ||
          'Collaborative';
        return {
          id: a.id,
          role: a.role || a.name,
          name: a.name,
          goal: a.primaryGoal || a.goal,
          personality,
          is_human: personality === 'Human' || a.id === location.state?.userRoleAgentId,
        };
      });
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

    const agentId =
      metaAgent.id ||
      simAgent.id ||
      (currentScenarioId === 'job-offer'
        ? (idx === 0 ? 'hiring-director' : 'job-candidate')
        : currentScenarioId === 'project-budget'
        ? (idx === 0 ? 'department-a' : idx === 1 ? 'department-b' : 'department-c')
        : (idx === 0 ? 'buyer-procurement' : 'vendor-sales'));

    const configuredPersonality =
      effectivePersonalities?.[agentId] ||
      effectivePersonalities?.[metaAgent.id] ||
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
      current_offer:
        simAgent.current_offer ||
        (currentScenarioId === 'job-offer'
          ? (idx === 0 ? 152000 : 175000)
          : currentScenarioId === 'project-budget'
          ? (idx === 0 ? 450000 : idx === 1 ? 350000 : 300000)
          : (idx === 0 ? 95000 : 110000)),
      stance: simAgent.stance || (idx === 0 ? 'Holding firm' : 'Evaluating terms'),
      progress_percent: simAgent.progress_percent || 50,
    };
  });

  const buyerAgent = activeAgentsList[0] || {};
  const sellerAgent = activeAgentsList[1] || {};
  const humanAgent = activeAgentsList.find(
    (a) => a.id === location.state?.userRoleAgentId || a.personality === 'Human' || a.is_human === true
  ) || (location.state?.userSide === 'seller' ? activeAgentsList[1] : activeAgentsList[0]);

  const opponentAgent = activeAgentsList.find(
    (a) => a !== humanAgent
  ) || (humanAgent === activeAgentsList[0] ? activeAgentsList[1] : activeAgentsList[0]);

  const opponentStance = getDynamicStanceCategory(
    opponentAgent,
    simulation,
    opponentAgent === activeAgentsList[0]
  );

  // Auto-record practice mode session updates to localStorage (isolated from Simulation History DB)
  useEffect(() => {
    if (!isPracticeMode || !simulation?.id) return;
    try {
      const raw = localStorage.getItem('practice_mode_sessions');
      let sessions = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(sessions)) sessions = [];

      const isAgreed =
        (simulation.status === 'AGREEMENT_REACHED' || simulation.status === 'COMPLETED') &&
        Boolean(simulation.agreement);
      const isDead = simulation.status === 'DEADLOCK';
      const score = isAgreed ? 85 : isDead ? 38 : 60;

      const record = {
        id: simulation.id,
        scenario_id: simulation.scenario_id || currentScenarioId,
        scenario_title: simulation.scenario_title || scenarioMeta.title,
        status: simulation.status,
        current_round: simulation.current_round || 1,
        rounds: simulation.current_round || 1,
        created_at: simulation.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        score,
        userRole: humanAgent?.role || 'Procurement Buyer',
        opponentRole: opponentAgent?.role || 'Enterprise Supplier',
        opponentPersonality: opponentAgent?.personality || 'Collaborative',
        is_human: true,
        mode: 'practice',
      };

      const existingIdx = sessions.findIndex((s) => s.id === record.id);
      if (existingIdx >= 0) {
        sessions[existingIdx] = { ...sessions[existingIdx], ...record };
      } else {
        sessions.unshift(record);
      }
      localStorage.setItem('practice_mode_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Could not save practice session to localStorage:', e);
    }
  }, [
    isPracticeMode,
    simulation?.id,
    simulation?.status,
    simulation?.current_round,
    simulation?.agreement,
    currentScenarioId,
    scenarioMeta.title,
    humanAgent?.role,
    opponentAgent?.role,
    opponentAgent?.personality,
  ]);

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
                                  <p className="arena-orchestrator-text">{formatOrchestratorMessage(msg.message)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Direct, accurate agent lookup for this message
                        const senderAgent = activeAgentsList.find((a) => {
                          if (msg.sender_id && (a.id === msg.sender_id || a.agent_id === msg.sender_id)) return true;
                          const msgRole = (msg.sender_role || '').toLowerCase();
                          const aRole = (a.role || '').toLowerCase();
                          const aName = (a.name || '').toLowerCase();
                          const msgName = (msg.sender_name || '').toLowerCase();
                          if (msgRole && (aRole === msgRole || aName === msgRole)) return true;
                          if (msgName && (aName === msgName || aRole === msgName)) return true;
                          if (msgRole.includes('candidate') && (aRole.includes('candidate') || a.id.includes('candidate'))) return true;
                          if (msgRole.includes('recruiter') && (aRole.includes('recruiter') || a.id.includes('recruiter') || a.id.includes('hiring'))) return true;
                          if (msgRole.includes('buyer') && (aRole.includes('buyer') || a.id.includes('buyer') || aRole.includes('procurement'))) return true;
                          if (msgRole.includes('seller') && (aRole.includes('seller') || a.id.includes('seller') || a.id.includes('vendor') || aRole.includes('sales'))) return true;
                          if (msgRole.includes('engineering') && (aRole.includes('engineering') || a.id.includes('engineering') || a.id.includes('department-a'))) return true;
                          if (msgRole.includes('marketing') && (aRole.includes('marketing') || a.id.includes('marketing') || a.id.includes('department-b'))) return true;
                          if (msgRole.includes('product') && (aRole.includes('product') || a.id.includes('product'))) return true;
                          return false;
                        }) || (turnIdx % 2 === 0 ? activeAgentsList[0] : activeAgentsList[1]);

                        // Determine if message is from human
                        const isHumanMsg = Boolean(
                          msg.sender_type === 'HUMAN' ||
                          msg.personality === 'Human' ||
                          msg.is_human === true ||
                          (isPracticeMode && senderAgent && (
                            senderAgent.id === location.state?.userRoleAgentId ||
                            senderAgent.personality === 'Human' ||
                            senderAgent.is_human === true
                          ))
                        );

                        // Side placement: In Practice Mode, AI counterpart is on LEFT, Human is on RIGHT.
                        // In Simulation Mode, Agent 0 (opening agent) is on LEFT, Agent 1 is on RIGHT.
                        const isLeft = isPracticeMode
                          ? !isHumanMsg
                          : (senderAgent === activeAgentsList[0] || (turnIdx % 2 === 0));

                        turnIdx++;

                        const displayPersonality = senderAgent?.personality || msg.personality || 'Collaborative';
                        const personalityClass = (displayPersonality || '').toLowerCase().includes('aggressive')
                          ? 'aggressive'
                          : (displayPersonality || '').toLowerCase().includes('risk')
                          ? 'risk-averse'
                          : 'collaborative';

                        return (
                          <div
                            key={msg.id}
                            className={`arena-chat-row ${isLeft ? 'buyer-row' : 'seller-row'} ${isHumanMsg ? 'human-chat-row' : 'ai-chat-row'}`}
                          >
                            {/* Left-side Avatar (Shows animated SVG face avatar for all scenarios) */}
                            {isLeft && (
                              <div className="arena-avatar-container buyer-avatar">
                                <AgentFaceAvatar
                                  agentId={senderAgent?.id}
                                  personality={displayPersonality}
                                  role={senderAgent?.role || msg.sender_role || 'Negotiator'}
                                  size={44}
                                />
                              </div>
                            )}

                            {/* Message Bubble + Attached Offer */}
                            <div className={`arena-bubble-wrapper ${isLeft ? 'buyer' : 'seller'} ${isHumanMsg ? 'human-turn-bubble' : 'ai-turn-bubble'}`}>
                              {/* Message Meta Info Header */}
                              <div className="arena-bubble-meta">
                                {isHumanMsg ? (
                                  <>
                                    <span className="arena-human-badge">
                                      <User size={12} /> You
                                    </span>
                                    <span className="arena-agent-name">{getFormattedAgentTitle(msg, 'transcript')}</span>
                                    {renderActionBadge(msg.action, msg, simulation?.messages)}
                                    <span className="arena-meta-spacer" />
                                    <span className="arena-timestamp">
                                      {msg.timestamp_label || '10:24 AM'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="arena-agent-name">{getFormattedAgentTitle(msg, 'transcript')}</span>
                                    <span className={`arena-agent-personality ${personalityClass}`}>
                                      {displayPersonality}
                                    </span>
                                    {renderActionBadge(msg.action, msg, simulation?.messages)}
                                    <span className="arena-meta-spacer" />
                                    <span className="arena-timestamp">
                                      {msg.timestamp_label || '10:24 AM'}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Bubble Content Row (Text + Offer badge) */}
                              <div className="arena-bubble-content-row">
                                {/* Attached Offer Badge for Right/User messages (Placed on left of text) */}
                                {!isLeft && msg.offer_value && (
                                  <div className="arena-attached-offer seller-offer">
                                    <span>Offer: ₹{Number(msg.offer_value).toLocaleString()}</span>
                                  </div>
                                )}

                                <div className={`arena-speech-bubble ${isHumanMsg ? 'human-bubble' : ''} ${isLeft ? 'buyer-bubble' : 'seller-bubble'}`}>
                                  <p className="arena-bubble-text">{msg.message}</p>
                                </div>

                                {/* Attached Offer Badge for Left/AI messages (Placed on right of text) */}
                                {isLeft && msg.offer_value && (
                                  <div className="arena-attached-offer buyer-offer">
                                    <span>Offer: ₹{Number(msg.offer_value).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right-side Avatar (Shows animated SVG face avatar for all scenarios) */}
                            {!isLeft && (
                              <div className="arena-avatar-container seller-avatar">
                                <AgentFaceAvatar
                                  agentId={senderAgent?.id}
                                  personality={displayPersonality}
                                  role={senderAgent?.role || msg.sender_role || 'Negotiator'}
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

          {/* Interactive Human Participant Action Input Dock */}
          {isPracticeMode && (
            <div
              className={`arena-human-dock ${
                isHumanTurn && !turnRunning ? 'is-human-turn-active' : 'is-thinking-locked'
              }`}
            >
              {/* Top Status & Stance Bar */}
              <div className="arena-human-dock-header">
                <div className="arena-dock-header-left">
                  <div className="arena-turn-indicator-wrap">
                    {isTerminated ? (
                      <span className="arena-dock-badge completed-badge">
                        <CheckCircle2 size={13} />
                        <span>Negotiation Concluded ({isCompleted ? 'Agreement Reached' : 'Deadlock'})</span>
                      </span>
                    ) : isHumanTurn && !turnRunning ? (
                      <span className="arena-dock-badge user-turn-badge">
                        <span className="pulse-dot-green" />
                        <span>{isOpeningMove ? 'Your Turn to Make Opening Offer' : 'Your Turn to Bargain'}</span>
                      </span>
                    ) : (
                      <span className="arena-dock-badge ai-thinking-badge">
                        <Loader2 size={13} className="spin-icon" />
                        <span>AI Counterpart Deliberating...</span>
                      </span>
                    )}
                  </div>
                  <span className="arena-dock-role-tag">
                    Role: <strong>{humanAgent?.role || 'Human Participant'}</strong>
                  </span>
                </div>

                <div className="arena-dock-header-right">
                  {opponentAgent && (
                    <div className="arena-opponent-stance-pill">
                      <span className="stance-label">Opponent Stance:</span>
                      <span className={`arena-live-stance-pill stance-${opponentStance.toLowerCase()}`}>
                        <span className="stance-dot" />
                        {opponentStance}
                      </span>
                    </div>
                  )}
                  <button className="arena-practice-coach-link" type="button" onClick={() => setAiCoachEnabled((p) => !p)}>
                    <Lightbulb size={13} className="arena-coach-bulb" />
                    <span>AI Coach Tips</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Offer & Rationale Inputs Grid */}
              <div className="arena-dock-inputs-grid">
                {/* 1. Numeric Offer Field (₹) */}
                <div className="arena-dock-field-wrap offer-field-wrap">
                  <label htmlFor="human-numeric-offer" className="arena-dock-label">
                    <Coins size={13} />
                    <span>{isOpeningMove ? 'Your Opening Offer (₹)' : 'Your Counter-Offer (₹)'}</span>
                  </label>
                  <div className="arena-currency-input-box">
                    <span className="currency-symbol">₹</span>
                    <input
                      id="human-numeric-offer"
                      type="text"
                      className="arena-dock-numeric-input"
                      placeholder={currentScenarioId === 'vendor-pricing' ? '10,000' : '165,000'}
                      value={practiceOfferValue}
                      disabled={!isHumanTurn || turnRunning || isTerminated}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9,]/g, '');
                        setPracticeOfferValue(raw);
                      }}
                    />
                    <span className="currency-suffix">INR</span>
                  </div>
                </div>

                {/* 2. Message Textarea */}
                <div className="arena-dock-field-wrap message-field-wrap">
                  <div className="arena-dock-label-row">
                    <label htmlFor="human-message-input" className="arena-dock-label">
                      <MessageSquare size={13} />
                      <span>Negotiation Message & Justification</span>
                    </label>
                    <span className="arena-dock-char-count">{practiceMessage.length}/1000</span>
                  </div>
                  <textarea
                    id="human-message-input"
                    className="arena-dock-textarea"
                    placeholder={
                      isTerminated
                        ? "Negotiation has concluded. Inspect the summary report above or restart to begin a new session."
                        : isHumanTurn
                          ? isOpeningMove
                            ? "State your opening proposal and terms (e.g., 'We are pleased to extend an initial compensation offer of ₹152,000 with standard benefits')..."
                            : "State your rationale or proposed terms (e.g., 'Given our delivery commitments, I propose ₹165,000 with Net-60 terms')..."
                          : "AI counterpart is reviewing the dialogue and formulating a response..."
                    }
                    value={practiceMessage}
                    disabled={!isHumanTurn || turnRunning || isTerminated}
                    onChange={(e) => setPracticeMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleHumanAction('COUNTER_OFFER');
                      }
                    }}
                    maxLength={1000}
                    rows={2}
                  />
                </div>
              </div>

              {/* Bottom Action Controls Bar */}
              <div className="arena-dock-actions-bar">
                <div className="arena-dock-voice-hint">
                  <button className="arena-dock-mic-btn" type="button" title="Record voice message">
                    <Mic size={15} />
                  </button>
                  <div className="arena-audio-waves">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="arena-dock-hint-text">Type terms or speak proposal</span>
                </div>

                <div className="arena-dock-action-buttons">
                  {/* Action 1: Reject / Concede */}
                  <button
                    type="button"
                    className="btn-dock-action btn-dock-reject"
                    disabled={!isHumanTurn || turnRunning || isTerminated}
                    onClick={() => handleHumanAction('REJECT')}
                    title="Reject current proposal and terminate negotiation"
                  >
                    <XCircle size={14} />
                    <span>Reject / Concede</span>
                  </button>

                  {/* Action 2: Accept Deal */}
                  <button
                    type="button"
                    className="btn-dock-action btn-dock-accept"
                    disabled={!isHumanTurn || turnRunning || isTerminated || isOpeningMove}
                    onClick={() => handleHumanAction('ACCEPT')}
                    title={isOpeningMove ? "Cannot accept before counterpart extends an offer" : "Accept counterpart's current proposal"}
                  >
                    <CheckCircle2 size={14} />
                    <span>Accept Deal</span>
                  </button>

                  {/* Action 3: Send Counter-Offer / Opening Offer */}
                  <button
                    type="button"
                    className="btn-dock-action btn-dock-counter"
                    disabled={!isHumanTurn || turnRunning || isTerminated}
                    onClick={() => handleHumanAction('COUNTER_OFFER')}
                    title={isOpeningMove ? "Send initial opening offer with proposed terms" : "Send counter-offer with proposed price and justification"}
                  >
                    {isOpeningMove ? <Tag size={14} /> : <ArrowRightLeft size={14} />}
                    <span>{turnRunning ? 'Deliberating...' : (isOpeningMove ? 'Send Opening Offer' : 'Send Counter-Offer')}</span>
                  </button>
                </div>
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
                          <span className="arena-agent-main-role">{getFormattedAgentTitle(agent, 'agent-status')}</span>
                          {(() => {
                            const isHumanParticipant = Boolean(
                              agent.personality === 'Human' ||
                              agent.is_human === true ||
                              (isPracticeMode && (
                                agent.id === location.state?.userRoleAgentId ||
                                (humanAgent && (agent.id === humanAgent.id || agent.role === humanAgent.role))
                              ))
                            );
                            return (
                              <span className={`arena-role-pill ${isHumanParticipant ? 'human' : rolePillClass}`}>
                                {isHumanParticipant ? 'You' : (agent.personality || (isFirst ? 'Collaborative' : 'Aggressive'))}
                              </span>
                            );
                          })()}
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
                        <span className="arena-stat-label">{isPracticeMode ? 'LIVE STANCE' : 'Stance'}</span>
                        <span
                          className={`arena-live-stance-pill stance-${getDynamicStanceCategory(agent, simulation, isFirst).toLowerCase()}`}
                          title={`Live Stance: ${getDynamicStanceCategory(agent, simulation, isFirst)}`}
                        >
                          <span className="stance-dot" />
                          {getDynamicStanceCategory(agent, simulation, isFirst)}
                        </span>
                      </div>
                    </div>

                    <div className="arena-agent-progress-row">
                      <div className="arena-agent-progress-track">
                        <div
                          className={`arena-agent-progress-bar ${isFirst ? 'buyer-progress' : 'seller-progress'}`}
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>
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

      {/* Practice Mode Report Under Development Notice Modal */}
      {showPracticeReportModal && (
        <div className="arena-modal-backdrop" onClick={() => setShowPracticeReportModal(false)}>
          <div className="arena-modal-card practice-report-dev-modal" onClick={(e) => e.stopPropagation()}>
            <div className="practice-dev-header">
              <div className="practice-dev-icon-wrap">
                <Sparkles size={28} className="practice-dev-icon" />
              </div>
              <span className="practice-dev-badge">Practice Mode Notice</span>
              <h3 className="practice-dev-title">Practice Negotiation Report</h3>
              <span className="practice-dev-status-pill">Under Development</span>
            </div>

            <p className="practice-dev-text">
              The post-negotiation report for <strong>Practice Mode</strong> (including tactical scorecard, concession curve telemetry, and AI coaching assessment) is currently <strong>Under Development</strong> for Milestone 3.
            </p>

            <div className="practice-dev-note">
              <span>💡 Comprehensive reports and archived transcripts are fully available for <strong>Simulation Mode</strong> under History & Reports.</span>
            </div>

            <div className="practice-dev-actions">
              <button
                type="button"
                className="btn-practice-dev-scenarios"
                onClick={() => {
                  allowExitRef.current = true;
                  navigate('/practice');
                }}
              >
                Back to Practice Scenarios
              </button>
              <button
                type="button"
                className="btn-practice-dev-restart"
                onClick={() => {
                  setShowPracticeReportModal(false);
                  handleRestart();
                }}
              >
                Restart Session
              </button>
              <button
                type="button"
                className="btn-practice-dev-close"
                onClick={() => setShowPracticeReportModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NegotiationArena;
