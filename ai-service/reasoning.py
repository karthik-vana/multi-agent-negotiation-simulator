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

    counterpart_personality = str(counterpart.get("personality") or "Collaborative")

    scenario_id = str(scenario.get("id") or "vendor-pricing")
    offer_fields = SCENARIO_OFFER_FIELDS.get(
        scenario_id, ["offer_value"]
    )

    history = (conversation_history or [])[-8:]
    history_text = json.dumps(history, ensure_ascii=False, default=str)

    return f"""
You are an AI autonomous negotiation agent representing {agent.get('role', 'Negotiator')} in a multi-agent simulation.

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
Personality: {counterpart_personality}
Goal: {counterpart.get("goal", "")}
Current offer: {counterpart.get("current_offer")}

NEGOTIATION STATE
Round: {round_number} of {max_rounds}
Incoming offer: {current_offer}
Required offer fields: {json.dumps(offer_fields)}
Conversation history: {history_text}

STRATEGIC PERSONALITY DIRECTIVES:
- Aggressive:
  * You defend your target value fiercely and make minimal concessions (at most 0.5% - 1.5% per round).
  * In rounds 1 through 7, NEVER choose "ACCEPT" unless the counterpart has fully conceded to your target or reservation threshold.
  * CRITICAL FOR AGGRESSIVE VS AGGRESSIVE: Both you and your counterpart are Aggressive! Stand your ground firmly. Do NOT concede easily and DO NOT accept or converge in round 4. Force the negotiation into late rounds (rounds 8-10). If your counterpart refuses to concede, keep countering firmly or let it deadlock in round {max_rounds}.
- Collaborative:
  * You seek a balanced, mutually beneficial agreement. Concede steadily and reciprocally (15% - 25% of the remaining gap per round).
  * Aim to converge and reach agreement around Round 5, 6, or 7 by exploring creative compromises on secondary terms.
- Risk-Averse:
  * You prioritize certainty and avoiding deadlock above all else.
  * Make larger concessions early on to ensure convergence quickly (around Round 3 to 5).

RULES & CONSTRAINTS:
- Consider the complete scenario, goals, constraints, personality, and conversation history.
- Check current Round ({round_number} of {max_rounds}):
  * In early rounds (1-3), maintain an active gap. DO NOT execute "ACCEPT" in round 1 or 2.
  * If you are Aggressive, DO NOT accept in rounds 1 through 7 unless your target is met.
  * If both agents are Aggressive, DO NOT converge in round 4! Stand firm and keep countering through later rounds.
- Never knowingly violate a stated hard constraint (e.g. Buyer payment_days >= 60).
- For vendor-pricing: proposed_offer must include "price" (numeric), "payment_days" (numeric, >= 60 for buyer), and "delivery_weeks" (numeric).
- For job-offer: proposed_offer must include "base_salary" (numeric), "sign_on_bonus" (numeric), "equity_pct" (numeric), "office_days" (numeric), "joining_days" (numeric).
- For project-budget: proposed_offer must include "engineering", "marketing", and "product_ai" allocations summing to exactly 1,000,000.
- Return only valid JSON. Do not include Markdown fences.
- DIVERSITY & NATURAL DIALOGUE: Generate unique, persuasive, context-specific negotiation dialogue. Avoid canned repetitive phrases. Adapt your rationale to the latest round numbers and counterpart actions.

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


def extract_json_block(text: str) -> str:
    """Robustly extract JSON string from model response, handling code fences and preamble."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        cleaned = cleaned[first_brace:last_brace + 1]
    return cleaned


def parse_reasoning_response(
    response_text: str,
) -> Optional[Dict[str, Any]]:
    """Parse and validate the essential fields in a Gemini JSON response."""

    try:
        clean_text = extract_json_block(response_text)
        result = json.loads(clean_text)
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
