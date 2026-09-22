"""
Evidence Gatherer: Controlled, policy-approved evidence gathering & simulation.
Under Policy Section 5:
The agent may, without approval, ask the customer to validate a transaction,
request step-up authentication, or request information from an analyst.
In this round responses are simulated and assumptions recorded.
"""

from typing import Dict, List, Any, Optional

class EvidenceGatherer:
    def __init__(self):
        pass

    def simulate_evidence_request(
        self,
        req_type: str,
        case_context: Dict[str, Any],
        step_number: int = 2
    ) -> Dict[str, Any]:
        """
        Simulates customer validation, step-up auth, or analyst info based on underlying signals.
        """
        ground_truth_verdict = case_context.get("expected_nature", "unknown")
        pattern = case_context.get("pattern", "none")
        card_id = case_context.get("card_id", "")
        trigger_type = case_context.get("trigger_type", "")
        trigger_text = case_context.get("trigger_text", "")

        if req_type == "customer_validation":
            if ground_truth_verdict == "fraud" or trigger_type == "customer_report":
                response = "Customer states they did not make this transaction, remains in possession of the card, and requests card protection."
            elif pattern == "out_of_region_use" and ground_truth_verdict == "legitimate":
                response = "Cardholder confirms recent travel to the billing region and confirms legitimate in-person transactions."
            elif ground_truth_verdict == "legitimate":
                response = "Cardholder confirms making the purchase, noting recent device upgrade / recurring service."
            else:
                response = "Customer states they did not recognize the merchant or authorization amount."

        elif req_type == "step_up_auth":
            if ground_truth_verdict == "fraud":
                response = "Step-up OTP authentication failed: passcode timed out with no response from cardholder device."
            else:
                response = "Step-up authentication successfully completed via biometric app push by verified cardholder."

        elif req_type == "analyst_info":
            if "device profile" in trigger_text.lower() or case_context.get("shared_device_detected"):
                response = "Analyst confirms device profile matches a known fraud ring active across multiple cards this week."
            else:
                response = "Analyst review notes merchant category anomaly and recommends monitoring connected accounts."
        else:
            response = "Simulated verification complete."

        return {
            "type": req_type,
            "asked_after_step": step_number,
            "assumed_response": response
        }
