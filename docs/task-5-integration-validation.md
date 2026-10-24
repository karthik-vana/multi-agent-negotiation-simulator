# Task 5 — End-to-End Integration Support, Scenario Testing & Validation

Issue: https://github.com/karthik-vana/multi-agent-negotiation-simulator/issues/18

## Scope boundary

This contribution validates the existing frontend, Express backend, AI reasoning service, and persistence layer. It does not rebuild the frontend/backend or replace the backend orchestrator from Task 2. The existing backend orchestrator implementation from PR #21 must remain intact.

PR #22 introduced a duplicate client-side orchestrator implementation and was reverted by PR #23. The revert has already been merged into main. Do not revert PR #21 or repeat the PR #22 revert on main.

## Environment prerequisites

1. Use a clean checkout of the latest main and create a separate Task 5 branch.
2. Install backend dependencies: cd backend, then npm ci.
3. Start the Python AI service if testing the full AI-service integration. From ai-service, install requirements.txt, configure any required environment variables, and start FastAPI using the repository's documented command. When the Gemini key is absent, label the result as fallback-mode testing; do not claim live Gemini verification.
4. Configure DATABASE_URL with an authorized, non-production Neon test database when durable database validation is required. Never commit .env files, database URLs, or API keys.
5. Start the backend with npm start. Its API health endpoint is GET /api/health; simulation endpoints are mounted at /api/simulations.
6. Start the frontend and exercise Simulation Mode in a browser to validate the actual UI-to-API integration.

## Automated backend API checks

The API-level regression suite is backend/tests/task5.e2e.test.js. It uses Node's built-in test runner and has no additional test dependency.

From backend:

PowerShell:

    $env:TASK5_BASE_URL = "http://localhost:5000"
    node --test tests/task5.e2e.test.js

Bash:

    TASK5_BASE_URL=http://localhost:5000 node --test tests/task5.e2e.test.js

For a run that must verify the live Neon connection, set TASK5_REQUIRE_NEON=1 as well. A run where health reports IN_MEMORY_FALLBACK may confirm in-process API/session behavior, but it is not proof of durable Neon PostgreSQL persistence.

The suite checks:

- backend health and 404 behavior for an unknown simulation ID;
- initialization and expected agent counts for Vendor Pricing, Job Offer, and Project Budget Allocation;
- opening transcript/offer presence and session retrieval after an API re-fetch (refresh-equivalent);
- pause, no-step-while-paused, and resume behavior;
- end-of-round maximum-round termination for each scenario;
- retrieval from the simulation listing endpoint;
- an explicit Neon-connection requirement when TASK5_REQUIRE_NEON=1.

These are API-level integration tests. They do not automate a browser or independently prove live Gemini behavior. Perform the UI and service-level checks below before reporting Task 5 as complete.

## Manual end-to-end checklist

Mark each item only after running it and saving evidence.

| ID | Scenario / check | Expected result | Evidence to capture | Result |
|---|---|---|---|---|
| UI-01 | Open Simulation Mode from the existing frontend | UI loads without console/runtime errors | Browser screenshot and console output | Not run |
| VP-01 | Vendor Pricing: start and run several turns | Buyer/Seller turn order and offers are visible; status/rounds update | Session ID, transcript, health response | Not run |
| JO-01 | Job Offer: start and run several turns | Candidate/Recruiter salary offers and counteroffers render correctly | Session ID, transcript, final status | Not run |
| PB-01 | Project Budget: start and run several turns | Three agents rotate in order; each offer and round is tracked | Session ID, transcript, final status | Not run |
| LIFE-01 | Pause and resume each scenario | No new turn while paused; turns resume after resuming | Before/after transcript counts | Automated suite added; runtime pending |
| EDGE-01 | Maximum rounds | Simulation stops at configured maximum without incrementing beyond it | Terminal status and current/max round | Automated suite added; runtime pending |
| EDGE-02 | Explicit acceptance and rejection | Correct terminal status and outcome record | Transcript and agreement/outcome record | Not run |
| EDGE-03 | Invalid/malformed offer | Request/offer is rejected or safely normalized; no invalid agreement | Sanitized request and response | Not run |
| EDGE-04 | AI service unavailable/timeout | Backend fallback behavior is deterministic, logged, and does not crash the API | Backend log and response | Not run |
| DB-01 | Neon persistence | Session, agents, messages, offers and terminal outcome remain retrievable after a fresh request/process restart | Health showing CONNECTED, session ID, retrieved rows | Not run |
| DB-02 | In-memory fallback | UI/API still report fallback mode; result is not presented as Neon persistence | Health JSON | Not run |

## Test-result reporting template

For each test, record: date/time and environment; scenario ID; session ID (if created); command or manual steps; expected result; actual result; PASS/FAIL/BLOCKED; sanitized logs/screenshots; associated issue; and retest result after a fix. Do not include credentials, tokens, personal data, or complete production database connection strings.

## Known verification limitations

- This authoring environment could inspect repository content but could not clone the repository or run its dependencies, so no live API execution result is asserted here. The test file's syntax was checked locally; a no-URL invocation correctly skips live tests.
- Real Neon verification requires DATABASE_URL to point to an authorized test instance and the health endpoint to report CONNECTED.
- Live Gemini verification requires the configured AI service and authorized credentials. If the reasoning service is unavailable or credentials are missing, record that run as fallback-mode validation.
- Any bug in a module owned by another task should be recorded with a minimal reproduction and routed to that module's owner; Task 5 should not silently rewrite that module.