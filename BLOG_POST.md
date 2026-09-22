# Autonomous Fraud Investigation & Next-Best Action with TigerGraph and GraphRAG

*A deep dive into building an AI-powered agentic financial crime investigator for HackerHouse Goa 2026.*

---

## 1. What We Built

Financial fraud teams operate in an asymmetric battle against syndicated crime rings. Fraud analysts face hundreds of disparate signals daily—raw transaction records, behavioral features, network telemetry, device signatures, and ambiguous risk model alerts. By the time an analyst manually queries the customer's history, checks connected accounts, reviews compliance policy, and routes an escalation, the illicit funds have already been laundered and withdrawn.

To solve this challenge, we built the **TigerGraph Agentic Fraud Investigation System**: an autonomous investigation agent that moves from uncertain fraud alerts to clear, defensible next-best actions.

The system evaluates incoming alerts, constructs localized subgraphs of entities (cards, customers, transactions, device profiles, and billing regions), simulates controlled policy-compliant evidence gathering (e.g. cardholder verification, step-up biometric authentication), and produces two-stage next-best actions with rigorous human-in-the-loop approval routing (`auto`, `L1`, `L2`).

When confirmed fraud meets institutional exposure thresholds or links to syndicated multi-card rings, the agent automatically drafts a **FinCEN-compliant Suspicious Activity Report (SAR)** narrative detailing the *Who, What, When, Where, How, and Why*.

---

## 2. Architecture & System Design

Our solution uses a layered agentic architecture combining graph algorithms, GraphRAG, and deterministic policy boundaries:

```
[ Alert Trigger ] ---> [ Graph Engine (TigerGraph / GSQL) ]
                                |
                                v
               [ GraphRAG Context Retrieval ]
                                |
                                v
             [ Stage 1: Initial Policy Assessment ]
                                |
                                v
             [ Controlled Evidence Simulation ]
                                |
                                v
             [ Stage 2: Final Next-Best Actions ]
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
   [ FinCEN SAR Generator ]             [ Graph Memory Writeback ]
             |                                     |
             +------------------+------------------+
                                |
                                v
             [ Fraud Analyst Investigation Dashboard ]
```

### Key Pillars:
1. **TigerGraph Graph Layer**: Represents high-dimensional relationships between Customers, Cards, Transactions, DeviceProfiles, and Closed Cases.
2. **GraphRAG Reasoning Engine**: Rather than overwhelming the LLM with raw tabular records, GraphRAG extracts targeted subgraphs (e.g. 48-hour card velocity, device sharing across cards, historical billing region distributions).
3. **Adaptive Policy Engine (Bank Policy v1.0)**: Enforces rules R1 through R10, ensuring that weak signals (< 0.70 probability on a single signal) require verification before blocking, while syndicated device rings (R6/R9) trigger automatic case creation, SAR filing, and monitoring of connected cards.
4. **Case Memory**: Persists every completed investigation back into the graph (`InvestigationCase` vertex) with bidirectional relationships to cards, transactions, and devices, enabling subsequent cases to cite historical precedents.

---

## 3. How TigerGraph is Used

TigerGraph powers the core intelligence of the agent through both schema design and GSQL query execution:

### The Graph Schema:
- **Vertices**:
  - `Customer`: Identified by account ID.
  - `Card`: Network, type (credit/debit), issuer code.
  - `Transaction`: Timestamp, amount, channel (`in_person` vs `online`), risk score, billing region (`addr1`, `addr2`), email domains.
  - `DeviceProfile`: Composite signature (`DeviceInfo | OS | Browser | Screen`) with proxy and new device flags.
  - `ClosedCase`: Historical investigations from July – October 2016.
  - `InvestigationCase`: Newly formed cases written by the agent.
- **Edges**:
  - `OWNS` (`Customer` → `Card`)
  - `MADE` (`Card` → `Transaction`)
  - `FROM_DEVICE` (`Transaction` → `DeviceProfile`)
  - `BILLED_IN` (`Transaction` → `BillingRegion`)
  - `NEXT` (`Transaction` → `Transaction`, temporal order)
  - `INVOLVES`, `ON_CARD`, `CONNECTED_TO` (Case memory links)

### GSQL Queries & Graph Algorithms:
1. `card_window`: Rapid temporal traversal retrieving transactions within +/- 48 hours to uncover rapid card testing bursts (three sub-$5 authorizations followed by larger purchases).
2. `device_neighbors`: Multi-hop traversal starting from a transaction's device signature to discover other cards or customers sharing the exact same hardware footprint, instantly exposing multi-card syndicates.
3. `region_deviation`: Aggregates historical card-present billing regions (`addr1`) to distinguish legitimate domestic use, out-of-region card cloning, or cardholder travel.
4. `find_similar_cases`: Graph vector & attribute similarity search retrieving past closed cases matching the observed typology and exposure range.

---

## 4. Agentic Capabilities Implemented

- **Autonomous Uncertainty Management**: The agent quantifies uncertainty between initial trigger receipt and post-evidence decisioning. Under Rule R1, if probability is below 0.70 on an isolated signal, the agent avoids catastrophic false-positive card blocking, instead scheduling `VERIFY_WITH_CUSTOMER` or `STEP_UP_AUTH`.
- **Two-Stage Action Evolution**: Every case answer documents what the bank should do *before* evidence arrives versus *after* evidence is received, accompanied by an explicit `what_changed` explanation.
- **Controlled Evidence Gathering**: Simulates cardholder verification inquiries and step-up authentication challenges, recording assumptions within `evidence_requests`.
- **Automated Regulatory Filings**: When exposure exceeds $1,000 or activity connects across cards/devices, the agent automatically authors a complete FinCEN SAR narrative following regulatory narrative standards.
- **Real-Time Analyst Dashboard**: Built with Vite and React, featuring an interactive HTML5 force-directed graph canvas, live case re-investigation triggers, and side-by-side action comparisons.

---

## 5. What We Learned

1. **Graph Structures Outperform Tabular Feature Stores in Fraud Detection**: Tabular models struggle to detect distributed attacks where individual transaction amounts and velocities look normal. Linking devices, billing regions, and cards across accounts immediately unmasks organized rings that simple risk scores miss.
2. **Risk Scores are Inputs, Not Answers**: Half of the high-risk score alerts in financial data are benign cardholder anomalies (e.g. vacations, phone upgrades). Rigid rule systems create customer friction, whereas agentic GraphRAG evaluates context before acting.
3. **Graph Memory Creates Compounding Accuracy**: Writing closed investigation findings back to the graph converts today's investigation into tomorrow's instant retrieval anchor.

---

## 6. What We Would Improve with More Time

- **Graph Neural Network (GNN) Embeddings**: Train GNN node embeddings directly in TigerGraph (using TigerGraph ML Workbench) to detect subtle ring topology structures before rule alerts fire.
- **Real-Time Streaming GSQL via Kafka**: Ingest live card authorizations into TigerGraph and trigger sub-second agent intervention before authorization responses return to merchants.
- **Multi-Agent Debate Protocol**: Deploy specialized subagents (e.g. a Customer Experience Advocate Agent vs a Compliance Officer Agent) to debate edge cases before escalating to human managers.

---

*Built with ❤️ for HackerHouse Goa 2026. Powered by TigerGraph.*
