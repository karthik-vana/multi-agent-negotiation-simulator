"""Concession rules: how fast an agent gives ground."""
from .personality import PersonalityProfile


def progress_of(round_number: int, max_rounds: int) -> float:
    """0.0 in round 1 -> 1.0 in the last round."""
    if max_rounds <= 1:
        return 1.0
    return max(0.0, min(1.0, (round_number - 1) / (max_rounds - 1)))


def accept_threshold(p: PersonalityProfile, round_number: int, max_rounds: int) -> float:
    """Utility needed to accept. It falls linearly from the personality's opening
    level to its floor in the last round, so agents get more flexible as the
    deadline approaches."""
    drop = (p.accept_threshold - p.threshold_floor) * progress_of(round_number, max_rounds)
    return p.accept_threshold - drop


def concession_fraction(p: PersonalityProfile, round_number: int,
                        max_rounds: int, reciprocated: bool) -> float:
    """Share (0-1) of the gap to the other side that is given away this turn."""
    rate = p.base_concession + p.progress_gain * progress_of(round_number, max_rounds)
    if reciprocated:
        rate += p.reciprocity
    return max(0.0, min(p.max_concession, rate))


def move_toward(mine: float, theirs: float, better: str, rate: float) -> float:
    """New position: closer to `theirs`, never worse than before.

    If the other side already offers something BETTER than my last position,
    I simply take it (no reason to ask for less than what is on the table).
    """
    theirs_is_better = theirs > mine if better == "higher" else theirs < mine
    if theirs_is_better:
        return theirs
    return mine + rate * (theirs - mine)


def at_least_one_step(mine: float, theirs: float, value: float, unit: float) -> float:
    """Guarantee progress: a concession moves at least one unit (e.g. 1 day, 1 dollar)
    toward the other side, without jumping past it. Stops 'Zeno' stalls where
    rounding keeps an agent one step short of agreement."""
    gap = theirs - mine
    if abs(gap) < 1e-12 or abs(value - mine) >= unit - 1e-9:
        return value
    step = unit if abs(gap) >= unit else abs(gap)
    return mine + (step if gap > 0 else -step)
