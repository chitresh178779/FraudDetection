import React from 'react';
import { CheckCircle2, ShieldAlert, Clock, RefreshCw, ArrowRight, Zap } from 'lucide-react';

export default function NextBestActionTimeline({ nba, evidenceRequests }) {
  if (!nba) return null;

  const initialActions = nba.initial || [];
  const finalActions = nba.final || [];
  const whatChanged = nba.what_changed || "nothing";

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '9999px', 
            background: '#F0F9FF', 
            border: '1px solid #BAE6FD',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <ShieldAlert size={16} color="#0284C7" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-heading)', color: '#121212' }}>
              Next-Best Action Plan
            </h3>
            <div style={{ fontSize: '11px', color: '#71717A', marginTop: '1px' }}>
              Autonomous Bank Fraud Policy Evaluation & Controlled Remediation
            </div>
          </div>
        </div>
        <span className="badge badge-auto">Bank Policy v1.0</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '18px', alignItems: 'stretch' }}>
        {/* Stage 1: Initial Actions */}
        <div className="action-stage-box" style={{ background: '#FAF9F8', border: '1px solid #EBEBE8' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Initial Assessment
            </span>
            <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 500 }}>Prior to Evidence</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {initialActions.map((act, i) => (
              <div key={i} className="action-row">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#121212' }}>
                      {act.title || act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="mono" style={{ fontSize: '10px', color: '#71717A', background: '#F4F4F5', padding: '1px 5px', borderRadius: '4px' }}>
                      {act.action}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#52525B', marginTop: '4px', lineHeight: 1.45 }}>
                    {act.plain_english || act.reason}
                  </div>
                  <div style={{ fontSize: '10px', color: '#A1A1AA', marginTop: '4px' }}>
                    Policy Rule: {act.reason}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                  <span className={`badge badge-${act.route}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {act.route_label || act.route}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Evidence Progression Divider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
          <div style={{ width: '1px', height: '36px', background: '#E4E4E0' }}></div>
          <div style={{ 
            background: '#FFFFFF', 
            border: '1px solid #D4D4D0', 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#121212',
            margin: '8px 0',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <ArrowRight size={14} />
          </div>
          <div style={{ width: '1px', height: '36px', background: '#E4E4E0' }}></div>
        </div>

        {/* Stage 2: Final Actions */}
        <div className="action-stage-box" style={{ 
          background: '#FFFFFF', 
          borderColor: '#121212', 
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#121212', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. Final Decision & Actions
            </span>
            <span style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <CheckCircle2 size={13} /> Verified Evidence
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {finalActions.map((act, i) => (
              <div key={i} className="action-row" style={{ background: '#FAF9F8' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#121212' }}>
                      {act.title || act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="mono" style={{ fontSize: '10px', color: '#71717A', background: '#FFFFFF', padding: '1px 5px', borderRadius: '4px', border: '1px solid #EBEBE8' }}>
                      {act.action}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#52525B', marginTop: '4px', lineHeight: 1.45 }}>
                    {act.plain_english || act.reason}
                  </div>
                  <div style={{ fontSize: '10px', color: '#A1A1AA', marginTop: '4px' }}>
                    Policy Basis: {act.reason}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                  <span className={`badge badge-${act.route}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {act.route_label || act.route}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Verification Callout */}
      {evidenceRequests && evidenceRequests.length > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px 18px', 
          background: '#F0F9FF', 
          borderRadius: '12px', 
          border: '1px solid #BAE6FD', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <Clock size={16} color="#0284C7" />
          <div style={{ fontSize: '12px', color: '#0369A1', lineHeight: 1.5 }}>
            <strong>Cardholder Verification Step ({evidenceRequests[0].type.replace(/_/g, ' ')}):</strong> "{evidenceRequests[0].assumed_response}"
          </div>
        </div>
      )}

      {/* What Changed Summary */}
      <div style={{ 
        marginTop: '12px', 
        padding: '12px 18px', 
        background: '#FAF9F8', 
        borderRadius: '12px', 
        border: '1px solid var(--border-subtle)', 
        fontSize: '12px', 
        color: '#52525B', 
        lineHeight: 1.5 
      }}>
        <strong style={{ color: '#121212' }}>Decision Progression:</strong> {whatChanged}
      </div>
    </div>
  );
}
