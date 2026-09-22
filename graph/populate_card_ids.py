"""
Populate card_id in SQLite database and build required B-tree indexes.
Ensures 100% consistency with case_pack.csv and closed_cases_history.csv.
"""

import sqlite3
import pandas as pd
import time
import os

DB_PATH = r"d:\HackerHouseGoa\data\fraud_graph.db"
CASE_PACK_PATH = r"d:\HackerHouseGoa\data\case_pack.csv"
CLOSED_CASES_PATH = r"d:\HackerHouseGoa\data\closed_cases_history.csv"

def populate():
    print("Connecting to SQLite database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if card_id column exists
    cursor.execute("PRAGMA table_info(transactions)")
    cols = [r[1] for r in cursor.fetchall()]
    if "card_id" not in cols:
        print("Adding column card_id to transactions table...")
        cursor.execute("ALTER TABLE transactions ADD COLUMN card_id TEXT")
        conn.commit()

    # Build known mappings: (customer_id, card1) -> card_id
    card_map = {} # (customer_id, card1) -> card_id

    # 1. From case_pack.csv
    df_pack = pd.read_csv(CASE_PACK_PATH)
    for _, r in df_pack.iterrows():
        cid = str(r['customer_id'])
        card_id = str(r['card_id'])
        flagged_tid = int(r['flagged_txn_id'])
        cursor.execute("SELECT card1 FROM transactions WHERE TransactionID = ?", (flagged_tid,))
        row = cursor.fetchone()
        if row and row[0]:
            card_map[(cid, row[0])] = card_id

    # 2. From closed_cases_history.csv
    df_closed = pd.read_csv(CLOSED_CASES_PATH)
    for _, r in df_closed.iterrows():
        cid = str(r['customer_id'])
        card_id = str(r['card_id'])
        txns = [t for t in str(r.get('txn_ids', '')).split('|') if t and t != 'nan']
        if txns:
            try:
                first_tid = int(txns[0])
                cursor.execute("SELECT card1 FROM transactions WHERE TransactionID = ?", (first_tid,))
                row = cursor.fetchone()
                if row and row[0]:
                    card_map[(cid, row[0])] = card_id
            except:
                pass

    print(f"Mapped {len(card_map)} unique (customer_id, card1) pairs from ground-truth cases.")

    # 3. For any remaining (customer_id, card1), assign K1, K2 sequentially
    print("Mapping remaining customer cards...")
    cursor.execute("SELECT DISTINCT customer_id, card1 FROM transactions WHERE customer_id IS NOT NULL")
    all_pairs = cursor.fetchall()
    
    cust_to_cards = {}
    for cid, card1 in all_pairs:
        if (cid, card1) in card_map:
            cust_to_cards.setdefault(cid, set()).add(card_map[(cid, card1)])

    for cid, card1 in all_pairs:
        if (cid, card1) not in card_map:
            existing = cust_to_cards.setdefault(cid, set())
            idx = 1
            while f"{cid}-K{idx}" in existing:
                idx += 1
            assigned = f"{cid}-K{idx}"
            existing.add(assigned)
            card_map[(cid, card1)] = assigned

    print(f"Total mapped card pairs: {len(card_map):,}. Updating transactions table...")
    start_time = time.time()
    
    # Fast bulk update using temporary mapping table
    cursor.execute("CREATE TEMP TABLE temp_card_map (customer_id TEXT, card1 INTEGER, card_id TEXT, PRIMARY KEY (customer_id, card1))")
    cursor.executemany("INSERT INTO temp_card_map VALUES (?, ?, ?)", [(k[0], k[1], v) for k, v in card_map.items()])
    
    cursor.execute("""
        UPDATE transactions
        SET card_id = (
            SELECT card_id FROM temp_card_map
            WHERE temp_card_map.customer_id = transactions.customer_id
              AND temp_card_map.card1 = transactions.card1
        )
    """)
    conn.commit()
    print(f"Updated card_id in {time.time() - start_time:.1f}s.")

    print("Building high-speed B-tree indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_txn_id ON transactions (TransactionID)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_card_id ON transactions (card_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cust_id ON transactions (customer_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ts ON transactions (ts)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_addr1 ON transactions (addr1)")
    conn.commit()
    conn.close()
    print("Database indexing complete and ready for instant querying!")

if __name__ == "__main__":
    populate()
