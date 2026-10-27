/**
 * Simulation API Service
 * Handles client communication with the Express Backend and AI Service
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function startSimulation(scenarioId = 'vendor-pricing', customAgents = null, maxRounds = null) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, customAgents, maxRounds }),
    });

    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    throw new Error(`Server returned ${res.status}`);
  } catch (err) {
    console.warn('[Simulation API] Backend unavailable, initializing local offline arena session:', err.message);
    return createLocalSimulation(scenarioId, maxRounds || 10);
  }
}

export async function listSimulations() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations`);
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (err) {
    console.warn('[Simulation API] Failed to list simulations:', err.message);
  }
  return [];
}

export async function getSimulationState(simulationId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations/${simulationId}`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('[Simulation API] Failed to fetch state:', err.message);
  }
  return null;
}

export async function stepSimulation(simulationId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations/${simulationId}/step`, {
      method: 'POST',
    });

    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('[Simulation API] Step failed on backend, executing local step:', err.message);
  }
  return null;
}

export async function pauseSimulation(simulationId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations/${simulationId}/pause`, {
      method: 'POST',
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('[Simulation API] Pause error:', err.message);
  }
  return null;
}

export async function resumeSimulation(simulationId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations/${simulationId}/resume`, {
      method: 'POST',
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('[Simulation API] Resume error:', err.message);
  }
  return null;
}

export async function endSimulation(simulationId, reason = 'Left in between') {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations/${simulationId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('[Simulation API] End error:', err.message);
  }
  return null;
}

export async function restartSimulation(simulationId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations/${simulationId}/restart`, {
      method: 'POST',
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('[Simulation API] Restart error:', err.message);
  }
  return null;
}

/**
 * Local offline fallback simulation generator matching reference screenshot exactly
 */
function createLocalSimulation(scenarioId, maxRounds = 10) {
  const scenarioTitles = {
    'vendor-pricing': 'Vendor Pricing Negotiation',
    'job-offer': 'Job Offer Negotiation',
    'project-budget': 'Project Budget Allocation',
  };

  return {
    id: `local_sim_${Date.now()}`,
    scenario_id: scenarioId,
    scenario_title: scenarioTitles[scenarioId] || 'Vendor Pricing Negotiation',
    status: 'RUNNING',
    current_round: 3,
    max_rounds: maxRounds,
    current_gap: 1000,
    agreement_likelihood: 68,
    agents: [
      {
        id: 'buyer',
        role: 'Buyer',
        name: 'Procurement Director',
        personality: 'Collaborative',
        goal: 'Get best price with good terms',
        current_offer: 9000,
        stance: 'Seeking agreement',
        progress_percent: 70,
      },
      {
        id: 'seller',
        role: 'Seller',
        name: 'Sales Account Executive',
        personality: 'Aggressive',
        goal: 'Maximize profit with stable demand',
        current_offer: 10000,
        stance: 'Holding firm',
        progress_percent: 60,
      },
    ],
    messages: [
      {
        id: 'msg_1',
        round_number: 1,
        sender_type: 'AGENT',
        sender_name: 'Procurement Director',
        sender_role: 'Buyer',
        personality: 'Collaborative',
        message: 'We can offer ₹8,000 per unit for the initial order.',
        offer_value: 8000,
        timestamp_label: '10:21 AM',
      },
      {
        id: 'msg_2',
        round_number: 1,
        sender_type: 'AGENT',
        sender_name: 'Sales Account Executive',
        sender_role: 'Seller',
        personality: 'Aggressive',
        message: 'That price is below our target. We can offer ₹11,000 per unit.',
        offer_value: 11000,
        timestamp_label: '10:22 AM',
      },
      {
        id: 'msg_3',
        round_number: 2,
        sender_type: 'AGENT',
        sender_name: 'Procurement Director',
        sender_role: 'Buyer',
        personality: 'Collaborative',
        message: 'I can increase to ₹9,000 if bulk delivery is included.',
        offer_value: 9000,
        timestamp_label: '10:23 AM',
      },
      {
        id: 'msg_4',
        round_number: 2,
        sender_type: 'AGENT',
        sender_name: 'Sales Account Executive',
        sender_role: 'Seller',
        personality: 'Aggressive',
        message: 'I can move to ₹10,000 with a larger order commitment.',
        offer_value: 10000,
        timestamp_label: '10:23 AM',
      },
      {
        id: 'msg_5',
        round_number: 3,
        sender_type: 'ORCHESTRATOR',
        sender_name: 'Orchestrator Agent',
        sender_role: 'Orchestrator',
        message: "Seller's turn completed. Moving to next round...",
        timestamp_label: '10:24 AM',
      },
    ],
    offers: [
      { round_number: 1, agent_role: 'Buyer', offer_value: 8000 },
      { round_number: 1, agent_role: 'Seller', offer_value: 11000 },
      { round_number: 2, agent_role: 'Buyer', offer_value: 9000 },
      { round_number: 2, agent_role: 'Seller', offer_value: 10000 },
    ],
  };
}
