import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, HelpCircle, Activity, 
  Search, Play, AlertOctagon, CheckCircle, Database, RefreshCw, Cpu,
  RotateCcw, ArrowRight, CheckCircle2, AlertTriangle, FileText, User, CreditCard, DollarSign, MapPin, Smartphone, Layers
} from 'lucide-react';

import GraphCanvas from './components/GraphCanvas';
import NextBestActionTimeline from './components/NextBestActionTimeline';
import EvidenceList from './components/EvidenceList';
import SarViewer from './components/SarViewer';
import CaseMemoryCard from './components/CaseMemoryCard';

export default function App() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('HHG-001');
  const [caseDetail, setCaseDetail] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [health, setHealth] = useState(null);
  const [investigationStep, setInvestigationStep] = useState('');

  // Initial load
  useEffect(() => {
    fetchHealth();
    fetchCases();
  }, []);

  const fetchHealth = () => {
    fetch('/api/health')
      .then(res => res.json())
      .then(d => setHealth(d))
      .catch(err => console.error(err));
  };

  const fetchCases = (preferredId = null) => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        setCases(data);
        const targetId = preferredId || (data.length > 0 ? data[0].case_id : null);
        if (targetId) {
          loadCase(targetId);
        }
      })
      .catch(err => console.error(err));
  };

  const loadCase = (cid) => {
    setSelectedCaseId(cid);
    fetch(`/api/cases/${cid}`)
      .then(res => res.json())
      .then(d => setCaseDetail(d))
      .catch(err => console.error(err));

    fetch(`/api/cases/${cid}/graph`)
      .then(res => res.json())
      .then(g => setGraphData(g))
      .catch(err => console.error(err));
  };

  // Run live agent investigation for single selected case
  const handleInvestigate = () => {
    if (!selectedCaseId) return;
    setIsInvestigating(true);
    setInvestigationStep('1/4: Traversing 48h temporal card window in TigerGraph...');

    const timer1 = setTimeout(() => {
      setInvestigationStep('2/4: Checking hardware device neighbors & multi-card ring...');
    }, 600);

    const timer2 = setTimeout(() => {
      setInvestigationStep('3/4: Querying geographic deviation & case memory precedents...');
    }, 1200);

    const timer3 = setTimeout(() => {
      setInvestigationStep('4/4: Evaluating Bank Policy v1.0 rules & next-best actions...');
    }, 1800);

    fetch(`/api/investigate/${selectedCaseId}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setCaseDetail({ ...data, investigated: true });
        setIsInvestigating(false);
        setInvestigationStep('');

        // Refresh graph network
        fetch(`/api/cases/${selectedCaseId}/graph`)
          .then(res => res.json())
          .then(g => setGraphData(g));

        // Refresh cases list to update sidebar badges
        fetchCases(selectedCaseId);
      })
      .catch(err => {
        console.error(err);
        setIsInvestigating(false);
        setInvestigationStep('');
      });
  };

  // Reset all 20 cases back to uninvestigated pending state
  const handleResetAll = () => {
    if (!window.confirm("Reset all 20 benchmark alerts to uninvestigated PENDING state?")) return;
    setIsResetting(true);
    fetch('/api/cases/reset', { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setIsResetting(false);
        fetchCases(selectedCaseId || 'HHG-001');
      })
      .catch(err => {
        console.error(err);
        setIsResetting(false);
      });
  };

  // Batch run all remaining pending cases
  const handleInvestigateAll = () => {
    setIsBatchRunning(true);
    fetch('/api/cases/investigate-all', { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setIsBatchRunning(false);
        fetchCases(selectedCaseId);
      })
      .catch(err => {
        console.error(err);
        setIsBatchRunning(false);
      });
  };

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.pattern && c.pattern.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.trigger_text && c.trigger_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.card_id && c.card_id.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterTab === 'pending') return !c.investigated || c.verdict === 'pending';
    if (filterTab === 'fraud') return c.investigated && c.verdict === 'fraud';
    if (filterTab === 'legitimate') return c.investigated && c.verdict === 'legitimate';
    if (filterTab === 'sar') return c.sar_file;
    return true;
  });

  // Calculate metrics
  const totalExposure = cases.reduce((acc, cur) => acc + (cur.exposure_usd || 0), 0);
  const pendingCount = cases.filter(c => !c.investigated || c.verdict === 'pending').length;
  const fraudCount = cases.filter(c => c.investigated && c.verdict === 'fraud').length;
  const legitCount = cases.filter(c => c.investigated && c.verdict === 'legitimate').length;
  const sarCount = cases.filter(c => c.sar_file).length;

  const isCurrentInvestigated = caseDetail && caseDetail.investigated && caseDetail.case?.verdict !== 'pending';

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: '#2563eb', 
            padding: '7px', 
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #3b82f6'
          }}>
            <ShieldAlert size={20} color="#ffffff" />
          </div>
          <div>
            <div className="brand-title" style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              TigerGraph Agentic Fraud Investigation
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Autonomous GraphRAG & Next-Best Action Engine • HHGOA 2026
            </div>
          </div>
        </div>

        {/* Global Key Metrics & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', padding: '4px 10px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Alerts</div>
            <div className="mono" style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              {cases.length} Alerts
            </div>
          </div>

          <div style={{ textAlign: 'right', padding: '4px 10px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Pending</div>
            <div className="mono" style={{ fontSize: '13px', fontWeight: 700, color: pendingCount > 0 ? '#38bdf8' : '#94a3b8' }}>
              {pendingCount} Pending
            </div>
          </div>

          <div style={{ textAlign: 'right', padding: '4px 10px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Fraud / Legit</div>
            <div className="mono" style={{ fontSize: '13px', fontWeight: 700 }}>
              <span style={{ color: '#f87171' }}>{fraudCount}</span> / <span style={{ color: '#34d399' }}>{legitCount}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', padding: '4px 10px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>SARs Filed</div>
            <div className="mono" style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
              {sarCount} Filings
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '6px 12px', 
            background: '#06261e', 
            border: '1px solid #065f46', 
            borderRadius: '6px' 
          }}>
            <span className="pulsing-dot"></span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>
              {health?.tigergraph_connected ? "TigerGraph Savanna Online" : "TigerGraph GraphEngine Active"}
            </span>
          </div>

          {/* Quick Demo Control Buttons */}
          <button 
            onClick={handleResetAll}
            disabled={isResetting}
            className="btn-danger-ghost"
            title="Reset all 20 cases back to uninvestigated pending state"
          >
            <RotateCcw size={13} className={isResetting ? "spin" : ""} />
            {isResetting ? "Resetting..." : "Reset to Pending"}
          </button>

          {pendingCount > 0 && (
            <button 
              onClick={handleInvestigateAll}
              disabled={isBatchRunning}
              className="btn-secondary"
              title="Run investigation on all remaining pending alerts"
            >
              <Play size={13} className={isBatchRunning ? "spin" : ""} />
              {isBatchRunning ? "Running..." : "Run All"}
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="app-body">
        {/* Cases Sidebar */}
        <aside className="cases-sidebar">
          <div className="sidebar-header">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              <input 
                type="text"
                placeholder="Search case, trigger, card..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div className="case-filter-tabs">
              <button 
                className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All ({cases.length})
              </button>
              <button 
                className={`filter-tab ${filterTab === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterTab('pending')}
              >
                Pending ({pendingCount})
              </button>
              <button 
                className={`filter-tab ${filterTab === 'fraud' ? 'active' : ''}`}
                onClick={() => setFilterTab('fraud')}
              >
                Fraud ({fraudCount})
              </button>
              <button 
                className={`filter-tab ${filterTab === 'legitimate' ? 'active' : ''}`}
                onClick={() => setFilterTab('legitimate')}
              >
                Legit ({legitCount})
              </button>
              <button 
                className={`filter-tab ${filterTab === 'sar' ? 'active' : ''}`}
                onClick={() => setFilterTab('sar')}
              >
                SAR ({sarCount})
              </button>
            </div>
          </div>

          <div className="cases-list">
            {filteredCases.map(c => {
              const isSelected = c.case_id === selectedCaseId;
              const isPending = !c.investigated || c.verdict === 'pending';
              const isFraud = c.investigated && c.verdict === 'fraud';
              const isLegit = c.investigated && c.verdict === 'legitimate';

              // Format intuitive trigger label
              let triggerLabel = "Alert";
              if (c.trigger_type === 'customer_report') {
                triggerLabel = "Customer Dispute";
              } else if (c.trigger_type === 'analyst_request') {
                triggerLabel = "Analyst Ring Flag";
              } else if (c.risk_score) {
                triggerLabel = `Risk Score: ${c.risk_score.toFixed(2)}`;
              }

              return (
                <div 
                  key={c.case_id}
                  className={`case-card-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => loadCase(c.case_id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#a5b4fc' : '#f8fafc' }}>
                      {c.case_id}
                    </span>
                    {isPending ? (
                      <span className="badge badge-pending">PENDING</span>
                    ) : isFraud ? (
                      <span className="badge badge-fraud">FRAUD</span>
                    ) : (
                      <span className="badge badge-legit">LEGITIMATE</span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>
                    {isPending ? triggerLabel : (c.pattern ? c.pattern.replace(/_/g, ' ') : 'Legitimate')}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                    <span className="mono">
                      ${c.exposure_usd?.toFixed(2)} USD
                    </span>
                    {c.sar_file && (
                      <span className="badge badge-L2" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        SAR Filed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Workspace Main Panel */}
        <main className="workspace-main">
          {caseDetail && (
            <>
              {!isCurrentInvestigated ? (
                /* ========================================================== */
                /* UNINVESTIGATED PENDING STATE: INCOMING ALERT DOSSIER       */
                /* ========================================================== */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Alert Header Banner */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {caseDetail.case_id}
                          </h2>
                          <span className="badge badge-pending" style={{ fontSize: '12px', padding: '4px 10px' }}>
                            Awaiting Investigation
                          </span>
                          <span className="badge badge-auto" style={{ fontSize: '11px' }}>
                            {caseDetail.trigger_type === 'customer_report' ? 'Customer Report' : 
                             caseDetail.trigger_type === 'analyst_request' ? 'Analyst Request' : 'Real-Time Model Score'}
                          </span>
                        </div>

                        {/* Incoming Trigger Callout Box */}
                        <div style={{ 
                          background: '#090f1d', 
                          border: '1px solid #1e293b', 
                          borderLeft: '4px solid #3b82f6',
                          borderRadius: '6px', 
                          padding: '14px 16px', 
                          marginTop: '16px',
                          maxWidth: '850px'
                        }}>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#60a5fa', fontWeight: 800, letterSpacing: '0.05em' }}>
                            Incoming Alert Signal Trigger:
                          </div>
                          <div style={{ fontSize: '14px', color: '#f8fafc', marginTop: '6px', lineHeight: 1.5, fontStyle: 'italic' }}>
                            "{caseDetail.trigger_text || caseDetail.case?.summary}"
                          </div>
                        </div>
                      </div>

                      {/* Main Call to Action Button */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={handleInvestigate} 
                          disabled={isInvestigating}
                          className="btn-primary-large"
                          style={{ minWidth: '260px', justifyContent: 'center' }}
                        >
                          {isInvestigating ? <RefreshCw size={18} className="spin" /> : <Play size={18} fill="#ffffff" />}
                          {isInvestigating ? "Reasoning with TigerGraph..." : "Run Agent Investigation"}
                        </button>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Executes autonomous GraphRAG & policy loop
                        </span>
                      </div>
                    </div>

                    {/* Investigation Live Execution Indicator */}
                    {isInvestigating && (
                      <div style={{ 
                        marginTop: '20px', 
                        padding: '14px', 
                        background: '#0b162c', 
                        border: '1px solid #1e3a8a', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <RefreshCw size={18} className="spin" color="#60a5fa" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd' }}>
                            {investigationStep || 'Agent actively querying graph and evaluating Bank Fraud Policy v1.0...'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            Traversing vertices: Customer, Card, Transactions, DeviceProfile, and ClosedCases Memory.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Raw Flagged Transaction Dossier Grid */}
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #1e293b' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={15} color="#3b82f6" />
                        Flagged Transaction Parameters
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        <div style={{ padding: '12px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Transaction ID</div>
                          <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                            #{caseDetail.flagged_txn_id}
                          </div>
                        </div>

                        <div style={{ padding: '12px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Transaction Amount</div>
                          <div className="mono" style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                            ${caseDetail.case?.exposure_usd?.toFixed(2)} USD
                          </div>
                        </div>

                        <div style={{ padding: '12px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Channel / Type</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: caseDetail.flagged_txn?.channel === 'online' ? '#38bdf8' : '#34d399', textTransform: 'capitalize', marginTop: '4px' }}>
                            {caseDetail.flagged_txn?.channel ? caseDetail.flagged_txn.channel.replace('_', ' ') : 'Online'}
                          </div>
                        </div>

                        <div style={{ padding: '12px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Card Account</div>
                          <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#a5b4fc', marginTop: '4px' }}>
                            {caseDetail.card_id}
                          </div>
                        </div>

                        <div style={{ padding: '12px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Customer ID</div>
                          <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginTop: '4px' }}>
                            {caseDetail.customer_id}
                          </div>
                        </div>

                        <div style={{ padding: '12px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Billing Region</div>
                          <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px' }}>
                            {caseDetail.flagged_txn?.addr1 || 'Unspecified'}
                          </div>
                        </div>

                        <div style={{ padding: '12px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Model Risk Score</div>
                          <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: caseDetail.risk_score && caseDetail.risk_score > 0.7 ? '#f87171' : '#fbbf24', marginTop: '4px' }}>
                            {caseDetail.risk_score ? caseDetail.risk_score.toFixed(2) : 'Dispute Ref'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pre-Investigation Traversal Plan */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={16} color="#3b82f6" />
                      Autonomous GraphRAG Traversal Plan
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: '14px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, fontSize: '12px' }}>
                          <span>1. Temporal Card Window</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.4 }}>
                          Query ±48h window on card {caseDetail.card_id} to detect rapid sub-$5 card-testing sequences or purchase bursts.
                        </div>
                      </div>

                      <div style={{ padding: '14px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '12px' }}>
                          <span>2. Device Ring Traversal</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.4 }}>
                          Inspect device fingerprint in TigerGraph. Trace other card accounts sharing this device to uncover syndicates.
                        </div>
                      </div>

                      <div style={{ padding: '14px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '12px' }}>
                          <span>3. Geographic Deviation</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.4 }}>
                          Compute billing region deviation from cardholder home address to identify out-of-region card-present fraud.
                        </div>
                      </div>

                      <div style={{ padding: '14px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 700, fontSize: '12px' }}>
                          <span>4. Policy & FinCEN SAR</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.4 }}>
                          Evaluate Rules R1-R9, execute controlled cardholder validation, and file regulatory SAR if threshold is met.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preliminary Graph Canvas */}
                  <GraphCanvas graphData={graphData} />
                </div>
              ) : (
                /* ========================================================== */
                /* INVESTIGATED STATE: FULL COMPLETED BENCHMARK REPORT        */
                /* ========================================================== */
                <>
                  {/* Case Header Banner */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
                            {caseDetail.case_id}
                          </h2>
                          <span className={`badge ${caseDetail.case.verdict === 'fraud' ? 'badge-fraud' : 'badge-legit'}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                            {caseDetail.case.verdict}
                          </span>
                          <span className="badge badge-auto" style={{ fontSize: '11px' }}>
                            {caseDetail.case.status}
                          </span>
                          {caseDetail.sar.file && (
                            <span className="badge badge-L2" style={{ fontSize: '11px' }}>
                              SAR Required
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '8px', maxWidth: '850px', lineHeight: 1.5 }}>
                          {caseDetail.case.summary}
                        </p>
                      </div>

                      <button 
                        onClick={handleInvestigate} 
                        disabled={isInvestigating}
                        className="btn-primary"
                      >
                        {isInvestigating ? <RefreshCw size={15} className="spin" /> : <Play size={15} />}
                        {isInvestigating ? "Reasoning with Graph..." : "Live Re-Investigate"}
                      </button>
                    </div>

                    {/* Score vs Probability Comparison */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
                      <div style={{ padding: '12px 14px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Assessed Fraud Probability</div>
                        <div className="mono" style={{ fontSize: '20px', fontWeight: 800, color: caseDetail.case.fraud_probability > 0.7 ? '#f87171' : '#34d399', marginTop: '4px' }}>
                          {caseDetail.case.fraud_probability !== null ? `${(caseDetail.case.fraud_probability * 100).toFixed(0)}%` : 'Pending'}
                        </div>
                      </div>

                      <div style={{ padding: '12px 14px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Financial Exposure</div>
                        <div className="mono" style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                          ${caseDetail.case.exposure_usd?.toFixed(2)} USD
                        </div>
                      </div>

                      <div style={{ padding: '12px 14px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Typology Pattern</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#60a5fa', textTransform: 'capitalize', marginTop: '6px' }}>
                          {caseDetail.case.pattern ? caseDetail.case.pattern.replace(/_/g, ' ') : 'Legitimate'}
                        </div>
                      </div>

                      <div style={{ padding: '12px 14px', background: '#090f1d', border: '1px solid #1e293b', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Agent Execution</div>
                        <div className="mono" style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
                          {caseDetail.tool_calls} Graph Queries • {caseDetail.latency_s}s
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Graph Network Canvas */}
                  <GraphCanvas graphData={graphData} />

                  {/* Adaptive Next-Best Actions Timeline */}
                  <NextBestActionTimeline 
                    nba={caseDetail.next_best_actions}
                    evidenceRequests={caseDetail.evidence_requests}
                  />

                  {/* Supporting Evidence Drawer */}
                  <EvidenceList evidence={caseDetail.case.evidence} />

                  {/* FinCEN Suspicious Activity Report Viewer */}
                  <SarViewer sar={caseDetail.sar} caseId={caseDetail.case_id} />

                  {/* Historical Precedent Memory */}
                  <CaseMemoryCard 
                    similarCases={caseDetail.case.similar_prior_cases}
                    writtenToGraph={caseDetail.case.written_to_graph}
                    graphCaseId={caseDetail.case.graph_case_id}
                  />
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
