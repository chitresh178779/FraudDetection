import React, { useState } from 'react';
import { Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SarViewer({ sar, caseId }) {
  const [copied, setCopied] = useState(false);

  if (!sar) return null;

  const handleCopy = () => {
    if (sar.narrative) {
      navigator.clipboard.writeText(sar.narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!sar.file) {
    return (
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#090f1d', borderColor: '#1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '6px', background: '#06261e', border: '1px solid #065f46', borderRadius: '6px' }}>
            <ShieldCheck size={20} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              Suspicious Activity Report (SAR) Exempt
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {sar.reason}
            </div>
          </div>
        </div>
        <span className="badge badge-legit">Exempt</span>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', borderColor: '#7f1d1d', background: '#170c10' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '6px', background: '#2a1215', border: '1px solid #7f1d1d', borderRadius: '6px' }}>
            <AlertTriangle size={20} color="#f87171" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f87171' }}>
              FinCEN Suspicious Activity Report (Regulatory Filing)
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Statutory Basis: {sar.reason}
            </span>
          </div>
        </div>
        <button 
          onClick={handleCopy}
          className="btn-secondary" 
          style={{ background: '#2a1215', borderColor: '#7f1d1d', color: '#fca5a5' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy Narrative"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div style={{ padding: '12px', background: '#090f1d', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Suspicious Amount</div>
          <div className="mono" style={{ fontSize: '16px', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
            ${sar.total_amount_usd?.toFixed(2)} USD
          </div>
        </div>

        <div style={{ padding: '12px', background: '#090f1d', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Activity Window</div>
          <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '6px' }}>
            {sar.activity_dates?.[0]} — {sar.activity_dates?.[1]}
          </div>
        </div>

        <div style={{ padding: '12px', background: '#090f1d', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Named Subjects ({sar.subjects?.length})</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
            {sar.subjects?.map((s, idx) => (
              <span key={idx} className="mono" style={{ fontSize: '10px', padding: '2px 6px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#cbd5e1' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px', background: '#070b14', borderRadius: '6px', border: '1px solid #1e293b' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
          Official Regulatory Narrative
        </div>
        <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#e2e8f0', whiteSpace: 'pre-line', fontFamily: 'var(--font-mono)' }}>
          {sar.narrative}
        </p>
      </div>
    </div>
  );
}
