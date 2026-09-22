"""
Unit Tests & Benchmark Answer Verification Suite.
Validates all 20 answer JSON files in cases/ against the strict hackathon specification.
"""

import os
import json
import unittest

CASES_DIR = r"d:\HackerHouseGoa\cases"

ALLOWED_STATUSES = {"open", "closed_fraud", "closed_legitimate", "escalated"}
ALLOWED_VERDICTS = {"fraud", "legitimate", "uncertain"}
ALLOWED_PATTERNS = {
    "card_testing", "card_not_present_fraud", "card_not_present_new_device",
    "out_of_region_use", "account_takeover", "undocumented", "none"
}
ALLOWED_ACTIONS = {
    "ALLOW_TRANSACTION", "DECLINE_TRANSACTION", "MONITOR_CARD",
    "MONITOR_CONNECTED_CARDS", "WARN_CUSTOMER", "VERIFY_WITH_CUSTOMER",
    "STEP_UP_AUTH", "BLOCK_CARD", "BLOCK_ALL_CARDS", "GENERATE_REPORT",
    "CREATE_CASE", "FILE_REPORT", "ESCALATE_TO_ANALYST", "CLOSE_NO_FRAUD"
}
ALLOWED_ROUTES = {"auto", "L1", "L2"}

class TestCaseAnswers(unittest.TestCase):
    def test_twenty_cases_exist(self):
        """Verify all 20 cases exist."""
        for i in range(1, 21):
            cid = f"HHG-{i:03d}"
            p = os.path.join(CASES_DIR, f"{cid}.json")
            self.assertTrue(os.path.exists(p), f"Missing answer file {p}")

    def test_schema_conformance(self):
        """Verify each case JSON strictly satisfies all field requirements."""
        for i in range(1, 21):
            cid = f"HHG-{i:03d}"
            p = os.path.join(CASES_DIR, f"{cid}.json")
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Top level fields
            for key in ["case_id", "case", "evidence_requests", "next_best_actions", "sar", "stop_reason", "tool_calls", "tokens", "latency_s"]:
                self.assertIn(key, data, f"{cid} missing top-level key {key}")

            self.assertEqual(data["case_id"], cid)
            self.assertIsInstance(data["tool_calls"], int)
            self.assertIsInstance(data["tokens"], int)
            self.assertIsInstance(data["latency_s"], (int, float))
            self.assertIsInstance(data["stop_reason"], str)
            self.assertTrue(len(data["stop_reason"]) > 5)

            # Part 1: case
            c = data["case"]
            self.assertIn(c["status"], ALLOWED_STATUSES)
            self.assertIn(c["verdict"], ALLOWED_VERDICTS)
            self.assertIn(c["pattern"], ALLOWED_PATTERNS)
            self.assertIsInstance(c["fraud_probability"], (int, float))
            self.assertTrue(0.0 <= c["fraud_probability"] <= 1.0)
            self.assertIsInstance(c["affected_txn_ids"], list)
            self.assertIsInstance(c["connected_card_ids"], list)
            self.assertIsInstance(c["connected_device_profiles"], list)
            self.assertIsInstance(c["exposure_usd"], (int, float))
            self.assertIsInstance(c["evidence"], list)
            self.assertIsInstance(c["similar_prior_cases"], list)
            self.assertIsInstance(c["summary"], str)
            self.assertIsInstance(c["written_to_graph"], bool)
            self.assertTrue(c["written_to_graph"])
            self.assertIsInstance(c["graph_case_id"], str)

            # Evidence checks
            for ev in c["evidence"]:
                self.assertIn("claim", ev)
                self.assertIn("source", ev)
                self.assertIn(ev["source"], {"graph", "document", "customer", "external"})
                self.assertIn("ref", ev)
                self.assertIn("entity_ids", ev)

            # Part 2: sar
            sar = data["sar"]
            self.assertIsInstance(sar["file"], bool)
            self.assertIsInstance(sar["reason"], str)
            self.assertIsInstance(sar["narrative"], str)
            self.assertIsInstance(sar["subjects"], list)
            self.assertIsInstance(sar["total_amount_usd"], (int, float))
            self.assertIsInstance(sar["activity_dates"], list)

            final_actions = [a["action"] for a in data["next_best_actions"]["final"]]
            if sar["file"]:
                self.assertIn("FILE_REPORT", final_actions, f"{cid}: sar.file is True but FILE_REPORT missing from final actions")
                self.assertTrue(len(sar["narrative"]) > 20, f"{cid}: SAR narrative must not be empty when file=True")
                self.assertTrue(len(sar["subjects"]) > 0)
                self.assertEqual(len(sar["activity_dates"]), 2)
            else:
                self.assertNotIn("FILE_REPORT", final_actions, f"{cid}: sar.file is False but FILE_REPORT present in final actions")
                self.assertEqual(sar["narrative"], "")
                self.assertEqual(sar["subjects"], [])
                self.assertEqual(sar["total_amount_usd"], 0.0)
                self.assertEqual(sar["activity_dates"], [])

            # Part 3: next_best_actions
            nba = data["next_best_actions"]
            self.assertIn("initial", nba)
            self.assertIn("final", nba)
            self.assertIn("what_changed", nba)

            for act in nba["initial"] + nba["final"]:
                self.assertIn(act["action"], ALLOWED_ACTIONS, f"Invalid action {act['action']}")
                self.assertIn(act["route"], ALLOWED_ROUTES, f"Invalid route {act['route']}")
                self.assertIn("reason", act)

if __name__ == "__main__":
    unittest.main()
