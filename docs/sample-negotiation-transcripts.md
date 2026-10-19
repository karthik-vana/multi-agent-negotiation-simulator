# Sample Negotiation Transcripts & Outcome Reference Guide

This document presents structured reference transcripts demonstrating the three core negotiation outcomes within the **Negotiator AI** platform:

1. **Successful Agreement:** Agents exchange offers and counteroffers, make reasonable concessions, and reach an agreement that respects both agents' constraints.
2. **Counteroffer Negotiation:** Agents evaluate incoming offers and produce context-aware counteroffers based on their objectives, constraints, personalities, and previous concessions.
3. **Negotiation Breakdown (Deadlock):** Agents reject unacceptable offers and fail to reach an agreement because their constraints or objectives cannot be reconciled.

> **Label:** These transcripts are **curated reference samples** based on the system's baseline data models in `frontend/src/data/scenarios.js` and database schemas in `backend/src/db/init.sql`. JSON fixtures are available in [`examples/transcripts/`](file:///c:/multi-agent-negotiation-simulator/examples/transcripts/).

---

## 1. Successful Agreement: Vendor Pricing Negotiation

* **Scenario:** Vendor Pricing Negotiation (`vendor-pricing`)
* **Domain:** Procurement & Sales
* **Outcome:** `AGREEMENT_REACHED` in Round 3
* **JSON Fixture:** [`examples/transcripts/vendor-pricing-agreement.json`](file:///c:/multi-agent-negotiation-simulator/examples/transcripts/vendor-pricing-agreement.json)

### Participating Agents:
* **Buyer (`Purchasing Manager`):**
  * *Personality:* Collaborative
  * *Objective:* Secure competitive price while maintaining quality and delivery standards.
  * *Economic Limits:* Target $\$80/\text{unit}$, Walkaway Ceiling $\$100/\text{unit}$, Budget Cap $\$110,000$.
* **Vendor (`Sales Representative`):**
  * *Personality:* Collaborative
  * *Objective:* Secure profitable sale above minimum commercial margin.
  * *Economic Limits:* Target $\$100/\text{unit}$, Walkaway Floor $\$80/\text{unit}$, Supply Cost $\$65/\text{unit}$.

### Turn-by-Turn Dialogue & Concessions:

#### Round 1:
* **Purchasing Manager (OFFER - $82/unit):**
  * *"We would like to place an order for 1,000 units at an opening price of $82 per unit with Net-60 payment terms and delivery in 21 days."*
  * *Decision Reasoning:* Initial anchor near low end of ZOPA, satisfying $110k budget cap.
* **Sales Representative (COUNTER_OFFER - $96/unit):**
  * *"Thank you for the opening proposal. $82 is below our target commercial margin. We can commit to 1,000 Grade 4 units at $96 per unit with standard Net-30 terms and fast 14-day delivery."*
  * *Decision Reasoning:* Rejects $82 as yielding inadequate margin over $65 cost; counters at $96 offering expedited 14-day delivery.

#### Round 2:
* **Purchasing Manager (COUNTER_OFFER - $88/unit):**
  * *"We appreciate the fast turnaround offer, but $96 stretches our allocation. We can move our price up to $88 per unit and adjust payment terms to Net-45 if you can meet us on an 18-day schedule."*
  * *Decision Reasoning:* Concedes $6 on price ($82 -> $88) and tightens payment terms to signal willingness to find middle ground.
* **Sales Representative (COUNTER_OFFER - $92/unit):**
  * *"We value this partnership. We can accept the 18-day delivery schedule and lower our unit price to $92, provided we keep payment terms at Net-30 to manage our working capital."*
  * *Decision Reasoning:* Concedes $4 ($96 -> $92) and accepts 18-day delivery while holding Net-30 for cash flow.

#### Round 3:
* **Purchasing Manager (COUNTER_OFFER - $90/unit):**
  * *"If we agree to your Net-30 payment condition, can we split the difference and close the contract at $90 per unit for the 1,000 units?"*
  * *Decision Reasoning:* Proposes final split-the-difference midpoint at $90/unit ($90,000 total).
* **Sales Representative (ACCEPT - $90/unit):**
  * *"We have an agreement. At $90 per unit with Net-30 terms and 18-day delivery, this deal meets our profitability thresholds. We confirm acceptance."*
  * *Decision Reasoning:* $90 >= $80 floor and provides a healthy $25/unit gross margin above $65 cost.
* **Orchestrator Agent:**
  * *"Agreement confirmed in Round 3. All buyer constraints (budget <= $110k, price <= $100) and vendor constraints (price >= $80, lead time >= 14d) verified."*

### Final Outcome Summary:
* **Agreed Price:** **$\$90.00 / \text{unit}$** for 1,000 units ($\$90,000$ total)
* **Terms:** Net-30 Payment, 18-Day Delivery Lead Time, Quality Grade 4.

---

## 2. Counteroffer Negotiation: Job Offer Multi-Issue Convergence

* **Scenario:** Job Offer Negotiation (`job-offer`)
* **Domain:** Talent & Human Resources
* **Outcome:** `COUNTEROFFER_CONVERGENCE` (Agreement via package trade-offs in Round 3)
* **JSON Fixture:** [`examples/transcripts/job-offer-counteroffer.json`](file:///c:/multi-agent-negotiation-simulator/examples/transcripts/job-offer-counteroffer.json)

### Participating Agents:
* **Job Candidate:**
  * *Personality:* Collaborative
  * *Objective:* Competitive total compensation and schedule flexibility.
  * *Constraints:* Base Salary $\ge \$90,000$, Notice Period $\ge 30\text{ days}$, Remote Days $\ge 2\text{ days/week}$.
* **Hiring Manager:**
  * *Personality:* Risk-Averse
  * *Objective:* Hire within approved departmental salary guidelines and company policies.
  * *Constraints:* Base Salary $\le \$105,000$, Start Date $\le 60\text{ days}$, Remote Days $\le 3\text{ days/week}$, Bonus $\le 10\%$.

### Turn-by-Turn Dialogue & Concessions:

#### Round 1:
* **Hiring Manager (OFFER - $92,000 Base, 5% Bonus, 30d start, 2 remote days):**
  * *"We are excited to extend an initial offer with a base salary of $92,000, a 5% performance bonus, starting in 30 days, with 2 remote days per week."*
  * *Decision Reasoning:* Opens cautiously within budget band, satisfying candidate minimum $90k requirement.
* **Job Candidate (COUNTER_OFFER - $102,000 Base, 8% Bonus, 45d start, 3 remote days):**
  * *"Thank you for the offer. Based on my specialized AI engineering experience and market benchmarks, I am targeting a base of $102,000 with an 8% bonus and 3 remote days. I would be able to start in 45 days after completing my transition."*
  * *Decision Reasoning:* Evaluates that $92k meets floor but tests upper boundary ($102k) with preferred 45-day start date.

#### Round 2:
* **Hiring Manager (COUNTER_OFFER - $95,000 Base, 6% Bonus, 35d start, 2 remote days):**
  * *"A base salary of $102,000 exceeds our internal equity benchmarks for this role tier. We can increase the base to $95,000 with a 6% bonus ($5,700). However, the team requires your on-site presence at 3 days per week, and we need you to start within 35 days."*
  * *Decision Reasoning:* Evaluates candidate counteroffer; adjusts base by +$3k, but sets strict requirements on on-site presence and earlier start.
* **Job Candidate (COUNTER_OFFER - $98,000 Base, 8% Bonus, 35d start, 2 remote days):**
  * *"I am willing to compromise on the schedule by agreeing to your 35-day start date and the 2 days remote arrangement. In return, I request that we adjust the base salary to $98,000 with an 8% bonus to bridge the overall value gap."*
  * *Decision Reasoning:* Concedes on start date (45d -> 35d) and remote days (3d -> 2d), requesting monetary offset to $98k base.

#### Round 3:
* **Hiring Manager (COUNTER_OFFER - $97,000 Base, 8% Bonus, 35d start, 2 remote days):**
  * *"We appreciate your flexibility on the start date and on-site commitments. We can stretch our base salary authorization to $97,000 and approve the 8% annual performance bonus ($7,760), bringing your total compensation potential to $104,760."*
  * *Decision Reasoning:* Evaluates total compensation; $97k base is below $105k ceiling and 8% bonus meets company policy.
* **Job Candidate (ACCEPT):**
  * *"With total compensation reaching $104,760, a $97,000 base, 2 remote days per week, and a 35-day start, this package satisfies all my core objectives. I am delighted to accept your offer."*
  * *Decision Reasoning:* Total package exceeds $100k target; all hard constraints honored.
* **Orchestrator Agent:**
  * *"Negotiation concluded successfully via multi-issue counteroffers in Round 3. All employer constraints and candidate constraints verified."*

### Final Outcome Summary:
* **Agreed Package:** Base Salary **$\$97,000$**, $8\%$ Annual Bonus ($\$7,760$), Total Estimated Package **$\$104,760$**.
* **Terms:** 35-Day Joining Date, 2 Days/Week Remote Flexibility.

---

## 3. Negotiation Breakdown: Project Budget Allocation (Deadlock)

* **Scenario:** Project Budget Allocation (`project-budget`)
* **Domain:** Corporate Strategy & Finance
* **Outcome:** `DEADLOCK` in Round 4
* **JSON Fixture:** [`examples/transcripts/project-budget-breakdown.json`](file:///c:/multi-agent-negotiation-simulator/examples/transcripts/project-budget-breakdown.json)

### Resource Caps & Competing Demands:
* **Total Available Budget:** **$\$1,000,000$ (Strict Cap)**
* **Total Shared Engineering Hours:** **$2,000\text{ hours}$ (Strict Cap)**
* **Department A (Core Engineering):** Requires $\$600,000$ and $1,200\text{ hours}$. Min Floor: $\$250,000$ and $700\text{ hours}$.
* **Department B (Growth & Marketing):** Requires $\$550,000$ and $1,000\text{ hours}$. Min Floor: $\$200,000$ and $600\text{ hours}$.
* *Core Conflict:* Combined requests ($\$1,150,000$ and $2,200\text{ hours}$) exceed organizational capacity by $\$150,000$ and $200\text{ hours}$. Both departments hold conflicting policy constraints regarding non-deferrable commitments.

### Turn-by-Turn Dialogue & Impasse:

#### Round 1:
* **Department A (OFFER - $600k Funding, 1,200 Hours):**
  * *"Our infrastructure modernization is the foundation for all platform services. We request our full estimated budget of $600,000 and 1,200 shared engineering hours, leaving $400,000 and 800 hours for Department B."*
* **Department B (REJECT - Demands $520k Funding, 1,000 Hours):**
  * *"We reject this proposal. A $400,000 allocation would immediately compromise our Q3 contractual launch commitments. We require $520,000 and at least 1,000 shared engineering hours, leaving $480,000 and 1,000 hours for Department A."*

#### Round 2:
* **Department A (COUNTER_OFFER - $580k Funding, 1,150 Hours):**
  * *"Reducing Department A to $480,000 would halt mandatory security compliance audits. The most we can concede is reducing our ask to $580,000 and 1,150 hours, permitting Department B to receive $420,000 and 850 hours."*
* **Department B (REJECT - Demands 50/50 Split):**
  * *"We cannot accept $420,000; our contract penalty liabilities exceed any savings. The only viable path is an equal 50/50 split of the $1,000,000 budget ($500,000 each) and 1,000 shared hours each."*

#### Round 3:
* **Department A (COUNTER_OFFER - $560k Funding, 1,100 Hours):**
  * *"An equal $500,000 split is fundamentally unacceptable because our non-deferrable infrastructure migration requires a minimum hard floor of $560,000 and 1,100 hours. This is our final concession."*
* **Department B (REJECT):**
  * *"At $440,000, Department B would incur severe contractual defaults on enterprise partner deliverables. Since you refuse to accept $500,000, we have reached an impasse and cannot concede further."*

#### Round 4:
* **Department A (REJECT):**
  * *"We formally reject any allocation below $560,000 and 1,100 shared hours. As both parties have reached their hard constraint limits, we declare formal impasse."*
* **Department B (REJECT):**
  * *"Department B concurs. We cannot sign off on an agreement that forces project default. Negotiation terminated without consensus."*
* **Orchestrator Agent (DEADLOCK ANNOUNCEMENT):**
  * *"DEADLOCK DETECTED: Mutual rejection reached at Round 4. Department A bottom line ($560,000) + Department B bottom line ($500,000) = $1,060,000, exceeding total available budget ($1,000,000) by $60,000. Shared hours demand (1,100 + 1,000 = 2,100h) exceeds capacity (2,000h) by 100h. Simulation concluded in deadlock. Escalating to executive arbitration."*

### Breakdown Root-Cause Analysis:
* **Mathematical Infeasibility of Rigid Baselines:** Dept A walkaway floor ($\$560\text{k}$) + Dept B walkaway floor ($\$500\text{k}$) equals $\$1,060,000$ (over budget by $\$60,000$).
* **Capacity Overrun:** Shared hours bottom lines ($1,100\text{h} + 1,000\text{h} = 2,100\text{h}$) exceed the maximum available $2,000\text{ hours}$.
* **Policy Deadlock:** Core Engineering security compliance policy directly contradicted Marketing's binding partner launch dates, preventing either agent from yielding further.
