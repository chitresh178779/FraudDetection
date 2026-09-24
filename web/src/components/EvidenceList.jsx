import React from 'react';
import { Database, UserCheck, FileText, Globe } from 'lucide-react';

export default function EvidenceList({ evidence }) {
  if (!evidence || evidence.length === 0) return null;

  const getSourceIcon = (source) => {
    switch (source) {
      case 'graph':
        return <Database size={13} color="#0284C7" />;
      case 'customer':
        return <UserCheck size={13} color="#059669" />;
      case 'document':
        return <FileText size={13} color="#D97706" />;
      default:
        return <Globe size={13} color="#7C3AED" />;
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
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-heading)', color: '#121212' }}>
            Supporting Investigation Evidence ({evidence.length})
          </h3>
          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>
            Attributed graph traversals and contextual validation records
          </div>
        </div>
        <span className="badge badge-auto">Graph-Grounded</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {evidence.map((ev, i) => (
          <div 
            key={i} 
            style={{ 
              padding: '14px 16px', 
              background: '#FAF9F8', 
              borderRadius: '12px', 
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className={`badge ${getSourceBadgeClass(ev.source)}`} style={{ textTransform: 'capitalize' }}>
                {getSourceIcon(ev.source)} {ev.source} Traversal
              </span>
              <span className="mono" style={{ fontSize: '11px', color: '#71717A' }}>
                {ev.ref}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#3F3F46', lineHeight: 1.5 }}>
              {ev.claim}
            </p>

            {ev.entity_ids && ev.entity_ids.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ fontSize: '11px', color: '#71717A', fontWeight: 600 }}>Linked Entities:</span>
                {ev.entity_ids.map((id, idx) => (
                  <span key={idx} className="mono" style={{ 
                    fontSize: '11px', 
                    padding: '2px 8px', 
                    borderRadius: '9999px', 
                    background: '#FFFFFF', 
                    border: '1px solid #E4E4E0',
                    color: '#121212',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
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
