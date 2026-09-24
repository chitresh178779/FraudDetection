"""
FastAPI Backend Server: Serves cases, graph data, and agent re-investigation endpoints.
"""

import os
import sys
import json

# Add project root to sys.path so running api/server.py directly resolves agent and graph modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Any

from agent.investigator import Investigator
from agent.agentic_loop import AgenticFraudInvestigator
from graph.graph_engine import GraphEngine
from graph.tg_client import TigerGraphClient

app = FastAPI(title="TigerGraph Fraud Investigation Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CASES_DIR = r"d:\HackerHouseGoa\cases"
agentic_investigator = AgenticFraudInvestigator()
engine = GraphEngine.get_instance()
tg_client = TigerGraphClient.get_instance()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "tigergraph_connected": tg_client.is_connected,
        "engine_records": len(engine.closed_cases),
        "devices_indexed": len(engine.device_profiles)
    }

@app.get("/api/cases")
def list_cases():
    """Returns overview list of all 20 benchmark cases (showing whether investigated or pending)."""
    import pandas as pd
    df_pack = pd.read_csv(r"d:\HackerHouseGoa\data\case_pack.csv")
    cases = []
    for _, row in df_pack.iterrows():
        cid = str(row["case_id"])
        p = os.path.join(CASES_DIR, f"{cid}.json")
        flagged_tid = str(row["flagged_txn_id"])
        txn = engine.get_transaction(flagged_tid)
        default_amt = float(txn.get("TransactionAmt", 0.0)) if txn else 0.0

        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    d = json.load(f)
                    c = d.get("case", {})
                    status = c.get("status", "pending")
                    if status in ["closed_fraud", "closed_legitimate", "closed_uncertain"]:
                        cases.append({
                            "case_id": cid,
                            "investigated": True,
                            "status": status,
                            "verdict": c.get("verdict", "pending"),
                            "fraud_probability": c.get("fraud_probability"),
                            "pattern": c.get("pattern"),
                            "exposure_usd": c.get("exposure_usd", default_amt),
                            "sar_file": d.get("sar", {}).get("file", False),
                            "initial_actions_count": len(d.get("next_best_actions", {}).get("initial", [])),
                            "final_actions_count": len(d.get("next_best_actions", {}).get("final", [])),
                            "summary": c.get("summary", ""),
                            "trigger_type": str(row.get("trigger_type", "")),
                            "trigger_text": str(row.get("trigger_text", "")),
                            "flagged_txn_id": flagged_tid,
                            "card_id": str(row.get("card_id", "")),
                            "customer_id": str(row.get("customer_id", "")),
                            "risk_score": float(row.get("risk_score")) if pd.notna(row.get("risk_score")) else None,
                            "latency_s": d.get("latency_s", 0.0)
                        })
                        continue
            except Exception:
                pass

        # Case is uninvestigated / pending
        cases.append({
            "case_id": cid,
            "investigated": False,
            "status": "pending_investigation",
            "verdict": "pending",
            "fraud_probability": None,
            "pattern": "Pending Analysis",
            "exposure_usd": default_amt,
            "sar_file": False,
            "initial_actions_count": 0,
            "final_actions_count": 0,
            "summary": f"Uninvestigated alert: {row.get('trigger_text', '')}",
            "trigger_type": str(row.get("trigger_type", "")),
            "trigger_text": str(row.get("trigger_text", "")),
            "flagged_txn_id": flagged_tid,
            "card_id": str(row.get("card_id", "")),
            "customer_id": str(row.get("customer_id", "")),
            "risk_score": float(row.get("risk_score")) if pd.notna(row.get("risk_score")) else None,
            "latency_s": 0.0
        })
    return cases

@app.get("/api/cases/{case_id}")
def get_case_detail(case_id: str):
    """Returns full details of a specific case, or incoming alert dossier if uninvestigated."""
    import pandas as pd
    df_pack = pd.read_csv(r"d:\HackerHouseGoa\data\case_pack.csv")
    match = df_pack[df_pack["case_id"] == case_id]
    if len(match) == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    row = match.iloc[0]
    flagged_tid = str(row["flagged_txn_id"])
    txn = engine.get_transaction(flagged_tid) or {}

    p = os.path.join(CASES_DIR, f"{case_id}.json")
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["investigated"] = True
                data["flagged_txn"] = txn
                data["trigger_type"] = str(row.get("trigger_type", ""))
                data["trigger_text"] = str(row.get("trigger_text", ""))
                data["card_id"] = str(row.get("card_id", ""))
                data["customer_id"] = str(row.get("customer_id", ""))
                data["risk_score"] = float(row.get("risk_score")) if pd.notna(row.get("risk_score")) else None
                return data
        except Exception:
            pass

    # Uninvestigated initial dossier
    amt = float(txn.get("TransactionAmt", 0.0)) if txn else 0.0
    return {
        "case_id": case_id,
        "investigated": False,
        "opened_at": str(row.get("opened_at", "")),
        "trigger_type": str(row.get("trigger_type", "")),
        "trigger_text": str(row.get("trigger_text", "")),
        "flagged_txn_id": flagged_tid,
        "card_id": str(row.get("card_id", "")),
        "customer_id": str(row.get("customer_id", "")),
        "risk_score": float(row.get("risk_score")) if pd.notna(row.get("risk_score")) else None,
        "flagged_txn": txn,
        "case": {
            "status": "pending_investigation",
            "verdict": "pending",
            "fraud_probability": None,
            "pattern": "pending_analysis",
            "pattern_description": "Alert received and queued for investigation. Graph traversal, policy evaluation, and evidence simulation have not been executed yet.",
            "affected_txn_ids": [flagged_tid],
            "first_suspicious_txn_id": flagged_tid,
            "connected_card_ids": [],
            "connected_device_profiles": [],
            "exposure_usd": amt,
            "evidence": [],
            "similar_prior_cases": [],
            "summary": f"Incoming alert queued for autonomous investigation: {row.get('trigger_text', '')}",
            "written_to_graph": False,
            "graph_case_id": None
        },
        "evidence_requests": [],
        "next_best_actions": {
            "initial": [],
            "final": [],
            "what_changed": "Pending agent execution"
        },
        "sar": {
            "file": False,
            "reason": "Investigation pending",
            "narrative": "",
            "subjects": []
        },
        "stop_reason": "Case has not been investigated yet. Click 'Run Agent Investigation' to start.",
        "tool_calls": 0,
        "tokens": 0,
        "latency_s": 0.0
    }

@app.get("/api/cases/{case_id}/graph")
def get_case_subgraph(case_id: str):
    """
    Constructs an interactive knowledge graph network (nodes & edges)
    representing Customer, Card, Transactions, DeviceProfile, BillingRegion, Connected Cards,
    and Historical Case Precedents.
    Includes rich node preview details for interactive hover tooltips.
    """
    import pandas as pd
    df_pack = pd.read_csv(r"d:\HackerHouseGoa\data\case_pack.csv")
    match = df_pack[df_pack["case_id"] == case_id]
    if len(match) == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    row = match.iloc[0]
    cust_id = str(row["customer_id"])
    card_id = str(row["card_id"])
    flagged_tid = str(row["flagged_txn_id"])
    txn = engine.get_transaction(flagged_tid) or {}

    p = os.path.join(CASES_DIR, f"{case_id}.json")
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                case_data = json.load(f)
                c = case_data["case"]
                sar = case_data.get("sar", {})
                cid = case_data["case_id"]
        except Exception:
            c = {"verdict": "pending"}
            sar = {}
            cid = case_id
    else:
        c = {"verdict": "pending"}
        sar = {}
        cid = case_id

    nodes = []
    edges = []
    seen_nodes = set()

    def add_node(node_dict):
        if node_dict["id"] not in seen_nodes:
            seen_nodes.add(node_dict["id"])
            nodes.append(node_dict)

    # 1. Customer Node
    add_node({
        "id": cust_id,
        "label": "Customer",
        "sublabel": cust_id,
        "type": "Customer",
        "color": "#2563eb",
        "details": {
            "Customer ID": cust_id,
            "Primary Card": card_id,
            "Account Status": "Active Bank Cardholder",
            "Dispute History": "1 Report" if row.get("trigger_type") == "customer_report" else "None"
        }
    })

    # 2. Card Account Node
    card_network = str(txn.get("card4", "Bank Card")).upper()
    card_type = str(txn.get("card6", "card")).capitalize()
    add_node({
        "id": card_id,
        "label": "Card",
        "sublabel": card_id,
        "type": "Card",
        "color": "#0284c7",
        "details": {
            "Card ID": card_id,
            "Cardholder": cust_id,
            "Network": card_network,
            "Type": card_type,
            "Investigation Status": c.get("verdict", "pending").upper()
        }
    })

    # Customer OWNS Card
    edges.append({
        "source": cust_id,
        "target": card_id,
        "label": "OWNS"
    })

    # 3. Central Flagged Transaction Node
    txn_amt = float(txn.get("TransactionAmt", row.get("exposure_usd", 0.0) or 0.0))
    txn_color = "#ea580c"  # Signature warm orange as in reference Image 2
    add_node({
        "id": f"TXN_{flagged_tid}",
        "label": "Txn",
        "sublabel": f"#{flagged_tid}",
        "type": "Transaction",
        "color": txn_color,
        "flagged": True,
        "details": {
            "Transaction ID": flagged_tid,
            "Amount": f"${txn_amt:.2f} USD",
            "Channel": str(txn.get("channel", "online")).replace("_", " ").title(),
            "Timestamp": str(txn.get("ts", row.get("opened_at", "2016-12"))),
            "Risk Score": f"{float(row.get('risk_score')):.2f}" if pd.notna(row.get("risk_score")) else "Dispute Alert",
            "Role": "Primary Trigger Transaction",
            "Email Domain": str(txn.get("P_emaildomain", "N/A"))
        }
    })

    # Customer MADE Transaction
    edges.append({
        "source": cust_id,
        "target": f"TXN_{flagged_tid}",
        "label": "MADE"
    })

    # Card PAID_WITH Transaction
    edges.append({
        "source": card_id,
        "target": f"TXN_{flagged_tid}",
        "label": "PAID_WITH"
    })

    # 4. Billing Region Node
    addr1 = txn.get("addr1")
    if addr1 and pd.notna(addr1):
        region_code = str(int(float(addr1)))
        add_node({
            "id": f"REGION_{region_code}",
            "label": "Region",
            "sublabel": region_code,
            "type": "BillingRegion",
            "color": "#0d9488",
            "details": {
                "Region Code": region_code,
                "Country Code": str(txn.get("addr2", "87.0")),
                "Type": "Card Billing Postal Region"
            }
        })
        # Txn BILLED_IN Region
        edges.append({
            "source": f"TXN_{flagged_tid}",
            "target": f"REGION_{region_code}",
            "label": "BILLED_IN"
        })

    # 5. Device Profile Node
    device_prof = txn.get("device_profile")
    device_sig = c.get("connected_device_profiles", [])
    if device_prof:
        browser_info = str(device_prof.get("browser", "")).strip()
        os_info = str(device_prof.get("os", "")).strip()
        dev_sublabel = browser_info if browser_info and browser_info != "Unknown Browser" else (os_info if os_info else "Device")
        dev_id = device_prof.get("device_id", "DEV_NODE")
        add_node({
            "id": dev_id,
            "label": "Device",
            "sublabel": dev_sublabel[:14],
            "type": "DeviceProfile",
            "color": "#7c3aed",
            "details": {
                "Hardware": device_prof.get("device_info", "Hardware Signature"),
                "Operating System": os_info,
                "Browser Engine": browser_info,
                "Screen Resolution": device_prof.get("screen", "Unknown"),
                "Device Class": device_prof.get("device_type", "mobile/desktop"),
                "Status": "New Device" if device_prof.get("is_new") == "New" else "Known Profile"
            }
        })
        edges.append({
            "source": f"TXN_{flagged_tid}",
            "target": dev_id,
            "label": "FROM_DEVICE"
        })
    elif device_sig:
        dev_sublabel = device_sig[0].split('|')[0].strip() if '|' in device_sig[0] else device_sig[0][:14]
        add_node({
            "id": "DEV_NODE",
            "label": "Device",
            "sublabel": dev_sublabel[:14],
            "type": "DeviceProfile",
            "color": "#7c3aed",
            "details": {
                "Fingerprint": device_sig[0],
                "Category": "Hardware Telemetry",
                "Risk": "Observed in investigation"
            }
        })
        edges.append({
            "source": f"TXN_{flagged_tid}",
            "target": "DEV_NODE",
            "label": "FROM_DEVICE"
        })

    # 6. Additional affected transactions
    for tid in c.get("affected_txn_ids", []):
        if str(tid) != flagged_tid:
            node_id = f"TXN_{tid}"
            aff_txn = engine.get_transaction(str(tid)) or {}
            aff_amt = float(aff_txn.get("TransactionAmt", 0.0))
            add_node({
                "id": node_id,
                "label": "Txn",
                "sublabel": f"#{tid}",
                "type": "Transaction",
                "color": "#f87171",
                "flagged": False,
                "details": {
                    "Transaction ID": str(tid),
                    "Amount": f"${aff_amt:.2f} USD" if aff_amt else "Under Dispute",
                    "Channel": str(aff_txn.get("channel", "online")),
                    "Role": "Compromised Episode Transaction"
                }
            })
            edges.append({
                "source": card_id,
                "target": node_id,
                "label": "PAID_WITH"
            })

    # 7. Connected Cards
    dev_target_id = (device_prof.get("device_id", "DEV_NODE") if device_prof else "DEV_NODE")
    for cc in c.get("connected_card_ids", []):
        add_node({
            "id": cc,
            "label": "Card",
            "sublabel": cc,
            "type": "ConnectedCard",
            "color": "#ea580c",
            "details": {
                "Card ID": cc,
                "Relationship": "Shares Hardware Device Profile",
                "Risk Indicator": "Syndicate / Shared Device Ring"
            }
        })
        if dev_target_id in seen_nodes:
            edges.append({
                "source": dev_target_id,
                "target": cc,
                "label": "SHARED_DEVICE"
            })

    # 8. Historical Closed Cases / Precedents (SIMILAR_TO Txn)
    for sc in c.get("similar_prior_cases", []):
        past_case = engine.closed_cases.get(sc, {})
        past_exposure = past_case.get("exposure_usd", 0.0)
        add_node({
            "id": sc,
            "label": "Similar",
            "sublabel": sc,
            "type": "ClosedCase",
            "color": "#dc2626",
            "details": {
                "Case Precedent": sc,
                "Ground Truth Outcome": str(past_case.get("outcome", "resolved")).replace("_", " ").title(),
                "Typology": str(past_case.get("pattern", "N/A")).replace("_", " ").title(),
                "Historical Exposure": f"${past_exposure:.2f} USD",
                "Remediation Action": str(past_case.get("actions_taken", "N/A")),
                "SAR Filed": str(past_case.get("report_filed", "No"))
            }
        })
        edges.append({
            "source": f"TXN_{flagged_tid}",
            "target": sc,
            "label": "SIMILAR_TO"
        })

    # 9. Investigation Case Node (if investigated or tracking case)
    if c.get("verdict") and c.get("verdict") != "pending":
        add_node({
            "id": f"CASE_{cid}",
            "label": "Case",
            "sublabel": cid,
            "type": "InvestigationCase",
            "color": "#18181b",
            "details": {
                "Case ID": cid,
                "Verdict": c.get("verdict", "Pending").upper(),
                "Typology Pattern": str(c.get("pattern", "Pending Analysis")).replace("_", " ").title(),
                "Assessed Exposure": f"${float(c.get('exposure_usd', txn_amt)):.2f} USD",
                "SAR Required": "Yes (FinCEN SAR Generated)" if sar.get("file") else "Exempt / No",
                "Graph Writeback": "Stored in TigerGraph Memory" if c.get("written_to_graph") else "Pending Writeback"
            }
        })
        edges.append({
            "source": f"CASE_{cid}",
            "target": f"TXN_{flagged_tid}",
            "label": "VERDICT"
        })

    return {"nodes": nodes, "edges": edges}

@app.post("/api/investigate/{case_id}")
def trigger_investigation(case_id: str):
    """Triggers live agent investigation for a case."""
    import pandas as pd
    df_pack = pd.read_csv(r"d:\HackerHouseGoa\data\case_pack.csv")
    match = df_pack[df_pack["case_id"] == case_id]
    if len(match) == 0:
        raise HTTPException(status_code=404, detail="Case not found in case pack")
    case_info = match.iloc[0].to_dict()
    result = agentic_investigator.run_investigation(case_info)

    # Save to cases/
    out_path = os.path.join(CASES_DIR, f"{case_id}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    return result

@app.post("/api/cases/reset")
def reset_all_cases():
    """Resets all 20 cases back to uninvestigated pending state by deleting cached case files."""
    deleted_count = 0
    if os.path.exists(CASES_DIR):
        for f in os.listdir(CASES_DIR):
            if f.endswith(".json") and f.startswith("HHG-"):
                try:
                    os.remove(os.path.join(CASES_DIR, f))
                    deleted_count += 1
                except Exception:
                    pass
    return {"status": "success", "reset_count": deleted_count, "message": "All cases reset to pending state."}

@app.post("/api/cases/investigate-all")
def investigate_all_pending():
    """Runs agent investigation for all remaining pending cases."""
    import pandas as pd
    from agent.investigator import Investigator
    inv = Investigator()
    df_pack = pd.read_csv(r"d:\HackerHouseGoa\data\case_pack.csv")
    investigated = []
    for _, row in df_pack.iterrows():
        cid = str(row["case_id"])
        p = os.path.join(CASES_DIR, f"{cid}.json")
        if not os.path.exists(p):
            res = inv.investigate(row.to_dict())
            with open(p, "w", encoding="utf-8") as f:
                json.dump(res, f, indent=2)
            investigated.append(cid)
    return {"status": "success", "investigated_count": len(investigated), "cases": investigated}

# Serve static web frontend if built
dist_dir = r"d:\HackerHouseGoa\web\dist"
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.server:app", host="127.0.0.1", port=8000, reload=True)
