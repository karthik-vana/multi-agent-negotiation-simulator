"""Deterministic scoring: hard-constraint checks and offer utility (0-1)."""
import math
from typing import Any, Dict, List

from .models import AgentProfile, IssueSpec

EPS = 1e-9


def fmt(value: float) -> str:
    return str(int(value)) if float(value).is_integer() else str(value)


def satisfies(spec: IssueSpec, value: float) -> bool:
    """True if value is at least as good as the limit (limit itself is OK)."""
    if spec.better == "higher":
        return value >= spec.limit - EPS
    return value <= spec.limit + EPS


def issue_score(spec: IssueSpec, value: float) -> float:
    """1.0 at/after target, 0.0 at/after limit, linear in between."""
    span = abs(spec.target - spec.limit)
    if span < EPS:
        return 1.0 if satisfies(spec, value) else 0.0
    if spec.better == "higher":
        raw = (value - spec.limit) / span
    else:
        raw = (spec.limit - value) / span
    return max(0.0, min(1.0, raw))


def utility(profile: AgentProfile, offer: Dict[str, Any]) -> float:
    return sum(s.weight * issue_score(s, offer[s.key]) for s in profile.issues)


def hard_violations(profile: AgentProfile, offer: Dict[str, Any]) -> List[Dict[str, Any]]:
    found = []
    for spec in profile.issues:
        if spec.hard and not satisfies(spec, offer[spec.key]):
            side = "below the minimum" if spec.better == "higher" else "above the maximum"
            found.append({
                "issue": spec.key,
                "value": offer[spec.key],
                "limit": spec.limit,
                "message": f"{spec.label} {fmt(offer[spec.key])} is {side} of {fmt(spec.limit)}",
            })
    return found


def same_offer(a: Dict[str, Any], b: Dict[str, Any]) -> bool:
    if set(a) != set(b):
        return False
    try:
        return all(math.isclose(float(a[k]), float(b[k]), abs_tol=EPS) for k in a)
    except (TypeError, ValueError):
        return False
