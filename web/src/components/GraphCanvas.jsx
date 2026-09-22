import React, { useRef, useEffect, useState } from 'react';

export default function GraphCanvas({ graphData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initialize node positions in a circle or force-directed layout
    const nodes = graphData.nodes.map((n, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.35;
      return {
        ...n,
        x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 30,
        y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
        radius: n.type === 'Transaction' ? 14 : (n.type === 'Customer' ? 20 : 16)
      };
    });

    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const edges = graphData.edges
      .map(e => ({
        source: nodeMap.get(e.source),
        target: nodeMap.get(e.target),
        label: e.label
      }))
      .filter(e => e.source && e.target);

    // Simple spring simulation
    const simulate = () => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) / 180 * 0.4;
            nodes[i].vx -= (dx / dist) * force;
            nodes[i].vy -= (dy / dist) * force;
            nodes[j].vx += (dx / dist) * force;
            nodes[j].vy += (dy / dist) * force;
          }
        }

        // Center gravity
        nodes[i].vx += (width / 2 - nodes[i].x) * 0.005;
        nodes[i].vy += (height / 2 - nodes[i].y) * 0.005;
      }

      edges.forEach(e => {
        const dx = e.target.x - e.source.x;
        const dy = e.target.y - e.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 110;
        const force = (dist - targetDist) * 0.03;
        e.source.vx += (dx / dist) * force;
        e.source.vy += (dy / dist) * force;
        e.target.vx -= (dx / dist) * force;
        e.target.vy -= (dy / dist) * force;
      });

      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.85;
        n.vy *= 0.85;

        // Boundaries
        n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
        n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
      });

      // Render
      ctx.clearRect(0, 0, width, height);

      // Draw Edges with solid line
      edges.forEach(e => {
        ctx.beginPath();
        ctx.moveTo(e.source.x, e.source.y);
        ctx.lineTo(e.target.x, e.target.y);
        ctx.strokeStyle = '#22324d';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Edge label
        if (e.label) {
          const midX = (e.source.x + e.target.x) / 2;
          const midY = (e.source.y + e.target.y) / 2;
          ctx.fillStyle = '#64748b';
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(e.label, midX, midY - 3);
        }
      });

      // Draw Nodes with crisp solid borders
      nodes.forEach(n => {
        // Outer solid border ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#22324d';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core node circle (solid color)
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color || '#2563eb';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + n.radius + 14);

        // Type subtitle
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(n.type, n.x, n.y + n.radius + 25);
      });

      animationFrameId = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [graphData]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '380px', borderRadius: '8px', overflow: 'hidden', background: '#070b14', border: '1px solid #1e293b' }}>
      <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 10, display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          TigerGraph Entity Subgraph
        </span>
        <span className="badge badge-auto">Interactive</span>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
