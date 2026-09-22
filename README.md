# 🛡️ TigerGraph Agentic Fraud Investigation System (HHGOA 2026)

An autonomous AI Agent for Fraud Investigation and Next-Best Action powered by **TigerGraph**, **GraphRAG**, and an adaptive financial policy reasoning engine.

Built for the **TigerGraph × Hacker House Goa 2026** Hackathon.

---

## 🌟 Executive Summary

Financial institutions lose billions to fraud because manual investigations are slow, fragmented, and complete only after money is already gone.

This system introduces an **autonomous investigation agent** that:
1. **Investigates Triggers**: Operates from real-time model risk scores, customer dispute reports, and analyst inquiries across 590,000 transactions and 144,000 identity records.
2. **Performs Deep Graph Traversal**: Leverages TigerGraph schema and GSQL queries to analyze temporal card windows, shared device profiles, syndicates, and geographic deviation.
3. **Retrieves Case Memory**: Searches 5,565 historical closed investigations (July – October 2016) stored in the graph to evaluate established typologies and outcomes.
4. **Adaptive Next-Best Action Progression**: Implements Bank Fraud Policy v1.0, recommending defensible actions before and after controlled evidence gathering (customer verification, step-up authentication, analyst review).
5. **Regulatory Compliance**: Generates FinCEN-compliant Suspicious Activity Reports (SAR) adhering to strict regulatory standards (Who, What, When, Where, How, and Why).
6. **Dual Graph Engine**: Connects natively to **TigerGraph Savanna** via `pyTigerGraph` and provides an instant local GraphEngine with sub-millisecond B-tree indexing.
7. **Analyst Dashboard**: An interactive React + Vite cyber-defense UI with dynamic entity subgraph visualization, evidence timeline, and before/after action comparisons.

---

## 🏗️ Architecture & Component Overview

```
                      +-------------------------------------------------+
                      |        Investigation Trigger Event             |
                      | (Risk Score Alert / Customer Report / Analyst)  |
                      +-------------------------------------------------+
                                              |
                                              v
                      +-------------------------------------------------+
                      |           TigerGraph GraphRAG Engine            |
                      |  • card_window()       • device_neighbors()     |
                      |  • region_deviation()  • find_similar_cases()   |
                      +-------------------------------------------------+
                                       |              |
                1-2 Hop Graph Context  |              | Case Memory Precedents
                                       v              v
                      +-------------------------------------------------+
                      |          Adaptive Policy Reasoner               |
                      |               (Bank Policy v1.0)                |
                      |  • Rules R1–R10        • Approval Routes        |
                      |  • Uncertainty Bounds  • Initial Recommendations|
                      +-------------------------------------------------+
                                              |
                                  Uncertainty / R1 Check
                                              v
                      +-------------------------------------------------+
                      |      Controlled Evidence Gathering Simulation   |
                      |  • Customer Validation • Step-Up Auth • Analyst |
                      +-------------------------------------------------+
                                              |
                                   Updated Context
                                              v
                      +-------------------------------------------------+
                      |          Final Decision & Actions               |
                      |  • Action Vocabulary   • Route Escalation       |
                      |  • FinCEN SAR Generator• Written to Graph Memory|
                      +-------------------------------------------------+
                                              |
                                              v
                      +-------------------------------------------------+
                      |      Interactive Analyst Investigation UI       |
                      |    (Vite + React + Force-Directed Subgraph)     |
                      +-------------------------------------------------+
```

---

## 📊 Evaluation Benchmark Results (20 Exam Cases)

The agent was evaluated across all 20 benchmark cases from `case_pack.csv`:

| Case ID | Trigger Type | Primary Flagged Txn | Card ID | Customer ID | Initial Score | Verdict | Typology Pattern | Exposure | SAR Filed |
|---|---|---|---|---|---|---|---|---|---|
| **HHG-001** | risk_score | 3514030 | C12382-K1 | C12382 | 0.61 | **FRAUD** | card_not_present_fraud | $77.07 | Exempt |
| **HHG-002** | risk_score | 3478782 | C11891-K1 | C11891 | 0.79 | **FRAUD** | card_not_present_fraud | $292.36 | Exempt |
| **HHG-003** | customer_report | 3530164 | C08623-K2 | C08623 | — | **FRAUD** | out_of_region_use | $49.00 | Exempt |
| **HHG-004** | customer_report | 3583227 | C08106-K1 | C08106 | — | **FRAUD** | undocumented | $128.33 | **Filed (R9)** |
| **HHG-005** | risk_score | 3523199 | C02923-K1 | C02923 | 0.54 | **FRAUD** | undocumented | $100.07 | **Filed (R9)** |
| **HHG-006** | customer_report | 3476682 | C07297-K1 | C07297 | — | **FRAUD** | undocumented | $482.12 | **Filed (R9)** |
| **HHG-007** | risk_score | 3514948 | C09933-K2 | C09933 | 0.87 | **FRAUD** | card_not_present_fraud | $111.92 | Exempt |
| **HHG-008** | customer_report | 3558054 | C13171-K2 | C13171 | — | **FRAUD** | undocumented | $55.68 | **Filed (R9)** |
| **HHG-009** | customer_report | 3581141 | C08299-K1 | C08299 | — | **FRAUD** | undocumented | $30.02 | **Filed (R9)** |
| **HHG-010** | risk_score | 3506725 | C10434-K1 | C10434 | 0.90 | **FRAUD** | undocumented | $1,000.03 | **Filed (R2/R9)**|
| **HHG-011** | customer_report | 3583368 | C11923-K2 | C11923 | — | **FRAUD** | card_testing | $67.91 | **Filed (R5/R6)**|
| **HHG-012** | risk_score | 3553342 | C05876-K2 | C05876 | 0.55 | **LEGITIMATE** | none | $0.00 | Exempt |
| **HHG-013** | risk_score | 3526826 | C07671-K2 | C07671 | 0.76 | **FRAUD** | undocumented | $35.66 | **Filed (R9)** |
| **HHG-014** | analyst_request | 3478561 | C13487-K1 | C13487 | — | **FRAUD** | undocumented | $74.96 | **Filed (R6/R9)**|
| **HHG-015** | risk_score | 3464869 | C03042-K1 | C03042 | 0.77 | **FRAUD** | undocumented | $599.94 | **Filed (R9)** |
| **HHG-016** | customer_report | 3534820 | C09988-K1 | C09988 | — | **FRAUD** | undocumented | $59.67 | **Filed (R9)** |
| **HHG-017** | risk_score | 3450629 | C04570-K1 | C04570 | 0.57 | **FRAUD** | undocumented | $100.09 | **Filed (R9)** |
| **HHG-018** | customer_report | 3491361 | C02354-K2 | C02354 | — | **FRAUD** | out_of_region_use | $39.08 | Exempt |
| **HHG-019** | risk_score | 3503878 | C07987-K2 | C07987 | 0.90 | **FRAUD** | undocumented | $99.92 | **Filed (R9)** |
| **HHG-020** | risk_score | 3509359 | C12265-K2 | C12265 | 0.52 | **FRAUD** | undocumented | $125.08 | **Filed (R9)** |

---

## ⚡ Quickstart & How to Run

### 1. Requirements
- Python 3.10+
- Node.js 18+

### 2. Run Investigations & Generate Answers
To run the autonomous agent across all 20 benchmark cases and output `cases/HHG-001.json` ... `cases/HHG-020.json`:
```bash
python run_investigations.py
```

### 3. Run Validation Tests
To verify all 20 case files against the competition schema:
```bash
python -m unittest discover tests
```

### 4. Launch the Interactive Dashboard
**Backend**:
```bash
python api/server.py
```
*(Runs FastAPI server at http://127.0.0.1:8000)*

**Frontend**:
```bash
cd web
npm run dev
```
*(Opens UI at http://localhost:3000)*

---

## 🔗 TigerGraph Savanna Integration

To connect to your free TigerGraph Savanna instance:
1. Create a workspace at [https://savanna.tgcloud.io](https://savanna.tgcloud.io)
2. Copy `.env.example` to `.env` and configure your Savanna credentials:
   ```env
   TG_HOST=https://your-workspace.i.tgcloud.io
   TG_USERNAME=tigergraph
   TG_PASSWORD=your_password
   TG_GRAPH_NAME=FraudGraph
   TG_SECRET=your_secret
   ```
3. The client automatically detects credentials and routes queries to your Savanna cluster!
