"""
Investigator: High-Level Orchestrator for Fraud Investigation Agent.
Executes GraphRAG traversal -> Next-Best Action Reasoning -> Graph Memory Writeback -> Answer Formatting.
"""

import time
from typing import Dict, List, Any
from agent.graphrag import GraphRAG
from agent.reasoner import Reasoner
from graph.tg_client import TigerGraphClient

class Investigator:
    def __init__(self):
        self.rag = GraphRAG()
        self.reasoner = Reasoner()
        self.tg_client = TigerGraphClient.get_instance()

    def investigate(self, case_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs the investigation on a case and returns the benchmark answer object.
        """
        start_time = time.time()
        tool_calls = 0

        # Step 1: GraphRAG analysis
        tool_calls += 4 # card_window, device_neighbors, region_deviation, find_similar_cases
        rag_res = self.rag.analyze_case(case_info)

        # Step 2: Next-Best Action Reasoning
        reason_res = self.reasoner.reason_case(rag_res)

        # Step 3: Write case to TigerGraph memory
        tool_calls += 1 # upsertVertex / record_investigation_case
        self.tg_client.record_investigation_case(reason_res)

        elapsed = round(time.time() - start_time, 2)
        # Estimated token usage for GraphRAG reasoning
        token_count = 1200 + len(str(reason_res)) // 4

        # Assemble full deliverable JSON matching README specifications
        deliverable = {
            "case_id": reason_res["case_id"],
            "case": {
                "status": reason_res["status"],
                "verdict": reason_res["verdict"],
                "fraud_probability": reason_res["fraud_probability"],
                "pattern": reason_res["pattern"],
                "pattern_description": reason_res["pattern_description"],
                "affected_txn_ids": reason_res["affected_txn_ids"],
                "first_suspicious_txn_id": reason_res["first_suspicious_txn_id"],
                "connected_card_ids": reason_res["connected_card_ids"],
                "connected_device_profiles": reason_res["connected_device_profiles"],
                "exposure_usd": reason_res["exposure_usd"],
                "evidence": reason_res["evidence"],
                "similar_prior_cases": reason_res["similar_prior_cases"],
                "summary": reason_res["summary"],
                "written_to_graph": reason_res["written_to_graph"],
                "graph_case_id": reason_res["graph_case_id"]
            },
            "evidence_requests": reason_res["evidence_requests"],
            "next_best_actions": reason_res["next_best_actions"],
            "plain_english_report": reason_res.get("plain_english_report", {}),
            "sar": reason_res["sar"],
            "stop_reason": reason_res["stop_reason"],
            "tool_calls": tool_calls,
            "tokens": token_count,
            "latency_s": elapsed
        }

        return deliverable
