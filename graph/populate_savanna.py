"""
Populate TigerGraph Savanna Cloud with Ground-Truth Cases, Transactions, and Precedent Memory.
Loads customers, cards, transactions, device profiles, and closed cases into FraudGraph.
"""

import os
import sys
import time
import sqlite3
import pandas as pd
from dotenv import load_dotenv

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

import pyTigerGraph as tg

DATA_DIR = r"d:\HackerHouseGoa\data"
DB_PATH = os.path.join(DATA_DIR, "fraud_graph.db")
CASE_PACK_PATH = os.path.join(DATA_DIR, "case_pack.csv")
CLOSED_CASES_PATH = os.path.join(DATA_DIR, "closed_cases_history.csv")
IDENTITY_PATH = os.path.join(DATA_DIR, "identity.csv")

def populate_savanna(batch_size: int = 500):
    host = os.environ.get("TG_HOST")
    username = os.environ.get("TG_USERNAME", "tigergraph")
    password = os.environ.get("TG_PASSWORD")
    graph_name = os.environ.get("TG_GRAPH_NAME", "FraudGraph")
    secret = os.environ.get("TG_SECRET")

    print(f"Connecting to TigerGraph Savanna at {host}...")
    conn = tg.TigerGraphConnection(
        host=host,
        username=username,
        password=password,
        graphname=graph_name,
        gsqlSecret=secret if secret else None
    )
    if secret:
        conn.getToken(secret)
    print("Successfully authenticated with TigerGraph Savanna.")

    # ---------------------------------------------------------
    # 1. Load Device Profiles from identity.csv
    # ---------------------------------------------------------
    print("\n[1/5] Extracting and loading Device Profiles...")
    device_profiles = {}
    txn_to_device = {}
    if os.path.exists(IDENTITY_PATH):
        cols = ['TransactionID', 'DeviceInfo', 'id_30', 'id_31', 'id_33', 'id_15', 'id_23', 'DeviceType']
        df_id = pd.read_csv(IDENTITY_PATH, usecols=lambda c: c in cols, low_memory=False).fillna('Unknown')
        for _, row in df_id.iterrows():
            tid = str(row['TransactionID'])
            d_info = str(row['DeviceInfo'])
            os_ver = str(row['id_30'])
            browser = str(row['id_31'])
            screen = str(row['id_33'])
            is_new = str(row['id_15'])
            proxy = str(row['id_23'])
            dev_type = str(row['DeviceType'])
            dev_sig = f"{d_info} | {os_ver} | {browser} | {screen}"
            dev_id = f"DEV_{hash(dev_sig) & 0xffffffff:08x}"
            txn_to_device[tid] = dev_id
            if dev_id not in device_profiles:
                device_profiles[dev_id] = {
                    "device_id": dev_id,
                    "device_type": dev_type[:50],
                    "device_info": d_info[:50],
                    "os": os_ver[:50],
                    "browser": browser[:50],
                    "screen": screen[:50],
                    "is_new_device": is_new[:20],
                    "proxy_rating": proxy[:50]
                }
        
        # Batch upsert DeviceProfiles
        dev_list = list(device_profiles.values())
        print(f"Upserting {len(dev_list)} unique Device Profiles into TigerGraph...")
        for i in range(0, len(dev_list), batch_size):
            chunk = dev_list[i:i+batch_size]
            formatted = {d["device_id"]: d for d in chunk}
            conn.upsertVertices("DeviceProfile", formatted)
        print(f"Device Profiles loaded successfully.")

    # ---------------------------------------------------------
    # 2. Load Customers & Cards for Benchmark Cases
    # ---------------------------------------------------------
    print("\n[2/5] Loading Customers, Cards, and OWNS edges...")
    df_pack = pd.read_csv(CASE_PACK_PATH)
    customers = {}
    cards = {}
    owns_edges = []
    
    for _, r in df_pack.iterrows():
        cust_id = str(r['customer_id'])
        card_id = str(r['card_id'])
        customers[cust_id] = {"customer_id": cust_id}
        cards[card_id] = {
            "card_id": card_id,
            "network": "visa",
            "card_type": "debit",
            "issuer_code": 15000
        }
        owns_edges.append((cust_id, card_id, {}))

    conn.upsertVertices("Customer", customers)
    conn.upsertVertices("Card", cards)
    conn.upsertEdges("Customer", "OWNS", "Card", owns_edges)
    print(f"Loaded {len(customers)} Customers, {len(cards)} Cards, and {len(owns_edges)} OWNS edges.")

    # ---------------------------------------------------------
    # 3. Load Transactions, Window History, and MADE / FROM_DEVICE edges
    # ---------------------------------------------------------
    print("\n[3/5] Extracting relevant case transactions from local SQLite...")
    sqlite_conn = sqlite3.connect(DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()

    # Collect transactions: flagged + 48h temporal window
    all_txns = {}
    made_edges = []
    dev_edges = []
    
    for _, r in df_pack.iterrows():
        card_id = str(r['card_id'])
        flagged_tid = int(r['flagged_txn_id'])
        cursor.execute("SELECT ts FROM transactions WHERE TransactionID = ?", (flagged_tid,))
        row = cursor.fetchone()
        center_ts = row[0] if row else "2016-12-01 00:00:00"

        # Fetch window transactions (+/- 48 hours)
        cursor.execute("""
            SELECT * FROM transactions 
            WHERE card_id = ? 
              AND abs(strftime('%s', ts) - strftime('%s', ?)) <= 48 * 3600
        """, (card_id, center_ts))
        
        for t in cursor.fetchall():
            tid = str(t['TransactionID'])
            all_txns[tid] = {
                "txn_id": tid,
                "ts": str(t['ts']),
                "amt": float(t['TransactionAmt'] or 0.0),
                "product_cd": str(t['ProductCD'] or 'W'),
                "channel": str(t['channel'] or 'online'),
                "risk_score": float(t['risk_score'] or 0.0),
                "addr1": str(t['addr1'] or ''),
                "addr2": str(t['addr2'] or '87'),
                "dist1": float(t['dist1'] or 0.0),
                "dist2": float(t['dist2'] or 0.0),
                "p_emaildomain": str(t['P_emaildomain'] or ''),
                "r_emaildomain": str(t['R_emaildomain'] or '')
            }
            made_edges.append((card_id, tid, {}))
            
            # Edge to device if exists
            dev_id = txn_to_device.get(tid)
            if dev_id:
                dev_edges.append((tid, dev_id, {}))

    sqlite_conn.close()

    print(f"Upserting {len(all_txns)} case transactions to TigerGraph...")
    txn_items = list(all_txns.items())
    for i in range(0, len(txn_items), batch_size):
        chunk = dict(txn_items[i:i+batch_size])
        conn.upsertVertices("Transaction", chunk)

    conn.upsertEdges("Card", "MADE", "Transaction", made_edges)
    if dev_edges:
        conn.upsertEdges("Transaction", "FROM_DEVICE", "DeviceProfile", dev_edges)
    print(f"Loaded {len(all_txns)} Transactions, {len(made_edges)} MADE edges, and {len(dev_edges)} FROM_DEVICE edges.")

    # ---------------------------------------------------------
    # 4. Load Closed Cases History (Precedent Memory)
    # ---------------------------------------------------------
    print("\n[4/5] Loading Historical Closed Cases Memory...")
    if os.path.exists(CLOSED_CASES_PATH):
        df_closed = pd.read_csv(CLOSED_CASES_PATH, low_memory=False)
        cases_dict = {}
        for _, r in df_closed.iterrows():
            cid = str(r['case_id'])
            cases_dict[cid] = {
                "case_id": cid,
                "opened_at": str(r['opened_at']) if str(r['opened_at']) != 'nan' else "2016-07-01 00:00:00",
                "closed_at": str(r['closed_at']) if str(r['closed_at']) != 'nan' else "2016-07-02 00:00:00",
                "outcome": str(r['outcome']),
                "pattern": str(r['pattern']),
                "exposure_usd": float(r['exposure_usd'] or 0.0),
                "n_txns": int(r['n_txns'] or 1),
                "actions_taken": str(r['actions_taken'] or '')[:100],
                "report_filed": str(r['report_filed'] or 'No'),
                "analyst_notes": str(r['analyst_notes'] or '')[:200]
            }

        case_items = list(cases_dict.items())
        print(f"Upserting {len(case_items)} Closed Cases into TigerGraph...")
        for i in range(0, len(case_items), batch_size):
            chunk = dict(case_items[i:i+batch_size])
            conn.upsertVertices("ClosedCase", chunk)
        print(f"Loaded {len(cases_dict)} ClosedCase memory vertices.")

    # ---------------------------------------------------------
    # 5. Verify Final Vertex Counts in TigerGraph
    # ---------------------------------------------------------
    print("\n[5/5] Verifying TigerGraph Savanna Database State...")
    time.sleep(2)
    counts = {v: conn.getVertexCount(v) for v in conn.getVertexTypes()}
    print(f"TigerGraph Savanna live counts: {counts}")
    print("\nPopulate Complete! TigerGraph Savanna is fully operational and ready for live investigations.")

if __name__ == "__main__":
    populate_savanna()
