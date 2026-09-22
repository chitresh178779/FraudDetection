"""
SAR Generator: Produces FinCEN-compliant Suspicious Activity Reports.
Adheres strictly to FinCEN Narrative Guidance: Who, What, When, Where, How, and Why.
"""

from typing import Dict, List, Any, Optional

class SarGenerator:
    def __init__(self):
        pass

    def generate_sar(
        self,
        case_id: str,
        customer_id: str,
        card_id: str,
        verdict: str,
        pattern: str,
        exposure_usd: float,
        affected_txns: List[Dict[str, Any]],
        connected_cards: List[str],
        connected_devices: List[str],
        rule_citation: str,
        reason: str,
        assumed_response: str = "",
        should_file: bool = False
    ) -> Dict[str, Any]:
        """
        Generates Part 2: sar object adhering to schema rules.
        Must strictly agree with whether FILE_REPORT appears in final actions.
        """
        # If no SAR is warranted
        if not should_file or verdict != "fraud" or exposure_usd <= 0.0:
            return {
                "file": False,
                "reason": reason or "Exposure does not meet regulatory SAR filing threshold and no shared compromise identified.",
                "narrative": "",
                "subjects": [],
                "total_amount_usd": 0.0,
                "activity_dates": []
            }

        # Determine activity dates
        dates = []
        for t in affected_txns:
            ts = t.get("ts", "")
            if ts:
                d = str(ts).split(" ")[0]
                dates.append(d)
        dates.sort()
        start_date = dates[0] if dates else "2016-11-01"
        end_date = dates[-1] if dates else start_date

        # Compile subjects
        subjects = [customer_id, card_id]
        for c in connected_cards:
            if c not in subjects:
                subjects.append(c)
        for d in connected_devices:
            if d not in subjects:
                subjects.append(d)

        txn_count = len(affected_txns)
        channel = affected_txns[0].get("channel", "online") if affected_txns else "online"

        # Build 6-12 sentence FinCEN narrative answering Who, What, When, Where, How, Why
        p_name = pattern.replace("_", " ")
        narrative_parts = [
            f"This Suspicious Activity Report is filed regarding unauthorized card transactions on account of customer {customer_id}.",
            f"Between {start_date} and {end_date}, primary card {card_id} exhibited {txn_count} suspicious transaction(s) totaling ${exposure_usd:.2f} USD conducted via the {channel} channel.",
            f"The flagged activity aligns with the typology of {p_name}."
        ]

        if pattern == "card_testing":
            narrative_parts.append(
                "The transaction pattern exhibited repeated low-value online authorizations under $5 followed by larger purchase attempts, indicative of automated card verification."
            )
        elif pattern in {"card_not_present_fraud", "card_not_present_new_device"}:
            narrative_parts.append(
                "Transactions originated from uncharacteristic online merchant endpoints with anomalous device parameters inconsistent with the cardholder's established behavioral profile."
            )
        elif pattern == "out_of_region_use":
            narrative_parts.append(
                "Card-present transactions were authorized in an uncharacteristic billing region while historical account activity concurrently occurred at the cardholder's primary residence."
            )
        elif pattern == "account_takeover":
            narrative_parts.append(
                "Investigation revealed mixed-channel unauthorized attempts combined with credential authentication anomalies, pointing to compromised cardholder credentials."
            )
        else:
            narrative_parts.append(
                "The activity reflects repeated and coordinated anomalous authorizations not matching standard retail typologies."
            )

        if connected_devices:
            narrative_parts.append(
                f"Identified device profile ({connected_devices[0]}) was observed linking across multiple customer cards, indicating syndicated or coordinated fraud operation."
            )

        if connected_cards:
            narrative_parts.append(
                f"Coordinated activity directly connects to additional compromised card identifiers: {', '.join(connected_cards)}."
            )

        if assumed_response:
            narrative_parts.append(f"Investigative follow-up: {assumed_response}")

        narrative_parts.extend([
            f"Total exposure of confirmed fraudulent transactions is quantified at ${exposure_usd:.2f} USD.",
            "In accordance with institutional security policy and BSA/AML requirements, the affected card has been blocked and designated for reissue.",
            "Connected accounts have been placed under heightened surveillance to mitigate further financial exposure."
        ])

        full_narrative = " ".join(narrative_parts)

        return {
            "file": True,
            "reason": f"{rule_citation}: {reason}",
            "narrative": full_narrative,
            "subjects": subjects,
            "total_amount_usd": round(exposure_usd, 2),
            "activity_dates": [start_date, end_date]
        }
