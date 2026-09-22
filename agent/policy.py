"""
Bank Fraud Policy v1.0
Implements action vocabulary, approval routing (auto, L1, L2), and rules R1 through R10.
"""

from typing import Dict, List, Any, Optional

ALLOWED_ACTIONS = {
    "ALLOW_TRANSACTION",
    "DECLINE_TRANSACTION",
    "MONITOR_CARD",
    "MONITOR_CONNECTED_CARDS",
    "WARN_CUSTOMER",
    "VERIFY_WITH_CUSTOMER",
    "STEP_UP_AUTH",
    "BLOCK_CARD",
    "BLOCK_ALL_CARDS",
    "GENERATE_REPORT",
    "CREATE_CASE",
    "FILE_REPORT",
    "ESCALATE_TO_ANALYST",
    "CLOSE_NO_FRAUD"
}

def get_approval_route(action: str, exposure_usd: float = 0.0) -> str:
    """
    Returns the approval route for an action under policy section 2:
    - auto: agent acts alone
    - L1: team lead must approve
    - L2: fraud manager must approve
    """
    if action in {
        "ALLOW_TRANSACTION", "MONITOR_CARD", "MONITOR_CONNECTED_CARDS",
        "WARN_CUSTOMER", "VERIFY_WITH_CUSTOMER", "STEP_UP_AUTH",
        "GENERATE_REPORT", "CREATE_CASE", "ESCALATE_TO_ANALYST", "CLOSE_NO_FRAUD"
    }:
        return "auto"

    if action == "DECLINE_TRANSACTION":
        return "L1"

    if action == "BLOCK_CARD":
        return "L1" if exposure_usd <= 2500.0 else "L2"

    if action in {"BLOCK_ALL_CARDS", "FILE_REPORT"}:
        return "L2"

    return "auto"

def should_file_sar(verdict: str, fraud_probability: float, exposure_usd: float,
                    has_shared_link: bool = False, is_undocumented_coordinated: bool = False) -> bool:
    """
    Policy Section 3a & Rules R2/R6/R9:
    File a SAR (FILE_REPORT) when fraud is confirmed or strongly suspected AND at least one holds:
    - exposure exceeds $1,000
    - connects to shared device profile, shared region cluster, or another customer's fraud
    - pattern is coordinated or undocumented (R9)
    """
    if verdict != "fraud" and fraud_probability < 0.70:
        return False

    if exposure_usd > 1000.0:
        return True
    if has_shared_link:
        return True
    if is_undocumented_coordinated:
        return True

    return False
