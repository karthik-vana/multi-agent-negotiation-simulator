"""Tests for the offer evaluation module. Run from ai-service/:
    python -m unittest discover -s tests -v      (or: pytest)
"""
import itertools
import math
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from decision import (ACCEPT, COUNTEROFFER, REJECT, SCENARIO_IDS,  # noqa: E402
                      SUPPORTED_PERSONALITIES, evaluate_offer, get_scenario,
                      opening_offer)
from decision.scoring import hard_violations  # noqa: E402

BUYER, VENDOR = "buyer-procurement", "vendor-sales"
CAND, EMPL = "job-candidate", "hiring-director"
ENG, MKT, AI = "vp-engineering", "cmo-marketing", "head-product-ai"


def buyer(price, pay=60, weeks=4, **kw):
    return evaluate_offer("vendor-pricing", BUYER,
                          {"price": price, "payment_days": pay, "delivery_weeks": weeks}, **kw)


def vendor(price, pay=30, weeks=6, **kw):
    return evaluate_offer("vendor-pricing", VENDOR,
                          {"price": price, "payment_days": pay, "delivery_weeks": weeks}, **kw)


def job(agent, **kw):
    base = {"base_salary": 164000, "sign_on_bonus": 10000, "equity_pct": 0.2,
            "office_days": 2, "joining_days": 60}
    base.update(kw)
    return evaluate_offer("job-offer", agent, base)


class ConfigSanity(unittest.TestCase):
    def test_weights_sum_to_one_and_issues_covered(self):
        for sid in SCENARIO_IDS:
            sc = get_scenario(sid)
            for profile in sc.agents.values():
                self.assertAlmostEqual(sum(s.weight for s in profile.issues), 1.0, places=9)
                if sc.kind == "bilateral":
                    self.assertEqual({s.key for s in profile.issues}, set(sc.issue_keys()))

    def test_personalities_match_frontend(self):
        self.assertEqual(set(SUPPORTED_PERSONALITIES), {"Aggressive", "Collaborative", "Risk-Averse"})
        for sc in map(get_scenario, SCENARIO_IDS):
            for profile in sc.agents.values():
                self.assertIn(profile.default_personality, SUPPORTED_PERSONALITIES)

    def test_a_deal_is_possible(self):
        # vendor: price ranges overlap; job: salary/office/joining overlap; budget: minimums fit
        vp = get_scenario("vendor-pricing").agents
        self.assertGreaterEqual(vp[BUYER].issues[0].limit, vp[VENDOR].issues[0].limit)
        deal = {"price": 95000, "payment_days": 60, "delivery_weeks": 4}
        for agent in vp.values():
            self.assertEqual(hard_violations(agent, deal), [])
        jp = get_scenario("job-offer").agents
        deal = {"base_salary": 164000, "sign_on_bonus": 10000, "equity_pct": 0.2,
                "office_days": 2, "joining_days": 60}
        for agent in jp.values():
            self.assertEqual(hard_violations(agent, deal), [])
        bp = get_scenario("project-budget")
        self.assertLessEqual(sum(a.issues[0].limit for a in bp.agents.values()), bp.total_budget)
        self.assertGreater(sum(a.issues[0].target for a in bp.agents.values()), bp.total_budget)


class VendorBuyerTable(unittest.TestCase):
    """The 8-row table from the mentoring session (Collaborative buyer)."""

    def test_1_below_target_accepts(self):
        self.assertEqual(buyer(90000)["decision"], ACCEPT)

    def test_2_exactly_target_accepts(self):
        self.assertEqual(buyer(95000)["decision"], ACCEPT)

    def test_3_within_limit_above_target_counters(self):
        r = buyer(97000)
        self.assertEqual(r["decision"], COUNTEROFFER)
        self.assertGreater(r["counter_offer"]["price"], 95000 - 1)
        self.assertLess(r["counter_offer"]["price"], 97000)

    def test_4_exactly_on_limit_is_allowed_but_countered(self):
        self.assertEqual(buyer(100000)["decision"], COUNTEROFFER)

    def test_5_one_dollar_over_limit_rejects(self):
        r = buyer(100001)
        self.assertEqual(r["decision"], REJECT)
        self.assertTrue(r["violates_constraints"])

    def test_5b_reject_carries_a_valid_next_offer(self):
        r = buyer(100001)
        prof = get_scenario("vendor-pricing").agents[BUYER]
        self.assertEqual(hard_violations(prof, r["next_offer"]), [])
        self.assertGreaterEqual(r["next_offer"]["price"], 95000)     # concedes upward, never past 100000
        self.assertLessEqual(r["next_offer"]["price"], 100000)
        self.assertIsNone(buyer(-1)["next_offer"])                   # invalid offers get none

    def test_6_net30_rejects_even_with_great_price(self):
        r = buyer(90000, pay=30)
        self.assertEqual(r["decision"], REJECT)
        self.assertEqual(r["violations"][0]["issue"], "payment_days")

    def test_7_invalid_prices_reject(self):
        for bad in (0, -5000):
            r = buyer(bad)
            self.assertEqual(r["decision"], REJECT)
            self.assertTrue(r["errors"])
            self.assertFalse(r["violates_constraints"])

    def test_8_repeated_offer_is_flagged_and_decision_stays_consistent(self):
        o = {"price": 97000, "payment_days": 60, "delivery_weeks": 4}
        mine1 = {"price": 95500, "payment_days": 60, "delivery_weeks": 4}
        mine2 = {"price": 96000, "payment_days": 60, "delivery_weeks": 4}
        history = [{"agent_id": VENDOR, "offer": o}, {"agent_id": BUYER, "offer": mine1},
                   {"agent_id": VENDOR, "offer": o}, {"agent_id": BUYER, "offer": mine2}]
        r = buyer(97000, history=history, round_number=3, max_rounds=20)
        self.assertEqual(r["decision"], COUNTEROFFER)
        self.assertTrue(r["repeated_offer"])
        self.assertEqual(r["repeat_count"], 2)
        # monotonic: never goes back below its own last offer (price only rises)
        self.assertGreaterEqual(r["counter_offer"]["price"], 96000)


class VendorSeller(unittest.TestCase):
    def test_accepts_above_target(self):
        self.assertEqual(vendor(112000)["decision"], ACCEPT)

    def test_counters_in_the_middle(self):
        self.assertEqual(vendor(100000, pay=60, weeks=4)["decision"], COUNTEROFFER)

    def test_floor_is_allowed_but_countered(self):
        self.assertEqual(vendor(90000, pay=60, weeks=4)["decision"], COUNTEROFFER)

    def test_below_floor_rejects(self):
        self.assertEqual(vendor(89999)["decision"], REJECT)


class JobOffer(unittest.TestCase):
    def test_candidate_hard_limits(self):
        self.assertEqual(job(CAND, base_salary=159999)["decision"], REJECT)
        self.assertEqual(job(CAND, office_days=3)["decision"], REJECT)
        self.assertEqual(job(CAND, joining_days=30)["decision"], REJECT)
        self.assertNotEqual(job(CAND, base_salary=160000)["decision"], REJECT)

    def test_candidate_accepts_dream_offer(self):
        r = job(CAND, base_salary=175000, sign_on_bonus=20000, equity_pct=0.25,
                office_days=0, joining_days=60)
        self.assertEqual(r["decision"], ACCEPT)

    def test_employer_hard_limits(self):
        self.assertEqual(job(EMPL, base_salary=168001)["decision"], REJECT)
        self.assertEqual(job(EMPL, sign_on_bonus=15001)["decision"], REJECT)
        self.assertEqual(job(EMPL, office_days=1)["decision"], REJECT)
        self.assertNotEqual(job(EMPL, base_salary=168000)["decision"], REJECT)

    def test_employer_accepts_cheap_offer(self):
        r = job(EMPL, base_salary=150000, sign_on_bonus=5000, equity_pct=0.15,
                office_days=3, joining_days=30)
        self.assertEqual(r["decision"], ACCEPT)


def alloc(e, m, a):
    return {"engineering": e, "marketing": m, "product_ai": a}


class ProjectBudget(unittest.TestCase):
    def test_over_budget_is_invalid(self):
        r = evaluate_offer("project-budget", ENG, alloc(450000, 350000, 300000))
        self.assertEqual(r["decision"], REJECT)
        self.assertIn("total budget", r["errors"][0])

    def test_share_below_minimum_rejects(self):
        r = evaluate_offer("project-budget", ENG, alloc(349999, 350000, 300000))
        self.assertEqual(r["decision"], REJECT)
        self.assertTrue(r["violates_constraints"])

    def test_minimum_is_allowed_but_countered(self):
        r = evaluate_offer("project-budget", ENG, alloc(350000, 350000, 300000))
        self.assertEqual(r["decision"], COUNTEROFFER)

    def test_target_share_accepts(self):
        r = evaluate_offer("project-budget", ENG, alloc(450000, 300000, 250000))
        self.assertEqual(r["decision"], ACCEPT)

    def test_counter_is_feasible_for_everyone(self):
        sc = get_scenario("project-budget")
        for agent, personality in itertools.product(sc.agents, SUPPORTED_PERSONALITIES):
            r = evaluate_offer("project-budget", agent, alloc(400000, 300000, 300000),
                               personality=personality)
            if r["decision"] == COUNTEROFFER:
                c = r["counter_offer"]
                self.assertLessEqual(sum(c.values()), sc.total_budget)
                for a in sc.agents.values():
                    self.assertGreaterEqual(c[a.issues[0].key], a.issues[0].limit)


class InvalidInput(unittest.TestCase):
    def test_bad_offers_reject_with_errors(self):
        good = {"price": 95000, "payment_days": 60, "delivery_weeks": 4}
        cases = [None, "95000", [], {}, dict(good, price=float("nan")),
                 dict(good, price=float("inf")), dict(good, price="abc"),
                 dict(good, price=True), dict(good, prize=1), dict(good, payment_days=-1)]
        for bad in cases:
            r = evaluate_offer("vendor-pricing", BUYER, bad)
            self.assertEqual(r["decision"], REJECT, bad)
            self.assertTrue(r["errors"], bad)

    def test_partial_offer_is_filled_from_history(self):
        history = [{"agent_id": VENDOR, "offer": {"price": 99000, "payment_days": 60,
                                                  "delivery_weeks": 4}}]
        r = evaluate_offer("vendor-pricing", BUYER, {"price": 94000}, history=history)
        self.assertEqual(r["decision"], ACCEPT)

    def test_unknown_ids_raise(self):
        with self.assertRaises(ValueError):
            evaluate_offer("nope", BUYER, {})
        with self.assertRaises(ValueError):
            evaluate_offer("vendor-pricing", "nobody", {})
        with self.assertRaises(ValueError):
            evaluate_offer("vendor-pricing", BUYER, opening_offer("vendor-pricing", BUYER),
                           personality="Sneaky")


class HardConstraintsNeverBroken(unittest.TestCase):
    def test_sweep_vendor(self):
        prof = get_scenario("vendor-pricing").agents
        for agent, pers, rnd in itertools.product((BUYER, VENDOR), SUPPORTED_PERSONALITIES, (1, 5, 12)):
            for price in range(80000, 130001, 2500):
                for pay, weeks in itertools.product((30, 60, 90), (2, 4, 8)):
                    r = evaluate_offer("vendor-pricing", agent,
                                       {"price": price, "payment_days": pay, "delivery_weeks": weeks},
                                       round_number=rnd, personality=pers)
                    if r["decision"] == ACCEPT:
                        self.assertEqual(hard_violations(prof[agent], {
                            "price": price, "payment_days": pay, "delivery_weeks": weeks}), [])
                    if r["decision"] == COUNTEROFFER:
                        self.assertEqual(hard_violations(prof[agent], r["counter_offer"]), [])


class PersonalityEffects(unittest.TestCase):
    def test_aggressive_concedes_less_than_collaborative(self):
        a = buyer(99000, personality="Aggressive")["counter_offer"]["price"]
        c = buyer(99000, personality="Collaborative")["counter_offer"]["price"]
        self.assertLess(a, c)   # buyer wants LOW prices: aggressive stays lower

    def test_risk_averse_accepts_sooner_than_aggressive(self):
        offer = {"price": 97000, "payment_days": 60, "delivery_weeks": 4}
        self.assertEqual(evaluate_offer("vendor-pricing", BUYER, offer, personality="Risk-Averse")["decision"], ACCEPT)
        self.assertEqual(evaluate_offer("vendor-pricing", BUYER, offer, personality="Aggressive")["decision"], COUNTEROFFER)

    def test_threshold_relaxes_over_rounds(self):
        early = buyer(97000, round_number=1)["accept_threshold"]
        late = buyer(97000, round_number=10)["accept_threshold"]
        self.assertLess(late, early)


def negotiate(scenario_id, a, b, pers, max_rounds=12):
    """Two agents alternate offers until one accepts / rejects."""
    history, sender, receiver = [], a, b
    offer = opening_offer(scenario_id, a)
    for turn in range(2 * max_rounds):
        r = evaluate_offer(scenario_id, receiver, offer, history, turn // 2 + 1,
                           max_rounds, pers[receiver])
        history.append({"agent_id": sender, "offer": offer})
        if r["decision"] == ACCEPT:
            return offer, turn + 1
        if r["decision"] == REJECT:
            if not r["next_offer"]:
                return None, turn + 1
            nxt = r["next_offer"]
        else:
            nxt = r["counter_offer"]
        offer, sender, receiver = nxt, receiver, sender
    return None, 2 * max_rounds


class FullNegotiations(unittest.TestCase):
    def test_agreed_deals_respect_both_sides(self):
        for sid, (a, b) in (("vendor-pricing", (BUYER, VENDOR)), ("job-offer", (CAND, EMPL))):
            sc = get_scenario(sid)
            for pa, pb in itertools.product(SUPPORTED_PERSONALITIES, repeat=2):
                deal, _ = negotiate(sid, a, b, {a: pa, b: pb})
                if deal:
                    for agent in (a, b):
                        self.assertEqual(hard_violations(sc.agents[agent], deal), [], (sid, pa, pb))

    def test_collaborative_pairs_reach_a_deal(self):
        for sid, (a, b) in (("vendor-pricing", (BUYER, VENDOR)), ("job-offer", (CAND, EMPL))):
            deal, turns = negotiate(sid, a, b, {a: "Collaborative", b: "Collaborative"})
            self.assertIsNotNone(deal, sid)
            self.assertLessEqual(turns, 24)


def negotiate_budget(personalities, max_rounds=12):
    """Three departments take turns proposing; a deal needs the other two to accept."""
    sc = get_scenario("project-budget")
    ids = list(sc.agents)
    history, proposer = [], ids[0]
    offer = opening_offer("project-budget", proposer)
    for turn in range(3 * max_rounds):
        res = {a: evaluate_offer("project-budget", a, offer, history, turn // 3 + 1,
                                 max_rounds, personalities[a]) for a in ids if a != proposer}
        if all(r["decision"] == ACCEPT for r in res.values()):
            return offer
        history.append({"agent_id": proposer, "offer": offer})
        nxt = next(a for a in ids if a != proposer and res[a]["decision"] != ACCEPT)
        r = res[nxt]
        offer = r["counter_offer"] if r["decision"] == COUNTEROFFER else r["next_offer"]
        proposer = nxt
    return None


class BudgetNegotiations(unittest.TestCase):
    def test_all_personality_combinations_reach_a_valid_split(self):
        sc = get_scenario("project-budget")
        ids = list(sc.agents)
        for combo in itertools.product(SUPPORTED_PERSONALITIES, repeat=3):
            deal = negotiate_budget(dict(zip(ids, combo)))
            self.assertIsNotNone(deal, combo)
            self.assertLessEqual(sum(deal.values()), sc.total_budget)
            for a in sc.agents.values():
                self.assertEqual(hard_violations(a, deal), [], combo)


class MorePairs(unittest.TestCase):
    def test_every_vendor_pair_reaches_a_deal(self):
        for pa, pb in itertools.product(SUPPORTED_PERSONALITIES, repeat=2):
            deal, _ = negotiate("vendor-pricing", BUYER, VENDOR, {BUYER: pa, VENDOR: pb})
            self.assertIsNotNone(deal, (pa, pb))

    def test_cooperative_job_pairs_reach_a_deal(self):
        for pa, pb in (("Collaborative", "Collaborative"), ("Risk-Averse", "Collaborative")):
            deal, _ = negotiate("job-offer", CAND, EMPL, {CAND: pa, EMPL: pb})
            self.assertIsNotNone(deal, (pa, pb))


if __name__ == "__main__":
    unittest.main()
