/**
 * Orchestrator Agent & Negotiation Turn Management Service
 * 
 * Responsibilities:
 * 1. Manages autonomous AI-vs-AI turn-taking order across bilateral (2-agent) and multilateral (3-agent) scenarios.
 * 2. Tracks simulation rounds, active agent turns, and lifecycle states (RUNNING, PAUSED, COMPLETED, DEADLOCK).
 * 3. Maintains conversation history and formats strategic context for the AI reasoning service (Gemini).
 * 4. Coordinates with the Decision and Concession Evaluation logic for incoming/outgoing offers.
 * 5. Updates and persists negotiation state, messages, offers, and agreements via the Neon database interface.
 * 6. Enforces stopping conditions: agreement acceptance, concession convergence, reservation walkaway, or max-round exhaustion.
 */

const { db } = require('../db/db');
const { getAgentNegotiationMove } = require('./aiClient');

// Canonical Scenario Presets
const SCENARIO_PRESETS = {
  'vendor-pricing': {
    id: 'vendor-pricing',
    title: 'Vendor Pricing Negotiation',
    domain: 'Procurement & Sales',
    currency: '₹',
    max_rounds: 10,
    agreement_threshold: 50, // Gap <= 50 considered agreement
    agents: [
      {
        id: 'buyer-procurement',
        role: 'Buyer',
        name: 'Procurement Director',
        personality: 'Collaborative',
        goal: 'Secure enterprise software licenses under budget with 99.9% uptime SLA and Net-60 terms',
        target_value: 8000,
        reservation_value: 10500,
        current_offer: 8000,
        stance: 'Seeking agreement',
        progress_percent: 50,
      },
      {
        id: 'vendor-sales',
        role: 'Seller',
        name: 'Sales Account Executive',
        personality: 'Aggressive',
        goal: 'Maximize annual contract value, protect commercial margin, and secure Net-30 terms',
        target_value: 11000,
        reservation_value: 8500,
        current_offer: 11000,
        stance: 'Holding firm',
        progress_percent: 45,
      },
    ],
  },
  'job-offer': {
    id: 'job-offer',
    title: 'Job Offer Negotiation',
    domain: 'Talent & Human Resources',
    currency: '₹',
    max_rounds: 8,
    agreement_threshold: 500,
    agents: [
      {
        id: 'job-candidate',
        role: 'Candidate',
        name: 'Senior AI Engineer Candidate',
        personality: 'Collaborative',
        goal: 'Secure top-of-band base compensation, equity stock grants, and remote flexibility',
        target_value: 120000,
        reservation_value: 95000,
        current_offer: 120000,
        stance: 'Seeking agreement',
        progress_percent: 50,
      },
      {
        id: 'hiring-director',
        role: 'Recruiter',
        name: 'Hiring Director & Talent Lead',
        personality: 'Risk-Averse',
        goal: 'Hire key engineering talent within departmental salary limits and equity allocation bands',
        target_value: 95000,
        reservation_value: 115000,
        current_offer: 95000,
        stance: 'Evaluating budget',
        progress_percent: 45,
      },
    ],
  },
  'project-budget': {
    id: 'project-budget',
    title: 'Project Budget Allocation',
    domain: 'Corporate Strategy & Finance',
    currency: '₹',
    max_rounds: 12,
    agreement_threshold: 1000,
    agents: [
      {
        id: 'vp-engineering',
        role: 'Engineering Lead',
        name: 'VP of Engineering',
        personality: 'Risk-Averse',
        goal: 'Secure core infrastructure budget (target ₹450,000) for database modernization and uptime reliability',
        target_value: 450000,
        reservation_value: 350000,
        current_offer: 450000,
        stance: 'Justifying reliability',
        progress_percent: 50,
      },
      {
        id: 'cmo-marketing',
        role: 'Marketing Lead',
        name: 'Chief Marketing Officer',
        personality: 'Aggressive',
        goal: 'Secure customer acquisition and paid growth capital (target ₹350,000)',
        target_value: 350000,
        reservation_value: 250000,
        current_offer: 350000,
        stance: 'Demanding growth capital',
        progress_percent: 45,
      },
      {
        id: 'head-product-ai',
        role: 'Product AI Lead',
        name: 'Head of Product AI',
        personality: 'Collaborative',
        goal: 'Secure GenAI research and compute budget (target ₹300,000)',
        target_value: 300000,
        reservation_value: 200000,
        current_offer: 300000,
        stance: 'Highlighting innovation',
        progress_percent: 50,
      },
    ],
  },
};

class OrchestratorAgent {
  constructor() {
    this.name = 'Orchestrator Agent';
    this.role = 'Orchestrator';
  }

  /**
   * Retrieves scenario definition by ID with fallback
   */
  getScenarioPreset(scenarioId) {
    return SCENARIO_PRESETS[scenarioId] || SCENARIO_PRESETS['vendor-pricing'];
  }

  /**
   * 1. Initialize a brand new simulation session
   */
  async initializeSimulation({ scenarioId = 'vendor-pricing', customAgents = null, maxRounds = null }) {
    const preset = this.getScenarioPreset(scenarioId);
    const simId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const effectiveMaxRounds = maxRounds || preset.max_rounds || 10;
    const effectiveAgents = Array.isArray(customAgents) && customAgents.length > 0
      ? customAgents
      : preset.agents;

    const initialBuyerOffer = effectiveAgents[0]?.current_offer || effectiveAgents[0]?.target_value || 8000;
    const initialSellerOffer = effectiveAgents[1]?.current_offer || effectiveAgents[1]?.target_value || 11000;
    const initialGap = Math.abs(initialBuyerOffer - initialSellerOffer);

    const simulationRecord = {
      id: simId,
      scenario_id: preset.id,
      scenario_title: preset.title,
      status: 'RUNNING',
      current_round: 1,
      max_rounds: effectiveMaxRounds,
      current_gap: initialGap,
      agreement_likelihood: 50,
    };

    // 1. Persist initial simulation and agents to database
    await db.createSimulation(simulationRecord, effectiveAgents);

    // 2. Log Orchestrator Welcome Announcement
    const participantRoles = effectiveAgents.map(a => a.role || a.name).join(' vs ');
    await db.addMessage({
      simulation_id: simId,
      round_number: 1,
      sender_type: 'ORCHESTRATOR',
      sender_name: this.name,
      sender_role: this.role,
      message: `Simulation initialized for "${preset.title}". Round 1 commenced between ${participantRoles}. Awaiting opening move from ${effectiveAgents[0]?.role || 'Agent 1'}.`,
      action: 'STATUS',
    });

    // 3. Dispatch the opening move for Agent 1
    const openingAgent = effectiveAgents[0];
    const counterpartAgent = effectiveAgents[1] || effectiveAgents[0];

    const openingMove = await getAgentNegotiationMove({
      scenario: preset,
      agent: openingAgent,
      counterpart: counterpartAgent,
      roundNumber: 1,
      maxRounds: effectiveMaxRounds,
      currentOffer: initialBuyerOffer,
      history: [],
    });

    // 4. Record opening message and offer
    await db.addMessage({
      simulation_id: simId,
      round_number: 1,
      sender_type: 'AGENT',
      sender_name: openingAgent.name,
      sender_role: openingAgent.role,
      personality: openingAgent.personality,
      message: openingMove.message,
      offer_value: openingMove.offer_value,
      action: openingMove.action || 'OFFER',
    });

    if (openingMove.offer_value) {
      await db.addOffer({
        simulation_id: simId,
        round_number: 1,
        agent_role: openingAgent.role,
        offer_value: openingMove.offer_value,
        terms: openingMove.terms,
      });

      await db.updateAgent(simId, openingAgent.role, {
        current_offer: openingMove.offer_value,
        stance: openingMove.stance || 'Seeking agreement',
        progress_percent: openingMove.progress_percent || 55,
      });
    }

    return await db.getSimulation(simId);
  }

  /**
   * 2. Determine which agent speaks next
   * Handles 2-agent bilateral and 3+ agent multilateral round-robin turn-taking
   */
  determineNextTurn(sim) {
    const agents = sim.agents || [];
    if (agents.length === 0) {
      throw new Error('Simulation has no registered participating agents.');
    }

    // Filter messages for the current round sent by AGENTS
    const currentRoundMessages = (sim.messages || []).filter(
      m => m.round_number === sim.current_round && m.sender_type === 'AGENT'
    );

    const turnsCount = currentRoundMessages.length;
    const numAgents = agents.length;

    // Index of the agent whose turn it is now (0 to numAgents - 1)
    const activeIndex = turnsCount % numAgents;
    const activeAgent = agents[activeIndex];

    // Counterpart is the previous speaker, or the next agent in circular order
    const counterpartIndex = (activeIndex + 1) % numAgents;
    const counterpartAgent = agents[counterpartIndex];

    // Round ends when all agents in this round have completed exactly one turn
    const isRoundEnd = (turnsCount + 1) % numAgents === 0;

    return {
      activeAgent,
      counterpartAgent,
      isRoundEnd,
      turnIndexInRound: activeIndex + 1,
      totalTurnsInRound: numAgents,
    };
  }

  /**
   * 3. Advance the negotiation by one single turn
   */
  async advanceStep(simulationId) {
    const sim = await db.getSimulation(simulationId);
    if (!sim) {
      throw new Error(`Simulation with ID "${simulationId}" not found.`);
    }

    // Guard: only advance if currently running
    if (sim.status !== 'RUNNING') {
      return {
        simulation: sim,
        advanced: false,
        message: `Simulation is currently ${sim.status}. Cannot advance turns.`,
      };
    }

    // 1. Determine active speaker and counterpart
    const { activeAgent, counterpartAgent, isRoundEnd } = this.determineNextTurn(sim);

    // 2. Build formatted conversation history context for AI reasoning
    const historyContext = (sim.messages || []).slice(-10).map(m => ({
      sender_role: m.sender_role,
      sender_name: m.sender_name,
      sender_type: m.sender_type,
      message: m.message,
      offer_value: m.offer_value,
      round: m.round_number,
      action: m.action,
    }));

    // 3. Request decision & reasoned move from AI service (with domain fallback)
    const preset = this.getScenarioPreset(sim.scenario_id);
    const move = await getAgentNegotiationMove({
      scenario: {
        id: sim.scenario_id,
        title: sim.scenario_title,
        domain: preset.domain,
      },
      agent: activeAgent,
      counterpart: counterpartAgent,
      roundNumber: sim.current_round,
      maxRounds: sim.max_rounds,
      currentOffer: activeAgent.current_offer || activeAgent.target_value,
      history: historyContext,
    });

    // 4. Record Agent Dialogue in Database
    await db.addMessage({
      simulation_id: simulationId,
      round_number: sim.current_round,
      sender_type: 'AGENT',
      sender_name: activeAgent.name,
      sender_role: activeAgent.role,
      personality: activeAgent.personality,
      message: move.message,
      offer_value: move.offer_value,
      action: move.action || 'COUNTER_OFFER',
    });

    // 5. Record discrete numerical offer & update agent current standing
    if (move.offer_value !== undefined && move.offer_value !== null) {
      await db.addOffer({
        simulation_id: simulationId,
        round_number: sim.current_round,
        agent_role: activeAgent.role,
        offer_value: move.offer_value,
        terms: move.terms || {},
      });

      await db.updateAgent(simulationId, activeAgent.role, {
        current_offer: move.offer_value,
        stance: move.stance || 'In negotiation',
        progress_percent: move.progress_percent || 60,
      });
    }

    // 6. Refresh simulation to inspect all latest agent offers
    const updatedSim = await db.getSimulation(simulationId);
    const agents = updatedSim.agents || [];

    // Calculate current gap between primary stakeholders (Agent 0 & Agent 1)
    const agent0Offer = Number(agents[0]?.current_offer || 0);
    const agent1Offer = Number(agents[1]?.current_offer || 0);
    const currentGap = (agent0Offer > 0 && agent1Offer > 0)
      ? Math.abs(agent0Offer - agent1Offer)
      : sim.current_gap;

    // Compute dynamic agreement likelihood %
    const threshold = preset.agreement_threshold || 50;
    let likelihood = Math.min(
      99,
      Math.max(10, Math.round(100 - (currentGap / (threshold * 3 || 150)) + (sim.current_round * 5)))
    );

    // 7. Evaluate Stopping Conditions
    const stoppingEvaluation = this.evaluateStoppingConditions({
      action: move.action,
      agreementReached: move.agreement_reached,
      currentGap,
      threshold,
      currentRound: sim.current_round,
      maxRounds: sim.max_rounds,
      isRoundEnd,
      settlementPrice: agent1Offer || agent0Offer || move.offer_value,
      activeAgent,
    });

    let newStatus = sim.status;
    let nextRound = sim.current_round;

    if (stoppingEvaluation.shouldStop) {
      newStatus = stoppingEvaluation.finalStatus;
      likelihood = stoppingEvaluation.finalStatus === 'COMPLETED' ? 100 : 0;

      // Post Orchestrator Termination Announcement
      await db.addMessage({
        simulation_id: simulationId,
        round_number: sim.current_round,
        sender_type: 'ORCHESTRATOR',
        sender_name: this.name,
        sender_role: this.role,
        message: stoppingEvaluation.orchestratorMessage,
        action: 'STATUS',
      });

      // If agreement reached, persist agreement record
      if (stoppingEvaluation.finalStatus === 'COMPLETED') {
        await db.saveAgreement({
          simulation_id: simulationId,
          final_value: stoppingEvaluation.agreedValue,
          outcome: 'AGREEMENT_REACHED',
          terms: {
            agreedPrice: stoppingEvaluation.agreedValue,
            settlementRound: sim.current_round,
            scenario: sim.scenario_title,
          },
        });
      }
    } else if (isRoundEnd) {
      // Transition to next round
      nextRound = sim.current_round + 1;

      await db.addMessage({
        simulation_id: simulationId,
        round_number: sim.current_round,
        sender_type: 'ORCHESTRATOR',
        sender_name: this.name,
        sender_role: this.role,
        message: `Round ${sim.current_round} concluded. Gap is ₹${currentGap.toLocaleString()}. Advancing to Round ${nextRound}...`,
        action: 'STATUS',
      });
    }

    // 8. Update Simulation Envelope in DB
    await db.updateSimulation(simulationId, {
      current_round: nextRound,
      status: newStatus,
      current_gap: currentGap,
      agreement_likelihood: likelihood,
    });

    const finalState = await db.getSimulation(simulationId);
    return {
      simulation: finalState,
      advanced: true,
      turnTakenBy: activeAgent.role,
      action: move.action,
      offerValue: move.offer_value,
      stoppingConditionMet: stoppingEvaluation.shouldStop,
    };
  }

  /**
   * 4. Stopping Conditions Evaluator
   * Checks for:
   * - Agreement (ACCEPT action or offer gap within threshold)
   * - Maximum Rounds Exhaustion (Deadlock)
   * - Negotiation Breakdown (Explicit REJECT without concession room)
   */
  evaluateStoppingConditions({
    action,
    agreementReached,
    currentGap,
    threshold,
    currentRound,
    maxRounds,
    isRoundEnd,
    settlementPrice,
    activeAgent,
  }) {
    // Condition A: Explicit or Numerical Agreement
    const isExplicitAccept = action === 'ACCEPT' || agreementReached === true;
    const isGapConverged = currentGap <= threshold && currentGap >= 0;

    if (isExplicitAccept || isGapConverged) {
      return {
        shouldStop: true,
        finalStatus: 'COMPLETED',
        agreedValue: settlementPrice,
        orchestratorMessage: `Agreement successfully confirmed in Round ${currentRound}! Both parties settled at ₹${Number(settlementPrice).toLocaleString()}. Negotiation concluded successfully.`,
      };
    }

    // Condition B: Negotiation Breakdown on Hard Rejection
    if (action === 'REJECT') {
      return {
        shouldStop: true,
        finalStatus: 'DEADLOCK',
        agreedValue: null,
        orchestratorMessage: `${activeAgent.role} rejected the counterpart's terms citing strict reservation constraints. Negotiation broke down without agreement.`,
      };
    }

    // Condition C: Max Rounds Reached at End of Round
    if (isRoundEnd && currentRound >= maxRounds) {
      return {
        shouldStop: true,
        finalStatus: 'DEADLOCK',
        agreedValue: null,
        orchestratorMessage: `Maximum round limit (${maxRounds}) reached without agreement. Final gap remained ₹${currentGap.toLocaleString()}. Negotiation terminated in Deadlock.`,
      };
    }

    // No stopping condition met -> continue negotiation
    return {
      shouldStop: false,
      finalStatus: 'RUNNING',
    };
  }

  /**
   * 5. Pause active simulation
   */
  async pauseSimulation(simulationId) {
    const sim = await db.getSimulation(simulationId);
    if (!sim) throw new Error('Simulation not found');

    await db.updateSimulation(simulationId, { status: 'PAUSED' });
    await db.addMessage({
      simulation_id: simulationId,
      round_number: sim.current_round,
      sender_type: 'ORCHESTRATOR',
      sender_name: this.name,
      sender_role: this.role,
      message: `Simulation paused by user at Round ${sim.current_round}.`,
      action: 'STATUS',
    });

    return await db.getSimulation(simulationId);
  }

  /**
   * 6. Resume paused simulation
   */
  async resumeSimulation(simulationId) {
    const sim = await db.getSimulation(simulationId);
    if (!sim) throw new Error('Simulation not found');

    await db.updateSimulation(simulationId, { status: 'RUNNING' });
    await db.addMessage({
      simulation_id: simulationId,
      round_number: sim.current_round,
      sender_type: 'ORCHESTRATOR',
      sender_name: this.name,
      sender_role: this.role,
      message: `Simulation resumed by user at Round ${sim.current_round}.`,
      action: 'STATUS',
    });

    return await db.getSimulation(simulationId);
  }

  /**
   * 7. End simulation manually
   */
  async endSimulation(simulationId, reason = 'Manually terminated by user') {
    const sim = await db.getSimulation(simulationId);
    if (!sim) throw new Error('Simulation not found');

    await db.updateSimulation(simulationId, { status: 'COMPLETED' });
    await db.addMessage({
      simulation_id: simulationId,
      round_number: sim.current_round,
      sender_type: 'ORCHESTRATOR',
      sender_name: this.name,
      sender_role: this.role,
      message: `Simulation concluded. Reason: ${reason}`,
      action: 'STATUS',
    });

    return await db.getSimulation(simulationId);
  }

  /**
   * 8. Restart simulation using original parameters
   */
  async restartSimulation(simulationId) {
    const sim = await db.getSimulation(simulationId);
    if (!sim) throw new Error('Simulation not found');

    return await this.initializeSimulation({
      scenarioId: sim.scenario_id,
      maxRounds: sim.max_rounds,
    });
  }

  /**
   * 9. Run full simulation until completion or deadlock (useful for automated AI-vs-AI runs)
   */
  async runFullSimulation(simulationId, maxSteps = 30) {
    let stepsTaken = 0;
    let result = null;

    while (stepsTaken < maxSteps) {
      result = await this.advanceStep(simulationId);
      stepsTaken++;

      if (!result.advanced || result.stoppingConditionMet) {
        break;
      }
    }

    return {
      simulation: result?.simulation || (await db.getSimulation(simulationId)),
      stepsTaken,
    };
  }
}

const orchestratorService = new OrchestratorAgent();

module.exports = {
  OrchestratorAgent,
  orchestratorService,
  SCENARIO_PRESETS,
};
