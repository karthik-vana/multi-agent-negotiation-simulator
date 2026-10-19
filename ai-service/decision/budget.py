"""Project Budget Allocation: split a fixed budget between stakeholders."""
import math
from typing import Any, Dict, Optional

from .concession import at_least_one_step, move_toward
from .models import AgentProfile, ScenarioSpec


def distribute_remaining(scenario: ScenarioSpec, agent_id: str, own_share: float) -> Dict[str, int]:
    """Give the other agents everything that is left after `own_share`.

    1) every other agent gets its minimum, 2) the rest goes up to each
    agent's target (proportionally), 3) anything still left is shared by target.
    """
    specs = [p.issues[0] for aid, p in scenario.agents.items() if aid != agent_id]
    alloc = {s.key: float(s.limit) for s in specs}
    extra = scenario.total_budget - own_share - sum(alloc.values())
    if extra > 0:
        room = {s.key: max(0.0, s.target - s.limit) for s in specs}
        room_total = sum(room.values())
        if room_total > 0:
            give = min(extra, room_total)
            for key in room:
                alloc[key] += give * room[key] / room_total
            extra -= give
        if extra > 0:
            target_total = sum(s.target for s in specs)
            for s in specs:
                alloc[s.key] += extra * s.target / target_total
    return {k: int(math.floor(v + 1e-9)) for k, v in alloc.items()}


def opening_allocation(scenario: ScenarioSpec, profile: AgentProfile) -> Dict[str, int]:
    own = profile.issues[0]
    alloc = distribute_remaining(scenario, profile.agent_id, own.target)
    alloc[own.key] = int(own.target)
    return alloc


def allocation_counter(scenario: ScenarioSpec, profile: AgentProfile,
                       incoming: Dict[str, Any], last_own: Optional[Dict[str, Any]],
                       rate: float) -> Dict[str, int]:
    own = profile.issues[0]
    mine = last_own.get(own.key, own.target) if last_own else own.target
    share = move_toward(mine, incoming[own.key], own.better, rate)
    share = at_least_one_step(mine, incoming[own.key], share, 1)
    others_min = sum(p.issues[0].limit for aid, p in scenario.agents.items()
                     if aid != profile.agent_id)
    cap = int(scenario.total_budget - others_min)        # others must keep their minimum
    share = max(int(own.limit), min(int(round(share)), cap))
    alloc = distribute_remaining(scenario, profile.agent_id, share)
    alloc[own.key] = share
    return alloc
