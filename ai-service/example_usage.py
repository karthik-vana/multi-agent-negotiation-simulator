 """Runnable demo: python example_usage.py   (from the ai-service/ folder)

Shows how the Orchestrator should call the module.
"""
import json
from decision import evaluate_offer, opening_offer

SCENARIO = "vendor-pricing"
BUYER, VENDOR = "buyer-procurement", "vendor-sales"

history = []                                   # turns BEFORE the incoming offer
offer, sender, receiver = opening_offer(SCENARIO, BUYER), BUYER, VENDOR

for turn in range(24):
    result = evaluate_offer(SCENARIO, receiver, offer, history,
                            round_number=turn // 2 + 1, max_rounds=12)
    history.append({"agent_id": sender, "offer": offer})
    print(f"turn {turn + 1:2}  {sender:18} offers {offer}\n"
          f"         {receiver:18} -> {result['decision'].upper()}  ({result['reason']})")
    if result["decision"] == "accept":
        print("\nAGREEMENT:", json.dumps(offer))
        break
    # a counteroffer or a (conceding) rejection both give the next position
    next_offer = result["counter_offer"] or result["next_offer"]
    if next_offer is None:                     # invalid offer: ask the sender to retry
        break
    offer, sender, receiver = next_offer, receiver, sender
