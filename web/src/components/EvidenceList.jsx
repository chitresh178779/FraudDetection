import React from 'react';
import { Database, UserCheck, FileText, Globe } from 'lucide-react';

export default function EvidenceList({ evidence }) {
  if (!evidence || evidence.length === 0) return null;

  const getSourceIcon = (source) => {
    switch (source) {
      case 'graph':
        return <Database size={13} color="#38bdf8" />;
      case 'customer':
        return <UserCheck size={13} color="#34d399" />;
      case 'document':
        return <FileText size={13} color="#fbbf24" />;
      default:
        return <Globe size={13} color="#60a5fa" />;
    }
  };

  const getSourceBadgeClass = (source) => {
    switch (source) {
      case 'graph':
        return 'badge-auto';
      case 'customer':
        return 'badge-legit';
      case 'document':
        return 'badge-uncertain';
      default:
        return 'badge-auto';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Supporting Investigation Evidence ({evidence.length})</h3>
        <span style={{ fontSize: '11px', color: '#64748b' }}>Graph & Attributed Context</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {evidence.map((ev, i) => (
          <div 
            key={i} 
            style={{ 
              padding: '12px 14px', 
              background: '#090f1d', 
              borderRadius: '6px', 
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className={`badge ${getSourceBadgeClass(ev.source)}`}>
                {getSourceIcon(ev.source)} {ev.source}
              </span>
              <span className="mono" style={{ fontSize: '11px', color: '#64748b' }}>
                {ev.ref}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {ev.claim}
            </p>

            {ev.entity_ids && ev.entity_ids.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', alignSelf: 'center', fontWeight: 600 }}>Entities:</span>
                {ev.entity_ids.map((id, idx) => (
                  <span key={idx} className="mono" style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    background: '#141e33', 
                    border: '1px solid #22324d',
                    color: '#94a3b8' 
                  }}>
                    {id}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
