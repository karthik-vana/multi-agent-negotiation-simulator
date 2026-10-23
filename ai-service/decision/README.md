# Offer evaluation & concession module (Task 4)

Pure Python, no AI calls, no extra dependencies. Decides whether an agent
**accepts, counters or rejects** an incoming offer. The AI model only writes the
*wording*; hard constraints are checked here, in code.

```python
from decision import evaluate_offer, opening_offer

result = evaluate_offer(
    scenario_id="vendor-pricing",        # vendor-pricing | job-offer | project-budget
    agent_id="buyer-procurement",        # ids from frontend/src/data/scenarios.js
    offer={"price": 97000, "payment_days": 60, "delivery_weeks": 4},
    history=[...],                       # turns BEFORE this offer, oldest first
    round_number=3, max_rounds=10,
    personality=None,                    # None = the agent's default personality
)
```

## Input contract
* **offer**: flat dict of numbers (no strings, no `None`, no `NaN`). Keys per scenario:
  * vendor-pricing: `price`, `payment_days`, `delivery_weeks`
  * job-offer: `base_salary`, `sign_on_bonus`, `equity_pct`, `office_days`, `joining_days`
  * project-budget: `engineering`, `marketing`, `product_ai` (whole split of the budget)
* **history**: `[{"agent_id": "...", "offer": {...}}, ...]`, both sides, **excluding** the incoming offer.
* A partial offer is completed from the other side's last offer in `history`.
* Parsing the AI/human text into numbers is the AI Reasoning engine's job.

## Output contract (`dict`)
| field | meaning |
|---|---|
| `decision` | `"accept"`, `"counteroffer"` or `"reject"` |
| `counter_offer` | full offer to send next (only for `counteroffer`) |
| `next_offer` | position after a **hard-constraint reject**, so the talks continue |
| `reason` | short human-readable explanation (feed it to the AI as context) |
| `utility`, `accept_threshold`, `concession_rate` | numbers for the live metrics panel |
| `violates_constraints`, `violations` | which hard limits were broken |
| `errors` | validation problems (invalid offer; no `next_offer` is given) |
| `repeated_offer`, `repeat_count` | the other side repeated an earlier offer (useful for deadlock detection) |
| `personality`, `round_number` | what was used |

Orchestrator rule: next position = `counter_offer or next_offer`; if both are
`None` the offer was invalid, so ask the sender to resend.

## How a decision is made
1. **Validate**: dict of finite numbers, known keys, valid ranges (budget split must not exceed the total).
2. **Score** the offer 0-1 per issue (1 = at/after target, 0 = at/after limit), weighted.
3. **Hard constraint broken?** -> `reject` (never accepted, whatever the personality or round).
4. **Score >= acceptance bar?** -> `accept`. The bar falls linearly from the personality's opening level to its floor in the last round.
5. Otherwise **counteroffer**: move a share of the gap toward the other side (never worse than before, never past own limit, at least one unit per turn).

| Personality | accepts at (round 1 -> last) | opening concession -> max |
|---|---|---|
| Aggressive | 0.90 -> 0.40 | 15% -> 45% |
| Collaborative | 0.80 -> 0.30 | 30% -> 60% (+10% if the other side just conceded) |
| Risk-Averse | 0.70 -> 0.25 | 25% -> 50% (+5% reciprocity) |

## Config
`decision/config.py` holds targets, limits and weights. **Numbers are copied from
`frontend/src/data/scenarios.js`: keep them in sync.** Values marked `ASSUMED`
are sample values not present in that file.

## Run
```
python -m unittest discover -s tests -v     # 37 tests
python example_usage.py                      # prints a full vendor negotiation
```

## Open questions for the team
* Project Budget has 3 agents in `scenarios.js`; the task text says Department A/B. Config is data-driven, so either works.
* Vendor floor ($90,000, "without VP approval") is treated as a **hard** limit.
* Deadlock detection/resolution is Milestone 3; this module only reports `repeated_offer`.
