# Reference Negotiation Transcripts

This directory contains reference sample negotiation transcripts for the **Negotiator AI** platform.

> **Note on Data Provenance:**  
> These transcripts are manually authored **reference fixtures** designed to model expected conversational behaviors, multi-round concession curves, and decision logic across predefined scenarios. They serve as deterministic benchmarks and test fixtures for the Orchestrator, AI Reasoning, and Evaluation modules, rather than live unconstrained Gemini API outputs.

---

## Catalog of Reference Transcripts

| Filename | Scenario | Outcome | Key Behaviors Demonstrated |
| :--- | :--- | :--- | :--- |
| [`vendor-pricing-agreement.json`](./vendor-pricing-agreement.json) | **Vendor Pricing Negotiation** | `AGREEMENT_REACHED` | Opening offers, mutual price concessions ($82 -> $90 and $96 -> $90), trade-offs on payment terms (Net-60 -> Net-30), and successful agreement respecting all budget/cost floors. |
| [`job-offer-counteroffer.json`](./job-offer-counteroffer.json) | **Job Offer Negotiation** | `COUNTEROFFER_CONVERGENCE` | Multi-issue package evaluation (Base Salary, Performance Bonus, Joining Date, Remote Days), context-aware counteroffer generation, and convergence to an agreement. |
| [`project-budget-breakdown.json`](./project-budget-breakdown.json) | **Project Budget Allocation** | `DEADLOCK` | Competing resource demands, policy constraint clashes, rigid baseline stances, mutual rejections, and formal impasse detection under fixed budget ($1M) and capacity (2,000h) caps. |

---

## Schema Structure

Each transcript file adheres to the core domain schema:

* `_meta`: Metadata describing the reference fixture, scenario ID, and targeted outcome.
* `simulation`: Simulation session envelope containing `id`, `scenario_id`, `status`, `current_round`, `max_rounds`, `initial_gap`, and `agreement_likelihood`.
* `agents`: Participating agent profiles, roles, personalities (`Collaborative`, `Aggressive`, `Risk-Averse`), primary goals, target/reservation values, and constraints.
* `rounds`: Chronological round groupings containing individual agent and orchestrator turns with:
  * `sender_role` & `sender_type` (`AGENT` or `ORCHESTRATOR`)
  * `personality`
  * `action` (`OFFER`, `COUNTER_OFFER`, `ACCEPT`, `REJECT`, `STATUS`)
  * `offer_value` & `terms`
  * `message` (Conversational dialogue)
  * `decision_explanation` (Internal tactical reasoning)
  * `timestamp_label`
* `final_agreement` / `final_outcome`: Final settlement terms, constraint validation audits, or breakdown root-cause analysis.
