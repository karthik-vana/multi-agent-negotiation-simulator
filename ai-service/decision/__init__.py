"""Counteroffer evaluation and concession decision module (Task 4)."""
from .config import SCENARIO_IDS, get_scenario
from .evaluator import evaluate_offer, opening_offer
from .models import ACCEPT, COUNTEROFFER, REJECT
from .personality import SUPPORTED_PERSONALITIES

__all__ = ["evaluate_offer", "opening_offer", "get_scenario", "SCENARIO_IDS",
           "SUPPORTED_PERSONALITIES", "ACCEPT", "COUNTEROFFER", "REJECT"]
