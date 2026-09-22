"""
TigerGraph Client: Dual-Mode Connection Manager
Supports direct pyTigerGraph connections to TigerGraph Savanna / Community Edition,
and provides seamless, zero-latency fallback to local GraphEngine when offline or credentials are not supplied.
"""

import os
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional
from graph.graph_engine import GraphEngine

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

class TigerGraphClient:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.host = os.environ.get("TG_HOST", "")
        self.username = os.environ.get("TG_USERNAME", "tigergraph")
        self.password = os.environ.get("TG_PASSWORD", "")
        self.graph_name = os.environ.get("TG_GRAPH_NAME", "FraudGraph")
        self.secret = os.environ.get("TG_SECRET", "")
        
        self.tg_conn = None
        self.local_engine = GraphEngine.get_instance()
        self.is_connected = False
        self.queries_available = True
        self.writes_available = True
        
        if self.host and self.password:
            self._init_tigergraph()

    def _init_tigergraph(self):
        try:
            import pyTigerGraph as tg
            print(f"Connecting to TigerGraph Savanna at {self.host}...")
            self.tg_conn = tg.TigerGraphConnection(
                host=self.host,
                username=self.username,
                password=self.password,
                graphname=self.graph_name,
                gsqlSecret=self.secret if self.secret else None
            )
            token = self.tg_conn.getToken(self.secret) if self.secret else None
            self.is_connected = True
            print("Successfully connected to TigerGraph Savanna cluster.")
        except Exception as e:
            print(f"TigerGraph remote connection not available: {e}. Utilizing local GraphEngine.")
            self.is_connected = False

    def query_card_window(self, card_id: str, center_ts: str, window_hours: int = 48) -> List[Dict[str, Any]]:
        """Queries card window from TigerGraph GSQL or local GraphEngine."""
        if self.is_connected and self.tg_conn and self.queries_available:
            try:
                params = {"target_card": (card_id,), "center_ts": center_ts, "window_hours": window_hours}
                res = self.tg_conn.runInstalledQuery("card_window", params)
                if res and len(res) > 0 and "Txns" in res[0]:
                    return res[0]["Txns"]
            except Exception as e:
                print(f"[TigerGraph Savanna] Query 'card_window' fallback ({e}). Routing to local GraphEngine.")
        
        return self.local_engine.query_card_window(card_id, center_ts, window_hours)

    def query_device_neighbors(self, device_id: str) -> Dict[str, Any]:
        """Finds cards, txns, and cases linked to device."""
        if self.is_connected and self.tg_conn and self.queries_available:
            try:
                params = {"target_device": (device_id,)}
                res = self.tg_conn.runInstalledQuery("device_neighbors", params)
                if res:
                    return {
                        "connected_cards": [c.get("v_id") for c in res[0].get("Cards", [])],
                        "prior_cases": [cc.get("v_id") for cc in res[0].get("Cases", [])],
                        "device_profile": self.local_engine.device_profiles.get(device_id)
                    }
            except Exception as e:
                print(f"[TigerGraph Savanna] Query 'device_neighbors' fallback ({e}). Routing to local GraphEngine.")

        return self.local_engine.query_device_neighbors(device_id)

    def query_region_deviation(self, card_id: str) -> Dict[str, int]:
        """Checks billing region counts."""
        if self.is_connected and self.tg_conn and self.queries_available:
            try:
                params = {"target_card": (card_id,)}
                res = self.tg_conn.runInstalledQuery("region_deviation", params)
                if res and len(res) > 0:
                    raw_counts = res[0].get("@@region_counts", {})
                    valid = {str(k): v for k, v in raw_counts.items() if str(k).strip() not in {"", "None", "nan"}}
                    if valid:
                        return valid
            except Exception as e:
                print(f"[TigerGraph Savanna] Query 'region_deviation' fallback ({e}). Routing to local GraphEngine.")

        return self.local_engine.query_region_deviation(card_id)

    def find_similar_cases(self, pattern: str, target_exposure: float = 0.0, k: int = 5) -> List[Dict[str, Any]]:
        """Retrieves similar cases from graph memory."""
        if self.is_connected and self.tg_conn and self.queries_available:
            try:
                params = {"target_pattern": pattern, "min_exposure": max(0.0, target_exposure - 500), "max_exposure": target_exposure + 500}
                res = self.tg_conn.runInstalledQuery("find_similar_cases", params)
                if res and len(res) > 0 and "Matched" in res[0]:
                    matched = [c.get("attributes", {}) for c in res[0]["Matched"]]
                    return matched[:k]
            except Exception as e:
                print(f"[TigerGraph Savanna] Remote query 'find_similar_cases' not installed ({e}). Routing to local GraphEngine.")
                self.queries_available = False

        return self.local_engine.find_similar_cases(pattern, target_exposure, k)

    def record_investigation_case(self, case_record: Dict[str, Any]) -> str:
        """Stores case record in graph memory."""
        cid = case_record.get("case_id")
        if self.is_connected and self.tg_conn and self.writes_available:
            try:
                c = case_record.get("case", {})
                self.tg_conn.upsertVertex("InvestigationCase", cid, {
                    "case_id": cid,
                    "status": c.get("status", "open"),
                    "verdict": c.get("verdict", "uncertain"),
                    "fraud_probability": c.get("fraud_probability", 0.0),
                    "pattern": c.get("pattern", "none"),
                    "pattern_description": c.get("pattern_description", ""),
                    "exposure_usd": c.get("exposure_usd", 0.0),
                    "summary": c.get("summary", ""),
                    "sar_filed": case_record.get("sar", {}).get("file", False),
                    "recommended_actions": "|".join([a.get("action", "") for a in case_record.get("next_best_actions", {}).get("final", [])])
                })
            except Exception as e:
                print(f"[TigerGraph Savanna] Vertex 'InvestigationCase' not on remote schema ({e}). Storing in local GraphEngine.")
                self.writes_available = False

        return self.local_engine.record_investigation_case(case_record)
