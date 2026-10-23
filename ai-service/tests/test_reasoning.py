
import json
import os
import sys
import unittest

sys.path.insert(
    0,
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
)

from reasoning import build_reasoning_prompt, parse_reasoning_response


class ReasoningPromptTests(unittest.TestCase):
    def setUp(self):
        self.scenario = {
            "id": "vendor-pricing",
            "title": "Vendor Pricing Negotiation",
            "domain": "Procurement",
        }
        self.agent = {
            "role": "Buyer",
            "name": "Procurement Director",
            "personality": "Collaborative",
            "goal": "Get a fair price",
            "target_value": 8000,
            "reservation_value": 10500,
            "constraints": ["Delivery within 14 days"],
        }
        self.counterpart = {
            "role": "Seller",
            "name": "Sales Executive",
            "personality": "Aggressive",
        }

    def test_prompt_includes_agent_context(self):
        prompt = build_reasoning_prompt(
            self.scenario,
            self.agent,
            self.counterpart,
            2,
            10,
            current_offer=9000,
            conversation_history=[],
        )
        self.assertIn("Procurement Director", prompt)
        self.assertIn("Get a fair price", prompt)
        self.assertIn("Delivery within 14 days", prompt)
        self.assertIn("9000", prompt)

    def test_prompt_supports_all_personalities(self):
        for personality in ("Aggressive", "Collaborative", "Risk-Averse"):
            agent = {**self.agent, "personality": personality}
            prompt = build_reasoning_prompt(
                self.scenario, agent, self.counterpart, 1, 10
            )
            self.assertIn(f"Personality: {personality}", prompt)

    def test_prompt_has_fields_for_each_scenario(self):
        expected = {
            "vendor-pricing": "payment_days",
            "job-offer": "base_salary",
            "project-budget": "engineering",
        }
        for scenario_id, field in expected.items():
            scenario = {**self.scenario, "id": scenario_id}
            prompt = build_reasoning_prompt(
                scenario, self.agent, self.counterpart, 1, 10
            )
            self.assertIn(field, prompt)


class ReasoningResponseTests(unittest.TestCase):
    def test_valid_response_is_parsed(self):
        raw = json.dumps({
            "message": "We can discuss a fair price.",
            "action": "counter_offer",
            "proposed_offer": {"price": 9000},
            "offer_value": 9000,
            "stance": "Exploring compromise",
            "decision_explanation": "The offer narrows the gap.",
            "agreement_reached": False,
        })
        result = parse_reasoning_response(raw)
        self.assertIsNotNone(result)
        self.assertEqual(result["action"], "COUNTER_OFFER")
        self.assertEqual(result["proposed_offer"]["price"], 9000)

    def test_malformed_json_is_rejected(self):
        self.assertIsNone(parse_reasoning_response("{not valid json"))

    def test_invalid_action_is_rejected(self):
        raw = json.dumps({
            "message": "Hello",
            "action": "MAYBE",
            "proposed_offer": {},
        })
        self.assertIsNone(parse_reasoning_response(raw))

    def test_non_numeric_offer_is_rejected(self):
        raw = json.dumps({
            "message": "Here is our offer.",
            "action": "OFFER",
            "proposed_offer": {"price": "cheap"},
        })
        self.assertIsNone(parse_reasoning_response(raw))

    def test_acceptance_requires_explicit_agreement_flag(self):
        raw = json.dumps({
            "message": "We accept.",
            "action": "ACCEPT",
            "proposed_offer": {},
            "agreement_reached": False,
        })
        result = parse_reasoning_response(raw)
        self.assertFalse(result["agreement_reached"])


if __name__ == "__main__":
    unittest.main()
