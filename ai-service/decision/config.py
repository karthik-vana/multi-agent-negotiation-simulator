"""Targets, limits and weights per scenario and agent.

SOURCE OF TRUTH: the numbers below are copied from
frontend/src/data/scenarios.js (keep them in sync!). Values marked ASSUMED
are not in that file and are sample values chosen so that a deal is possible.
All numbers are sample values, not real business data.
"""
from .models import AgentProfile, IssueSpec, ScenarioSpec

C, A, R = "Collaborative", "Aggressive", "Risk-Averse"


def _agent(sid, aid, name, personality, *issues):
    return AgentProfile(sid, aid, name, personality, tuple(issues))


# ---------------------------------------------------------------- vendor ----
# price = total annual contract value in USD, payment_days = Net-N,
# delivery_weeks = weeks until delivery/implementation.
_VENDOR = ScenarioSpec("vendor-pricing", "bilateral", {
    "buyer-procurement": _agent(
        "vendor-pricing", "buyer-procurement", "Procurement Director", C,
        IssueSpec("price", "price", 95000, 100000, "lower", 0.70, True, 0, 1),
        IssueSpec("payment_days", "payment days", 60, 60, "higher", 0.15, True),
        IssueSpec("delivery_weeks", "delivery weeks", 4, 4, "lower", 0.15, True)),
    "vendor-sales": _agent(
        "vendor-pricing", "vendor-sales", "Enterprise Account Executive", A,
        # floor 90,000 treated as HARD ("without VP approval" is ambiguous)
        IssueSpec("price", "price", 110000, 90000, "higher", 0.75, True, 0, 1),
        IssueSpec("payment_days", "payment days", 30, 90, "lower", 0.15, False),
        # ASSUMED: vendor prefers a longer delivery window
        IssueSpec("delivery_weeks", "delivery weeks", 6, 2, "higher", 0.10, False)),
})

# ------------------------------------------------------------------- job ----
# base_salary / sign_on_bonus in USD, equity_pct in %, office_days per week,
# joining_days = days from offer until the start date.
_JOB = ScenarioSpec("job-offer", "bilateral", {
    "job-candidate": _agent(
        "job-offer", "job-candidate", "Senior AI Engineer Candidate", C,
        IssueSpec("base_salary", "base salary", 175000, 160000, "higher", 0.50, True),
        IssueSpec("sign_on_bonus", "sign-on bonus", 20000, 0, "higher", 0.10, False),
        IssueSpec("equity_pct", "equity", 0.25, 0.0, "higher", 0.15, False, 2),
        IssueSpec("office_days", "office days", 0, 2, "lower", 0.15, True),
        IssueSpec("joining_days", "joining days", 60, 60, "higher", 0.10, True)),
    "hiring-director": _agent(
        "job-offer", "hiring-director", "Hiring Director & Talent Lead", R,
        IssueSpec("base_salary", "base salary", 150000, 168000, "lower", 0.50, True),
        IssueSpec("sign_on_bonus", "sign-on bonus", 5000, 15000, "lower", 0.10, True),
        IssueSpec("equity_pct", "equity", 0.15, 0.20, "lower", 0.15, False, 2),
        IssueSpec("office_days", "office days", 3, 2, "higher", 0.15, True),
        # ASSUMED: employer prefers an earlier start, accepts up to 90 days
        IssueSpec("joining_days", "joining days", 30, 90, "lower", 0.10, False)),
})

# ---------------------------------------------------------------- budget ----
# Offer = how the whole budget is split: {"engineering": x, "marketing": y,
# "product_ai": z} in USD. Each agent cares about its own share only.
_BUDGET = ScenarioSpec("project-budget", "allocation", {
    "vp-engineering": _agent(
        "project-budget", "vp-engineering", "VP of Engineering", R,
        IssueSpec("engineering", "engineering share", 450000, 350000, "higher", 1.0)),
    "cmo-marketing": _agent(
        "project-budget", "cmo-marketing", "Chief Marketing Officer", A,
        IssueSpec("marketing", "marketing share", 350000, 250000, "higher", 1.0)),
    "head-product-ai": _agent(
        "project-budget", "head-product-ai", "Head of Product AI", C,
        IssueSpec("product_ai", "product AI share", 300000, 200000, "higher", 1.0)),
}, total_budget=1000000)

SCENARIOS = {s.scenario_id: s for s in (_VENDOR, _JOB, _BUDGET)}
SCENARIO_IDS = tuple(SCENARIOS)


def get_scenario(scenario_id: str) -> ScenarioSpec:
    if scenario_id not in SCENARIOS:
        raise ValueError(f"Unknown scenario '{scenario_id}'. "
                         f"Valid: {list(SCENARIO_IDS)}")
    return SCENARIOS[scenario_id]
