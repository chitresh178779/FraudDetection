"""
Next-Best Action Reasoner: Two-Stage Policy Evaluation Engine.
Evaluates initial actions -> simulates policy-approved evidence gathering -> computes final actions, human-readable explanations, and executive report.
"""

from typing import Dict, List, Any, Optional
from agent.policy import get_approval_route, should_file_sar
from agent.evidence_gatherer import EvidenceGatherer
from agent.sar_generator import SarGenerator

class Reasoner:
    def __init__(self):
        self.gatherer = EvidenceGatherer()
        self.sar_gen = SarGenerator()

    def _format_action(self, action_code: str, route: str, reason: str, card_id: str = "", exposure: float = 0.0) -> Dict[str, Any]:
        """Enriches each action with human-readable English title, explanation, and clear approval label."""
        titles = {
            "BLOCK_CARD": "Deactivate Compromised Card",
            "DECLINE_TRANSACTION": "Decline Transaction at Gateway",
            "ALLOW_TRANSACTION": "Approve & Settle Transaction",
            "VERIFY_WITH_CUSTOMER": "Contact Cardholder for Authorization",
            "CREATE_CASE": "Open Formal Fraud Investigation Case",
            "CLOSE_NO_FRAUD": "Resolve Alert — Confirmed Legitimate",
            "FILE_REPORT": "File FinCEN Suspicious Activity Report (SAR)",
            "MONITOR_CONNECTED_CARDS": "Place Connected Cards on Heightened Surveillance"
        }
        
        route_labels = {
            "auto": "Instant Automated Action",
            "L1": "Level 1 Fraud Specialist Approval",
            "L2": "Level 2 Senior Compliance Officer Approval"
        }
        
        plain_descriptions = {
            "BLOCK_CARD": f"Immediately deactivate card {card_id} to block further unauthorized purchases by criminals, and dispatch an expedited replacement card to the cardholder.",
            "DECLINE_TRANSACTION": f"Prevent authorization of the flagged charge (${exposure:.2f}) before merchant settlement, protecting account balances.",
            "ALLOW_TRANSACTION": f"Allow the transaction (${exposure:.2f}) to complete normally. Cardholder activity has been verified as authentic.",
            "VERIFY_WITH_CUSTOMER": f"Send an urgent two-way SMS and mobile banking push notification to verify whether the cardholder authorized this purchase before taking permanent action.",
            "CREATE_CASE": f"Generate a permanent internal fraud incident record linking the TigerGraph transaction trail for chargeback recovery and merchant dispute.",
            "CLOSE_NO_FRAUD": "Mark this alert as fully resolved. The cardholder confirmed the purchase, and spending history aligns with normal behavior. No restrictions needed.",
            "FILE_REPORT": f"Submit an electronic regulatory compliance filing (SAR) to FinCEN due to financial exposure (${exposure:.2f}) or organized syndicate activity.",
            "MONITOR_CONNECTED_CARDS": "Flag other card accounts associated with this shared device signature for enhanced real-time fraud monitoring."
        }

        return {
            "action": action_code,
            "title": titles.get(action_code, action_code.replace("_", " ").title()),
            "plain_english": plain_descriptions.get(action_code, reason),
            "route": route,
            "route_label": route_labels.get(route, f"Approval: {route}"),
            "reason": reason
        }

    def _generate_plain_english_report(
        self,
        case_id: str,
        verdict: str,
        pattern: str,
        exposure: float,
        card_id: str,
        customer_id: str,
        flagged_tid: str,
        trigger_type: str,
        trigger_text: str,
        connected_cards: List[str],
        connected_devices: List[str],
        assumed_resp: str,
        sar_filed: bool
    ) -> Dict[str, Any]:
        """Constructs an executive investigation report in clear, understandable English."""
        # 1. Headline
        if verdict == "fraud":
            if pattern == "card_testing":
                headline = f"Confirmed Card Testing Attack on Card {card_id}"
            elif pattern == "undocumented":
                headline = f"Confirmed Multi-Card Organized Fraud Syndicate"
            elif pattern == "out_of_region_use":
                headline = f"Confirmed Unauthorized In-Person Card Compromise"
            else:
                headline = f"Confirmed Fraud: Unauthorized Card-Not-Present Charge (${exposure:.2f})"
        else:
            headline = f"Alert Cleared: Authorized Cardholder Purchase (${exposure:.2f})"

        # 2. What Triggered the Alert
        if trigger_type == "customer_report":
            trigger_summary = f"Cardholder {customer_id} contacted customer support disputing an unrecognized charge of ${exposure:.2f} (Txn #{flagged_tid}), stating they did not recognize or make it."
        elif trigger_type == "analyst_request":
            trigger_summary = f"A senior fraud intelligence analyst flagged transaction #{flagged_tid} on card {card_id} due to an unusual hardware device signature observed across multiple distinct card accounts."
        else:
            trigger_summary = f"The bank's real-time risk engine automatically flagged transaction #{flagged_tid} (${exposure:.2f}) on card {card_id} with an elevated risk alert requiring verification."

        # 3. What the Graph Traversal Revealed
        graph_points = []
        if pattern == "card_testing":
            graph_points.append("TigerGraph temporal traversal detected a rapid sequence of micro-authorizations under $5 right before this larger purchase, a classic signature of fraudsters probing active card numbers.")
        elif pattern == "undocumented":
            graph_points.append(f"TigerGraph device neighbor query identified {len(connected_cards)} other distinct card accounts sharing the exact same hardware fingerprint in a tight time window, confirming coordinated syndicate activity.")
        elif pattern == "out_of_region_use":
            graph_points.append("Geographic deviation analysis showed this in-person transaction occurred in a billing region completely outside the cardholder's historical living and spending area.")
        elif pattern in {"card_not_present_fraud", "card_not_present_new_device"}:
            graph_points.append("Online transaction analysis confirmed the purchase originated from an unrecognized device profile with no prior relationship to this customer account.")
        else:
            graph_points.append("TigerGraph temporal and geographic queries showed spending history, merchant categories, and location are fully consistent with the cardholder's baseline behavior.")

        # 4. Cardholder Verification Outcome
        if assumed_resp:
            customer_outcome = f"During verification, the response recorded: '{assumed_resp}'"
        elif trigger_type == "customer_report":
            customer_outcome = f"The customer explicitly initiated this case to dispute an unrecognized charge."
        else:
            customer_outcome = "Customer verification confirmed authorization for this transaction."

        # 5. Conclusion & Safety Actions
        if verdict == "fraud":
            conclusion = (
                f"The evidence confirms card {card_id} has been compromised. "
                f"Total financial exposure is ${exposure:.2f}. The card has been blocked to prevent further fraud, "
                f"and an internal dispute file has been created."
            )
            if sar_filed:
                conclusion += " A mandatory Suspicious Activity Report (SAR) has been generated for FinCEN regulatory compliance."
        else:
            conclusion = (
                f"The investigation verified that transaction #{flagged_tid} is legitimate cardholder activity. "
                f"No account restriction is necessary, the transaction has been approved for normal settlement, "
                f"and this monitoring alert is closed."
            )

        return {
            "headline": headline,
            "trigger_summary": trigger_summary,
            "graph_findings": " ".join(graph_points),
            "customer_outcome": customer_outcome,
            "conclusion": conclusion
        }

    def reason_case(self, rag_result: Dict[str, Any]) -> Dict[str, Any]:
        case_id = rag_result["case_id"]
        customer_id = rag_result["customer_id"]
        card_id = rag_result["card_id"]
        flagged_tid = rag_result["flagged_tid"]
        pattern = rag_result["detected_pattern"]
        exposure = rag_result["exposure_usd"]
        raw_prob = rag_result["raw_prob"]
        trigger_type = rag_result["trigger_type"]
        trigger_text = rag_result["trigger_text"]
        connected_cards = rag_result["connected_cards"]
        connected_devices = rag_result["connected_devices"]
        evidence_list = rag_result["evidence_list"]

        # ----------------------------------------------------
        # STAGE 1: Initial Next-Best Actions (Before Evidence)
        # ----------------------------------------------------
        initial_actions = []
        initial_prob = raw_prob
        req_type = None

        if pattern == "card_testing":
            initial_actions.append(self._format_action(
                "DECLINE_TRANSACTION",
                get_approval_route("DECLINE_TRANSACTION", exposure),
                "R5: testing sequence observed on card",
                card_id, exposure
            ))
            initial_actions.append(self._format_action(
                "VERIFY_WITH_CUSTOMER",
                "auto",
                "R1: verify transaction sequence with cardholder before blocking card",
                card_id, exposure
            ))
            req_type = "customer_validation"

        elif pattern == "undocumented": # Coordinated multi-card device
            initial_actions.append(self._format_action(
                "CREATE_CASE",
                "auto",
                "R9: coordinated undocumented device activity observed",
                card_id, exposure
            ))
            initial_actions.append(self._format_action(
                "VERIFY_WITH_CUSTOMER",
                "auto",
                "R1: confirm customer authorization on flagged transaction",
                card_id, exposure
            ))
            req_type = "customer_validation"

        elif pattern == "out_of_region_use":
            initial_actions.append(self._format_action(
                "VERIFY_WITH_CUSTOMER",
                "auto",
                "R1: out-of-region card-present activity, confirm travel before blocking",
                card_id, exposure
            ))
            req_type = "customer_validation"

        elif pattern in {"card_not_present_fraud", "card_not_present_new_device"}:
            if trigger_type == "customer_report":
                initial_actions.append(self._format_action(
                    "BLOCK_CARD",
                    get_approval_route("BLOCK_CARD", exposure),
                    "R2: customer reported unrecognized charge",
                    card_id, exposure
                ))
                initial_actions.append(self._format_action(
                    "CREATE_CASE",
                    "auto",
                    "R2: mandatory internal case creation on customer report",
                    card_id, exposure
                ))
                req_type = "analyst_info" if connected_devices else None
            elif initial_prob < 0.70:
                initial_actions.append(self._format_action(
                    "VERIFY_WITH_CUSTOMER",
                    "auto",
                    "R1: probability below 0.70 on single signal, verify before block",
                    card_id, exposure
                ))
                req_type = "customer_validation"
            else:
                initial_actions.append(self._format_action(
                    "DECLINE_TRANSACTION",
                    get_approval_route("DECLINE_TRANSACTION", exposure),
                    "R1: high risk score, decline authorization pending verification",
                    card_id, exposure
                ))
                initial_actions.append(self._format_action(
                    "VERIFY_WITH_CUSTOMER",
                    "auto",
                    "R1: confirm unauthorized use before permanent block",
                    card_id, exposure
                ))
                req_type = "customer_validation"
        else:
            # Pattern is none / legitimate
            if initial_prob < 0.30:
                initial_actions.append(self._format_action(
                    "ALLOW_TRANSACTION",
                    "auto",
                    "Policy Section 1: low risk score and consistent card history",
                    card_id, exposure
                ))
                initial_actions.append(self._format_action(
                    "CLOSE_NO_FRAUD",
                    "auto",
                    "R3: activity verified consistent with cardholder behavior",
                    card_id, exposure
                ))
                req_type = None
            else:
                initial_actions.append(self._format_action(
                    "VERIFY_WITH_CUSTOMER",
                    "auto",
                    "R1: moderate risk score on isolated transaction, verify with cardholder",
                    card_id, exposure
                ))
                req_type = "customer_validation"

        # ----------------------------------------------------
        # STAGE 2: Controlled Evidence Gathering
        # ----------------------------------------------------
        evidence_requests = []
        assumed_resp = ""
        is_fraud = (pattern != "none")

        sim_context = {
            "expected_nature": "fraud" if is_fraud else "legitimate",
            "pattern": pattern,
            "card_id": card_id,
            "trigger_type": trigger_type,
            "trigger_text": trigger_text,
            "shared_device_detected": bool(connected_cards)
        }

        if req_type:
            ev_req = self.gatherer.simulate_evidence_request(req_type, sim_context, step_number=len(evidence_list) + 1)
            evidence_requests.append(ev_req)
            assumed_resp = ev_req["assumed_response"]
            
            evidence_list.append({
                "claim": f"Response to {req_type.replace('_', ' ')}: {assumed_resp}",
                "source": "customer" if "customer" in req_type else "external",
                "ref": f"evidence_request:{len(evidence_requests)}",
                "entity_ids": []
            })

        # ----------------------------------------------------
        # STAGE 3: Final Next-Best Actions (After Evidence)
        # ----------------------------------------------------
        final_actions = []
        what_changed = "nothing"
        final_prob = initial_prob

        if not is_fraud:
            # Cleared as legitimate
            final_prob = 0.05
            verdict = "legitimate"
            status = "closed_legitimate"
            stop_reason = "Customer confirmation and graph verification cleared transaction as legitimate."
            final_actions.append(self._format_action(
                "ALLOW_TRANSACTION",
                "auto",
                "Policy Section 1: authorized transaction cleared for settlement",
                card_id, exposure
            ))
            final_actions.append(self._format_action(
                "CLOSE_NO_FRAUD",
                "auto",
                "R3: transaction confirmed legitimate by cardholder",
                card_id, exposure
            ))
            if req_type:
                what_changed = "Customer confirmed transaction, resolving uncertainty and clearing alert with ALLOW_TRANSACTION and CLOSE_NO_FRAUD."
        else:
            # Confirmed Fraud
            final_prob = min(0.95, max(0.85, raw_prob + 0.12))
            verdict = "fraud"
            status = "closed_fraud"
            stop_reason = "Customer denial and graph evidence confirmed compromise; appropriate block, case, and protective actions taken."

            # Action 1: Block Card
            final_actions.append(self._format_action(
                "BLOCK_CARD",
                get_approval_route("BLOCK_CARD", exposure),
                f"R2: confirmed unauthorized activity; exposure ${exposure:.2f} is {'under' if exposure <= 2500 else 'over'} $2,500",
                card_id, exposure
            ))

            # Action 2: Create Case
            final_actions.append(self._format_action(
                "CREATE_CASE",
                "auto",
                "R2: internal case record created with graph evidence attached",
                card_id, exposure
            ))

            # Action 3: File Report (SAR) if threshold met
            has_shared_link = bool(connected_cards or connected_devices)
            is_undoc = (pattern == "undocumented")
            if should_file_sar(verdict, final_prob, exposure, has_shared_link, is_undoc):
                sar_route = get_approval_route("FILE_REPORT", exposure)
                final_actions.append(self._format_action(
                    "FILE_REPORT",
                    sar_route,
                    "R6: shared device/network links to other cards" if has_shared_link else ("R9: undocumented coordinated pattern" if is_undoc else "R2: exposure exceeds $1,000 threshold"),
                    card_id, exposure
                ))

            # Action 4: Monitor Connected Cards if shared origin
            if connected_cards:
                final_actions.append(self._format_action(
                    "MONITOR_CONNECTED_CARDS",
                    "auto",
                    f"R6: device profile also observed on {len(connected_cards)} connected card(s)",
                    card_id, exposure
                ))

            if req_type:
                what_changed = f"Customer response confirmed unauthorized activity, raising fraud probability to {final_prob:.2f} and escalating recommendations to BLOCK_CARD and CREATE_CASE."
                if any(a["action"] == "FILE_REPORT" for a in final_actions):
                    what_changed += " Regulatory reporting (FILE_REPORT) triggered under policy thresholds."

        # ----------------------------------------------------
        # STAGE 4: Suspicious Activity Report (SAR)
        # ----------------------------------------------------
        sar_file_warranted = any(a["action"] == "FILE_REPORT" for a in final_actions)
        sar_rule = "R6" if connected_cards else ("R9" if pattern == "undocumented" else "R2")
        sar_reason = "Confirmed unauthorized transaction exceeding regulatory and policy filing criteria" if sar_file_warranted else "Exposure does not meet regulatory SAR filing threshold."

        sar_obj = self.sar_gen.generate_sar(
            case_id=case_id,
            customer_id=customer_id,
            card_id=card_id,
            verdict=verdict,
            pattern=pattern,
            exposure_usd=exposure,
            affected_txns=[rag_result["flagged_txn"]],
            connected_cards=connected_cards,
            connected_devices=connected_devices,
            rule_citation=sar_rule,
            reason=sar_reason,
            assumed_response=assumed_resp,
            should_file=sar_file_warranted
        )

        # Summary for analyst
        if verdict == "fraud":
            summary = f"Investigation confirmed {pattern.replace('_', ' ')} on card {card_id} (exposure: ${exposure:.2f}). "
            if connected_cards:
                summary += f"Shared device profile identified across {len(connected_cards)} additional card account(s). "
            summary += f"Defensive action executed with card block and case recorded into TigerGraph memory."
        else:
            summary = f"Alert reviewed and cleared as legitimate cardholder transaction following verification. No unauthorized compromise detected."

        plain_report = self._generate_plain_english_report(
            case_id=case_id,
            verdict=verdict,
            pattern=pattern,
            exposure=exposure,
            card_id=card_id,
            customer_id=customer_id,
            flagged_tid=flagged_tid,
            trigger_type=trigger_type,
            trigger_text=trigger_text,
            connected_cards=connected_cards,
            connected_devices=connected_devices,
            assumed_resp=assumed_resp,
            sar_filed=sar_file_warranted
        )

        return {
            "case_id": case_id,
            "status": status,
            "verdict": verdict,
            "fraud_probability": round(final_prob, 2),
            "pattern": pattern,
            "pattern_description": rag_result["pattern_description"],
            "affected_txn_ids": rag_result["affected_txns"] if verdict == "fraud" else [],
            "first_suspicious_txn_id": rag_result["first_suspicious_tid"] if verdict == "fraud" else "",
            "connected_card_ids": connected_cards if verdict == "fraud" else [],
            "connected_device_profiles": connected_devices if verdict == "fraud" else [],
            "exposure_usd": round(exposure, 2) if verdict == "fraud" else 0.0,
            "evidence": evidence_list,
            "similar_prior_cases": rag_result["similar_prior_cases"],
            "summary": summary,
            "plain_english_report": plain_report,
            "written_to_graph": True,
            "graph_case_id": f"CASE-2016-{case_id.replace('HHG-', '')}",
            "evidence_requests": evidence_requests,
            "next_best_actions": {
                "initial": initial_actions,
                "final": final_actions,
                "what_changed": what_changed
            },
            "sar": sar_obj,
            "stop_reason": stop_reason
        }
