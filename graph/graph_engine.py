"""
Graph Engine: Local In-Memory & SQLite Graph Model mirroring TigerGraph Schema
Supports graph traversals, temporal card windows, shared device rings, region deviation,
and case memory retrieval.
"""

import os
import sqlite3
import pandas as pd
from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timedelta

DATA_DIR = r"d:\HackerHouseGoa\data"
DB_PATH = os.path.join(DATA_DIR, "fraud_graph.db")

class GraphEngine:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.db_path = DB_PATH
        self.device_profiles = {}  # device_id -> dict
        self.txn_to_device = {}    # txn_id -> device_id
        self.device_to_cards = {}   # device_id -> set(card_id)
        self.device_to_cases = {}   # device_id -> list(case_id)
        self.closed_cases = {}     # case_id -> dict
        self.investigation_cases = {} # case_id -> dict (memory)
        self._load_metadata()

    def _load_metadata(self):
        identity_path = os.path.join(DATA_DIR, "identity.csv")
        if os.path.exists(identity_path):
            print("Loading identity records into GraphEngine...")
            cols = ['TransactionID', 'DeviceInfo', 'id_30', 'id_31', 'id_33', 'id_15', 'id_23', 'DeviceType']
            df_id = pd.read_csv(identity_path, usecols=lambda c: c in cols, low_memory=False).fillna('Unknown')
            
            tids = df_id['TransactionID'].astype(str).tolist()
            d_infos = df_id['DeviceInfo'].astype(str).tolist()
            os_vers = df_id['id_30'].astype(str).tolist()
            browsers = df_id['id_31'].astype(str).tolist()
            screens = df_id['id_33'].astype(str).tolist()
            is_news = df_id['id_15'].astype(str).tolist()
            proxies = df_id['id_23'].astype(str).tolist()
            dev_types = df_id['DeviceType'].astype(str).tolist()

            for i in range(len(tids)):
                tid = tids[i]
                d_info = d_infos[i]
                os_ver = os_vers[i]
                browser = browsers[i]
                screen = screens[i]
                is_new = is_news[i]
                proxy = proxies[i]
                dev_type = dev_types[i]

                dev_sig = f"{d_info} | {os_ver} | {browser} | {screen}"
                dev_id = f"DEV_{hash(dev_sig) & 0xffffffff:08x}"

                if dev_id not in self.device_profiles:
                    self.device_profiles[dev_id] = {
                        "device_id": dev_id,
                        "device_sig": dev_sig,
                        "device_info": d_info,
                        "os": os_ver,
                        "browser": browser,
                        "screen": screen,
                        "is_new": is_new,
                        "proxy": proxy,
                        "device_type": dev_type
                    }
                self.txn_to_device[tid] = dev_id

        # Load closed cases history
        closed_path = os.path.join(DATA_DIR, "closed_cases_history.csv")
        if os.path.exists(closed_path):
            print("Loading closed cases memory into GraphEngine...")
            df_cases = pd.read_csv(closed_path, low_memory=False)
            records = df_cases.to_dict(orient='records')
            for row in records:
                cid = str(row['case_id'])
                case_obj = {
                    "case_id": cid,
                    "customer_id": str(row['customer_id']),
                    "card_id": str(row['card_id']),
                    "opened_at": str(row['opened_at']),
                    "closed_at": str(row['closed_at']),
                    "outcome": str(row['outcome']),
                    "pattern": str(row['pattern']),
                    "first_fraud_txn_id": str(row.get('first_fraud_txn_id', '')),
                    "txn_ids": [t for t in str(row.get('txn_ids', '')).split('|') if t and t != 'nan'],
                    "exposure_usd": float(row.get('exposure_usd', 0.0) or 0.0),
                    "connected_card_ids": [c for c in str(row.get('connected_card_ids', '')).split('|') if c and c != 'nan'],
                    "actions_taken": str(row.get('actions_taken', '')),
                    "report_filed": str(row.get('report_filed', 'No')),
                    "analyst_notes": str(row.get('analyst_notes', ''))
                }
                self.closed_cases[cid] = case_obj

                # Link device to cases
                for tid in case_obj["txn_ids"]:
                    dev_id = self.txn_to_device.get(tid)
                    if dev_id:
                        self.device_to_cases.setdefault(dev_id, []).append(cid)

    def get_connection(self):
        if not os.path.exists(self.db_path):
            return None
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def get_transaction(self, txn_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        if not conn:
            return None
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE TransactionID = ?", (str(txn_id),))
        row = cursor.fetchone()
        conn.close()
        if row:
            d = dict(row)
            d["device_id"] = self.txn_to_device.get(str(txn_id))
            if d["device_id"]:
                d["device_profile"] = self.device_profiles.get(d["device_id"])
            return d
        return None

    def query_card_window(self, card_id: str, center_ts: str, window_hours: int = 48) -> List[Dict[str, Any]]:
        """Finds transactions on a card within +/- window_hours of a timestamp."""
        conn = self.get_connection()
        if not conn:
            return []
        
        cursor = conn.cursor()
        query = """
            SELECT * FROM transactions 
            WHERE card_id = ? 
              AND abs(strftime('%s', ts) - strftime('%s', ?)) <= ?
            ORDER BY ts ASC
        """
        cursor.execute(query, (card_id, center_ts, window_hours * 3600))
        rows = cursor.fetchall()
        conn.close()

        results = []
        for r in rows:
            d = dict(r)
            d["device_id"] = self.txn_to_device.get(str(d["TransactionID"]))
            if d["device_id"]:
                d["device_profile"] = self.device_profiles.get(d["device_id"])
            results.append(d)
        return results

    def query_card_history(self, card_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Returns historical transactions on a card."""
        conn = self.get_connection()
        if not conn:
            return []
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE card_id = ? ORDER BY ts ASC LIMIT ?", (card_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def query_customer_cards(self, customer_id: str) -> List[str]:
        """Returns all cards owned by a customer."""
        conn = self.get_connection()
        if not conn:
            return []
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT card_id FROM transactions WHERE customer_id = ?", (customer_id,))
        rows = cursor.fetchall()
        conn.close()
        return [r["card_id"] for r in rows]

    def query_device_neighbors(self, device_id: str) -> Dict[str, Any]:
        """Finds other cards, transactions, and closed cases linked to this device profile."""
        if not device_id:
            return {"connected_cards": [], "connected_cases": [], "device_profile": None}

        dev_prof = self.device_profiles.get(device_id)
        cases = self.device_to_cases.get(device_id, [])

        # Find other transactions and cards with this device
        conn = self.get_connection()
        connected_cards = set()
        connected_txns = []

        if conn:
            # Look up txns associated with this device
            tids = [tid for tid, did in self.txn_to_device.items() if did == device_id]
            if tids:
                # Query in batches or slice if large
                sample_tids = tids[:500]
                placeholders = ','.join('?' * len(sample_tids))
                cursor = conn.cursor()
                cursor.execute(f"SELECT TransactionID, card_id, ts, TransactionAmt FROM transactions WHERE TransactionID IN ({placeholders})", sample_tids)
                for row in cursor.fetchall():
                    connected_cards.add(row["card_id"])
                    connected_txns.append(dict(row))
            conn.close()

        return {
            "device_profile": dev_prof,
            "connected_cards": list(connected_cards),
            "connected_txns": connected_txns,
            "prior_cases": cases
        }

    def query_region_deviation(self, card_id: str) -> Dict[str, int]:
        """Calculates historical frequency of billing regions for a card."""
        conn = self.get_connection()
        if not conn:
            return {}
        cursor = conn.cursor()
        cursor.execute("SELECT addr1, COUNT(*) as cnt FROM transactions WHERE card_id = ? AND addr1 IS NOT NULL GROUP BY addr1 ORDER BY cnt DESC", (card_id,))
        rows = cursor.fetchall()
        conn.close()
        return {str(r["addr1"]): r["cnt"] for r in rows}

    def find_similar_cases(self, pattern: str, target_exposure: float = 0.0, k: int = 5) -> List[Dict[str, Any]]:
        """Retrieves past cases from memory matching pattern and exposure range."""
        candidates = []
        for cid, c in self.closed_cases.items():
            if pattern == "none" or c["pattern"] == pattern:
                exp_diff = abs(c["exposure_usd"] - target_exposure)
                candidates.append((exp_diff, c))
            elif pattern == "any":
                candidates.append((abs(c["exposure_usd"] - target_exposure), c))

        candidates.sort(key=lambda x: x[0])
        return [c for _, c in candidates[:k]]

    def record_investigation_case(self, case_record: Dict[str, Any]) -> str:
        """Saves an agent-completed investigation case to graph memory."""
        cid = case_record.get("case_id")
        self.investigation_cases[cid] = case_record
        return cid
