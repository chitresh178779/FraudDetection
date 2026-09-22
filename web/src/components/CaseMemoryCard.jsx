import React from 'react';
import { History } from 'lucide-react';

export default function CaseMemoryCard({ similarCases, writtenToGraph, graphCaseId }) {
  if (!similarCases || similarCases.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>TigerGraph Case Memory & Precedents</h3>
        </div>
        {writtenToGraph && (
          <span className="badge badge-auto">
            Stored: {graphCaseId}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>
          The agent retrieved past closed investigations from graph memory (July – October 2016) to substantiate defensive recommendations:
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {similarCases.map((cid, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '8px 12px', 
                background: '#090f1d', 
                border: '1px solid #1e293b', 
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                {cid}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Precedent</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
