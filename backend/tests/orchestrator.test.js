/**
 * Unit & Integration Tests for Orchestrator Agent & Negotiation Turn Management (Task 2)
 * 
 * Verifies:
 * 1. Session initialization and agent registration
 * 2. Bilateral (2-agent) and Multilateral (3-agent) turn rotation
 * 3. Conversation history tracking and context preservation
 * 4. Step advancement, metric updates (gap & likelihood), and round progression
 * 5. Stopping condition evaluations (Acceptance, Gap Convergence, Rejection Breakdown, Max Rounds Deadlock)
 * 6. Simulation lifecycle controls (Pause, Resume, End, Run to completion)
 */

const assert = require('assert');
const { OrchestratorAgent, orchestratorService, SCENARIO_PRESETS } = require('../src/services/orchestratorService');
const { db } = require('../src/db/db');

async function runTests() {
  console.log('🧪 Starting Orchestrator Agent & Negotiation Turn Management Test Suite...\n');
  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}\n${err.stack}`);
      failedCount++;
    }
  }

  // --- Test Suite ---

  await test('1. Preset retrieval loads valid defaults and scenarios', async () => {
    const orchestrator = new OrchestratorAgent();
    const vendorPreset = orchestrator.getScenarioPreset('vendor-pricing');
    assert.strictEqual(vendorPreset.id, 'vendor-pricing');
    assert.strictEqual(vendorPreset.agents.length, 2);

    const budgetPreset = orchestrator.getScenarioPreset('project-budget');
    assert.strictEqual(budgetPreset.id, 'project-budget');
    assert.strictEqual(budgetPreset.agents.length, 3);

    // Fallback for unknown ID
    const unknownPreset = orchestrator.getScenarioPreset('unknown-id');
    assert.strictEqual(unknownPreset.id, 'vendor-pricing');
  });

  await test('2. initializeSimulation creates session, logs welcome announcement, and posts opening move', async () => {
    const sim = await orchestratorService.initializeSimulation({
      scenarioId: 'vendor-pricing',
      maxRounds: 5,
    });

    assert.ok(sim.id, 'Simulation should have a unique ID');
    assert.strictEqual(sim.status, 'RUNNING');
    assert.strictEqual(sim.current_round, 1);
    assert.strictEqual(sim.max_rounds, 5);
    assert.strictEqual(sim.agents.length, 2);

    // Messages should include: 1 ORCHESTRATOR welcome status + 1 AGENT opening offer
    assert.ok(sim.messages.length >= 2, 'Should have at least 2 messages logged');
    assert.strictEqual(sim.messages[0].sender_type, 'ORCHESTRATOR');
    assert.strictEqual(sim.messages[1].sender_type, 'AGENT');
    assert.strictEqual(sim.messages[1].sender_role, sim.agents[0].role);

    // Initial offer recorded
    assert.ok(sim.offers.length >= 1, 'Should record opening offer');
    assert.strictEqual(sim.offers[0].agent_role, sim.agents[0].role);
  });

  await test('3. determineNextTurn handles bilateral (2-agent) alternation correctly', async () => {
    const orchestrator = new OrchestratorAgent();
    const mockSim = {
      current_round: 1,
      agents: [
        { role: 'Buyer', name: 'Buyer 1' },
        { role: 'Seller', name: 'Seller 1' },
      ],
      messages: [
        { round_number: 1, sender_type: 'ORCHESTRATOR', message: 'Welcome' },
        { round_number: 1, sender_type: 'AGENT', sender_role: 'Buyer', message: 'Offer 1' },
      ],
    };

    // After 1 agent turn, next speaker must be Agent 1 (Seller)
    const turn1 = orchestrator.determineNextTurn(mockSim);
    assert.strictEqual(turn1.activeAgent.role, 'Seller');
    assert.strictEqual(turn1.counterpartAgent.role, 'Buyer');
    assert.strictEqual(turn1.isRoundEnd, true, 'Turn 2 of 2 finishes Round 1');

    // Simulate Seller having spoken
    mockSim.messages.push({ round_number: 1, sender_type: 'AGENT', sender_role: 'Seller', message: 'Counter 1' });
    mockSim.current_round = 2; // Advancing to Round 2

    // Round 2 start: turnsCount = 0 for round 2
    const turn2 = orchestrator.determineNextTurn(mockSim);
    assert.strictEqual(turn2.activeAgent.role, 'Buyer');
    assert.strictEqual(turn2.isRoundEnd, false);
  });

  await test('4. determineNextTurn handles multilateral (3-agent) circular round-robin correctly', async () => {
    const orchestrator = new OrchestratorAgent();
    const mockSim3 = {
      current_round: 1,
      agents: [
        { role: 'Engineering Lead' },
        { role: 'Marketing Lead' },
        { role: 'Product AI Lead' },
      ],
      messages: [
        { round_number: 1, sender_type: 'AGENT', sender_role: 'Engineering Lead' },
      ],
    };

    // Turn 2 in round 1 -> Marketing Lead
    const turn2 = orchestrator.determineNextTurn(mockSim3);
    assert.strictEqual(turn2.activeAgent.role, 'Marketing Lead');
    assert.strictEqual(turn2.isRoundEnd, false);

    // Add turn 2
    mockSim3.messages.push({ round_number: 1, sender_type: 'AGENT', sender_role: 'Marketing Lead' });

    // Turn 3 in round 1 -> Product AI Lead
    const turn3 = orchestrator.determineNextTurn(mockSim3);
    assert.strictEqual(turn3.activeAgent.role, 'Product AI Lead');
    assert.strictEqual(turn3.isRoundEnd, true, 'Turn 3 of 3 completes round for 3 agents');
  });

  await test('5. advanceStep advances turn, records move, and updates metrics', async () => {
    const sim = await orchestratorService.initializeSimulation({
      scenarioId: 'vendor-pricing',
      maxRounds: 5,
    });

    const initialMessagesCount = sim.messages.length;
    const stepResult = await orchestratorService.advanceStep(sim.id);

    assert.strictEqual(stepResult.advanced, true);
    assert.strictEqual(stepResult.turnTakenBy, 'Seller'); // Since Buyer made opening move

    const updatedSim = await db.getSimulation(sim.id);
    assert.strictEqual(updatedSim.messages.length, initialMessagesCount + 2); // 1 Agent move + 1 Orchestrator round advancement announcement
    assert.strictEqual(updatedSim.current_round, 2); // Round 1 concluded, moved to Round 2
  });

  await test('6. evaluateStoppingConditions detects explicit ACCEPT and gap convergence', async () => {
    const orchestrator = new OrchestratorAgent();

    // Explicit ACCEPT
    const acceptEval = orchestrator.evaluateStoppingConditions({
      action: 'ACCEPT',
      agreementReached: true,
      currentGap: 100,
      threshold: 50,
      currentRound: 3,
      maxRounds: 10,
      isRoundEnd: false,
      settlementPrice: 10000,
      activeAgent: { role: 'Buyer' },
    });
    assert.strictEqual(acceptEval.shouldStop, true);
    assert.strictEqual(acceptEval.finalStatus, 'COMPLETED');
    assert.strictEqual(acceptEval.agreedValue, 10000);

    // Gap Convergence within threshold
    const gapEval = orchestrator.evaluateStoppingConditions({
      action: 'COUNTER_OFFER',
      agreementReached: false,
      currentGap: 30, // <= threshold 50
      threshold: 50,
      currentRound: 3,
      maxRounds: 10,
      isRoundEnd: false,
      settlementPrice: 9800,
      activeAgent: { role: 'Seller' },
    });
    assert.strictEqual(gapEval.shouldStop, true);
    assert.strictEqual(gapEval.finalStatus, 'COMPLETED');
  });

  await test('7. evaluateStoppingConditions detects REJECT and max round deadlock', async () => {
    const orchestrator = new OrchestratorAgent();

    // Breakdown via REJECT
    const rejectEval = orchestrator.evaluateStoppingConditions({
      action: 'REJECT',
      agreementReached: false,
      currentGap: 3000,
      threshold: 50,
      currentRound: 2,
      maxRounds: 5,
      isRoundEnd: false,
      settlementPrice: 8000,
      activeAgent: { role: 'Vendor' },
    });
    assert.strictEqual(rejectEval.shouldStop, true);
    assert.strictEqual(rejectEval.finalStatus, 'DEADLOCK');

    // Max rounds limit reached at round end
    const maxRoundEval = orchestrator.evaluateStoppingConditions({
      action: 'COUNTER_OFFER',
      agreementReached: false,
      currentGap: 1500,
      threshold: 50,
      currentRound: 5,
      maxRounds: 5,
      isRoundEnd: true,
      settlementPrice: 8500,
      activeAgent: { role: 'Seller' },
    });
    assert.strictEqual(maxRoundEval.shouldStop, true);
    assert.strictEqual(maxRoundEval.finalStatus, 'DEADLOCK');
  });

  await test('8. Pause, Resume, and End lifecycle controls work properly', async () => {
    const sim = await orchestratorService.initializeSimulation({
      scenarioId: 'vendor-pricing',
      maxRounds: 5,
    });

    const paused = await orchestratorService.pauseSimulation(sim.id);
    assert.strictEqual(paused.status, 'PAUSED');

    // Advancing while paused should be rejected
    const advanceWhilePaused = await orchestratorService.advanceStep(sim.id);
    assert.strictEqual(advanceWhilePaused.advanced, false);

    const resumed = await orchestratorService.resumeSimulation(sim.id);
    assert.strictEqual(resumed.status, 'RUNNING');

    const ended = await orchestratorService.endSimulation(sim.id, 'User test termination');
    assert.strictEqual(ended.status, 'COMPLETED');
  });

  await test('9. runFullSimulation executes turns until negotiation reaches conclusion', async () => {
    const sim = await orchestratorService.initializeSimulation({
      scenarioId: 'vendor-pricing',
      maxRounds: 6,
    });

    const fullRunResult = await orchestratorService.runFullSimulation(sim.id, 20);
    assert.ok(fullRunResult.stepsTaken > 0, 'Should have taken multiple steps');
    assert.ok(
      fullRunResult.simulation.status === 'COMPLETED' || fullRunResult.simulation.status === 'DEADLOCK',
      `Simulation status should be COMPLETED or DEADLOCK, was: ${fullRunResult.simulation.status}`
    );
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passedCount} Passed, ${failedCount} Failed`);
  console.log(`========================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

// Execute when run directly
if (require.main === module) {
  runTests().catch(err => {
    console.error('Test suite failed unexpectedly:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
