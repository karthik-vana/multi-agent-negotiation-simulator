import os
import json
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from reasoning import build_reasoning_prompt, parse_reasoning_response
from decision.config import get_scenario
from decision.evaluator import normalize_offer
from decision.scoring import hard_violations

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_negotiation_service")

app = FastAPI(
    title="Multi-Agent Negotiation AI Service",
    description="FastAPI service powered by Gemini for autonomous negotiation agents",
    version="1.0.0",
)

# Enable CORS for Express backend and React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Initialize Gemini Client if key is available
gemini_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info(f"âœ… Gemini client initialized successfully with model: {GEMINI_MODEL}")
    except Exception as e:
        logger.warning(f"âš ï¸ Failed to initialize Gemini client: {e}")
else:
    logger.info("â„¹ï¸ GEMINI_API_KEY not set in .env. Service will use high-fidelity domain reasoning fallback.")


# ============================================================================
# Pydantic Request / Response Data Models
# ============================================================================

class AgentProfile(BaseModel):
    role: str
    name: Optional[str] = "Negotiating Agent"
    personality: Optional[str] = "Collaborative"  # 'Collaborative', 'Aggressive', 'Analytical'
    goal: Optional[str] = ""
    target_value: Optional[float] = None
    reservation_value: Optional[float] = None
    current_offer: Optional[float] = None
    stance: Optional[str] = "Seeking agreement"
    progress_percent: Optional[int] = 50
    constraints: Optional[List[str]] = []


class ScenarioContext(BaseModel):
    id: str
    title: Optional[str] = "Commercial Negotiation"
    domain: Optional[str] = "General"


class NegotiationTurnRequest(BaseModel):
    scenario: ScenarioContext
    agent: AgentProfile
    counterpart_agent: AgentProfile
    round_number: int = 1
    max_rounds: int = 10
    current_offer: Optional[float] = None
    conversation_history: Optional[List[Dict[str, Any]]] = []



class NegotiationTurnResponse(BaseModel):
    agent_role: str
    agent_name: str
    message: str
    action: str = Field(..., description="OFFER, COUNTER_OFFER, ACCEPT, REJECT")
    offer_value: Optional[float] = None
    proposed_offer: Dict[str, Any] = Field(default_factory=dict)
    currency: str = "â‚¹"
    stance: str = "Seeking agreement"
    progress_percent: int = 50
    reasoning: Optional[str] = ""
    agreement_reached: bool = False
    terms: Optional[Dict[str, Any]] = Field(default_factory=dict)



# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "Multi-Agent Negotiation AI Service (FastAPI)",
        "gemini_api_configured": bool(GEMINI_API_KEY and gemini_client),
        "gemini_model": GEMINI_MODEL,
    }


@app.post("/api/agent/respond", response_model=NegotiationTurnResponse)
async def generate_agent_response(request: NegotiationTurnRequest):
    """
    Generate an autonomous negotiation move using Gemini AI (with intelligent fallback).
    """
    logger.info(
        f"Processing turn for {request.agent.role} ({request.agent.personality}) in round {request.round_number}/{request.max_rounds}"
    )

    # 1. Attempt Gemini Generation if configured
    if gemini_client and GEMINI_API_KEY:
        try:
            ai_response = await call_gemini_model(request)
            if ai_response:
                return ai_response
        except Exception as e:
            logger.error(f"Gemini API call failed, using domain fallback: {e}")

    # 2. Resilient Domain Fallback Engine
    return generate_domain_fallback_response(request)


# ============================================================================
# Gemini Generation Logic
# ============================================================================


async def call_gemini_model(req: NegotiationTurnRequest) -> Optional[NegotiationTurnResponse]:
    """Generate and validate a context-aware negotiation move using Gemini."""

    prompt = build_reasoning_prompt(
        scenario=req.scenario.model_dump(),
        agent=req.agent.model_dump(),
        counterpart=req.counterpart_agent.model_dump(),
        round_number=req.round_number,
        max_rounds=req.max_rounds,
        current_offer=req.current_offer,
        conversation_history=req.conversation_history or [],
    )

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "temperature": 0.4,
        },
    )

    if not response or not response.text:
        return None

    parsed = parse_reasoning_response(response.text)
    if not parsed:
        logger.warning("Gemini returned an invalid negotiation response.")
        return None

    action = parsed["action"]
    proposed_offer = parsed.get("proposed_offer") or {}

    # Preserve the numeric offer expected by the existing backend.
    offer_val = parsed.get("offer_value")
    if offer_val is None:
        for key in ("price", "base_salary", "engineering"):
            if key in proposed_offer:
                offer_val = proposed_offer[key]
                break

    if offer_val is None:
        offer_val = (
            req.agent.current_offer
            if req.agent.current_offer is not None
            else req.agent.target_value
        )

    agreement = (
        action == "ACCEPT"
        and parsed.get("agreement_reached") is True
    )

    progress = min(100, max(20, int(35 + req.round_number * 14)))
    if agreement:
        progress = 100

    terms = {
        "round": req.round_number,
        "proposed_offer": proposed_offer,
    }
    if offer_val is not None:
        terms["unitPrice"] = offer_val

    return NegotiationTurnResponse(
        agent_role=req.agent.role,
        agent_name=req.agent.name or req.agent.role,
        message=parsed["message"],
        action=action,
        offer_value=float(offer_val) if offer_val is not None else None,
        currency="â‚¹",
        stance=parsed.get("stance", "Seeking agreement"),
        progress_percent=progress,
        reasoning=parsed.get("decision_explanation", ""),
        agreement_reached=agreement,
        terms=terms,
    )



# ============================================================================
# High-Fidelity Domain Concession Fallback Engine
# ============================================================================




def validate_proposed_offer(scenario_id: str, agent_id: str, offer: Dict[str, Any]) -> tuple:
    """Validate an outgoing offer against the existing deterministic rules."""
    import math

    scenario = get_scenario(scenario_id)
    profile = scenario.agent(agent_id)

    if not isinstance(offer, dict):
        return False, ["Offer must be a dictionary."]

    expected_keys = {issue.key for issue in profile.issues}
    if scenario.kind == "allocation":
        expected_keys = set(scenario.issue_keys())

    if set(offer) != expected_keys:
        missing = sorted(expected_keys - set(offer))
        extra = sorted(set(offer) - expected_keys)
        errors = []
        if missing:
            errors.append(f"Missing required fields: {', '.join(missing)}")
        if extra:
            errors.append(f"Unexpected fields: {', '.join(extra)}")
        return False, errors

    for key, value in offer.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            return False, [f"{key} must be a finite number."]

    normalized, errors = normalize_offer(
        scenario=scenario,
        offer=offer,
        history=[],
        agent_id=agent_id,
    )
    if errors or normalized is None:
        return False, errors or ["Offer could not be normalized."]

    violations = hard_violations(profile, normalized)
    if violations:
        return False, [item["message"] for item in violations]

    return True, normalized


def generate_domain_fallback_response(req: NegotiationTurnRequest) -> NegotiationTurnResponse:
    """Generate a scenario-aware move and validate its structured offer."""

    scenario_id = req.scenario.id.lower()
    role = req.agent.role.lower()
    personality = (req.agent.personality or "Collaborative").lower()
    round_num = max(1, req.round_number)

    agent_ids = {
        "vendor-pricing": (
            "buyer-procurement" if any(
                term in role for term in ("buyer", "procurement", "client")
            ) else "vendor-sales"
        ),
        "job-offer": (
            "job-candidate" if "candidate" in role else "hiring-director"
        ),
        "project-budget": (
            "vp-engineering" if "engineering" in role
            else "cmo-marketing" if "marketing" in role
            else "head-product-ai"
        ),
    }

    agent_id = agent_ids.get(scenario_id)
    if not agent_id:
        raise ValueError(f"Unsupported negotiation scenario: {scenario_id}")

    action = "COUNTER_OFFER"
    agreement = False
    currency = "\u20b9"

    if scenario_id == "vendor-pricing":
        is_buyer = agent_id == "buyer-procurement"
        if is_buyer:
            offer_val = 95000 if round_num == 1 else min(100000, 95000 + (round_num - 1) * 1000)
            proposed_offer = {
                "price": offer_val,
                "payment_days": 60,
                "delivery_weeks": 4,
            }
            msg = f"We propose a contract value of {currency}{offer_val:,.0f}, with Net-60 payment and four-week delivery."
            stance = "Seeking agreement"
        else:
            offer_val = max(90000, 110000 - (round_num - 1) * 3000)
            proposed_offer = {
                "price": offer_val,
                "payment_days": 30,
                "delivery_weeks": 6,
            }
            msg = f"We propose a contract value of {currency}{offer_val:,.0f}, subject to the contract terms."
            stance = "Holding firm" if personality == "aggressive" else "Negotiating terms"

        terms = {**proposed_offer, "round": round_num}
        progress = min(95, 45 + round_num * 10)

    elif scenario_id == "job-offer":
        is_candidate = agent_id == "job-candidate"

        if is_candidate:
            base_salary = max(160000, 175000 - (round_num - 1) * 3000)
            proposed_offer = {
                "base_salary": base_salary,
                "sign_on_bonus": 20000,
                "equity_pct": 0.25,
                "office_days": 0,
                "joining_days": 60,
            }
            msg = f"I propose a base salary of {currency}{base_salary:,.0f}, with a sign-on bonus and flexible working terms."
            stance = "Advocating for candidate value"
        else:
            base_salary = min(168000, 150000 + (round_num - 1) * 3000)
            proposed_offer = {
                "base_salary": base_salary,
                "sign_on_bonus": 5000,
                "equity_pct": 0.15,
                "office_days": 3,
                "joining_days": 30,
            }
            msg = f"We propose a base salary of {currency}{base_salary:,.0f}, with the remaining compensation terms specified."
            stance = "Protecting hiring budget" if personality == "risk-averse" else "Negotiating compensation"

        offer_val = float(proposed_offer["base_salary"])
        terms = {**proposed_offer, "round": round_num}
        progress = min(95, 40 + round_num * 10)

    else:
        if agent_id == "vp-engineering":
            proposed_offer = {
                "engineering": 450000,
                "marketing": 300000,
                "product_ai": 250000,
            }
            stance = "Prioritizing engineering"
        elif agent_id == "cmo-marketing":
            proposed_offer = {
                "engineering": 350000,
                "marketing": 350000,
                "product_ai": 300000,
            }
            stance = "Advocating marketing investment"
        else:
            proposed_offer = {
                "engineering": 350000,
                "marketing": 350000,
                "product_ai": 300000,
            }
            stance = "Seeking balanced allocation"

        offer_val = float(proposed_offer[{
            "vp-engineering": "engineering",
            "cmo-marketing": "marketing",
            "head-product-ai": "product_ai",
        }[agent_id]])
        msg = (
            "I propose this budget split: "
            f"engineering {proposed_offer['engineering']:,}, "
            f"marketing {proposed_offer['marketing']:,}, "
            f"product AI {proposed_offer['product_ai']:,}. "
            "The total stays within the 1,000,000 budget."
        )
        terms = {**proposed_offer, "round": round_num}
        progress = min(95, 45 + round_num * 8)

    is_valid, validation_result = validate_proposed_offer(
        scenario_id, agent_id, proposed_offer
    )

    if not is_valid:
        logger.warning(
            "Fallback offer failed validation for %s: %s",
            scenario_id, validation_result,
        )
        proposed_offer = opening_offer_for_agent(scenario_id, agent_id)
        is_valid, validation_result = validate_proposed_offer(
            scenario_id, agent_id, proposed_offer
        )
        if not is_valid:
            raise ValueError(
                f"Deterministic opening offer failed validation: {validation_result}"
            )
        msg = "I propose a valid opening offer based on the scenario's negotiation rules."
        action = "OFFER"
        stance = "Seeking agreement"

    if scenario_id == "vendor-pricing":
        offer_val = float(proposed_offer["price"])
        terms = {"unitPrice": offer_val, **proposed_offer, "round": round_num}
    elif scenario_id == "job-offer":
        offer_val = float(proposed_offer["base_salary"])
        terms = {**proposed_offer, "round": round_num}
    else:
        issue_key = {
            "vp-engineering": "engineering",
            "cmo-marketing": "marketing",
            "head-product-ai": "product_ai",
        }[agent_id]
        offer_val = float(proposed_offer[issue_key])
        terms = {**proposed_offer, "round": round_num}

    return NegotiationTurnResponse(
        agent_role=req.agent.role,
        agent_name=req.agent.name or req.agent.role,
        message=msg,
        action=action,
        offer_value=offer_val,
        proposed_offer=proposed_offer,
        currency=currency,
        stance=stance,
        progress_percent=progress,
        reasoning=(
            f"Validated scenario-aware fallback for {scenario_id}; "
            f"personality: {req.agent.personality or 'Collaborative'}."
        ),
        agreement_reached=agreement,
        terms=terms,
    )


def opening_offer_for_agent(scenario_id: str, agent_id: str) -> Dict[str, Any]:
    """Get a deterministic opening offer for the specified agent."""
    scenario = get_scenario(scenario_id)
    profile = scenario.agent(agent_id)

    if scenario.kind == "allocation":
        from decision.budget import opening_allocation
        return opening_allocation(scenario, profile)

    return {issue.key: issue.target for issue in profile.issues}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
