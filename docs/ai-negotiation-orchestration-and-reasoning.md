# Technical Specification: AI Negotiation Orchestration & Reasoning Engine

**Module:** Milestone 2 (Task 2 & Task 3) — Autonomous Multi-Agent Negotiation Simulator  
**Repository:** [multi-agent-negotiation-simulator](https://github.com/karthik-vana/multi-agent-negotiation-simulator)  
**Status:** Completed & Validated

---

## 1. System Overview & End-to-End Architecture

The system enables autonomous AI agents to negotiate business agreements without human intervention. The complete lifecycle follows this deterministic operational loop:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                NEGOTIATION LIFECYCLE                                    │
│                                                                                        │
│  [1. Session Init]                                                                     │
│         │                                                                              │
│         ▼                                                                              │
│  [2. Agent Turn Management] ───► Bilateral (Alternating) or Multilateral (Round-Robin) │
│         │                                                                              │
│         ▼                                                                              │
│  [3. Context & History]    ───► Extracts last 10 turns + Persona + Goals + Constraints │
│         │                                                                              │
│         ▼                                                                              │
│  [4. LLM Reasoning]        ───► Gemini 2.5 Flash / Fast Heuristic Fallback Engine      │
│         │                                                                              │
│         ▼                                                                              │
│  [5. Offer Generation]     ───► Structured JSON: Dialogue Message + Numeric Terms      │
│         │                                                                              │
│         ▼                                                                              │
│  [6. Counteroffer Eval]    ───► Evaluates Reservation Price & Mathematical Boundaries  │
│         │                                                                              │
│         ▼                                                                              │
│  [7. Action Decision]      ───► ACCEPT / COUNTEROFFER / REJECT                         │
│         │                                                                              │
│         ├── (ACCEPT)        ───► Terminal Agreement Saved to Neon PostgreSQL           │
│         ├── (COUNTEROFFER)  ───► Concession Curve Updated ──► (Go to Step 2)           │
│         └── (REJECT/MAX)    ───► Terminal Deadlock Recorded to Neon PostgreSQL         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Mapping & Responsibilities

### Task - 2: Orchestration & Reasoning

#### 1. Orchestrator Agent
* **Source Location:** [`backend/src/services/orchestratorService.js`](../backend/src/services/orchestratorService.js) and [`frontend/src/pages/NegotiationArena.jsx`](../frontend/src/pages/NegotiationArena.jsx).
* **Turn Order Management:**
  * *Bilateral (2 Agents):* Strict alternating turns between Buyer/Candidate and Seller/Recruiter.
  * *Multilateral (3 Agents):* Circular round-robin indexing (`(turnIndex + 1) % participants.length`) ensuring balanced participation across Engineering, Product, and Finance.
* **Negotiation History & Context:** Extracts chronologically ordered dialogue turns, format-filtered for LLM prompt ingestion.
* **State Maintenance:** Dynamically computes `current_gap`, `agreement_likelihood`, agent stances, current round count, and max rounds.
* **Stopping Condition Evaluator:** Enforces termination upon explicit `ACCEPT`, concession gap convergence within tolerance, walkaway `REJECT`, or reaching `max_rounds`.

#### 2. LLM-Powered Agent Reasoning Engine
* **Source Location:** [`ai-service/main.py`](../ai-service/main.py), [`ai-service/reasoning.py`](../ai-service/reasoning.py), and [`backend/src/services/aiClient.js`](../backend/src/services/aiClient.js).
* **Context Ingestion:** Every prompt receives:
  * Agent persona & personality traits (Aggressive, Collaborative, Risk-Averse).
  * Explicit quantitative target value & reservation price (walk-away threshold).
  * Qualitative business goals and hard constraints.
  * Complete recent dialogue history and counteroffer state.
* **Personality-Conditioned Generation:**
  * *Aggressive:* Minimal concessions, firm posture, demanding language.
  * *Collaborative:* Proportional, reciprocal concessions with integrative compromise suggestions.
  * *Risk-Averse:* Cautious concessions, prioritizing certainty and rapid convergence over maximizing surplus.
* **Structured Response Schema:** Returns validated JSON with natural language message, numerical terms, tactical reasoning, stance, and action.

---

### Task - 3: Offer Evaluation, Concessions & E2E Loop

#### 3. Counteroffer Evaluation & Concession Module
* **Source Location:** [`ai-service/decision/`](../ai-service/decision/) (`evaluator.py`, `concession.py`, `scoring.py`, `budget.py`, `personality.py`, `config.py`).
* **Deterministic Decision Guard:** Mathematical constraints are strictly validated in Python/JS. The LLM only authors the conversational phrasing; deterministic code enforces hard constraint boundaries.
* **Decision Types:**
  * **ACCEPT:** Triggered when the utility of the incoming offer exceeds the acceptance threshold or the offer gap converges within tolerance.
  * **COUNTEROFFER:** Calculated using non-linear concession curves based on remaining rounds, reservation flexibility, and counterpart reciprocity.
  * **REJECT:** Fired when an offer breaches non-negotiable reservation limits or deadlocks persist.

#### 4. End-to-End AI vs AI Negotiation Across Scenarios
Fully integrated and tested across all three predefined business contexts:
1. **Vendor Pricing Negotiation (Procurement):**
   * *Buyer:* Alex Rivers (Procurement Lead, Target: ₹8,000, Max: ₹10,500)
   * *Seller:* Marcus Chen (Enterprise Sales VP, Target: ₹11,000, Min: ₹8,500)
   * *Outcome:* Concession convergence reaching agreement within the feasible Zone of Possible Agreement (ZOPA: ₹8,500 - ₹10,500).
2. **Job Offer Negotiation (HR & Talent):**
   * *Candidate:* David Park (Senior AI Candidate, Base Target: ₹180,000, Min: ₹145,000)
   * *Recruiter:* Sarah Jenkins (Hiring Manager, Budget: ₹160,000, Max: ₹165,000)
   * *Outcome:* Multi-round trade-offs across salary, signing bonus, and equity.
3. **Project Budget Allocation (Cross-Functional Governance):**
   * *Stakeholders:* Elena Rostova (Engineering), Marcus Vance (Product AI), Priya Sharma (Finance)
   * *Constraints:* Fixed total capital budget pool of ₹1,000,000.
   * *Outcome:* 3-agent circular negotiations allocating finite resources or deadlock detection upon unyielding claims.

---

## 3. Deliverables Checklist

| Deliverable | Location in Repository | Status |
| :--- | :--- | :---: |
| **1. Orchestrator Agent** | `backend/src/services/orchestratorService.js` | **Complete** |
| **2. LLM-Powered Reasoning Engine** | `ai-service/main.py`, `ai-service/reasoning.py` | **Complete** |
| **3. Counteroffer & Concession Module** | `ai-service/decision/`, `backend/src/services/aiClient.js` | **Complete** |
| **4. Integrated AI-vs-AI Negotiation Loop** | Full-Stack: `frontend`, `backend`, `ai-service`, Neon DB | **Complete** |
| **5. Test Results for All 3 Scenarios** | `backend/tests/task5.comprehensive.runner.js`, `task5.e2e.test.js` | **Complete** |
| **6. Sample Negotiation Transcripts** | `examples/transcripts/` (`vendor-pricing`, `job-offer`, `project-budget`) | **Complete** |
| **7. Technical Documentation** | `docs/` (`ai-negotiation-orchestration-and-reasoning.md`, `task-5-...`) | **Complete** |

---

## 4. Acceptance Criteria Verification

* [x] **Orchestrator manages turns and round counts:** Verified via `node --test tests/orchestrator.test.js` (9/9 pass).
* [x] **Negotiation history and current state are maintained:** Recorded in Neon DB (`messages`, `offers`, `simulations`).
* [x] **Agents use persona, goals, constraints, and history:** Passed into `build_reasoning_prompt` and verified in unit tests.
* [x] **Incoming offers are evaluated before making a decision:** Evaluated against utility curves and reservation boundaries.
* [x] **Agents can Accept, Counter, or Reject:** All 3 decision actions implemented and verified.
* [x] **Counteroffers demonstrate reasonable concessions:** Multi-round concession curves converge toward agreement.
* [x] **Simulation works across all three predefined scenarios:** Tested across Vendor Pricing, Job Offer, and Project Budget.
* [x] **Negotiation produces a clear final outcome:** Enforces terminal states: `COMPLETED` (Agreement) or `DEADLOCK` (Breakdown).
