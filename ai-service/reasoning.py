
import json
from typing import Any, Dict, List, Optional

SUPPORTED_PERSONALITIES = {
    "aggressive",
    "collaborative",
    "risk-averse",
}

SCENARIO_OFFER_FIELDS = {
    "vendor-pricing": ["price", "payment_days", "delivery_weeks"],
    "job-offer": [
        "base_salary",
        "sign_on_bonus",
        "equity_pct",
        "office_days",
        "joining_days",
    ],
    "project-budget": ["engineering", "marketing", "product_ai"],
}


def build_reasoning_prompt(
    scenario: Dict[str, Any],
    agent: Dict[str, Any],
    counterpart: Dict[str, Any],
    round_number: int,
    max_rounds: int,
    current_offer: Optional[float] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """Build a context-aware prompt for a negotiation agent."""

    personality = str(agent.get("personality") or "Collaborative")
    if personality.lower() not in SUPPORTED_PERSONALITIES:
        personality = "Collaborative"

    scenario_id = str(scenario.get("id") or "vendor-pricing")
    offer_fields = SCENARIO_OFFER_FIELDS.get(
        scenario_id, ["offer_value"]
    )

    history = (conversation_history or [])[-6:]
    history_text = json.dumps(history, ensure_ascii=False, default=str)

    return f"""
You are an AI agent negotiating in a multi-agent simulation.

SCENARIO
ID: {scenario_id}
Title: {scenario.get("title", "Negotiation")}
Domain: {scenario.get("domain", "General")}

YOUR PROFILE
Role: {agent.get("role", "Negotiator")}
Name: {agent.get("name", "Negotiating Agent")}
Personality: {personality}
Goal: {agent.get("goal", "")}
Target value: {agent.get("target_value")}
Reservation value: {agent.get("reservation_value")}
Current offer: {agent.get("current_offer")}
Constraints: {json.dumps(agent.get("constraints") or [])}

COUNTERPART
Role: {counterpart.get("role", "Negotiator")}
Name: {counterpart.get("name", "Counterpart")}
Personality: {counterpart.get("personality", "Collaborative")}
Goal: {counterpart.get("goal", "")}
Current offer: {counterpart.get("current_offer")}

NEGOTIATION STATE
Round: {round_number} of {max_rounds}
Incoming offer: {current_offer}
Required offer fields: {json.dumps(offer_fields)}
Conversation history: {history_text}

PERSONALITY GUIDANCE
- Collaborative: seek a fair agreement and explain mutual benefits.
- Aggressive: defend your goal, make limited concessions, and remain firm.
- Risk-Averse: prioritize constraints, avoid unsupported commitments, and
  accept only when the proposal is safe and within acceptable limits.

RULES
- Consider the complete scenario, goals, constraints, and conversation history.
- Do not claim agreement unless the proposed terms are acceptable.
- Never knowingly violate a stated constraint or reservation limit.
- For project-budget, propose numeric allocations for engineering,
  marketing, and product_ai that do not exceed the total budget.
- Return only valid JSON. Do not include Markdown fences.

JSON FORMAT
{{
  "message": "Natural conversational response",
  "action": "OFFER, COUNTER_OFFER, ACCEPT, or REJECT",
  "proposed_offer": {{}},
  "offer_value": null,
  "stance": "Short negotiation stance",
  "decision_explanation": "Brief explanation of the decision",
  "agreement_reached": false
}}
""".strip()


def parse_reasoning_response(
    response_text: str,
) -> Optional[Dict[str, Any]]:
    """Parse and validate the essential fields in a Gemini JSON response."""

    try:
        result = json.loads(response_text)
    except (json.JSONDecodeError, TypeError):
        return None

    if not isinstance(result, dict):
        return None

    action = str(result.get("action", "")).upper()
    allowed_actions = {"OFFER", "COUNTER_OFFER", "ACCEPT", "REJECT"}

    if action not in allowed_actions:
        return None

    message = result.get("message")
    if not isinstance(message, str) or not message.strip():
        return None

    proposed_offer = result.get("proposed_offer", {})
    if not isinstance(proposed_offer, dict):
        return None

    for key, value in proposed_offer.items():
        if not isinstance(key, str):
            return None
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return None

    offer_value = result.get("offer_value")
    if offer_value is not None:
        if isinstance(offer_value, bool) or not isinstance(
            offer_value, (int, float)
        ):
            return None

    result["action"] = action
    result["message"] = message.strip()
    result["proposed_offer"] = proposed_offer
    result["decision_explanation"] = str(
        result.get("decision_explanation") or ""
    )
    result["agreement_reached"] = (
        action == "ACCEPT"
        and result.get("agreement_reached") is True
    )

    return result
