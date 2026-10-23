/**
 * Counteroffer Decision Module
 *
 * Determines the next action for each agent during a negotiation turn based on
 * their personality, constraints, goals, and the conversation history so far.
 *
 * Pure logic module — no React, no UI, no side effects.
 */

import { PERSONALITIES } from '../data/scenarios.js';

/* -------------------------------------------------------------------------- */
/* Action Types                                                                */
/* -------------------------------------------------------------------------- */

export const ACTIONS = Object.freeze({
  INITIAL_OFFER: 'INITIAL_OFFER',
  COUNTEROFFER: 'COUNTEROFFER',
  ACCEPT: 'ACCEPT',
  REJECT: 'REJECT',
});

/* -------------------------------------------------------------------------- */
/* Personality Profiles                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Each personality profile defines concession behaviour thresholds.
 *
 * - concessionRange: [min%, max%] of the gap the agent concedes per turn
 * - acceptThreshold: how close (0-1) to its own ideal before it will accept
 * - rejectAfterRounds: minimum rounds before the agent might hard-reject
 * - acceptanceFlexibility: probability modifier for accepting marginal deals
 */
const PERSONALITY_PROFILES = {
  [PERSONALITIES.AGGRESSIVE]: {
    concessionRange: [0.03, 0.10],
    acceptThreshold: 0.85,
    rejectAfterRounds: 6,
    acceptanceFlexibility: 0.15,
    openingAnchorStrength: 0.95,  // starts very close to own ideal
  },
  [PERSONALITIES.COLLABORATIVE]: {
    concessionRange: [0.10, 0.22],
    acceptThreshold: 0.60,
    rejectAfterRounds: 10,
    acceptanceFlexibility: 0.45,
    openingAnchorStrength: 0.75,
  },
  [PERSONALITIES.RISK_AVERSE]: {
    concessionRange: [0.05, 0.14],
    acceptThreshold: 0.70,
    rejectAfterRounds: 8,
    acceptanceFlexibility: 0.30,
    openingAnchorStrength: 0.80,
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Seeded-ish random in a range. */
const randomBetween = (min, max) => min + Math.random() * (max - min);

/** Clamp a value between lo and hi. */
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

/**
 * Extracts numeric parameter bounds relevant to a specific agent from the
 * scenario parameters object. Returns { paramKey: { value, direction } }
 * where direction is 'maximize' or 'minimize' based on constraint operators.
 */
function extractAgentBounds(agent, parameters) {
  const bounds = {};
  if (!agent.constraints || !parameters) return bounds;

  for (const c of agent.constraints) {
    if (c.parameterKey && parameters[c.parameterKey]) {
      const p = parameters[c.parameterKey];
      if (typeof p.value === 'number') {
        bounds[c.parameterKey] = {
          value: p.value,
          operator: c.operator,    // 'lte' or 'gte'
          hard: c.hard !== false,
        };
      }
    }
  }
  return bounds;
}

/**
 * Builds the negotiable topics with numeric ranges derived from both agents'
 * parameter bounds. Each topic gets an `agentIdeal` and `agentFloor` that
 * represent what the agent wants vs. what it can minimally accept.
 */
function buildNegotiableTopics(agent, opponentAgent, parameters, topics) {
  const agentBounds = extractAgentBounds(agent, parameters);
  const opponentBounds = extractAgentBounds(opponentAgent, parameters);

  // Collect all unique numeric parameter keys
  const allKeys = new Set([
    ...Object.keys(agentBounds),
    ...Object.keys(opponentBounds),
  ]);

  const negotiableTopics = [];

  for (const key of allKeys) {
    const aB = agentBounds[key];
    const oB = opponentBounds[key];

    if (!aB && !oB) continue;

    const paramValue = parameters[key]?.value;
    if (typeof paramValue !== 'number') continue;

    // Determine agent's preferred direction for this parameter
    let agentIdeal, agentFloor;

    if (aB) {
      if (aB.operator === 'lte') {
        // Agent wants to stay below this value → ideal is low, floor is the bound
        agentIdeal = paramValue * 0.6;
        agentFloor = paramValue;
      } else {
        // Agent wants to stay above this value → ideal is high, floor is the bound
        agentIdeal = paramValue * 1.4;
        agentFloor = paramValue;
      }
    } else {
      // Agent has no constraint on this key — use parameter value as-is
      agentIdeal = paramValue;
      agentFloor = paramValue;
    }

    negotiableTopics.push({
      key,
      label: parameters[key]?.description || key,
      unit: parameters[key]?.unit || '',
      agentIdeal,
      agentFloor,
      hardConstraint: aB?.hard ?? false,
      operator: aB?.operator || null,
    });
  }

  return negotiableTopics;
}

/* -------------------------------------------------------------------------- */
/* Offer Generation                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Generates an initial offer based on personality and agent bounds.
 */
function generateInitialOffer(agent, negotiableTopics, personality) {
  const profile = PERSONALITY_PROFILES[personality] || PERSONALITY_PROFILES[PERSONALITIES.COLLABORATIVE];
  const offer = {};

  for (const topic of negotiableTopics) {
    const { key, agentIdeal, agentFloor } = topic;
    const anchor = profile.openingAnchorStrength;

    // Anchor towards the agent's ideal
    const range = agentIdeal - agentFloor;
    const value = agentFloor + range * anchor;
    offer[key] = Math.round(value * 100) / 100;
  }

  return offer;
}

/**
 * Generates a counteroffer by conceding from the agent's last position toward
 * the opponent's last offer, constrained by personality and hard limits.
 */
function generateCounteroffer(
  agent,
  negotiableTopics,
  personality,
  lastOwnOffer,
  lastOpponentOffer,
  roundNumber,
  maxRounds,
) {
  const profile = PERSONALITY_PROFILES[personality] || PERSONALITY_PROFILES[PERSONALITIES.COLLABORATIVE];
  const offer = {};

  // Increase concession pressure as rounds progress
  const roundPressure = Math.min(1, roundNumber / maxRounds);
  const [minConcession, maxConcession] = profile.concessionRange;
  const concessionRate = minConcession + (maxConcession - minConcession) * roundPressure;

  for (const topic of negotiableTopics) {
    const { key, agentFloor, operator, hardConstraint } = topic;
    const ownLast = lastOwnOffer[key];
    const opponentLast = lastOpponentOffer[key];

    if (ownLast === undefined || opponentLast === undefined) {
      offer[key] = ownLast ?? agentFloor;
      continue;
    }

    // Concede toward opponent's position
    const gap = opponentLast - ownLast;
    const jitter = randomBetween(0.85, 1.15);
    const concession = gap * concessionRate * jitter;
    let newValue = ownLast + concession;

    // Enforce hard constraints
    if (hardConstraint && operator) {
      if (operator === 'lte') {
        newValue = Math.min(newValue, agentFloor);
      } else if (operator === 'gte') {
        newValue = Math.max(newValue, agentFloor);
      }
    }

    offer[key] = Math.round(newValue * 100) / 100;
  }

  return offer;
}

/* -------------------------------------------------------------------------- */
/* Acceptance / Rejection Evaluation                                           */
/* -------------------------------------------------------------------------- */

/**
 * Evaluates whether an agent should accept the opponent's latest offer.
 * Returns a score 0-1 representing how acceptable the offer is.
 */
function evaluateOffer(opponentOffer, negotiableTopics, personality) {
  const profile = PERSONALITY_PROFILES[personality] || PERSONALITY_PROFILES[PERSONALITIES.COLLABORATIVE];

  if (!opponentOffer || Object.keys(opponentOffer).length === 0) return 0;

  let totalScore = 0;
  let count = 0;

  for (const topic of negotiableTopics) {
    const { key, agentIdeal, agentFloor, hardConstraint, operator } = topic;
    const offeredValue = opponentOffer[key];
    if (offeredValue === undefined) continue;

    // Check hard constraint violation
    if (hardConstraint && operator) {
      if (operator === 'lte' && offeredValue > agentFloor * 1.01) return -1; // violation
      if (operator === 'gte' && offeredValue < agentFloor * 0.99) return -1; // violation
    }

    // Score: how close is the offered value to the agent's ideal vs floor
    const range = Math.abs(agentIdeal - agentFloor) || 1;
    const distanceFromIdeal = Math.abs(offeredValue - agentIdeal);
    const satisfaction = 1 - Math.min(1, distanceFromIdeal / range);

    totalScore += satisfaction;
    count++;
  }

  return count > 0 ? totalScore / count : 0;
}

/* -------------------------------------------------------------------------- */
/* Message Generation                                                          */
/* -------------------------------------------------------------------------- */

const INITIAL_MESSAGES = {
  [PERSONALITIES.AGGRESSIVE]: [
    'Here is our opening position. These terms reflect what we require to proceed.',
    'We have a clear view of what works for us. Here is our initial proposal.',
    'Let me be direct — this is what we need to make this work.',
  ],
  [PERSONALITIES.COLLABORATIVE]: [
    "Let's start with a proposal that I believe gives us a strong foundation to work from.",
    "I'd like to propose terms that balance both our interests. Here's my opening offer.",
    "I'm optimistic we can find common ground. Here's where I suggest we begin.",
  ],
  [PERSONALITIES.RISK_AVERSE]: [
    "I've carefully considered the parameters and would like to propose the following terms.",
    'After thorough evaluation, here is a proposal that addresses our core requirements.',
    'I want to ensure we proceed carefully. Here is a measured opening offer.',
  ],
};

const COUNTEROFFER_MESSAGES = {
  [PERSONALITIES.AGGRESSIVE]: [
    'Your proposal needs significant adjustment. Here is our revised position.',
    "We can't accept those terms. This counteroffer reflects our minimum requirements.",
    'We need to push harder on several points. Here are our revised terms.',
  ],
  [PERSONALITIES.COLLABORATIVE]: [
    "I appreciate your offer. I've adjusted a few terms to better serve both our interests.",
    "There's good progress here. Let me suggest some modifications that could work for everyone.",
    "We're getting closer. Here's a revised proposal that addresses some of your concerns.",
  ],
  [PERSONALITIES.RISK_AVERSE]: [
    "I've reviewed your terms carefully. Here are some adjustments for better risk alignment.",
    'Some of the proposed terms carry more risk than we can accept. Here is a safer alternative.',
    "Let me propose modifications that provide more certainty for both parties.",
  ],
};

const ACCEPT_MESSAGES = {
  [PERSONALITIES.AGGRESSIVE]: [
    'These terms are acceptable. We have a deal.',
    'After careful consideration, we agree to proceed on these terms.',
  ],
  [PERSONALITIES.COLLABORATIVE]: [
    "Excellent — I believe we've reached a fair agreement that works for both of us.",
    "I'm pleased with these terms. This is a strong outcome for everyone involved.",
  ],
  [PERSONALITIES.RISK_AVERSE]: [
    'The terms meet our requirements within acceptable risk parameters. We agree.',
    "After thorough evaluation, I'm satisfied these terms protect our core interests. Agreed.",
  ],
};

const REJECT_MESSAGES = {
  [PERSONALITIES.AGGRESSIVE]: [
    "We've reached an impasse. The terms on the table do not meet our minimum requirements.",
    "Unfortunately, we cannot continue negotiating under these conditions.",
  ],
  [PERSONALITIES.COLLABORATIVE]: [
    "Despite our best efforts, it appears we cannot bridge the remaining gap. I'm disappointed we couldn't reach an agreement.",
    "I had hoped for a better outcome, but the current terms don't quite work for us.",
  ],
  [PERSONALITIES.RISK_AVERSE]: [
    'Continuing further would expose us to unacceptable risk. We must decline.',
    'The terms remain outside our risk tolerance. We cannot proceed.',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage(action, personality) {
  const p = personality || PERSONALITIES.COLLABORATIVE;
  switch (action) {
    case ACTIONS.INITIAL_OFFER:
      return pickRandom(INITIAL_MESSAGES[p] || INITIAL_MESSAGES[PERSONALITIES.COLLABORATIVE]);
    case ACTIONS.COUNTEROFFER:
      return pickRandom(COUNTEROFFER_MESSAGES[p] || COUNTEROFFER_MESSAGES[PERSONALITIES.COLLABORATIVE]);
    case ACTIONS.ACCEPT:
      return pickRandom(ACCEPT_MESSAGES[p] || ACCEPT_MESSAGES[PERSONALITIES.COLLABORATIVE]);
    case ACTIONS.REJECT:
      return pickRandom(REJECT_MESSAGES[p] || REJECT_MESSAGES[PERSONALITIES.COLLABORATIVE]);
    default:
      return '';
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Determines the next action and generates the corresponding offer/message.
 *
 * @param {object} params
 * @param {object} params.agent - The agent whose turn it is
 * @param {object} params.opponentAgent - The other agent in the negotiation
 * @param {string} params.personality - Active personality for this agent
 * @param {object} params.parameters - Scenario parameters
 * @param {Array}  params.topics - Scenario topics
 * @param {Array}  params.history - Conversation history
 * @param {number} params.roundNumber - Current round number
 * @param {number} params.maxRounds - Maximum rounds allowed
 * @returns {{ action: string, offer: object, message: string }}
 */
export function decideNextAction({
  agent,
  opponentAgent,
  personality,
  parameters,
  topics,
  history,
  roundNumber,
  maxRounds,
}) {
  const negotiableTopics = buildNegotiableTopics(agent, opponentAgent, parameters, topics);
  const profile = PERSONALITY_PROFILES[personality] || PERSONALITY_PROFILES[PERSONALITIES.COLLABORATIVE];

  // Find the last offers from both sides
  const agentOffers = history.filter((h) => h.agentId === agent.id && h.offer);
  const opponentOffers = history.filter((h) => h.agentId === opponentAgent.id && h.offer);

  const lastOwnOffer = agentOffers.length > 0 ? agentOffers[agentOffers.length - 1].offer : null;
  const lastOpponentOffer = opponentOffers.length > 0 ? opponentOffers[opponentOffers.length - 1].offer : null;

  // --- Decision Logic ---

  // Case 1: No offers yet → Initial Offer
  if (!lastOwnOffer && !lastOpponentOffer) {
    const offer = generateInitialOffer(agent, negotiableTopics, personality);
    return {
      action: ACTIONS.INITIAL_OFFER,
      offer,
      message: generateMessage(ACTIONS.INITIAL_OFFER, personality),
    };
  }

  // Case 2: Opponent has made an offer, evaluate acceptance
  if (lastOpponentOffer) {
    const score = evaluateOffer(lastOpponentOffer, negotiableTopics, personality);

    // Hard constraint violated → must counter
    if (score === -1) {
      if (roundNumber >= maxRounds - 1) {
        return {
          action: ACTIONS.REJECT,
          offer: null,
          message: generateMessage(ACTIONS.REJECT, personality),
        };
      }
      // Generate a counteroffer within constraints
      const offer = lastOwnOffer
        ? generateCounteroffer(agent, negotiableTopics, personality, lastOwnOffer, lastOpponentOffer, roundNumber, maxRounds)
        : generateInitialOffer(agent, negotiableTopics, personality);
      return {
        action: ACTIONS.COUNTEROFFER,
        offer,
        message: generateMessage(ACTIONS.COUNTEROFFER, personality),
      };
    }

    // Acceptance decision with flexibility adjustment
    const adjustedThreshold = profile.acceptThreshold - (profile.acceptanceFlexibility * (roundNumber / maxRounds));
    const shouldAccept = score >= adjustedThreshold || (score > 0.5 && roundNumber >= maxRounds - 2);

    if (shouldAccept) {
      return {
        action: ACTIONS.ACCEPT,
        offer: lastOpponentOffer,
        message: generateMessage(ACTIONS.ACCEPT, personality),
      };
    }

    // Near max rounds and still not acceptable → potential rejection
    if (roundNumber >= maxRounds - 1 && score < 0.3) {
      return {
        action: ACTIONS.REJECT,
        offer: null,
        message: generateMessage(ACTIONS.REJECT, personality),
      };
    }
  }

  // Case 3: Generate counteroffer
  const referenceOffer = lastOwnOffer || generateInitialOffer(agent, negotiableTopics, personality);
  const targetOffer = lastOpponentOffer || referenceOffer;

  const offer = generateCounteroffer(
    agent,
    negotiableTopics,
    personality,
    referenceOffer,
    targetOffer,
    roundNumber,
    maxRounds,
  );

  return {
    action: lastOwnOffer ? ACTIONS.COUNTEROFFER : ACTIONS.INITIAL_OFFER,
    offer,
    message: generateMessage(lastOwnOffer ? ACTIONS.COUNTEROFFER : ACTIONS.INITIAL_OFFER, personality),
  };
}

export default decideNextAction;
