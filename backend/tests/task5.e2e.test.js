'use strict';

/**
 * Task 5 API-level end-to-end smoke tests.
 *
 * Prerequisites:
 *   - Start the Express backend and the AI service (or allow the backend's
 *     documented deterministic fallback to be used).
 *   - Set TASK5_BASE_URL, e.g. http://localhost:5000.
 *
 * Neon verification is only strict when TASK5_REQUIRE_NEON=1. Without that
 * flag, a memory-fallback run validates API/session behavior but does NOT
 * count as proof of durable Neon persistence.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = (process.env.TASK5_BASE_URL || '').trim().replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = Number(process.env.TASK5_REQUEST_TIMEOUT_MS || 20000);
const REQUIRE_NEON = process.env.TASK5_REQUIRE_NEON === '1';

const SCENARIOS = [
  { id: 'vendor-pricing', title: 'Vendor Pricing Negotiation', agentCount: 2 },
  { id: 'job-offer', title: 'Job Offer Negotiation', agentCount: 2 },
  { id: 'project-budget', title: 'Project Budget Allocation', agentCount: 3 },
];

if (!BASE_URL) {
  test('Task 5 E2E suite requires TASK5_BASE_URL', {
    skip: 'Set TASK5_BASE_URL to a running backend URL; see docs/task-5-integration-validation.md.',
  }, () => {});
} else {
  async function requestJson(path, options = {}) {
    const method = options.method || 'GET';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(BASE_URL + path, {
        method,
        headers: options.body === undefined ? {} : { 'content-type': 'application/json' },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      const raw = await response.text();
      let payload;
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch (error) {
        throw new Error(method + ' ' + path + ' returned non-JSON content (HTTP ' + response.status + ').');
      }

      const expectedStatus = options.expectedStatus === undefined ? 200 : options.expectedStatus;
      assert.equal(
        response.status,
        expectedStatus,
        method + ' ' + path + ': expected HTTP ' + expectedStatus + ', got ' + response.status + '; body=' + raw.slice(0, 500)
      );
      return payload;
    } finally {
      clearTimeout(timeout);
    }
  }

  function assertSessionShape(session, scenario) {
    assert.ok(session && typeof session === 'object', 'Simulation data must be an object.');
    assert.ok(typeof session.id === 'string' && session.id.length > 0, 'Simulation must have an ID.');
    assert.equal(session.scenario_id, scenario.id, 'Returned scenario ID must match the requested scenario.');
    assert.equal(session.status, 'RUNNING', 'A newly created simulation should be RUNNING.');
    assert.equal(session.max_rounds, 1, 'The test deliberately uses one round to exercise termination.');
    assert.ok(Array.isArray(session.agents), 'Simulation must include an agents array.');
    assert.equal(session.agents.length, scenario.agentCount, 'Scenario must expose the expected number of agents.');
    assert.ok(Array.isArray(session.messages), 'Simulation must include conversation history.');
    assert.ok(session.messages.length >= 2, 'Initialization should record a welcome message and opening move.');
    assert.ok(Array.isArray(session.offers), 'Simulation must include an offers array.');
    assert.ok(session.offers.length >= 1, 'Initialization should persist the opening offer.');
  }

  test('health endpoint and unknown-session handling', { timeout: 30000 }, async () => {
    const health = await requestJson('/api/health');
    assert.equal(health.status, 'ONLINE', 'Backend health endpoint should report ONLINE.');
    assert.equal(typeof health.neon_database, 'string', 'Health response should disclose database mode.');

    if (REQUIRE_NEON) {
      assert.equal(
        health.neon_database,
        'CONNECTED',
        'Neon is mandatory for this run; do not count memory fallback as database persistence verification.'
      );
    }

    const missing = await requestJson('/api/simulations/task5-missing-' + Date.now(), {
      expectedStatus: 404,
    });
    assert.equal(missing.success, false, 'Unknown session lookup should be reported as unsuccessful.');
  });

  for (const scenario of SCENARIOS) {
    test('Task 5: ' + scenario.id + ' lifecycle, round-trip persistence, and max-round termination', { timeout: 120000 }, async () => {
      let simulationId = null;
      let latestState = null;

      try {
        const initialized = await requestJson('/api/simulations/start', {
          method: 'POST',
          expectedStatus: 201,
          body: { scenarioId: scenario.id, maxRounds: 1 },
        });
        assert.equal(initialized.success, true, 'Start endpoint should report success.');
        latestState = initialized.data;
        assertSessionShape(latestState, scenario);
        simulationId = latestState.id;

        // Simulate a refresh by retrieving the current session through the API.
        const afterRefresh = await requestJson('/api/simulations/' + encodeURIComponent(simulationId));
        assert.equal(afterRefresh.success, true);
        assert.equal(afterRefresh.data.id, simulationId);
        assert.equal(afterRefresh.data.scenario_id, scenario.id);
        assert.equal(afterRefresh.data.messages.length, latestState.messages.length);
        assert.equal(afterRefresh.data.offers.length, latestState.offers.length);

        // Pause/resume behavior and guard against advancing while paused.
        const paused = await requestJson('/api/simulations/' + encodeURIComponent(simulationId) + '/pause', {
          method: 'POST',
        });
        assert.equal(paused.success, true);
        assert.equal(paused.data.status, 'PAUSED');
        latestState = paused.data;

        const pausedRefresh = await requestJson('/api/simulations/' + encodeURIComponent(simulationId));
        assert.equal(pausedRefresh.data.status, 'PAUSED');
        assert.equal(pausedRefresh.data.messages.length, latestState.messages.length);

        const pausedMessageCount = pausedRefresh.data.messages.length;
        const blockedStep = await requestJson('/api/simulations/' + encodeURIComponent(simulationId) + '/step', {
          method: 'POST',
        });
        assert.equal(blockedStep.success, true);
        assert.equal(blockedStep.data.status, 'PAUSED', 'Step must not resume a paused simulation implicitly.');
        assert.equal(
          blockedStep.data.messages.length,
          pausedMessageCount,
          'A step requested while paused must not append a turn or transcript message.'
        );
        latestState = blockedStep.data;

        const resumed = await requestJson('/api/simulations/' + encodeURIComponent(simulationId) + '/resume', {
          method: 'POST',
        });
        assert.equal(resumed.success, true);
        assert.equal(resumed.data.status, 'RUNNING');
        latestState = resumed.data;

        // Complete the remaining participant turns for the configured final round.
        // Vendor Pricing and Job Offer have two agents; Project Budget has three.
        for (let turn = 0; turn < scenario.agentCount - 1 && latestState.status === 'RUNNING'; turn += 1) {
          const previousMessageCount = latestState.messages.length;
          const stepped = await requestJson('/api/simulations/' + encodeURIComponent(simulationId) + '/step', {
            method: 'POST',
          });
          assert.equal(stepped.success, true);
          assert.equal(stepped.data.id, simulationId);
          assert.ok(
            stepped.data.messages.length > previousMessageCount,
            'Each accepted turn should append a transcript event.'
          );
          latestState = stepped.data;
        }

        assert.ok(
          ['COMPLETED', 'DEADLOCK'].includes(latestState.status),
          'Scenario should terminate at the one-round boundary; got status=' + latestState.status + '.'
        );
        assert.equal(latestState.current_round, 1, 'Terminal max-round handling must not increment past the final round.');

        // List endpoint should expose the created simulation for the active backend process/database.
        const listed = await requestJson('/api/simulations');
        assert.equal(listed.success, true);
        assert.ok(Array.isArray(listed.data));
        assert.ok(listed.data.some((item) => item.id === simulationId), 'Created session should appear in the simulation list.');
      } finally {
        // Only terminate a session if an earlier assertion failed while it was still active.
        if (simulationId && latestState && ['RUNNING', 'PAUSED'].includes(latestState.status)) {
          try {
            await requestJson('/api/simulations/' + encodeURIComponent(simulationId) + '/end', {
              method: 'POST',
              body: { reason: 'Task 5 integration test cleanup' },
            });
          } catch (cleanupError) {
            console.warn('[Task 5 cleanup] Could not close ' + simulationId + ': ' + cleanupError.message);
          }
        }
      }
    });
  }
}