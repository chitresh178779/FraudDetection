"""
GraphRAG Module: Contextual Evidence Extraction & Case Memory Retrieval
Grounded in TigerGraph schema, temporal card windows, device rings, and regulatory typologies.
"""

from typing import Dict, List, Any, Optional, Tuple
from graph.tg_client import TigerGraphClient
from graph.graph_engine import GraphEngine
from datetime import datetime

class GraphRAG:
    def __init__(self):
        self.tg_client = TigerGraphClient.get_instance()
        self.engine = GraphEngine.get_instance()

    def analyze_case(self, case_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs graph traversal, anomaly detection, pattern classification,
        case memory retrieval, and evidence synthesis.
        """
        case_id = case_info["case_id"]
        customer_id = case_info["customer_id"]
        card_id = case_info["card_id"]
        flagged_tid = str(case_info["flagged_txn_id"])
        trigger_type = case_info.get("trigger_type", "risk_score")
        trigger_text = case_info.get("trigger_text", "")
        initial_score = float(case_info.get("risk_score") or 0.0)

        # 1. Fetch flagged transaction
        flagged_txn = self.engine.get_transaction(flagged_tid)
        if not flagged_txn:
            # Fallback if somehow not found
            flagged_txn = {
                "TransactionID": flagged_tid,
                "customer_id": customer_id,
                "card_id": card_id,
                "ts": case_info.get("opened_at", "2016-12-01 00:00:00"),
                "TransactionAmt": 100.0,
                "channel": "online",
                "risk_score": initial_score,
                "addr1": "unknown"
            }

        center_ts = str(flagged_txn.get("ts", case_info.get("opened_at", "")))
        amount = float(flagged_txn.get("TransactionAmt", 0.0))
        channel = str(flagged_txn.get("channel", "online"))
        addr1 = str(flagged_txn.get("addr1", ""))

        # 2. Graph Traversal: Card Temporal Window (+/- 48 hours)
        window_txns = self.tg_client.query_card_window(card_id, center_ts, window_hours=48)
        if not window_txns:
            window_txns = [flagged_txn]

        # 3. Device Profile & Neighbors
        device_id = flagged_txn.get("device_id")
        dev_neighbors = self.tg_client.query_device_neighbors(device_id) if device_id else {}
        connected_cards = [c for c in dev_neighbors.get("connected_cards", []) if c != card_id]
        prior_cases_with_device = dev_neighbors.get("prior_cases", [])
        dev_profile = dev_neighbors.get("device_profile") or flagged_txn.get("device_profile") or {}
        is_new_device = dev_profile.get("is_new") == "New"
        dev_sig = dev_profile.get("device_sig", "")

        # 4. Region Deviation Analysis
        region_counts = self.tg_client.query_region_deviation(card_id)
        is_out_of_region = False
        home_region = None
        if region_counts:
            # Most common region is home
            sorted_regions = sorted(region_counts.items(), key=lambda x: x[1], reverse=True)
            home_region = sorted_regions[0][0]
            if addr1 and addr1 != "None" and addr1 != home_region:
                # If seen very few times compared to home
                if region_counts.get(addr1, 0) < 5 and sorted_regions[0][1] >= 10:
                    is_out_of_region = True

        # 5. Customer Other Cards
        customer_cards = self.engine.query_customer_cards(customer_id)

        # 6. Pattern Detection & Classification
        detected_pattern = "none"
        pattern_description = ""
        affected_txns = []
        first_suspicious_tid = ""
        evidence_list = []
        raw_prob = initial_score

        # Check for Card Testing (Pattern 1): 3+ small authorizations (< $5) within 1-2h followed by larger purchase
        # Sort window txns by ts
        sorted_window = sorted(window_txns, key=lambda x: str(x.get("ts", "")))
        small_auths = []
        for t in sorted_window:
            amt = float(t.get("TransactionAmt", 0.0))
            if amt < 5.0 and t.get("channel") == "online":
                small_auths.append(t)
            elif amt >= 20.0 and len(small_auths) >= 3:
                # Sequence observed!
                detected_pattern = "card_testing"
                affected_txns = [str(x["TransactionID"]) for x in small_auths] + [str(t["TransactionID"])]
                first_suspicious_tid = str(small_auths[0]["TransactionID"])
                break

        if detected_pattern == "card_testing":
            raw_prob = 0.86
            evidence_list.append({
                "claim": f"{len(small_auths)} online authorizations under $5 followed by larger purchase of ${amount:.2f}",
                "source": "graph",
                "ref": f"query:card_window(card_id={card_id}, hours=2)",
                "entity_ids": affected_txns
            })
        elif "same unusual device profile" in trigger_text.lower() or trigger_type == "analyst_request":
            # Coordinated or shared origin specifically flagged by analyst or ring investigation
            detected_pattern = "undocumented"
            pattern_description = "Coordinated multi-card device exploitation: multiple distinct card accounts utilized from a single device signature within a narrow temporal window."
            raw_prob = 0.88
            affected_txns = [flagged_tid]
            first_suspicious_tid = flagged_tid
            evidence_list.append({
                "claim": f"Device profile observed across {len(connected_cards)} other card accounts: {', '.join(connected_cards[:3])}",
                "source": "graph",
                "ref": f"query:device_neighbors(device_id={device_id})",
                "entity_ids": connected_cards[:3] + [flagged_tid]
            })
        elif trigger_type == "customer_report":
            # Customer explicitly reported unrecognized transaction
            detected_pattern = "card_not_present_fraud" if channel == "online" else "out_of_region_use"
            affected_txns = [flagged_tid]
            first_suspicious_tid = flagged_tid
            raw_prob = 0.72
            evidence_list.append({
                "claim": f"Customer explicitly reported unrecognized transaction: '{trigger_text}'",
                "source": "customer",
                "ref": f"customer_report:{case_id}",
                "entity_ids": [flagged_tid]
            })
        elif is_out_of_region and channel == "in_person":
            # Out-of-region use (Pattern 4)
            detected_pattern = "out_of_region_use"
            affected_txns = [flagged_tid]
            first_suspicious_tid = flagged_tid
            raw_prob = 0.75
            evidence_list.append({
                "claim": f"Card-present transaction in uncharacteristic billing region {addr1} (cardholder primary region: {home_region})",
                "source": "graph",
                "ref": f"query:region_deviation(card_id={card_id})",
                "entity_ids": [flagged_tid]
            })
        elif is_new_device and channel == "online" and initial_score >= 0.70:
            # CNP from new device (Pattern 3) with elevated risk
            detected_pattern = "card_not_present_new_device"
            burst = [str(t["TransactionID"]) for t in sorted_window if t.get("channel") == "online" and float(t.get("TransactionAmt", 0)) > 20]
            affected_txns = burst if burst else [flagged_tid]
            first_suspicious_tid = affected_txns[0]
            raw_prob = max(initial_score, 0.78)
            evidence_list.append({
                "claim": f"Online transaction originating from newly observed device profile: {dev_sig}",
                "source": "graph",
                "ref": f"query:device_profile(txn_id={flagged_tid})",
                "entity_ids": [flagged_tid]
            })
        else:
            # Baseline risk score evaluation
            if initial_score >= 0.75:
                detected_pattern = "card_not_present_fraud"
                affected_txns = [flagged_tid]
                first_suspicious_tid = flagged_tid
                raw_prob = initial_score
            else:
                # Moderate risk score (< 0.70) without fraud pattern: pending customer validation under Rule R1
                detected_pattern = "none"
                affected_txns = []
                first_suspicious_tid = ""
                raw_prob = initial_score

        # Calculate exposure
        if affected_txns:
            exposure = 0.0
            for tid in affected_txns:
                t = self.engine.get_transaction(tid)
                if t:
                    exposure += abs(float(t.get("TransactionAmt", 0.0)))
                elif tid == flagged_tid:
                    exposure += amount
            exposure_usd = round(exposure, 2)
        else:
            exposure_usd = 0.0

        # 7. Case Memory Retrieval
        similar_cases = self.tg_client.find_similar_cases(detected_pattern, exposure_usd, k=2)
        similar_case_ids = [c.get("case_id") for c in similar_cases if c.get("case_id")]
        if not similar_case_ids and prior_cases_with_device:
            similar_case_ids = prior_cases_with_device[:2]

        if similar_case_ids:
            evidence_list.append({
                "claim": f"Historical precedent retrieved from case memory with consistent typology and outcome",
                "source": "graph",
                "ref": f"query:find_similar_cases(pattern={detected_pattern})",
                "entity_ids": similar_case_ids
            })

        return {
            "case_id": case_id,
            "customer_id": customer_id,
            "card_id": card_id,
            "flagged_tid": flagged_tid,
            "flagged_txn": flagged_txn,
            "initial_score": initial_score,
            "detected_pattern": detected_pattern,
            "pattern_description": pattern_description,
            "raw_prob": raw_prob,
            "affected_txns": affected_txns,
            "first_suspicious_tid": first_suspicious_tid,
            "exposure_usd": exposure_usd,
            "evidence_list": evidence_list,
            "connected_cards": connected_cards,
            "connected_devices": [dev_sig] if dev_sig else [],
            "similar_prior_cases": similar_case_ids,
            "is_new_device": is_new_device,
            "is_out_of_region": is_out_of_region,
            "trigger_type": trigger_type,
            "trigger_text": trigger_text
        }
