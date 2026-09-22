import React from 'react';
import { 
  FileText, ShieldAlert, ShieldCheck, 
  Search, AlertTriangle, CheckCircle2, UserCheck
} from 'lucide-react';

export default function ExecutiveReportCard({ report, verdict, caseId, pattern, exposureUsd }) {
  if (!report || !report.headline) return null;

  const isFraud = verdict === 'fraud';

  return (
    <div className="glass-panel" style={{ 
      padding: '24px', 
      borderLeft: `5px solid ${isFraud ? '#ef4444' : '#10b981'}`,
      background: 'linear-gradient(180deg, #111a2e 0%, #0c1220 100%)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: isFraud ? '#2a1215' : '#06261e', 
            padding: '9px', 
            borderRadius: '8px',
            border: `1px solid ${isFraud ? '#7f1d1d' : '#065f46'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isFraud ? <ShieldAlert size={22} color="#f87171" /> : <ShieldCheck size={22} color="#34d399" />}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: isFraud ? '#f87171' : '#34d399', letterSpacing: '0.06em' }}>
              Understandable Investigation Report • Case {caseId}
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#f8fafc', marginTop: '3px' }}>
              {report.headline}
            </h3>
          </div>
        </div>

        <span className={`badge ${isFraud ? 'badge-fraud' : 'badge-legit'}`} style={{ fontSize: '12px', padding: '5px 12px' }}>
          {isFraud ? 'Confirmed Fraud' : 'Cleared Legitimate'}
        </span>
      </div>

      {/* 4 Narrative Sections in English */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '16px' }}>
        {/* 1. What Triggered Alert */}
        <div style={{ background: '#090f1d', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={15} color="#38bdf8" />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8' }}>
              1. What Triggered the Alert
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.55 }}>
            {report.trigger_summary}
          </p>
        </div>

        {/* 2. Graph Investigation Findings */}
        <div style={{ background: '#090f1d', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Search size={15} color="#818cf8" />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#818cf8' }}>
              2. Graph & Spending Pattern Findings
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.55 }}>
            {report.graph_findings}
          </p>
        </div>

        {/* 3. Cardholder Verification */}
        <div style={{ background: '#090f1d', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <UserCheck size={15} color="#fbbf24" />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24' }}>
              3. Cardholder Verification Outcome
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.55 }}>
            {report.customer_outcome}
          </p>
        </div>

        {/* 4. Final Conclusion & Protective Measures */}
        <div style={{ background: '#090f1d', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle2 size={15} color={isFraud ? '#f87171' : '#34d399'} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: isFraud ? '#f87171' : '#34d399' }}>
              4. Final Decision & Safety Actions
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.55 }}>
            {report.conclusion}
          </p>
        </div>
      </div>
    </div>
  );
}
