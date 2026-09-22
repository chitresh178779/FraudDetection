"""
Index DB: Populates local SQLite database from transactions.csv with high-performance B-tree indexes.
"""

import os
import sqlite3
import pandas as pd
import time

DATA_DIR = r"d:\HackerHouseGoa\data"
CSV_PATH = os.path.join(DATA_DIR, "transactions.csv")
DB_PATH = os.path.join(DATA_DIR, "fraud_graph.db")

def build_index():
    print(f"Checking {CSV_PATH}...")
    if not os.path.exists(CSV_PATH) or os.path.getsize(CSV_PATH) < 500 * 1024 * 1024:
        print("transactions.csv is still downloading or missing.")
        return False

    print(f"Building SQLite graph database at {DB_PATH}...")
    start_time = time.time()
    
    # Remove existing if incomplete
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Fast insertion settings
    cursor.execute("PRAGMA synchronous = OFF")
    cursor.execute("PRAGMA journal_mode = MEMORY")
    cursor.execute("PRAGMA cache_size = 100000")

    # Select columns most vital for graph investigation
    cols = [
        'TransactionID', 'customer_id', 'card_id', 'ts', 'channel', 'risk_score',
        'TransactionAmt', 'ProductCD', 'card1', 'card4', 'card6', 'addr1', 'addr2',
        'dist1', 'dist2', 'P_emaildomain', 'R_emaildomain'
    ]

    total_rows = 0
    chunksize = 100000
    print("Streaming transactions into SQLite database...")
    for chunk in pd.read_csv(CSV_PATH, usecols=lambda c: c in cols, chunksize=chunksize, low_memory=False):
        chunk.to_sql('transactions', conn, if_exists='append', index=False)
        total_rows += len(chunk)
        print(f"Indexed {total_rows:,} transactions...")

    print("Creating indexes on TransactionID, card_id, customer_id, ts, addr1...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_txn_id ON transactions (TransactionID)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_card_id ON transactions (card_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cust_id ON transactions (customer_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ts ON transactions (ts)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_addr1 ON transactions (addr1)")
    
    conn.commit()
    conn.close()
    
    elapsed = time.time() - start_time
    print(f"Finished indexing {total_rows:,} rows in {elapsed:.1f} seconds! Database size: {os.path.getsize(DB_PATH):,} bytes.")
    return True

if __name__ == "__main__":
    build_index()
