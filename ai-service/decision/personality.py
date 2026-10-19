"""How each personality changes acceptance and concession behaviour.

Names match PERSONALITIES in frontend/src/data/scenarios.js exactly.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class PersonalityProfile:
    name: str
    accept_threshold: float   # utility (0-1) needed to accept in round 1
    threshold_floor: float    # utility needed in the LAST round (deadline effect)
    base_concession: float    # share of the gap given away in round 1
    progress_gain: float      # extra concession by the last round
    max_concession: float     # never concede more than this per turn
    reciprocity: float        # bonus when the other side just conceded


PROFILES = {
    "Aggressive": PersonalityProfile(
        "Aggressive", 0.90, 0.40, 0.15, 0.25, 0.45, 0.00),
    "Collaborative": PersonalityProfile(
        "Collaborative", 0.80, 0.30, 0.30, 0.25, 0.60, 0.10),
    "Risk-Averse": PersonalityProfile(
        "Risk-Averse", 0.70, 0.25, 0.20, 0.25, 0.50, 0.05),
}
SUPPORTED_PERSONALITIES = tuple(PROFILES)


def get_personality(name: str) -> PersonalityProfile:
    if name not in PROFILES:
        raise ValueError(f"Unknown personality '{name}'. "
                         f"Valid: {list(SUPPORTED_PERSONALITIES)}")
    return PROFILES[name]
