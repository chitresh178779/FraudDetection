import React, { useState } from 'react';
import { Copy, Check, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

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
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '9999px', 
            background: '#ECFDF5', 
            border: '1px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={18} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#121212' }}>
              FinCEN SAR Regulatory Exemption
            </div>
            <div style={{ fontSize: '12px', color: '#71717A', marginTop: '2px' }}>
              {sar.reason}
            </div>
          </div>
        </div>
        <span className="badge badge-legit">Exempt from Filing</span>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ 
      padding: '24px', 
      borderColor: '#FECACA',
      background: 'linear-gradient(180deg, rgba(254, 242, 242, 0.5) 0%, rgba(255, 255, 255, 1) 35%)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '9999px', 
            background: '#FEF2F2', 
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={18} color="#DC2626" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-heading)', color: '#121212' }}>
              FinCEN Suspicious Activity Report (Regulatory Filing)
            </h3>
            <span style={{ fontSize: '12px', color: '#71717A' }}>
              Statutory Basis: {sar.reason}
            </span>
          </div>
        </div>

        <button 
          onClick={handleCopy}
          className="btn-secondary" 
          style={{ gap: '6px' }}
        >
          {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
          {copied ? "Copied to Clipboard" : "Copy Narrative"}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ padding: '14px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Total Suspicious Exposure
          </div>
          <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626', marginTop: '4px' }}>
            ${sar.total_amount_usd?.toFixed(2)} USD
          </div>
        </div>

        <div style={{ padding: '14px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Activity Temporal Window
          </div>
          <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: '#121212', marginTop: '6px' }}>
            {sar.activity_dates?.[0]} — {sar.activity_dates?.[1]}
          </div>
        </div>

        <div style={{ padding: '14px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Named Suspects / Entities ({sar.subjects?.length})
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
            {sar.subjects?.map((s, idx) => (
              <span key={idx} className="mono" style={{ 
                fontSize: '11px', 
                padding: '2px 8px', 
                background: '#F4F4F5', 
                border: '1px solid #E4E4E7', 
                borderRadius: '9999px', 
                color: '#18181B' 
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ 
        padding: '18px 20px', 
        background: '#FAF9F8', 
        borderRadius: '12px', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          color: '#71717A', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <FileText size={13} />
          Official FinCEN Narrative (Ready for Filing)
        </div>
        <p style={{ 
          fontSize: '12px', 
          lineHeight: 1.65, 
          color: '#27272A', 
          whiteSpace: 'pre-line', 
          fontFamily: 'var(--font-mono)' 
        }}>
          {sar.narrative}
        </p>
      </div>
    </div>
  );
}
