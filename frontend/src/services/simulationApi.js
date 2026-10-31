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

export async function startSimulation(scenarioId = 'vendor-pricing', customAgents = null, maxRounds = null, userEmail = null, userId = null) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, customAgents, maxRounds, userEmail, userId }),
    });

    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    throw new Error(`Server returned ${res.status}`);
  } catch (err) {
    console.warn('[Simulation API] Backend unavailable or timed out, initializing clean scenario session at Round 1:', err.message);
    const local = createLocalSimulation(scenarioId, customAgents, maxRounds || 10);
    local.user_email = userEmail;
    local.user_id = userId;
    return local;
  }
}

export async function listSimulations(userEmail = null, userId = null) {
  try {
    const params = new URLSearchParams();
    if (userEmail) params.append('userEmail', userEmail);
    if (userId) params.append('userId', userId);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${BACKEND_URL}/api/simulations${query}`);
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

export async function stepSimulation(simulationId, customMove = null) {
  try {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };
    if (customMove) {
      options.body = JSON.stringify(customMove);
    }
    const res = await fetch(`${BACKEND_URL}/api/simulations/${simulationId}/step`, options);

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
 * Local fallback simulation generator that starts cleanly at Round 1
 * and dynamically adapts agents and messages to the chosen scenario.
 */
function createLocalSimulation(scenarioId = 'vendor-pricing', customAgents = null, maxRounds = 10) {
  const scenarioConfigs = {
    'vendor-pricing': {
      title: 'Vendor Pricing Negotiation',
      defaultMaxRounds: 10,
      currency: '₹',
      agents: [
        {
          id: 'buyer-procurement',
          role: 'Buyer',
          name: 'Procurement Director',
          personality: 'Collaborative',
          goal: 'Secure server hardware licenses under budget with Net-60 terms and 99.9% uptime SLA',
          current_offer: 95000,
          target_value: 95000,
          reservation_value: 100000,
          stance: 'Seeking agreement',
          progress_percent: 50,
        },
        {
          id: 'vendor-sales',
          role: 'Seller',
          name: 'Sales Account Executive',
          personality: 'Aggressive',
          goal: 'Maximize annual contract value, protect commercial margin, and secure Net-30 terms',
          current_offer: 110000,
          target_value: 110000,
          reservation_value: 90000,
          stance: 'Holding firm',
          progress_percent: 45,
        },
      ],
      openingOffer: 95000,
      openingMessage: 'We can offer ₹95,000 total contract value for the initial hardware order with Net-60 payment terms.',
    },
    'job-offer': {
      title: 'Job Offer Negotiation',
      defaultMaxRounds: 8,
      currency: '₹',
      agents: [
        {
          id: 'job-candidate',
          role: 'Candidate',
          name: 'Senior AI Engineer Candidate',
          personality: 'Collaborative',
          goal: 'Secure top-of-band base compensation, equity stock grants, and 3 days remote flexibility',
          current_offer: 175000,
          target_value: 175000,
          reservation_value: 160000,
          stance: 'Seeking agreement',
          progress_percent: 50,
        },
        {
          id: 'hiring-director',
          role: 'Recruiter',
          name: 'Hiring Director & Talent Lead',
          personality: 'Risk-Averse',
          goal: 'Hire key engineering talent within departmental salary limits and equity allocation bands',
          current_offer: 152000,
          target_value: 152000,
          reservation_value: 168000,
          stance: 'Evaluating budget',
          progress_percent: 45,
        },
      ],
      openingOffer: 175000,
      openingMessage: 'Based on my track record and technical leadership, I am requesting a base compensation of ₹1,75,000 with 3 remote days per week.',
    },
    'project-budget': {
      title: 'Project Budget Allocation',
      defaultMaxRounds: 12,
      currency: '₹',
      agents: [
        {
          id: 'vp-engineering',
          role: 'Engineering Lead',
          name: 'Lead Software Engineer',
          personality: 'Risk-Averse',
          goal: 'Secure core infrastructure capital (target ₹45,00,000) for platform reliability and tech debt reduction',
          current_offer: 4500000,
          target_value: 4500000,
          reservation_value: 3500000,
          stance: 'Justifying reliability',
          progress_percent: 50,
        },
        {
          id: 'head-product-ai',
          role: 'Product Lead',
          name: 'Product Manager',
          personality: 'Collaborative',
          goal: 'Secure feature development and GenAI product launch capital (target ₹35,00,000) to meet roadmap goals',
          current_offer: 3500000,
          target_value: 3500000,
          reservation_value: 2500000,
          stance: 'Highlighting innovation',
          progress_percent: 50,
        },
        {
          id: 'cmo-marketing',
          role: 'Marketing Lead',
          name: 'Marketing Director',
          personality: 'Aggressive',
          goal: 'Secure customer acquisition and paid growth capital (target ₹25,00,000)',
          current_offer: 2500000,
          target_value: 2500000,
          reservation_value: 1500000,
          stance: 'Demanding growth capital',
          progress_percent: 45,
        },
      ],
      openingOffer: 4500000,
      openingMessage: 'Engineering requires ₹45,00,000 allocation for essential cloud infrastructure, database modernization, and platform uptime.',
    },
  };

  const config = scenarioConfigs[scenarioId] || scenarioConfigs['vendor-pricing'];

  // Apply custom agent personalities and goals if provided
  const effectiveAgents = config.agents.map((baseAgent, idx) => {
    if (Array.isArray(customAgents) && customAgents.length > 0) {
      const match = customAgents.find(
        (ca) =>
          ca.id === baseAgent.id ||
          ca.role?.toLowerCase() === baseAgent.role?.toLowerCase() ||
          ca.name?.toLowerCase() === baseAgent.name?.toLowerCase()
      ) || customAgents[idx];

      if (match) {
        return {
          ...baseAgent,
          name: match.name || baseAgent.name,
          role: match.role || baseAgent.role,
          personality: match.personality || baseAgent.personality,
          goal: match.goal || baseAgent.goal,
        };
      }
    }
    return baseAgent;
  });

  const firstAgent = effectiveAgents[0];
  const secondAgent = effectiveAgents[1] || effectiveAgents[0];
  const initialGap = Math.abs((firstAgent.current_offer || 0) - (secondAgent.current_offer || 0));

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isFirstHuman = firstAgent.personality === 'Human' || firstAgent.is_human === true;
  const initialMessages = [
    {
      id: `msg_init_${Date.now()}_0`,
      round_number: 1,
      sender_type: 'ORCHESTRATOR',
      sender_name: 'Orchestrator Agent',
      sender_role: 'Orchestrator',
      message: `Simulation initialized for "${config.title}". Round 1 commenced between ${effectiveAgents.map(a => a.name || a.role).join(' vs ')}. Awaiting opening move.`,
      action: 'STATUS',
      timestamp_label: timeStr,
    },
  ];

  const initialOffers = [];

  if (!isFirstHuman) {
    initialMessages.push({
      id: `msg_init_${Date.now()}_1`,
      round_number: 1,
      sender_type: 'AGENT',
      sender_name: firstAgent.name,
      sender_role: firstAgent.role,
      personality: firstAgent.personality,
      message: config.openingMessage,
      offer_value: config.openingOffer,
      timestamp_label: timeStr,
    });
    initialOffers.push({
      round_number: 1,
      agent_role: firstAgent.role,
      offer_value: config.openingOffer,
    });
  }

  return {
    id: `local_sim_${Date.now()}`,
    scenario_id: scenarioId,
    scenario_title: config.title,
    status: 'RUNNING',
    current_round: 1,
    max_rounds: maxRounds || config.defaultMaxRounds,
    current_gap: initialGap,
    agreement_likelihood: 50,
    agents: effectiveAgents,
    messages: initialMessages,
    offers: initialOffers,
  };
}
