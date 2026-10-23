/**
 * Orchestrator Engine
 *
 * Client-side state machine that manages the complete AI-vs-AI negotiation
 * flow: turn-taking, round counting, conversation history, offer tracking,
 * and termination conditions.
 *
 * Pure logic module — no React, no UI, no side effects.
 * When a backend (Express + Gemini + Neon) is added later, the
 * `runNextTurn()` method can be replaced with real API calls.
 */

import { decideNextAction, ACTIONS } from './counterofferModule.js';

/* -------------------------------------------------------------------------- */
/* Negotiation Status Constants                                                */
/* -------------------------------------------------------------------------- */

export const STATUS = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  AGREED: 'agreed',
  REJECTED: 'rejected',
  MAX_ROUNDS: 'max_rounds',
});

/* -------------------------------------------------------------------------- */
/* Default Configuration                                                       */
/* -------------------------------------------------------------------------- */

const DEFAULT_MAX_ROUNDS = 10;

/**
 * Parses an estimated-rounds string like "8 - 12 Turns" and extracts the
 * upper bound as the max round limit. Returns DEFAULT_MAX_ROUNDS on failure.
 */
function parseMaxRounds(estimatedRounds) {
  if (typeof estimatedRounds === 'number') return estimatedRounds;
  if (typeof estimatedRounds === 'string') {
    const match = estimatedRounds.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (match) return parseInt(match[2], 10);
    const single = estimatedRounds.match(/(\d+)/);
    if (single) return parseInt(single[1], 10);
  }
  return DEFAULT_MAX_ROUNDS;
}

/* -------------------------------------------------------------------------- */
/* OrchestratorEngine Class                                                    */
/* -------------------------------------------------------------------------- */

export class OrchestratorEngine {
  /**
   * @param {object} config - Validated negotiation configuration
   *   (output of `validateNegotiationConfig().validatedConfig`)
   */
  constructor(config) {
    if (!config) throw new Error('OrchestratorEngine requires a valid configuration object.');
    if (!config.agents || config.agents.length < 2) {
      throw new Error('OrchestratorEngine requires at least two agents.');
    }
    if (!config.scenario) {
      throw new Error('OrchestratorEngine requires a scenario.');
    }

    this._config = config;
    this._agents = config.agents;
    this._scenario = config.scenario;
    this._parameters = config.scenario.parameters || {};
    this._topics = config.scenario.topics || [];

    this._maxRounds = parseMaxRounds(config.scenario.estimatedRounds);
    this._currentRound = 0;
    this._activeAgentIndex = 0;
    this._turnCount = 0;
    this._status = STATUS.IDLE;
    this._conversationHistory = [];
    this._lastOffers = {};         // agentId → last offer object
    this._agreementTerms = null;
    this._terminationReason = null;

    // Build the agent personality lookup from config
    this._personalityMap = {};
    for (const agent of this._agents) {
      this._personalityMap[agent.id] = agent.personality || agent.defaultPersonality;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Read-Only State Accessors                                               */
  /* ---------------------------------------------------------------------- */

  getState() {
    return {
      status: this._status,
      currentRound: this._currentRound,
      maxRounds: this._maxRounds,
      turnCount: this._turnCount,
      activeAgentIndex: this._activeAgentIndex,
      activeAgent: this._agents[this._activeAgentIndex] || null,
      agents: this._agents,
      scenario: this._scenario,
      conversationHistory: [...this._conversationHistory],
      lastOffers: { ...this._lastOffers },
      agreementTerms: this._agreementTerms,
      terminationReason: this._terminationReason,
    };
  }

  get status() {
    return this._status;
  }

  get currentRound() {
    return this._currentRound;
  }

  get maxRounds() {
    return this._maxRounds;
  }

  get conversationHistory() {
    return [...this._conversationHistory];
  }

  get isTerminated() {
    return [STATUS.AGREED, STATUS.REJECTED, STATUS.MAX_ROUNDS].includes(this._status);
  }

  /* ---------------------------------------------------------------------- */
  /* Lifecycle Controls                                                      */
  /* ---------------------------------------------------------------------- */

  /**
   * Initializes and starts the negotiation. Sets status to RUNNING and
   * prepares the first turn.
   */
  start() {
    if (this._status !== STATUS.IDLE) {
      throw new Error(`Cannot start negotiation: current status is "${this._status}".`);
    }
    this._status = STATUS.RUNNING;
    this._currentRound = 1;
    this._activeAgentIndex = 0;
    this._turnCount = 0;
    return this.getState();
  }

  /** Pauses the negotiation (e.g. for user inspection). */
  pause() {
    if (this._status !== STATUS.RUNNING) return this.getState();
    this._status = STATUS.PAUSED;
    return this.getState();
  }

  /** Resumes a paused negotiation. */
  resume() {
    if (this._status !== STATUS.PAUSED) return this.getState();
    this._status = STATUS.RUNNING;
    return this.getState();
  }

  /** Resets the engine to IDLE with a fresh state. */
  reset() {
    this._currentRound = 0;
    this._activeAgentIndex = 0;
    this._turnCount = 0;
    this._status = STATUS.IDLE;
    this._conversationHistory = [];
    this._lastOffers = {};
    this._agreementTerms = null;
    this._terminationReason = null;
    return this.getState();
  }

  /* ---------------------------------------------------------------------- */
  /* Turn Execution                                                          */
  /* ---------------------------------------------------------------------- */

  /**
   * Runs a single negotiation turn for the currently active agent.
   *
   * The orchestrator:
   * 1. Identifies the active agent and its opponent.
   * 2. Delegates to the Counteroffer Decision Module for the next action.
   * 3. Records the turn in conversation history.
   * 4. Updates negotiation state (round, active agent, status).
   * 5. Checks termination conditions.
   *
   * @returns {object} The turn result and updated state.
   */
  runNextTurn() {
    if (this._status !== STATUS.RUNNING) {
      throw new Error(`Cannot run turn: negotiation status is "${this._status}".`);
    }

    const activeAgent = this._agents[this._activeAgentIndex];
    const opponentIndex = (this._activeAgentIndex + 1) % this._agents.length;
    const opponentAgent = this._agents[opponentIndex];
    const personality = this._personalityMap[activeAgent.id];

    // Delegate to the Counteroffer Decision Module
    const decision = decideNextAction({
      agent: activeAgent,
      opponentAgent,
      personality,
      parameters: this._parameters,
      topics: this._topics,
      history: this._conversationHistory,
      roundNumber: this._currentRound,
      maxRounds: this._maxRounds,
    });

    // Record in conversation history
    const historyEntry = {
      id: `turn-${this._turnCount + 1}`,
      round: this._currentRound,
      turnNumber: this._turnCount + 1,
      agentId: activeAgent.id,
      agentName: activeAgent.name || activeAgent.role,
      personality,
      action: decision.action,
      message: decision.message,
      offer: decision.offer,
      timestamp: new Date().toISOString(),
    };

    this._conversationHistory.push(historyEntry);
    this._turnCount++;

    // Update last offer tracking
    if (decision.offer) {
      this._lastOffers[activeAgent.id] = decision.offer;
    }

    // Check termination conditions
    if (decision.action === ACTIONS.ACCEPT) {
      this._status = STATUS.AGREED;
      this._agreementTerms = decision.offer;
      this._terminationReason = `${activeAgent.name || activeAgent.role} accepted the offer in round ${this._currentRound}.`;
    } else if (decision.action === ACTIONS.REJECT) {
      this._status = STATUS.REJECTED;
      this._terminationReason = `${activeAgent.name || activeAgent.role} rejected further negotiation in round ${this._currentRound}.`;
    } else {
      // Advance to next agent/round
      this._activeAgentIndex = opponentIndex;

      // A full round completes when both agents have had their turn
      if (this._activeAgentIndex === 0) {
        this._currentRound++;

        // Check max rounds
        if (this._currentRound > this._maxRounds) {
          this._status = STATUS.MAX_ROUNDS;
          this._terminationReason = `Negotiation reached the maximum of ${this._maxRounds} rounds without agreement.`;
        }
      }
    }

    return {
      turn: historyEntry,
      state: this.getState(),
    };
  }

  /**
   * Runs the negotiation to completion (or until paused/terminated).
   * Yields each turn result to the provided callback.
   *
   * @param {Function} onTurn - Called after each turn with the turn result
   * @param {number} [delayMs=0] - Delay between turns (for animation)
   * @returns {Promise<object>} Final negotiation state
   */
  async runToCompletion(onTurn, delayMs = 0) {
    if (this._status === STATUS.IDLE) {
      this.start();
    }

    while (this._status === STATUS.RUNNING) {
      const result = this.runNextTurn();
      if (onTurn) onTurn(result);

      if (delayMs > 0 && this._status === STATUS.RUNNING) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return this.getState();
  }
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new OrchestratorEngine from a validated configuration.
 *
 * @param {object} config - Output of `validateNegotiationConfig().validatedConfig`
 * @returns {OrchestratorEngine}
 */
export function createOrchestrator(config) {
  return new OrchestratorEngine(config);
}

export { ACTIONS };

export default OrchestratorEngine;
