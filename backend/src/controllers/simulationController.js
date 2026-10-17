const { db } = require('../db/db');
const { getAgentNegotiationMove } = require('../services/aiClient');

// Standard preset scenario definitions
const PRESET_SCENARIOS = {
  'vendor-pricing': {
    id: 'vendor-pricing',
    title: 'Vendor Pricing Negotiation',
    domain: 'Procurement & Sales',
    max_rounds: 10,
    agents: [
      {
        role: 'Buyer',
        name: 'Procurement Director',
        personality: 'Collaborative',
        goal: 'Get best price with good terms',
        target_value: 8000,
        reservation_value: 10500,
        current_offer: 8000,
        stance: 'Seeking agreement',
        progress_percent: 70,
      },
      {
        role: 'Seller',
        name: 'Sales Account Executive',
        personality: 'Aggressive',
        goal: 'Maximize profit with stable demand',
        target_value: 11000,
        reservation_value: 8500,
        current_offer: 11000,
        stance: 'Holding firm',
        progress_percent: 60,
      },
    ],
  },
  'job-offer': {
    id: 'job-offer',
    title: 'Job Offer Negotiation',
    domain: 'Talent & Human Resources',
    max_rounds: 8,
    agents: [
      {
        role: 'Candidate',
        name: 'Senior AI Engineer Candidate',
        personality: 'Collaborative',
        goal: 'Obtain competitive compensation and flexible work',
        target_value: 120000,
        reservation_value: 95000,
        current_offer: 120000,
        stance: 'Seeking agreement',
        progress_percent: 65,
      },
      {
        role: 'Recruiter',
        name: 'Hiring Director & Talent Lead',
        personality: 'Analytical',
        goal: 'Hire top talent within approved organizational budget',
        target_value: 95000,
        reservation_value: 115000,
        current_offer: 95000,
        stance: 'Evaluating budget',
        progress_percent: 55,
      },
    ],
  },
  'project-budget': {
    id: 'project-budget',
    title: 'Project Budget Allocation',
    domain: 'Corporate Strategy & Finance',
    max_rounds: 12,
    agents: [
      {
        role: 'Engineering Lead',
        name: 'Engineering Director',
        personality: 'Analytical',
        goal: 'Secure sufficient infrastructure budget',
        target_value: 500000,
        reservation_value: 300000,
        current_offer: 500000,
        stance: 'Justifying headcount',
        progress_percent: 60,
      },
      {
        role: 'Finance Director',
        name: 'Chief Financial Officer',
        personality: 'Aggressive',
        goal: 'Optimize capital return and control total expenditure',
        target_value: 350000,
        reservation_value: 450000,
        current_offer: 350000,
        stance: 'Controlling costs',
        progress_percent: 50,
      },
    ],
  },
};

/**
 * Start or Initialize a Simulation
 */
async function startSimulation(req, res) {
  try {
    const {
      scenarioId = 'vendor-pricing',
      customAgents = null,
      maxRounds = null,
    } = req.body || {};

    const preset = PRESET_SCENARIOS[scenarioId] || PRESET_SCENARIOS['vendor-pricing'];
    const simId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const effectiveMaxRounds = maxRounds || preset.max_rounds || 10;
    const effectiveAgents = customAgents && customAgents.length > 0 ? customAgents : preset.agents;

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

    // Save simulation & agents to DB
    await db.createSimulation(simulationRecord, effectiveAgents);

    // Initial Welcome Message from Orchestrator
    await db.addMessage({
      simulation_id: simId,
      round_number: 1,
      sender_type: 'ORCHESTRATOR',
      sender_name: 'Orchestrator Agent',
      sender_role: 'Orchestrator',
      message: `Simulation initialized for ${preset.title}. Round 1 commenced between ${effectiveAgents[0]?.role} and ${effectiveAgents[1]?.role}.`,
      action: 'STATUS',
    });

    // Generate Turn 1 (Buyer's opening move)
    const buyerMove = await getAgentNegotiationMove({
      scenario: preset,
      agent: effectiveAgents[0],
      counterpart: effectiveAgents[1],
      roundNumber: 1,
      maxRounds: effectiveMaxRounds,
      currentOffer: initialBuyerOffer,
      history: [],
    });

    await db.addMessage({
      simulation_id: simId,
      round_number: 1,
      sender_type: 'AGENT',
      sender_name: effectiveAgents[0].name,
      sender_role: effectiveAgents[0].role,
      personality: effectiveAgents[0].personality,
      message: buyerMove.message,
      offer_value: buyerMove.offer_value,
      action: buyerMove.action,
    });

    await db.addOffer({
      simulation_id: simId,
      round_number: 1,
      agent_role: effectiveAgents[0].role,
      offer_value: buyerMove.offer_value,
      terms: buyerMove.terms,
    });

    await db.updateAgent(simId, effectiveAgents[0].role, {
      current_offer: buyerMove.offer_value,
      stance: buyerMove.stance,
      progress_percent: buyerMove.progress_percent,
    });

    const fullState = await db.getSimulation(simId);
    return res.status(201).json({
      success: true,
      data: fullState,
    });
  } catch (err) {
    console.error('[Simulation Controller] Error starting simulation:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Simulation by ID
 */
async function getSimulationState(req, res) {
  try {
    const { id } = req.params;
    const sim = await db.getSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation not found' });
    }
    return res.json({ success: true, data: sim });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * List all simulations
 */
async function listSimulations(req, res) {
  try {
    const list = await db.listSimulations(50);
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Advance Simulation by One Step / Turn
 */
async function advanceSimulationStep(req, res) {
  try {
    const { id } = req.params;
    const sim = await db.getSimulation(id);

    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation not found' });
    }

    if (sim.status !== 'RUNNING') {
      return res.json({
        success: true,
        data: sim,
        message: `Simulation is currently ${sim.status}. Cannot advance.`,
      });
    }

    const agents = sim.agents || [];
    if (agents.length < 2) {
      return res.status(400).json({ success: false, error: 'At least 2 agents required.' });
    }

    const buyer = agents[0];
    const seller = agents[1];

    // Check which agent spoke last in this round
    const roundMsgs = (sim.messages || []).filter(m => m.round_number === sim.current_round && m.sender_type === 'AGENT');
    const lastSpeaker = roundMsgs.length > 0 ? roundMsgs[roundMsgs.length - 1].sender_role : null;

    let activeAgent;
    let counterpartAgent;
    let isRoundEnd = false;

    if (!lastSpeaker || lastSpeaker === seller.role) {
      // Buyer's turn
      activeAgent = buyer;
      counterpartAgent = seller;
    } else {
      // Seller's turn
      activeAgent = seller;
      counterpartAgent = buyer;
      isRoundEnd = true;
    }

    // Call AI service for next response
    const move = await getAgentNegotiationMove({
      scenario: { id: sim.scenario_id, title: sim.scenario_title },
      agent: activeAgent,
      counterpart: counterpartAgent,
      roundNumber: sim.current_round,
      maxRounds: sim.max_rounds,
      currentOffer: activeAgent.current_offer || activeAgent.target_value,
      history: sim.messages,
    });

    // Record Message
    await db.addMessage({
      simulation_id: id,
      round_number: sim.current_round,
      sender_type: 'AGENT',
      sender_name: activeAgent.name,
      sender_role: activeAgent.role,
      personality: activeAgent.personality,
      message: move.message,
      offer_value: move.offer_value,
      action: move.action,
    });

    // Record Offer
    if (move.offer_value) {
      await db.addOffer({
        simulation_id: id,
        round_number: sim.current_round,
        agent_role: activeAgent.role,
        offer_value: move.offer_value,
        terms: move.terms,
      });

      await db.updateAgent(id, activeAgent.role, {
        current_offer: move.offer_value,
        stance: move.stance,
        progress_percent: move.progress_percent,
      });
    }

    // Refresh updated agents
    const refreshed = await db.getSimulation(id);
    const updatedBuyer = refreshed.agents.find(a => a.role === buyer.role);
    const updatedSeller = refreshed.agents.find(a => a.role === seller.role);

    const bOffer = Number(updatedBuyer?.current_offer || buyer.current_offer || 0);
    const sOffer = Number(updatedSeller?.current_offer || seller.current_offer || 0);
    const gap = Math.abs(bOffer - sOffer);

    // Calculate agreement likelihood
    let likelihood = Math.min(99, Math.max(15, Math.round(100 - (gap / 80) + (sim.current_round * 4))));

    let newStatus = sim.status;
    let nextRound = sim.current_round;

    // Check if agreement is reached (offers match or move was ACCEPT)
    if (move.action === 'ACCEPT' || (bOffer > 0 && sOffer > 0 && gap <= 50)) {
      newStatus = 'COMPLETED';
      likelihood = 100;

      await db.addMessage({
        simulation_id: id,
        round_number: sim.current_round,
        sender_type: 'ORCHESTRATOR',
        sender_name: 'Orchestrator Agent',
        sender_role: 'Orchestrator',
        message: `Agreement successfully reached at ₹${sOffer.toLocaleString()}! Simulation completed.`,
        action: 'STATUS',
      });

      await db.saveAgreement({
        simulation_id: id,
        final_value: sOffer,
        outcome: 'AGREEMENT_REACHED',
        terms: { agreedPrice: sOffer, finalRound: sim.current_round },
      });
    } else if (isRoundEnd) {
      // Orchestrator announcement at end of round
      await db.addMessage({
        simulation_id: id,
        round_number: sim.current_round,
        sender_type: 'ORCHESTRATOR',
        sender_name: 'Orchestrator Agent',
        sender_role: 'Orchestrator',
        message: `${activeAgent.role}'s turn completed. Moving to round ${sim.current_round + 1}...`,
        action: 'STATUS',
      });

      if (sim.current_round >= sim.max_rounds) {
        newStatus = 'DEADLOCK';
        await db.addMessage({
          simulation_id: id,
          round_number: sim.current_round,
          sender_type: 'ORCHESTRATOR',
          sender_name: 'Orchestrator Agent',
          sender_role: 'Orchestrator',
          message: `Maximum rounds (${sim.max_rounds}) reached without agreement. Negotiation ended in deadlock.`,
          action: 'STATUS',
        });
      } else {
        nextRound = sim.current_round + 1;
      }
    }

    // Update simulation metrics
    await db.updateSimulation(id, {
      current_round: nextRound,
      status: newStatus,
      current_gap: gap,
      agreement_likelihood: likelihood,
    });

    const finalState = await db.getSimulation(id);
    return res.json({
      success: true,
      data: finalState,
      turnTaken: activeAgent.role,
    });
  } catch (err) {
    console.error('[Simulation Controller] Error in step:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Pause Simulation
 */
async function pauseSimulation(req, res) {
  try {
    const { id } = req.params;
    await db.updateSimulation(id, { status: 'PAUSED' });
    const sim = await db.getSimulation(id);
    return res.json({ success: true, data: sim });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Resume Simulation
 */
async function resumeSimulation(req, res) {
  try {
    const { id } = req.params;
    await db.updateSimulation(id, { status: 'RUNNING' });
    const sim = await db.getSimulation(id);
    return res.json({ success: true, data: sim });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * End Simulation manually
 */
async function endSimulation(req, res) {
  try {
    const { id } = req.params;
    await db.updateSimulation(id, { status: 'COMPLETED' });
    const sim = await db.getSimulation(id);
    return res.json({ success: true, data: sim });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Restart Simulation
 */
async function restartSimulation(req, res) {
  try {
    const { id } = req.params;
    const sim = await db.getSimulation(id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'Simulation not found' });
    }

    // Re-create using the same scenario
    return startSimulation(
      {
        body: {
          scenarioId: sim.scenario_id,
          maxRounds: sim.max_rounds,
        },
      },
      res
    );
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  startSimulation,
  getSimulationState,
  listSimulations,
  advanceSimulationStep,
  pauseSimulation,
  resumeSimulation,
  endSimulation,
  restartSimulation,
};
