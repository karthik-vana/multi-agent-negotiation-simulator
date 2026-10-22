/**
 * Simulation Controller
 * HTTP API Controller connecting Express routes to the Orchestrator Agent service.
 */

const { db } = require('../db/db');
const { orchestratorService } = require('../services/orchestratorService');

/**
 * Start or Initialize a Simulation
 * POST /api/simulations/start
 */
async function startSimulation(req, res) {
  try {
    const {
      scenarioId = 'vendor-pricing',
      customAgents = null,
      maxRounds = null,
    } = req.body || {};

    const fullState = await orchestratorService.initializeSimulation({
      scenarioId,
      customAgents,
      maxRounds,
    });

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
 * GET /api/simulations/:id
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
 * GET /api/simulations
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
 * POST /api/simulations/:id/step
 */
async function advanceSimulationStep(req, res) {
  try {
    const { id } = req.params;
    const result = await orchestratorService.advanceStep(id);

    return res.json({
      success: true,
      data: result.simulation,
      turnTaken: result.turnTakenBy,
      action: result.action,
      offerValue: result.offerValue,
      stoppingConditionMet: result.stoppingConditionMet,
      message: result.message,
    });
  } catch (err) {
    console.error('[Simulation Controller] Error in step:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Run full simulation until completion or deadlock
 * POST /api/simulations/:id/run
 */
async function runFullSimulation(req, res) {
  try {
    const { id } = req.params;
    const { maxSteps = 30 } = req.body || {};
    const result = await orchestratorService.runFullSimulation(id, maxSteps);

    return res.json({
      success: true,
      data: result.simulation,
      stepsTaken: result.stepsTaken,
    });
  } catch (err) {
    console.error('[Simulation Controller] Error in runFullSimulation:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Pause Simulation
 * POST /api/simulations/:id/pause
 */
async function pauseSimulation(req, res) {
  try {
    const { id } = req.params;
    const sim = await orchestratorService.pauseSimulation(id);
    return res.json({ success: true, data: sim });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Resume Simulation
 * POST /api/simulations/:id/resume
 */
async function resumeSimulation(req, res) {
  try {
    const { id } = req.params;
    const sim = await orchestratorService.resumeSimulation(id);
    return res.json({ success: true, data: sim });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * End Simulation manually
 * POST /api/simulations/:id/end
 */
async function endSimulation(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const sim = await orchestratorService.endSimulation(id, reason);
    return res.json({ success: true, data: sim });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Restart Simulation
 * POST /api/simulations/:id/restart
 */
async function restartSimulation(req, res) {
  try {
    const { id } = req.params;
    const sim = await orchestratorService.restartSimulation(id);
    return res.status(201).json({ success: true, data: sim });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  startSimulation,
  getSimulationState,
  listSimulations,
  advanceSimulationStep,
  runFullSimulation,
  pauseSimulation,
  resumeSimulation,
  endSimulation,
  restartSimulation,
};
