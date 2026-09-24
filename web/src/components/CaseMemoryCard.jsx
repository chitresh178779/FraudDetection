import React from 'react';
import { History, Sparkles } from 'lucide-react';

export default function CaseMemoryCard({ similarCases, writtenToGraph, graphCaseId }) {
  if (!similarCases || similarCases.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '9999px', 
            background: '#F0FDF4', 
            border: '1px solid #BBF7D0',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <History size={16} color="#059669" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-heading)', color: '#121212' }}>
              TigerGraph Case Memory & Precedents
            </h3>
            <div style={{ fontSize: '11px', color: '#71717A', marginTop: '1px' }}>
              Historical benchmark graph cases retrieved for contextual reasoning
            </div>
          </div>
        </div>
        {writtenToGraph && (
          <span className="badge badge-auto" style={{ gap: '4px' }}>
            <Sparkles size={11} /> Saved: {graphCaseId}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '13px', color: '#52525B', lineHeight: 1.5 }}>
          The autonomous agent retrieved historical investigations from TigerGraph memory to substantiate defensive policy actions:
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {similarCases.map((cid, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '8px 14px', 
                background: '#FAF9F8', 
                border: '1px solid var(--border-card)', 
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: '#121212' }}>
                {cid}
              </span>
              <span style={{ fontSize: '10px', color: '#71717A', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                Precedent
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
