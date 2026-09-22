import React from 'react';
import { CheckCircle2, ShieldAlert, Clock, RefreshCw, ArrowRight } from 'lucide-react';

export default function NextBestActionTimeline({ nba, evidenceRequests }) {
  if (!nba) return null;

  const initialActions = nba.initial || [];
  const finalActions = nba.final || [];
  const whatChanged = nba.what_changed || "nothing";

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="#3b82f6" />
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Next-Best Action Plan (Plain English & Bank Policy)</h3>
        </div>
        <span className="badge badge-auto">Bank Fraud Policy v1.0</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'stretch' }}>
        {/* Stage 1: Initial Actions */}
        <div className="action-stage-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              1. Initial Recommendation
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Before Evidence</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {initialActions.map((act, i) => (
              <div key={i} className="action-row" style={{ padding: '10px 12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      {act.title || act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="mono" style={{ fontSize: '10px', color: '#64748b' }}>
                      ({act.action})
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                    {act.plain_english || act.reason}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                    Policy Basis: {act.reason}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <span className={`badge badge-${act.route}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                    {act.route_label || act.route}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Evidence Transition */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
          <div style={{ width: '1px', height: '28px', background: '#1e293b' }}></div>
          <div style={{ 
            background: '#111a2e', 
            border: '1px solid #22324d', 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#60a5fa',
            margin: '6px 0'
          }}>
            <RefreshCw size={14} />
          </div>
          <div style={{ width: '1px', height: '28px', background: '#1e293b' }}></div>
        </div>

        {/* Stage 2: Final Actions */}
        <div className="action-stage-box" style={{ borderColor: '#2563eb', background: '#0b1322' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>
              2. Final Decisions & Protective Actions
            </span>
            <span style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> After Evidence Verification
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {finalActions.map((act, i) => (
              <div key={i} className="action-row" style={{ borderColor: '#1e293b', padding: '10px 12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      {act.title || act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="mono" style={{ fontSize: '10px', color: '#64748b' }}>
                      ({act.action})
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                    {act.plain_english || act.reason}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                    Policy Basis: {act.reason}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <span className={`badge badge-${act.route}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                    {act.route_label || act.route}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Simulation Note */}
      {evidenceRequests && evidenceRequests.length > 0 && (
        <div style={{ marginTop: '14px', padding: '12px 16px', background: '#0c2036', borderRadius: '6px', border: '1px solid #0369a1', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Clock size={16} color="#38bdf8" style={{ marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: '#e0f2fe', lineHeight: 1.5 }}>
            <strong>Cardholder Verification Step ({evidenceRequests[0].type.replace(/_/g, ' ')}):</strong> "{evidenceRequests[0].assumed_response}"
          </div>
        </div>
      )}

      {/* What Changed Banner */}
      <div style={{ marginTop: '10px', padding: '10px 14px', background: '#090f1d', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
        <strong style={{ color: '#f8fafc' }}>Decision Progression:</strong> {whatChanged}
      </div>
    </div>
  );
}
