# Milestone 2 — Task 2: Orchestrator Agent & Negotiation Turn Management

This document details the architectural specifications, turn-taking state machine, stopping conditions, and verification suite for **Milestone 2 — Task 2: Orchestrator Agent & Negotiation Turn Management (Member 2)**.

---

## 1. Objective & Scope

### Objective
Implement the orchestration logic that autonomously manages the complete AI-vs-AI negotiation flow between participating agents using the agreed Node.js/Express backend architecture.

### Member 2 Responsibilities & Deliverables Checklist
- [x] **Working Orchestrator Agent**: Encapsulated in [`backend/src/services/orchestratorService.js`](file:///c:/Users/harik/OneDrive/Desktop/infosys_sp/multi-agent-negotiation-simulator-main/backend/src/services/orchestratorService.js) (`OrchestratorAgent` class & singleton service).
- [x] **Turn-Taking Order Management**: Supports both bilateral (2-agent alternation) and multilateral (3-agent circular round-robin) scenarios.
- [x] **Round & Status Tracking**: Maintains `current_round`, `max_rounds`, and lifecycle states (`RUNNING`, `PAUSED`, `COMPLETED`, `DEADLOCK`).
- [x] **Conversation History & Context Formatting**: Extracts chronological dialogue history (last 10 turns) and passes structured context to the Gemini AI reasoning service.
- [x] **Coordination with Counteroffer Decision Module**: Dispatches moves to the AI reasoning client and deterministic evaluation models.
- [x] **State & Metric Updates**: Updates `current_gap`, `agreement_likelihood`, agent stances, and offer values after every turn.
- [x] **Stopping Conditions Enforcement**: Stops automatically on explicit `ACCEPT`, concession gap convergence (`gap <= threshold`), reservation walkaway (`REJECT`), or maximum rounds exhaustion (`DEADLOCK`).
- [x] **Neon PostgreSQL / In-Memory Interface**: Persists simulation envelopes, agents, messages, offers, and agreements.
- [x] **Decoupled API Controller**: Refactored [`backend/src/controllers/simulationController.js`](file:///c:/Users/harik/OneDrive/Desktop/infosys_sp/multi-agent-negotiation-simulator-main/backend/src/controllers/simulationController.js) following team lead contracts.
- [x] **Automated Test Suite**: Full test coverage in [`backend/tests/orchestrator.test.js`](file:///c:/Users/harik/OneDrive/Desktop/infosys_sp/multi-agent-negotiation-simulator-main/backend/tests/orchestrator.test.js) (9/9 tests passing).

---

## 2. Architecture & State Machine

```
                           ┌───────────────────────────────┐
                           │    Simulation Initialized     │
                           │  - Creates session in DB      │
                           │  - Posts Orchestrator Welcome │
                           │  - Dispatches Opening Move    │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                                 ┌───────────────────┐
                       ┌─────────┤   State: RUNNING  │◄────────┐
                       │         └─────────┬─────────┘         │
                       │                   │                   │
         Pause Request │                   │ Advance Turn      │ Next Turn /
                       ▼                   ▼                   │ Next Round
               ┌───────────────┐   ┌───────────────────────┐   │
               │ State: PAUSED │   │  determineNextTurn()  │   │
               └───────┬───────┘   │  - 2-Agent Alternation│   │
                       │           │  - 3-Agent Round-Robin│   │
        Resume Request │           └───────────┬───────────┘   │
                       └───────────────────────┤               │
                                               ▼               │
                                   ┌───────────────────────┐   │
                                   │  Fetch Move from AI   │   │
                                   │  (Gemini / Fallback)  │   │
                                   └───────────┬───────────┘   │
                                               ▼               │
                                   ┌───────────────────────┐   │
                                   │ Record Offer & Stance │   │
                                   │ Recompute Gap & Deal% │   │
                                   └───────────┬───────────┘   │
                                               ▼               │
                                   ┌───────────────────────┐   │
                                   │ Stopping Conditions?  │───┘ (No: Continue)
                                   └───────────┬───────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       │ (Yes: Stop)                                   │
                       ▼                                               ▼
         ┌───────────────────────────┐                   ┌───────────────────────────┐
         │     State: COMPLETED      │                   │      State: DEADLOCK      │
         │ - Explicit ACCEPT         │                   │ - Explicit REJECT         │
         │ - Gap <= Threshold        │                   │ - Max Rounds Exhausted    │
         │ - Saves Agreement Record  │                   │ - Logs Breakdown Notice   │
         └───────────────────────────┘                   └───────────────────────────┘
```

---

## 3. Turn-Taking Order Engine

The turn manager calculates dynamic agent speaker indexing using modular arithmetic:

```javascript
determineNextTurn(sim) {
  const agents = sim.agents || [];
  const currentRoundMessages = (sim.messages || []).filter(
    m => m.round_number === sim.current_round && m.sender_type === 'AGENT'
  );

  const turnsCount = currentRoundMessages.length;
  const numAgents = agents.length;

  // Active speaker index (0 to numAgents - 1)
  const activeIndex = turnsCount % numAgents;
  const activeAgent = agents[activeIndex];

  // Counterpart index (circular next agent)
  const counterpartIndex = (activeIndex + 1) % numAgents;
  const counterpartAgent = agents[counterpartIndex];

  // Flag indicating round completion
  const isRoundEnd = (turnsCount + 1) % numAgents === 0;

  return { activeAgent, counterpartAgent, isRoundEnd };
}
```

### Scenario Turn Patterns

| Scenario | Agent Count | Order Pattern | Round Boundary |
| :--- | :--- | :--- | :--- |
| **Vendor Pricing** | 2 | `Buyer` ➔ `Seller` ➔ Next Round | Every 2 agent turns |
| **Job Offer** | 2 | `Candidate` ➔ `Recruiter` ➔ Next Round | Every 2 agent turns |
| **Project Budget** | 3 | `Engineering` ➔ `Marketing` ➔ `Product AI` ➔ Next Round | Every 3 agent turns |

---

## 4. Conversation History & AI Coordination

Before dispatching to the AI reasoning service, the Orchestrator extracts chronological conversation context:

```javascript
const historyContext = (sim.messages || []).slice(-10).map(m => ({
  sender_role: m.sender_role,
  sender_name: m.sender_name,
  sender_type: m.sender_type,
  message: m.message,
  offer_value: m.offer_value,
  round: m.round_number,
  action: m.action,
}));
```

This context is forwarded to `getAgentNegotiationMove()` which calls FastAPI `POST /api/agent/respond` (Gemini model reasoning). If FastAPI is offline, an intelligent concession fallback engine handles all 3 domain scenarios seamlessly.

---

## 5. Stopping Conditions & Evaluation

The orchestrator evaluates 3 strict stopping conditions after every turn:

### 1. Agreement Reached (`COMPLETED`)
- **Explicit Agreement**: The active agent executes an `ACCEPT` action or sets `agreement_reached: true`.
- **Concession Gap Convergence**: `currentGap <= threshold` (e.g., gap $\le ₹50$ for Vendor Pricing).
- **Post-Action**: An agreement record is written to Neon PostgreSQL/in-memory store via `db.saveAgreement()`, and an Orchestrator announcement is logged.

### 2. Negotiation Breakdown (`DEADLOCK`)
- **Reservation Walkaway**: An agent executes a hard `REJECT` action citing immutable reservation constraints.
- **Post-Action**: Sets status to `DEADLOCK`, likelihood to 0%, and logs breakdown justification.

### 3. Maximum Rounds Exhaustion (`DEADLOCK`)
- **Condition**: `isRoundEnd && currentRound >= maxRounds`.
- **Post-Action**: When the final round expires without agreement, the orchestrator terminates the session with status `DEADLOCK`.

---

## 6. REST API Endpoints

The orchestrator routes are exposed through `backend/src/routes/simulationRoutes.js`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/simulations` | Initialize new simulation session with scenario preset and opening move |
| `GET` | `/api/simulations/:id` | Fetch full session envelope, messages, agents, offers, and agreements |
| `POST` | `/api/simulations/:id/step` | Advance negotiation by 1 turn using Orchestrator turn management |
| `POST` | `/api/simulations/:id/run` | Execute automated loop until agreement or deadlock |
| `POST` | `/api/simulations/:id/pause` | Pause active negotiation |
| `POST` | `/api/simulations/:id/resume` | Resume paused negotiation |
| `POST` | `/api/simulations/:id/restart`| Re-initialize simulation from Round 1 with original parameters |
| `DELETE`| `/api/simulations/:id` | End negotiation manually |

---

## 7. Verification & Test Suite

The test suite in [`backend/tests/orchestrator.test.js`](file:///c:/Users/harik/OneDrive/Desktop/infosys_sp/multi-agent-negotiation-simulator-main/backend/tests/orchestrator.test.js) verifies all requirements:

```bash
npm run test  # in backend/
```

### Test Results
```
🧪 Starting Orchestrator Agent & Negotiation Turn Management Test Suite...

  ✅ PASS: 1. Preset retrieval loads valid defaults and scenarios
  ✅ PASS: 2. initializeSimulation creates session, logs welcome announcement, and posts opening move
  ✅ PASS: 3. determineNextTurn handles bilateral (2-agent) alternation correctly
  ✅ PASS: 4. determineNextTurn handles multilateral (3-agent) circular round-robin correctly
  ✅ PASS: 5. advanceStep advances turn, records move, and updates metrics
  ✅ PASS: 6. evaluateStoppingConditions detects explicit ACCEPT and gap convergence
  ✅ PASS: 7. evaluateStoppingConditions detects REJECT and max round deadlock
  ✅ PASS: 8. Pause, Resume, and End lifecycle controls work properly
  ✅ PASS: 9. runFullSimulation executes turns until negotiation reaches conclusion

========================================
Results: 9 Passed, 0 Failed
========================================
```
