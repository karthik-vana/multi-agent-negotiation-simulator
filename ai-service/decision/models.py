"""Plain data classes used by the decision module (no AI, no I/O)."""
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Tuple

ACCEPT = "accept"
COUNTEROFFER = "counteroffer"
REJECT = "reject"


@dataclass(frozen=True)
class IssueSpec:
    """One negotiable issue (price, salary, payment days ...) for ONE agent.

    target    - the value the agent would love to get (score 1.0)
    limit     - the worst value the agent can live with (score 0.0)
    better    - "higher" or "lower": which direction is better for this agent
    weight    - importance of the issue (all weights of an agent sum to 1)
    hard      - True: a value worse than `limit` can NEVER be accepted
    min_value - smallest value that is a valid number for this issue
    """
    key: str
    label: str
    target: float
    limit: float
    better: str
    weight: float
    hard: bool = True
    decimals: int = 0
    min_value: float = 0.0

    def __post_init__(self):
        if self.better not in ("higher", "lower"):
            raise ValueError(f"{self.key}: better must be 'higher' or 'lower'")
        target_ok = (self.target >= self.limit if self.better == "higher"
                     else self.target <= self.limit)
        if not target_ok:
            raise ValueError(f"{self.key}: target is worse than limit")


@dataclass(frozen=True)
class AgentProfile:
    scenario_id: str
    agent_id: str
    name: str
    default_personality: str
    issues: Tuple[IssueSpec, ...]


@dataclass
class ScenarioSpec:
    scenario_id: str
    kind: str                                   # "bilateral" or "allocation"
    agents: Dict[str, AgentProfile]
    total_budget: Optional[float] = None        # only for "allocation"

    def agent(self, agent_id: str) -> AgentProfile:
        if agent_id not in self.agents:
            raise ValueError(f"Unknown agent '{agent_id}' for scenario "
                             f"'{self.scenario_id}'. Valid: {sorted(self.agents)}")
        return self.agents[agent_id]

    def issue_keys(self) -> List[str]:
        keys: List[str] = []
        for profile in self.agents.values():
            for spec in profile.issues:
                if spec.key not in keys:
                    keys.append(spec.key)
        return keys

    def issue_spec(self, key: str) -> IssueSpec:
        for profile in self.agents.values():
            for spec in profile.issues:
                if spec.key == key:
                    return spec
        raise KeyError(key)


@dataclass
class DecisionResult:
    """Structured result returned to the Orchestrator."""
    decision: str
    reason: str
    counter_offer: Optional[Dict[str, Any]] = None
    next_offer: Optional[Dict[str, Any]] = None   # agent's next position after a hard-constraint REJECT
    utility: Optional[float] = None
    accept_threshold: Optional[float] = None
    concession_rate: Optional[float] = None
    violates_constraints: bool = False
    violations: List[Dict[str, Any]] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    repeated_offer: bool = False
    repeat_count: int = 0
    personality: str = ""
    round_number: int = 1

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
