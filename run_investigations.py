"""
Batch Runner: Executes Fraud Investigation Agent across all 20 benchmark cases in case_pack.csv.
Outputs 20 JSON files into cases/ adhering strictly to the competition Answer Format.
"""

import os
import json
import time
import pandas as pd
from agent.investigator import Investigator

CASES_DIR = r"d:\HackerHouseGoa\cases"
CASE_PACK_PATH = r"d:\HackerHouseGoa\data\case_pack.csv"

def run_all_cases():
    os.makedirs(CASES_DIR, exist_ok=True)
    df_pack = pd.read_csv(CASE_PACK_PATH)
    total_cases = len(df_pack)
    print(f"Loaded {total_cases} benchmark cases from {CASE_PACK_PATH}.")

    investigator = Investigator()
    results = []

    start_all = time.time()
    for idx, row in df_pack.iterrows():
        case_info = row.to_dict()
        cid = case_info["case_id"]
        print(f"\n[{idx+1}/{total_cases}] Investigating {cid} (Trigger: {case_info.get('trigger_type')})...")
        
        t0 = time.time()
        ans = investigator.investigate(case_info)
        t_elapsed = time.time() - t0

        out_path = os.path.join(CASES_DIR, f"{cid}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(ans, f, indent=2)

        verdict = ans["case"]["verdict"]
        pattern = ans["case"]["pattern"]
        exposure = ans["case"]["exposure_usd"]
        sar_filed = ans["sar"]["file"]
        print(f"  -> Verdict: {verdict.upper()} | Pattern: {pattern} | Exposure: ${exposure:.2f} | SAR: {sar_filed} | Latency: {t_elapsed:.2f}s")
        results.append(ans)

    total_time = time.time() - start_all
    print(f"\nAll {total_cases} cases successfully investigated and written to {CASES_DIR} in {total_time:.2f} seconds!")
    return results

if __name__ == "__main__":
    run_all_cases()
