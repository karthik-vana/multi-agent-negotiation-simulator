"""Offer evaluation: ACCEPT, COUNTEROFFER or REJECT.

Everything here is deterministic Python. The AI model only writes the wording
of the message; it must never decide whether a hard constraint is respected.

Offer format : flat dict of numbers, e.g. {"price": 97000, "payment_days": 60}
History      : list of {"agent_id": str, "offer": dict} for the turns BEFORE
               the incoming offer, oldest first (both sides).
"""
import math
from typing import Any, Dict, List, Optional, Tuple

from .budget import allocation_counter, opening_allocation
from .concession import accept_threshold, at_least_one_step, concession_fraction, move_toward
from .config import get_scenario
from .models import ACCEPT, COUNTEROFFER, REJECT, DecisionResult, ScenarioSpec
from .personality import get_personality
from .scoring import EPS, fmt, hard_violations, same_offer, utility

RECIPROCITY_STEP = 0.02   # utility gain that counts as "the other side conceded"


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _offers(history: List[Dict[str, Any]], agent_id: str, own: bool) -> List[Dict[str, Any]]:
    out = []
    for entry in history:
        if isinstance(entry, dict) and isinstance(entry.get("offer"), dict):
            if (entry.get("agent_id") == agent_id) == own:
                out.append(entry["offer"])
    return out


def normalize_offer(scenario: ScenarioSpec, offer: Any, history: List[Dict[str, Any]],
                    agent_id: str) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    """Validate the offer. Missing issues are filled from the other side's last offer."""
    if not isinstance(offer, dict):
        return None, ["offer must be a dictionary of issue -> number"]
    errors: List[str] = []
    allowed = scenario.issue_keys()
    unknown = [str(k) for k in offer if k not in allowed]
    if unknown:
        errors.append(f"unknown issue(s): {', '.join(unknown)}")
    merged = {k: v for k, v in offer.items() if k in allowed}
    others = _offers(history, agent_id, own=False)
    if others:
        for key in allowed:
            if key not in merged and key in others[-1]:
                merged[key] = others[-1][key]
    missing = [k for k in allowed if k not in merged]
    if missing:
        errors.append(f"missing issue(s): {', '.join(missing)}")
    for key, value in merged.items():
        spec = scenario.issue_spec(key)
        if not _is_number(value):
            errors.append(f"{key} must be a finite number, got {value!r}")
        elif value < spec.min_value - EPS:
            errors.append(f"{key} must be at least {fmt(spec.min_value)}, got {fmt(value)}")
    if not errors and scenario.kind == "allocation":
        total = sum(merged.values())
        if total > scenario.total_budget + EPS:
            errors.append(f"allocations add up to {fmt(total)}, above the total budget "
                          f"of {fmt(scenario.total_budget)}")
    return (None if errors else merged), errors


def opening_offer(scenario_id: str, agent_id: str) -> Dict[str, Any]:
    """The agent's first offer: its target on every issue."""
    scenario = get_scenario(scenario_id)
    profile = scenario.agent(agent_id)
    if scenario.kind == "allocation":
        return opening_allocation(scenario, profile)
    return {s.key: s.target for s in profile.issues}


def _bilateral_counter(profile, incoming, last_own, rate) -> Dict[str, Any]:
    counter = dict(incoming)               # issues I don't care about: keep theirs
    for spec in profile.issues:
        mine = last_own.get(spec.key, spec.target) if last_own else spec.target
        value = move_toward(mine, incoming[spec.key], spec.better, rate)
        value = at_least_one_step(mine, incoming[spec.key], value, 10 ** -spec.decimals)
        value = max(value, spec.limit) if spec.better == "higher" else min(value, spec.limit)
        value = round(value, spec.decimals)
        counter[spec.key] = int(value) if spec.decimals == 0 else value
    return counter


def evaluate_offer(scenario_id: str, agent_id: str, offer: Any,
                   history: Optional[List[Dict[str, Any]]] = None,
                   round_number: int = 1, max_rounds: int = 10,
                   personality: Optional[str] = None) -> Dict[str, Any]:
    """Decide what `agent_id` does with the incoming `offer`. Returns a dict."""
    scenario = get_scenario(scenario_id)
    profile = scenario.agent(agent_id)
    p = get_personality(personality or profile.default_personality)
    history = list(history or [])
    round_number = max(1, int(round_number))
    max_rounds = max(1, int(max_rounds))
    threshold = accept_threshold(p, round_number, max_rounds)
    common = dict(personality=p.name, round_number=round_number,
                  accept_threshold=round(threshold, 4))

    # 1. Is the offer valid at all?
    offer_ok, errors = normalize_offer(scenario, offer, history, agent_id)
    if errors:
        return DecisionResult(REJECT, "Offer is invalid: " + "; ".join(errors),
                              errors=errors, **common).to_dict()

    repeat_count = sum(1 for o in _offers(history, agent_id, own=False) if same_offer(o, offer_ok))
    common.update(repeated_offer=repeat_count > 0, repeat_count=repeat_count)

    # 2. Score the offer (0-1) and decide how much to concede this turn.
    violations = hard_violations(profile, offer_ok)
    score = utility(profile, offer_ok)
    previous = _offers(history, agent_id, own=False)
    reciprocated = False
    if previous:
        try:
            reciprocated = score - utility(profile, previous[-1]) >= RECIPROCITY_STEP
        except (KeyError, TypeError):
            reciprocated = False
    rate = concession_fraction(p, round_number, max_rounds, reciprocated)
    common.update(utility=round(score, 4), concession_rate=round(rate, 4))

    own_before = _offers(history, agent_id, own=True)
    last_own = own_before[-1] if own_before else None

    def make_counter() -> Dict[str, Any]:
        if scenario.kind == "allocation":
            return allocation_counter(scenario, profile, offer_ok, last_own, rate)
        return _bilateral_counter(profile, offer_ok, last_own, rate)

    # 3. Hard constraints can never be broken: REJECT. The agent still moves
    #    toward the other side (never past its own limits) so talks can go on.
    if violations:
        return DecisionResult(
            REJECT, "Offer breaks hard constraint(s): " + "; ".join(v["message"] for v in violations),
            next_offer=make_counter(), violates_constraints=True,
            violations=violations, **common).to_dict()

    # 4. Good enough? ACCEPT.
    if score + EPS >= threshold:
        return DecisionResult(
            ACCEPT, f"Offer meets this agent's acceptance level ({score:.2f} >= {threshold:.2f}).",
            **common).to_dict()

    # 5. Otherwise COUNTEROFFER that concedes a little.
    counter = make_counter()
    if same_offer(counter, offer_ok):
        return DecisionResult(
            ACCEPT, "The counteroffer would equal the incoming offer, so the offer is accepted.",
            **common).to_dict()
    return DecisionResult(
        COUNTEROFFER,
        f"Offer is within limits but below the acceptance level ({score:.2f} < {threshold:.2f}); "
        f"conceding {rate:.0%} toward the other side.",
        counter_offer=counter, **common).to_dict()
