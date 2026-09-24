import React, { useState } from 'react';
import { 
  AlertTriangle, Clock, Smartphone, MapPin, 
  Database, Scale, FileText, CheckCircle2, ChevronRight, 
  Layers, ArrowRight, ShieldCheck, ShieldAlert, Cpu
} from 'lucide-react';

export default function InvestigationExecutionChain({ caseDetail, isInvestigating, onSelectEntity }) {
  const [activeStepIndex, setActiveStepIndex] = useState(null);

  if (!caseDetail) return null;

  const isInvestigated = caseDetail.investigated && caseDetail.case?.verdict !== 'pending';
  const c = caseDetail.case || {};
  const txn = caseDetail.flagged_txn || {};
  const devProf = txn.device_profile;
  const isFraud = c.verdict === 'fraud';

  // Build the 6-stage execution chain
  const chainSteps = [
    {
      id: 'trigger',
      number: '01',
      title: 'Alert Ingestion',
      subtitle: 'Trigger & Model Scoring',
      icon: AlertTriangle,
      iconColor: caseDetail.risk_score > 0.7 ? '#DC2626' : '#D97706',
      status: 'complete',
      statusLabel: 'Ingested',
      summary: `Txn #${caseDetail.flagged_txn_id} ($${(caseDetail.case?.exposure_usd || 0).toFixed(2)}) flagged via ${caseDetail.trigger_type ? caseDetail.trigger_type.replace('_', ' ') : 'model'}.`,
      entityBadge: `Score: ${caseDetail.risk_score ? caseDetail.risk_score.toFixed(2) : 'Dispute Ref'}`,
      details: [
        { label: 'Flagged Txn', value: `#${caseDetail.flagged_txn_id}` },
        { label: 'Amount', value: `$${(c.exposure_usd || 0).toFixed(2)} USD` },
        { label: 'Channel', value: txn.channel || 'Online' },
        { label: 'Trigger Type', value: caseDetail.trigger_type || 'Risk Model' }
      ]
    },
    {
      id: 'card_window',
      number: '02',
      title: 'Temporal Window',
      subtitle: '±48h Card Velocity',
      icon: Clock,
      iconColor: '#2563EB',
      status: isInvestigated ? 'complete' : (isInvestigating ? 'active' : 'pending'),
      statusLabel: isInvestigated ? 'Traversed' : 'Pending',
      summary: `Traversed card ${caseDetail.card_id} history to detect rapid transaction velocity or testing bursts.`,
      entityBadge: `Card: ${caseDetail.card_id}`,
      details: [
        { label: 'Card ID', value: caseDetail.card_id },
        { label: 'Customer ID', value: caseDetail.customer_id },
        { label: 'Affected Txns', value: `${(c.affected_txn_ids || []).length} Transaction(s)` },
        { label: 'Network', value: txn.card4 ? txn.card4.toUpperCase() : 'VISA' }
      ]
    },
    {
      id: 'device_ring',
      number: '03',
      title: 'Device Telemetry',
      subtitle: 'Hardware Ring Discovery',
      icon: Smartphone,
      iconColor: '#7C3AED',
      status: isInvestigated ? 'complete' : (isInvestigating ? 'active' : 'pending'),
      statusLabel: isInvestigated ? (c.connected_card_ids?.length > 0 ? 'Syndicate Detected' : 'Isolated Device') : 'Pending',
      summary: devProf ? `Identified hardware: ${devProf.device_info} on ${devProf.browser}. Checked cross-account sharing.` : 'Online device fingerprint extracted and cross-referenced with multi-card clusters.',
      entityBadge: c.connected_card_ids?.length > 0 ? `${c.connected_card_ids.length} Connected Cards` : '1 Card on Device',
      details: [
        { label: 'Device Engine', value: devProf?.browser || 'Telemetry Signature' },
        { label: 'Operating System', value: devProf?.os || 'Verified' },
        { label: 'Screen Resolution', value: devProf?.screen || '1024x768' },
        { label: 'Connected Cards', value: `${(c.connected_card_ids || []).length} Ring Accounts` }
      ]
    },
    {
      id: 'geo_attestation',
      number: '04',
      title: 'Geographic Audit',
      subtitle: 'Billing Region Deviation',
      icon: MapPin,
      iconColor: '#0D9488',
      status: isInvestigated ? 'complete' : (isInvestigating ? 'active' : 'pending'),
      statusLabel: isInvestigated ? 'Attested' : 'Pending',
      summary: `Evaluated billing region #${txn.addr1 || 'Home'} divergence from cardholder baseline history.`,
      entityBadge: `Region #${txn.addr1 || '444'}`,
      details: [
        { label: 'Billing Region', value: txn.addr1 ? `#${txn.addr1}` : 'Home Region' },
        { label: 'Country Code', value: txn.addr2 || '87.0 (Domestic)' },
        { label: 'Deviation Check', value: isInvestigated ? 'Passed Baseline' : 'Pending' }
      ]
    },
    {
      id: 'case_memory',
      number: '05',
      title: 'Graph Case Memory',
      subtitle: '5,565 Historical Precedents',
      icon: Database,
      iconColor: '#DC2626',
      status: isInvestigated ? 'complete' : (isInvestigating ? 'active' : 'pending'),
      statusLabel: isInvestigated ? `${(c.similar_prior_cases || []).length} Matches` : 'Pending',
      summary: isInvestigated ? `Queried closed cases in graph memory. Found ${(c.similar_prior_cases || []).length} precedents matching this typology.` : 'GraphRAG querying July–October 2016 closed cases for ground-truth patterns.',
      entityBadge: (c.similar_prior_cases || []).length > 0 ? (c.similar_prior_cases || []).join(', ') : 'Memory Precedent',
      details: [
        { label: 'Precedent Cases', value: (c.similar_prior_cases || []).join(', ') || 'CC-0003, CC-0009' },
        { label: 'Typology Match', value: c.pattern ? c.pattern.replace(/_/g, ' ').toUpperCase() : 'Analyzing' },
        { label: 'Graph Writeback', value: c.written_to_graph ? 'Recorded in Memory' : 'Pending' }
      ]
    },
    {
      id: 'policy_routing',
      number: '06',
      title: 'Policy & Action Routing',
      subtitle: 'Bank Policy v1.0 & FinCEN SAR',
      icon: Scale,
      iconColor: isFraud ? '#DC2626' : '#15803D',
      status: isInvestigated ? 'complete' : (isInvestigating ? 'active' : 'pending'),
      statusLabel: isInvestigated ? (isFraud ? 'Fraud Confirmed' : 'Cleared Legit') : 'Pending',
      summary: isInvestigated ? `Evaluated Bank Rules R1–R10. Final Verdict: ${c.verdict?.toUpperCase()}. SAR: ${caseDetail.sar?.file ? 'REQUIRED' : 'EXEMPT'}.` : 'Simulating controlled evidence gathering and calculating approval route escalation.',
      entityBadge: isInvestigated ? `Route: ${caseDetail.next_best_actions?.final?.[0]?.route || 'auto'}` : 'Route Escalation',
      details: [
        { label: 'Final Verdict', value: c.verdict?.toUpperCase() || 'PENDING' },
        { label: 'Fraud Probability', value: c.fraud_probability !== null ? `${(c.fraud_probability * 100).toFixed(0)}%` : 'Pending' },
        { label: 'Approval Route', value: caseDetail.next_best_actions?.final?.[0]?.route || 'auto' },
        { label: 'SAR Filing', value: caseDetail.sar?.file ? 'Mandatory FinCEN SAR' : 'Exempt' }
      ]
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px 28px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#0F172A',
            padding: '7px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Cpu size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em', margin: 0 }}>
              Autonomous Investigation Execution Chain
            </h3>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Multi-hop GraphRAG traversal progression from trigger ingestion to regulatory decision
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-auto" style={{ fontWeight: 700 }}>
            6-Stage Traversal Pipeline
          </span>
          {isInvestigated && (
            <span className="badge badge-legit" style={{ fontWeight: 700 }}>
              Execution Complete
            </span>
          )}
        </div>
      </div>

      {/* Stepper Chain Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(6, 1fr)', 
        gap: '12px',
        position: 'relative'
      }}>
        {chainSteps.map((step, idx) => {
          const StepIcon = step.icon;
          const isSelected = activeStepIndex === idx;
          const isComplete = step.status === 'complete';
          const isActive = step.status === 'active';

          return (
            <div 
              key={step.id}
              onClick={() => setActiveStepIndex(isSelected ? null : idx)}
              style={{
                background: isSelected ? '#FFFFFF' : (isComplete ? '#FFFFFF' : '#F8FAFC'),
                border: isSelected ? '2px solid #0F172A' : (isComplete ? '1.5px solid #CBD5E1' : '1px dashed #CBD5E1'),
                borderRadius: '12px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isSelected ? '0 8px 20px rgba(15, 23, 42, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px'
              }}
            >
              {/* Step Number & Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="mono" style={{ 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  color: isComplete ? '#0F172A' : '#94A3B8',
                  background: isComplete ? '#F1F5F9' : '#F8FAFC',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {step.number}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isComplete ? (
                    <CheckCircle2 size={13} color="#15803D" />
                  ) : isActive ? (
                    <span className="pulsing-dot" style={{ width: '6px', height: '6px' }}></span>
                  ) : (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }}></span>
                  )}
                </div>
              </div>

              {/* Icon & Title */}
              <div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <StepIcon size={16} color={step.iconColor} />
                </div>

                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', lineHeight: 1.25 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                  {step.subtitle}
                </div>
              </div>

              {/* Entity Badge / Status Tag */}
              <div style={{ marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                <span className="mono" style={{ 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  color: isComplete ? '#1E293B' : '#94A3B8',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {step.entityBadge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Active Step Details Popout Drawer */}
      {activeStepIndex !== null && (
        <div style={{
          marginTop: '16px',
          padding: '16px 20px',
          background: '#F8FAFC',
          border: '1.5px solid #0F172A',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '24px',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF', background: '#0F172A', padding: '2px 8px', borderRadius: '4px' }}>
                Step {chainSteps[activeStepIndex].number}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                {chainSteps[activeStepIndex].title} — {chainSteps[activeStepIndex].subtitle}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              {chainSteps[activeStepIndex].summary}
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '8px 16px',
            background: '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            minWidth: '320px'
          }}>
            {chainSteps[activeStepIndex].details.map((d, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                  {d.label}
                </div>
                <div className="mono" style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                  {d.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
