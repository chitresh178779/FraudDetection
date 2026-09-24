import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, HelpCircle, Activity, 
  Search, Play, AlertOctagon, CheckCircle, Database, RefreshCw, Cpu,
  RotateCcw, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, FileText, 
  User, CreditCard, DollarSign, MapPin, Smartphone, Layers, Sparkles,
  ChevronLeft, ChevronRight, CornerDownLeft, Eye, Clock, Shield, SlidersHorizontal
} from 'lucide-react';

import GraphCanvas from './components/GraphCanvas';
import NextBestActionTimeline from './components/NextBestActionTimeline';
import EvidenceList from './components/EvidenceList';
import SarViewer from './components/SarViewer';
import CaseMemoryCard from './components/CaseMemoryCard';
import InvestigationExecutionChain from './components/InvestigationExecutionChain';

export default function App() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
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

  // Keyboard shortcut: Esc to return to list view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && viewMode === 'detail') {
        setViewMode('list');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

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
        if (preferredId) {
          loadCase(preferredId, false);
        }
      })
      .catch(err => console.error(err));
  };

  const loadCase = (cid, openView = true) => {
    setSelectedCaseId(cid);
    if (openView) {
      setViewMode('detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    fetch(`/api/cases/${cid}`)
      .then(res => res.json())
      .then(d => setCaseDetail(d))
      .catch(err => console.error(err));

    fetch(`/api/cases/${cid}/graph`)
      .then(res => res.json())
      .then(g => setGraphData(g))
      .catch(err => console.error(err));
  };

  const openTransactionDetail = (cid) => {
    loadCase(cid, true);
  };

  const backToTransactionList = () => {
    setViewMode('list');
    fetchCases();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to Prev / Next case while in Detail view
  const navigateCase = (direction) => {
    const currentList = filteredCases.length > 0 ? filteredCases : cases;
    const currentIndex = currentList.findIndex(c => c.case_id === selectedCaseId);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex + direction;
    if (targetIndex < 0) targetIndex = currentList.length - 1;
    if (targetIndex >= currentList.length) targetIndex = 0;

    loadCase(currentList[targetIndex].case_id, true);
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

        // Refresh cases list
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
        fetchCases();
        if (selectedCaseId) {
          loadCase(selectedCaseId, false);
        }
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
        if (selectedCaseId) {
          loadCase(selectedCaseId, false);
        }
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
                          (c.card_id && c.card_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.flagged_txn_id && c.flagged_txn_id.toLowerCase().includes(searchQuery.toLowerCase()));
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
      {/* Sticky Structured Navigation Bar */}
      <header className="app-header">
        {/* Brand Identity */}
        <div 
          onClick={backToTransactionList}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          title="Return to All Transactions"
        >
          <div style={{ 
            background: '#0F172A', 
            padding: '9px', 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)'
          }}>
            <ShieldAlert size={20} color="#FFFFFF" />
          </div>
          <div>
            <div className="brand-title" style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Runway Fraud & Incident Response
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
              Autonomous TigerGraph GraphRAG & Policy Engine • Production Systems
            </div>
          </div>
        </div>

        {/* Global Key Metrics & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Metrics Cluster */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#F8FAFC',
            padding: '4px 6px',
            borderRadius: '10px',
            border: '1.5px solid var(--border-subtle)'
          }}>
            <div style={{ padding: '4px 10px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>Total</span>
              <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginLeft: '6px' }}>
                {cases.length}
              </span>
            </div>

            <div style={{ padding: '4px 10px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>Pending</span>
              <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: pendingCount > 0 ? '#2563EB' : '#64748B', marginLeft: '6px' }}>
                {pendingCount}
              </span>
            </div>

            <div style={{ padding: '4px 10px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>Fraud / Legit</span>
              <span className="mono" style={{ fontSize: '12px', fontWeight: 800, marginLeft: '6px' }}>
                <span style={{ color: '#DC2626' }}>{fraudCount}</span> / <span style={{ color: '#15803D' }}>{legitCount}</span>
              </span>
            </div>

            <div style={{ padding: '4px 10px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>SARs</span>
              <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: '#D97706', marginLeft: '6px' }}>
                {sarCount}
              </span>
            </div>
          </div>

          {/* Engine Status Indicator */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '7px 14px', 
            background: '#F0FDF4', 
            border: '1.5px solid #86EFAC', 
            borderRadius: '9px' 
          }}>
            <span className="pulsing-dot"></span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803D' }}>
              {health?.tigergraph_connected ? "TigerGraph Savanna Online" : "TigerGraph GraphEngine Active"}
            </span>
          </div>

          {/* Global Buttons */}
          <button 
            onClick={handleResetAll}
            disabled={isResetting}
            className="btn-danger-ghost"
            title="Reset all 20 cases back to uninvestigated pending state"
          >
            <RotateCcw size={13} className={isResetting ? "spin" : ""} />
            {isResetting ? "Resetting..." : "Reset"}
          </button>

          {pendingCount > 0 && (
            <button 
              onClick={handleInvestigateAll}
              disabled={isBatchRunning}
              className="btn-primary"
              title="Run investigation on all remaining pending alerts"
            >
              <Play size={13} className={isBatchRunning ? "spin" : ""} />
              {isBatchRunning ? "Running..." : "Run All"}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="app-body">
        {viewMode === 'list' ? (
          /* ================================================================ */
          /* MAIN FLOW VIEW: SEQUENTIAL RECTANGULAR CARDS IN CENTER           */
          /* ================================================================ */
          <div className="main-content-flow">
            {/* Hero Banner Header */}
            <div className="glass-panel" style={{ padding: '34px 38px' }}>
              <div style={{ maxWidth: '820px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="badge badge-auto" style={{ fontWeight: 800 }}>Benchmark Exam Pack</span>
                  <span className="badge badge-pending" style={{ fontWeight: 700 }}>20 Production Cases</span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                    IEEE-CIS Real-Time Financial Stream
                  </span>
                </div>

                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                  Test Transactions & Autonomous Investigations
                </h1>
                <p style={{ fontSize: '14px', color: '#475569', marginTop: '10px', lineHeight: 1.6, fontWeight: 500 }}>
                  Each rectangular card below represents a flagged test transaction requiring verification. 
                  Click on any transaction to open its dedicated investigation workspace, featuring the interactive 
                  TigerGraph knowledge subgraph, autonomous execution chain, and regulatory SAR reporting.
                </p>
              </div>

              {/* Filter and Search Bar */}
              <div style={{ 
                marginTop: '26px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '16px', 
                paddingTop: '22px', 
                borderTop: '1.5px solid var(--border-subtle)' 
              }}>
                {/* Search Input */}
                <div style={{ position: 'relative', width: '380px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: '#64748B' }} />
                  <input 
                    type="text"
                    placeholder="Search by case ID, transaction ID, card, customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      background: '#FFFFFF',
                      border: '1.5px solid var(--border-card)',
                      borderRadius: '10px',
                      color: '#0F172A',
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  />
                </div>

                {/* Filter Tabs */}
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
                    Confirmed Fraud ({fraudCount})
                  </button>
                  <button 
                    className={`filter-tab ${filterTab === 'legitimate' ? 'active' : ''}`}
                    onClick={() => setFilterTab('legitimate')}
                  >
                    Legitimate ({legitCount})
                  </button>
                  <button 
                    className={`filter-tab ${filterTab === 'sar' ? 'active' : ''}`}
                    onClick={() => setFilterTab('sar')}
                  >
                    SARs ({sarCount})
                  </button>
                </div>
              </div>
            </div>

            {/* List of Rectangular Cards Placed One by One */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredCases.map(c => {
                const isPending = !c.investigated || c.verdict === 'pending';
                const isFraud = c.investigated && c.verdict === 'fraud';
                const isLegit = c.investigated && c.verdict === 'legitimate';
                const statusClass = isFraud ? 'status-fraud' : (isLegit ? 'status-legit' : 'status-pending');

                let triggerLabel = "Alert Signal";
                if (c.trigger_type === 'customer_report') {
                  triggerLabel = "Customer Dispute";
                } else if (c.trigger_type === 'analyst_request') {
                  triggerLabel = "Analyst Syndicate Ring Flag";
                } else if (c.risk_score) {
                  triggerLabel = `Risk Score: ${c.risk_score.toFixed(2)}`;
                }

                return (
                  <div 
                    key={c.case_id}
                    className={`transaction-card ${statusClass}`}
                    onClick={() => openTransactionDetail(c.case_id)}
                  >
                    {/* Top Row: Case ID, Status Badge, Trigger, Exposure */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="mono" style={{ 
                          fontSize: '14px', 
                          fontWeight: 800, 
                          color: '#0F172A',
                          background: '#F1F5F9',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1'
                        }}>
                          {c.case_id}
                        </span>

                        <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                          Txn #{c.flagged_txn_id}
                        </span>

                        {isPending ? (
                          <span className="badge badge-pending">PENDING INVESTIGATION</span>
                        ) : isFraud ? (
                          <span className="badge badge-fraud">CONFIRMED FRAUD</span>
                        ) : (
                          <span className="badge badge-legit">CLEARED LEGITIMATE</span>
                        )}

                        <span className="badge badge-auto">
                          {triggerLabel}
                        </span>

                        {c.sar_file && (
                          <span className="badge badge-L2">
                            FinCEN SAR Required
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>Exposure</span>
                        <div className="mono" style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                          ${c.exposure_usd?.toFixed(2)} USD
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Parameter Grid */}
                    <div className="param-grid">
                      <div className="param-item">
                        <span className="param-label">Transaction ID</span>
                        <span className="param-value mono">#{c.flagged_txn_id}</span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Amount</span>
                        <span className="param-value mono">${c.exposure_usd?.toFixed(2)}</span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Card Account</span>
                        <span className="param-value mono">{c.card_id}</span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Customer ID</span>
                        <span className="param-value mono">{c.customer_id}</span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Detection Score</span>
                        <span className="param-value mono" style={{ color: c.risk_score && c.risk_score > 0.7 ? '#DC2626' : '#0F172A' }}>
                          {c.risk_score ? c.risk_score.toFixed(2) : 'Dispute Ref'}
                        </span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Typology Pattern</span>
                        <span className="param-value" style={{ textTransform: 'capitalize', color: isFraud ? '#DC2626' : (isLegit ? '#15803D' : '#64748B') }}>
                          {isPending ? 'Pending Graph Analysis' : (c.pattern ? c.pattern.replace(/_/g, ' ') : 'Legitimate')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Trigger Quote & CTA Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderTop: '1.5px solid var(--border-subtle)', paddingTop: '14px' }}>
                      <div style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', fontWeight: 500, flex: 1 }}>
                        "{c.trigger_text || c.summary}"
                      </div>

                      <button 
                        className="btn-secondary"
                        style={{ padding: '7px 16px', fontSize: '12px' }}
                      >
                        <span>Open Complete Investigation</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* TRANSACTION DETAIL PAGE: COMPLETE DEDICATED WORKSPACE FOR ALERT  */
          /* ================================================================ */
          <div className="main-content-flow">
            {caseDetail && (
              <>
                {/* Navigation Action Bar: Back Button, Breadcrumb & Prev/Next */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                  <button 
                    onClick={backToTransactionList}
                    className="btn-secondary"
                    style={{ padding: '9px 18px', fontSize: '13px' }}
                  >
                    <ArrowLeft size={15} />
                    <span>Back to All Transactions</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '4px' }}>(Esc)</span>
                  </button>

                  {/* Breadcrumb info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                    <span style={{ cursor: 'pointer' }} onClick={backToTransactionList}>Transactions</span>
                    <span>/</span>
                    <span className="mono" style={{ fontWeight: 800, color: '#0F172A' }}>{caseDetail.case_id}</span>
                    <span>/</span>
                    <span className="mono" style={{ color: '#334155' }}>Txn #{caseDetail.flagged_txn_id}</span>
                  </div>

                  {/* Prev / Next Alert Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => navigateCase(-1)}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                      title="Previous Transaction Alert"
                    >
                      <ChevronLeft size={14} />
                      <span>Prev</span>
                    </button>
                    <button 
                      onClick={() => navigateCase(1)}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                      title="Next Transaction Alert"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Case Dossier Hero Banner */}
                <div className="glass-panel" style={{ padding: '32px 36px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ maxWidth: '800px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span className="mono" style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                          {caseDetail.case_id}
                        </span>

                        {!isCurrentInvestigated ? (
                          <span className="badge badge-pending">Awaiting Investigation</span>
                        ) : caseDetail.case?.verdict === 'fraud' ? (
                          <span className="badge badge-fraud">Confirmed Fraud</span>
                        ) : (
                          <span className="badge badge-legit">Cleared Legitimate</span>
                        )}

                        <span className="badge badge-auto">
                          {caseDetail.trigger_type === 'customer_report' ? 'Customer Report' : 
                           caseDetail.trigger_type === 'analyst_request' ? 'Analyst Syndicate Request' : 'Real-Time Model Score'}
                        </span>

                        {caseDetail.sar?.file && (
                          <span className="badge badge-L2">FinCEN SAR Required</span>
                        )}
                      </div>

                      <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                        {isCurrentInvestigated 
                          ? (caseDetail.case?.pattern ? caseDetail.case.pattern.replace(/_/g, ' ') : 'Legitimate Cardholder Activity')
                          : 'Real-Time Fraud Detection & Incident Response'}
                      </h2>

                      <p style={{ fontSize: '14px', color: '#475569', marginTop: '8px', lineHeight: 1.6, fontWeight: 500 }}>
                        {isCurrentInvestigated ? caseDetail.case?.summary : 'Automated investigation workflow powered by TigerGraph GraphRAG, temporal card windows, shared device rings, and Bank Policy v1.0.'}
                      </p>

                      {/* Incoming Trigger Callout Box */}
                      <div style={{ 
                        background: '#F8FAFC', 
                        border: '1.5px solid var(--border-subtle)', 
                        borderLeft: '4px solid #0F172A',
                        borderRadius: '10px', 
                        padding: '16px 20px', 
                        marginTop: '18px'
                      }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 800, letterSpacing: '0.05em' }}>
                          Incoming Alert Trigger Signal
                        </div>
                        <div style={{ fontSize: '14px', color: '#0F172A', marginTop: '4px', lineHeight: 1.5, fontStyle: 'italic', fontWeight: 600 }}>
                          "{caseDetail.trigger_text || caseDetail.case?.summary}"
                        </div>
                      </div>
                    </div>

                    {/* Investigation Action Button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '240px' }}>
                      <button 
                        onClick={handleInvestigate} 
                        disabled={isInvestigating}
                        className="btn-primary-large"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {isInvestigating ? <RefreshCw size={16} className="spin" /> : <Play size={16} fill="#ffffff" />}
                        {isInvestigating ? "Reasoning with Graph..." : (isCurrentInvestigated ? "Re-Investigate Case" : "Run Agent Investigation")}
                      </button>
                      <span style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', width: '100%', fontWeight: 600 }}>
                        Graph traversal, evidence gathering & policy rules
                      </span>
                    </div>
                  </div>

                  {/* Live Execution Progress Bar */}
                  {isInvestigating && (
                    <div style={{ 
                      marginTop: '20px', 
                      padding: '14px 18px', 
                      background: '#EFF6FF', 
                      border: '1.5px solid #93C5FD', 
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <RefreshCw size={18} className="spin" color="#1D4ED8" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF' }}>
                          {investigationStep || 'Agent actively querying graph and evaluating Bank Fraud Policy v1.0...'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '2px', fontWeight: 600 }}>
                          Traversing Customer, Card, DeviceProfile, and Historical Case Precedents.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Flagged Transaction Parameters Grid */}
                  <div style={{ marginTop: '26px', paddingTop: '22px', borderTop: '1.5px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={14} color="#0F172A" />
                      Flagged Transaction Parameters
                    </div>

                    <div className="param-grid">
                      <div className="param-item">
                        <span className="param-label">Transaction ID</span>
                        <span className="param-value mono">#{caseDetail.flagged_txn_id}</span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Amount</span>
                        <span className="param-value mono">${caseDetail.case?.exposure_usd?.toFixed(2)} USD</span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Channel</span>
                        <span className="param-value" style={{ textTransform: 'capitalize', color: caseDetail.flagged_txn?.channel === 'online' ? '#0284C7' : '#15803D' }}>
                          {caseDetail.flagged_txn?.channel ? caseDetail.flagged_txn.channel.replace('_', ' ') : 'Online'}
                        </span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Card Account</span>
                        <span className="param-value mono">{caseDetail.card_id}</span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Customer ID</span>
                        <span className="param-value mono">{caseDetail.customer_id}</span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Billing Region</span>
                        <span className="param-value mono">{caseDetail.flagged_txn?.addr1 || 'Unspecified'}</span>
                      </div>

                      <div className="param-item">
                        <span className="param-label">Model Risk Score</span>
                        <span className="param-value mono" style={{ color: caseDetail.risk_score && caseDetail.risk_score > 0.7 ? '#DC2626' : '#0F172A' }}>
                          {caseDetail.risk_score ? caseDetail.risk_score.toFixed(2) : 'Dispute Ref'}
                        </span>
                      </div>

                      {isCurrentInvestigated && (
                        <div className="param-item">
                          <span className="param-label">Assessed Probability</span>
                          <span className="param-value mono" style={{ color: caseDetail.case?.fraud_probability > 0.7 ? '#DC2626' : '#15803D' }}>
                            {(caseDetail.case?.fraud_probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* INVESTIGATION EXECUTION CHAIN: PROGRESSION THROUGH ENTITIES    */}
                {/* ============================================================== */}
                <InvestigationExecutionChain 
                  caseDetail={caseDetail} 
                  isInvestigating={isInvestigating} 
                />

                {/* ============================================================== */}
                {/* INTERACTIVE KNOWLEDGE SUBGRAPH: ALWAYS ACTIVE & PERSISTENT    */}
                {/* ============================================================== */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', margin: 0 }}>
                        Investigation Knowledge Subgraph
                      </h3>
                      <span className="badge badge-auto" style={{ fontWeight: 800 }}>TigerGraph Interactive Canvas</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                      Hover over any node to preview details • Drag nodes or use zoom controls (+/-)
                    </span>
                  </div>

                  {/* Interactive Subgraph Canvas */}
                  <GraphCanvas graphData={graphData} />
                </div>

                {/* Post-Investigation Dossier Sections */}
                {isCurrentInvestigated ? (
                  <>
                    {/* Adaptive Next-Best Actions Timeline */}
                    <NextBestActionTimeline 
                      nba={caseDetail.next_best_actions}
                      evidenceRequests={caseDetail.evidence_requests}
                    />

                    {/* Supporting Evidence Drawer */}
                    <EvidenceList evidence={caseDetail.case?.evidence} />

                    {/* FinCEN Suspicious Activity Report (SAR) */}
                    <SarViewer sar={caseDetail.sar} caseId={caseDetail.case_id} />

                    {/* Historical Precedent Case Memory */}
                    <CaseMemoryCard 
                      similarCases={caseDetail.case?.similar_prior_cases}
                      writtenToGraph={caseDetail.case?.written_to_graph}
                      graphCaseId={caseDetail.case?.graph_case_id}
                    />
                  </>
                ) : (
                  /* Pre-Investigation Traversal Strategy */
                  <div className="glass-panel" style={{ padding: '26px 30px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                        Graph Traversal & Policy Reasoning Pipeline
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                        Run investigation to execute all 4 phases across TigerGraph
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div className="glass-panel card-tint-sky" style={{ padding: '18px', border: '1.5px solid #BAE6FD' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            1. Card Window Traversal
                          </span>
                          <span className="badge badge-auto" style={{ fontSize: '9px', fontWeight: 800 }}>Step 1</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px', lineHeight: 1.5, fontWeight: 500 }}>
                          Traverse ±48h window on card {caseDetail.card_id} to discover card-testing bursts or rapid authorizations.
                        </p>
                      </div>

                      <div className="glass-panel card-tint-amber" style={{ padding: '18px', border: '1.5px solid #FDE68A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            2. Shared Device Ring
                          </span>
                          <span className="badge badge-uncertain" style={{ fontSize: '9px', fontWeight: 800 }}>Step 2</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px', lineHeight: 1.5, fontWeight: 500 }}>
                          Trace hardware fingerprint to identify other cards transacting through the same device profile.
                        </p>
                      </div>

                      <div className="glass-panel card-tint-emerald" style={{ padding: '18px', border: '1.5px solid #A7F3D0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            3. Case Memory Lookup
                          </span>
                          <span className="badge badge-legit" style={{ fontSize: '9px', fontWeight: 800 }}>Step 3</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px', lineHeight: 1.5, fontWeight: 500 }}>
                          Search 5,565 closed historical cases in graph memory for matching fraud typologies and established outcomes.
                        </p>
                      </div>

                      <div className="glass-panel card-tint-purple" style={{ padding: '18px', border: '1.5px solid #E9D5FF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            4. Bank Policy & SAR
                          </span>
                          <span className="badge badge-L2" style={{ fontSize: '9px', fontWeight: 800 }}>Step 4</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px', lineHeight: 1.5, fontWeight: 500 }}>
                          Evaluate Rules R1–R10, calculate two-stage actions, and generate regulatory FinCEN SAR narrative.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
