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
    Constructs an interactive graph network (nodes & edges)
    representing Customer, Card, Transactions, DeviceProfile, BillingRegion, and ClosedCases.
    Supports preview graph when pending.
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

    p = os.path.join(CASES_DIR, f"{case_id}.json")
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                case_data = json.load(f)
                c = case_data["case"]
                cid = case_data["case_id"]
        except Exception:
            c = {"verdict": "pending"}
            cid = case_id
    else:
        c = {"verdict": "pending"}
        cid = case_id

    nodes = []
    edges = []

    # Node: Customer
    nodes.append({
        "id": cust_id,
        "label": cust_id,
        "type": "Customer",
        "color": "#38bdf8"
    })

    # Node: Card
    nodes.append({
        "id": card_id,
        "label": card_id,
        "type": "Card",
        "color": "#818cf8"
    })
    edges.append({
        "source": cust_id,
        "target": card_id,
        "label": "OWNS"
    })

    # Node: Flagged Transaction
    txn_color = "#f43f5e" if c.get("verdict") == "fraud" else ("#10b981" if c.get("verdict") == "legitimate" else "#f59e0b")
    nodes.append({
        "id": f"TXN_{flagged_tid}",
        "label": f"Txn #{flagged_tid}",
        "type": "Transaction",
        "color": txn_color,
        "flagged": True
    })
    edges.append({
        "source": card_id,
        "target": f"TXN_{flagged_tid}",
        "label": "MADE"
    })

    # Additional affected transactions
    for tid in c.get("affected_txn_ids", []):
        if str(tid) != flagged_tid:
            node_id = f"TXN_{tid}"
            nodes.append({
                "id": node_id,
                "label": f"Txn #{tid}",
                "type": "Transaction",
                "color": "#fb7185",
                "flagged": False
            })
            edges.append({
                "source": card_id,
                "target": node_id,
                "label": "MADE"
            })

    # Device Profile Node
    device_sig = c.get("connected_device_profiles", [])
    if device_sig:
        dev_label = device_sig[0][:25] + "..." if len(device_sig[0]) > 25 else device_sig[0]
        nodes.append({
            "id": "DEV_NODE",
            "label": dev_label,
            "type": "DeviceProfile",
            "color": "#fbbf24",
            "full_sig": device_sig[0]
        })
        edges.append({
            "source": f"TXN_{flagged_tid}",
            "target": "DEV_NODE",
            "label": "FROM_DEVICE"
        })

    # Connected Cards
    for cc in c.get("connected_card_ids", []):
        nodes.append({
            "id": cc,
            "label": cc,
            "type": "ConnectedCard",
            "color": "#f97316"
        })
        if device_sig:
            edges.append({
                "source": "DEV_NODE",
                "target": cc,
                "label": "SHARED_BY"
            })

    # Historical Closed Cases
    for sc in c.get("similar_prior_cases", []):
        nodes.append({
            "id": sc,
            "label": sc,
            "type": "ClosedCase",
            "color": "#c084fc"
        })
        edges.append({
            "source": card_id,
            "target": sc,
            "label": "SIMILAR_PRECEDENT"
        })

    # Current Investigation Case Node
    nodes.append({
        "id": f"CASE_{cid}",
        "label": cid,
        "type": "InvestigationCase",
        "color": "#a855f7"
    })
    edges.append({
        "source": f"CASE_{cid}",
        "target": card_id,
        "label": "INVESTIGATES"
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
