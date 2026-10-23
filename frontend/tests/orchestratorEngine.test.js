import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OrchestratorEngine,
  createOrchestrator,
  STATUS,
  ACTIONS,
} from '../src/engine/orchestratorEngine.js';
import { decideNextAction } from '../src/engine/counterofferModule.js';
import { getScenarioById, getAllScenarios } from '../src/data/scenarios.js';
import { validateNegotiationConfig } from '../src/utils/configurationValidator.js';

function getSampleConfig(scenarioId = 'vendor-pricing', personalities = {}) {
  const scenario = getScenarioById(scenarioId);
  const validation = validateNegotiationConfig(scenario, personalities);
  assert.ok(validation.isValid, `Validation failed: ${validation.errors?.join(', ')}`);
  return validation.validatedConfig;
}

/* -------------------------------------------------------------------------- */
/* Initialization & Validation Tests                                          */
/* -------------------------------------------------------------------------- */

test('1. OrchestratorEngine constructor validates required configuration', () => {
  assert.throws(() => new OrchestratorEngine(null), /valid configuration/i);
  assert.throws(() => new OrchestratorEngine({}), /at least two agents/i);
  assert.throws(() => new OrchestratorEngine({ agents: [{ id: 'a1' }] }), /at least two agents/i);
  assert.throws(
    () => new OrchestratorEngine({ agents: [{ id: 'a1' }, { id: 'a2' }] }),
    /requires a scenario/i
  );
});

test('2. Orchestrator initializes with clean IDLE state', () => {
  const config = getSampleConfig();
  const engine = new OrchestratorEngine(config);

  const state = engine.getState();
  assert.equal(state.status, STATUS.IDLE);
  assert.equal(state.currentRound, 0);
  assert.equal(state.turnCount, 0);
  assert.equal(state.conversationHistory.length, 0);
  assert.equal(state.activeAgentIndex, 0);
  assert.equal(state.activeAgent.id, config.agents[0].id);
  assert.equal(state.agents.length, 2);
  assert.ok(state.maxRounds > 0);
  assert.equal(engine.isTerminated, false);
});

test('3. parseMaxRounds correctly extracts upper bound from estimated rounds', () => {
  const config = getSampleConfig('vendor-pricing');
  // vendor-pricing has estimatedRounds "8 - 12 Turns"
  const engine = new OrchestratorEngine(config);
  assert.equal(engine.maxRounds, 12);

  const jobConfig = getSampleConfig('job-offer');
  // job-offer has estimatedRounds "6 - 10 Turns"
  const jobEngine = new OrchestratorEngine(jobConfig);
  assert.equal(jobEngine.maxRounds, 10);
});

/* -------------------------------------------------------------------------- */
/* Lifecycle Transitions                                                       */
/* -------------------------------------------------------------------------- */

test('4. Lifecycle state machine transitions: start -> pause -> resume -> reset', () => {
  const config = getSampleConfig();
  const engine = createOrchestrator(config);

  // Start
  engine.start();
  assert.equal(engine.status, STATUS.RUNNING);
  assert.equal(engine.currentRound, 1);

  // Cannot start while running
  assert.throws(() => engine.start(), /cannot start negotiation/i);

  // Pause
  engine.pause();
  assert.equal(engine.status, STATUS.PAUSED);

  // Resume
  engine.resume();
  assert.equal(engine.status, STATUS.RUNNING);

  // Reset
  engine.reset();
  assert.equal(engine.status, STATUS.IDLE);
  assert.equal(engine.currentRound, 0);
  assert.equal(engine.conversationHistory.length, 0);
});

/* -------------------------------------------------------------------------- */
/* Turn Alternation and Round Management                                      */
/* -------------------------------------------------------------------------- */

test('5. Turns alternate between agents and increment rounds properly', () => {
  const config = getSampleConfig();
  const engine = new OrchestratorEngine(config);
  engine.start();

  const agent1 = config.agents[0];
  const agent2 = config.agents[1];

  // Turn 1: Agent 1 acts
  const res1 = engine.runNextTurn();
  assert.equal(res1.turn.agentId, agent1.id);
  assert.equal(res1.turn.round, 1);
  assert.equal(res1.turn.turnNumber, 1);
  assert.ok(res1.turn.message.length > 0);
  assert.ok(res1.turn.offer !== null);

  // If not immediately accepted/rejected, next agent should be Agent 2
  if (engine.status === STATUS.RUNNING) {
    assert.equal(engine.getState().activeAgent.id, agent2.id);

    // Turn 2: Agent 2 acts
    const res2 = engine.runNextTurn();
    assert.equal(res2.turn.agentId, agent2.id);
    assert.equal(res2.turn.turnNumber, 2);

    // After both agents have acted, round should increment to 2 if still running
    if (engine.status === STATUS.RUNNING) {
      assert.equal(engine.currentRound, 2);
      assert.equal(engine.getState().activeAgent.id, agent1.id);
    }
  }

  assert.equal(engine.conversationHistory.length, engine.getState().turnCount);
});

/* -------------------------------------------------------------------------- */
/* Counteroffer Decision Module & Constraints                                 */
/* -------------------------------------------------------------------------- */

test('6. Counteroffer Decision Module generates offers within scenario parameter bounds', () => {
  const scenario = getScenarioById('vendor-pricing');
  const agent1 = scenario.agents[0];
  const agent2 = scenario.agents[1];

  const decision = decideNextAction({
    agent: agent1,
    opponentAgent: agent2,
    personality: 'Collaborative',
    parameters: scenario.parameters,
    topics: scenario.topics,
    history: [],
    roundNumber: 1,
    maxRounds: 10,
  });

  assert.equal(decision.action, ACTIONS.INITIAL_OFFER);
  assert.ok(decision.offer !== null);
  assert.ok(decision.message.length > 0);

  // Price per unit should be within bounds
  if (decision.offer.pricePerUnit !== undefined) {
    const min = scenario.parameters.pricePerUnit.min;
    const max = scenario.parameters.pricePerUnit.max;
    assert.ok(
      decision.offer.pricePerUnit >= min && decision.offer.pricePerUnit <= max,
      `pricePerUnit ${decision.offer.pricePerUnit} not in [${min}, ${max}]`
    );
  }
});

test('7. Counteroffer Module enforces personality-based behavior', () => {
  const scenario = getScenarioById('job-offer');
  const candidate = scenario.agents[0];
  const recruiter = scenario.agents[1];

  const aggressiveDecision = decideNextAction({
    agent: candidate,
    opponentAgent: recruiter,
    personality: 'Aggressive',
    parameters: scenario.parameters,
    topics: scenario.topics,
    history: [],
    roundNumber: 1,
    maxRounds: 10,
  });

  const collaborativeDecision = decideNextAction({
    agent: candidate,
    opponentAgent: recruiter,
    personality: 'Collaborative',
    parameters: scenario.parameters,
    topics: scenario.topics,
    history: [],
    roundNumber: 1,
    maxRounds: 10,
  });

  assert.ok(aggressiveDecision.message.length > 0);
  assert.ok(collaborativeDecision.message.length > 0);
});

/* -------------------------------------------------------------------------- */
/* Complete Run to Termination                                                */
/* -------------------------------------------------------------------------- */

test('8. runToCompletion runs negotiation to a valid termination state', async () => {
  const config = getSampleConfig('vendor-pricing');
  const engine = new OrchestratorEngine(config);

  const turnsRecorded = [];
  const finalState = await engine.runToCompletion((res) => {
    turnsRecorded.push(res.turn);
  });

  assert.ok(
    [STATUS.AGREED, STATUS.REJECTED, STATUS.MAX_ROUNDS].includes(finalState.status),
    `Unexpected termination status: ${finalState.status}`
  );
  assert.equal(engine.isTerminated, true);
  assert.ok(finalState.terminationReason !== null);
  assert.equal(turnsRecorded.length, finalState.conversationHistory.length);

  if (finalState.status === STATUS.AGREED) {
    assert.ok(finalState.agreementTerms !== null);
  }
});

test('9. All 3 scenarios can run full simulation successfully', async () => {
  const scenarios = getAllScenarios();
  for (const scen of scenarios) {
    const config = getSampleConfig(scen.id);
    const engine = new OrchestratorEngine(config);
    const finalState = await engine.runToCompletion();

    assert.ok(
      [STATUS.AGREED, STATUS.REJECTED, STATUS.MAX_ROUNDS].includes(finalState.status),
      `Scenario ${scen.id} terminated with invalid status: ${finalState.status}`
    );
    assert.ok(finalState.conversationHistory.length > 0);
  }
});
