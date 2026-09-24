import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Network, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, 
  Info, ExternalLink
} from 'lucide-react';

export default function GraphCanvas({ graphData }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Viewport transformation states
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  // Interaction states
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);

  // Dragging refs
  const isDraggingCanvasRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const transformRef = useRef({ scale: 1, pan: { x: 0, y: 0 } });

  // Sync transformRef for requestAnimationFrame loop
  useEffect(() => {
    transformRef.current = { scale, pan };
  }, [scale, pan]);

  // Node Shape, Color, and Geometry definition matching the reference design
  const getNodeConfig = useCallback((node) => {
    const yellowBorder = '#FACC15';

    switch (node.type) {
      case 'Customer':
        return {
          shape: 'circle',
          fill: '#2563EB',         // Deep Royal Blue
          stroke: yellowBorder,
          strokeWidth: 3.5,
          radius: 36,
          label: 'Customer',
          sublabel: node.sublabel || node.id,
          badge: 'Customer'
        };
      case 'Card':
        return {
          shape: 'roundRect',
          fill: '#0284C7',         // Ocean Blue
          stroke: yellowBorder,
          strokeWidth: 3.5,
          width: 104,
          height: 48,
          radius: 8,
          label: 'Card',
          sublabel: node.sublabel || node.id,
          badge: 'Card Account'
        };
      case 'DeviceProfile':
        return {
          shape: 'roundRect',
          fill: '#7C3AED',         // Vivid Purple
          stroke: yellowBorder,
          strokeWidth: 3.5,
          width: 110,
          height: 48,
          radius: 8,
          label: 'Device',
          sublabel: node.sublabel || 'Unknown',
          badge: 'Device Profile'
        };
      case 'BillingRegion':
        return {
          shape: 'hexagon',
          fill: '#0D9488',         // Deep Emerald/Teal
          stroke: yellowBorder,
          strokeWidth: 3.5,
          radius: 36,
          label: 'Region',
          sublabel: node.sublabel || node.id,
          badge: 'Billing Region'
        };
      case 'ClosedCase':
        return {
          shape: 'diamond',
          fill: '#DC2626',         // Rich Crimson Red
          stroke: yellowBorder,
          strokeWidth: 3.5,
          radius: 38,
          label: 'Similar',
          sublabel: node.sublabel || node.id,
          badge: 'Case Precedent'
        };
      case 'InvestigationCase':
        return {
          shape: 'roundRect',
          fill: '#18181B',         // Obsidian Slate
          stroke: yellowBorder,
          strokeWidth: 3.5,
          width: 106,
          height: 48,
          radius: 8,
          label: 'Case',
          sublabel: node.sublabel || node.id,
          badge: 'Investigation'
        };
      case 'ConnectedCard':
        return {
          shape: 'roundRect',
          fill: '#D97706',         // Warm Amber
          stroke: yellowBorder,
          strokeWidth: 3.5,
          width: 100,
          height: 46,
          radius: 8,
          label: 'Card',
          sublabel: node.sublabel || node.id,
          badge: 'Connected Card'
        };
      case 'Transaction':
      default:
        return {
          shape: 'roundRect',
          fill: '#EA580C',         // Warm Signature Orange (central node)
          stroke: yellowBorder,
          strokeWidth: 4,
          width: 114,
          height: 52,
          radius: 9,
          label: 'Txn',
          sublabel: node.sublabel || `#${node.id.replace('TXN_', '')}`,
          badge: node.flagged ? 'Flagged Txn' : 'Linked Txn',
          isCenter: !!node.flagged
        };
    }
  }, []);

  // Initialize nodes in an expansive, structured star layout matching Image 2
  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      nodesRef.current = [];
      edgesRef.current = [];
      return;
    }

    const container = containerRef.current;
    const width = container ? container.clientWidth : 960;
    const height = container ? (isExpanded ? 640 : 500) : 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const existingMap = new Map();
    nodesRef.current.forEach(n => existingMap.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy }));

    // Find central transaction node
    const txnNodeRaw = graphData.nodes.find(n => n.type === 'Transaction' && n.flagged) || graphData.nodes[0];

    // Count how many connected cards and precedents exist to layout gracefully
    const connectedCardNodes = graphData.nodes.filter(n => n.type === 'ConnectedCard');
    const similarNodes = graphData.nodes.filter(n => n.type === 'ClosedCase');

    let similarIdx = 0;
    let connCardIdx = 0;

    const nodes = graphData.nodes.map((n) => {
      const existing = existingMap.get(n.id);
      const config = getNodeConfig(n);
      const isCenter = n.id === txnNodeRaw.id;

      let initX = centerX;
      let initY = centerY;

      if (!isCenter) {
        if (n.type === 'Customer') {
          // Right side (slightly below horizontal), forming right triangle with Card & Txn
          initX = centerX + 240;
          initY = centerY + 50;
        } else if (n.type === 'Card') {
          // Top-right side, forming top vertex of triangle
          initX = centerX + 230;
          initY = centerY - 130;
        } else if (n.type === 'DeviceProfile') {
          // Left side
          initX = centerX - 240;
          initY = centerY - 30;
        } else if (n.type === 'BillingRegion') {
          // Bottom-left
          initX = centerX - 230;
          initY = centerY + 160;
        } else if (n.type === 'ClosedCase') {
          // Precedents placed top or bottom
          if (similarIdx === 0) {
            initX = centerX - 30;
            initY = centerY - 210;
          } else {
            initX = centerX - 30;
            initY = centerY + 220;
          }
          similarIdx++;
        } else if (n.type === 'InvestigationCase') {
          // Bottom-right
          initX = centerX + 130;
          initY = centerY + 190;
        } else if (n.type === 'ConnectedCard') {
          // Fan out to far left around Device profile with generous spacing
          const totalConn = connectedCardNodes.length;
          const arcOffset = (connCardIdx - (totalConn - 1) / 2) * 65;
          initX = centerX - 420;
          initY = centerY - 30 + arcOffset;
          connCardIdx++;
        } else {
          initX = centerX + (Math.random() - 0.5) * 300;
          initY = centerY + (Math.random() - 0.5) * 300;
        }
      }

      return {
        ...n,
        x: existing ? existing.x : initX,
        y: existing ? existing.y : initY,
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
        config,
        isCenter
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

    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [graphData, isExpanded, getNodeConfig]);

  // Main Canvas Render & Collision Resolution Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const container = containerRef.current;
      if (!container) return;
      const width = container.clientWidth;
      const height = isExpanded ? 640 : 500;

      if (canvas.width !== width * window.devicePixelRatio || canvas.height !== height * window.devicePixelRatio) {
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
      }

      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.clearRect(0, 0, width, height);

      const { scale: currentScale, pan: currentPan } = transformRef.current;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Force calculations
      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = 160;

          if (dist < minDist) {
            const force = ((minDist - dist) / minDist) * 0.35;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (draggedNodeRef.current?.id !== nodes[i].id && !nodes[i].isCenter) {
              nodes[i].vx -= fx;
              nodes[i].vy -= fy;
            }
            if (draggedNodeRef.current?.id !== nodes[j].id && !nodes[j].isCenter) {
              nodes[j].vx += fx;
              nodes[j].vy += fy;
            }
          }
        }

        // Center transaction stays solidly anchored in center
        if (nodes[i].isCenter) {
          if (draggedNodeRef.current?.id !== nodes[i].id) {
            nodes[i].vx += (centerX - nodes[i].x) * 0.05;
            nodes[i].vy += (centerY - nodes[i].y) * 0.05;
          }
        }
      }

      // 2. Rigid Collision Solver: PREVENTS ANY NODES FROM OVERLAPPING
      for (let iter = 0; iter < 2; iter++) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const requiredSeparation = 135; // Absolute minimum breathing room

            if (dist < requiredSeparation) {
              const overlap = (requiredSeparation - dist) / 2;
              const nx = dx / dist;
              const ny = dy / dist;

              if (!nodes[i].isCenter && draggedNodeRef.current?.id !== nodes[i].id) {
                nodes[i].x -= nx * overlap;
                nodes[i].y -= ny * overlap;
              }
              if (!nodes[j].isCenter && draggedNodeRef.current?.id !== nodes[j].id) {
                nodes[j].x += nx * overlap;
                nodes[j].y += ny * overlap;
              }
            }
          }
        }
      }

      // 3. Update positions with damping
      nodes.forEach(n => {
        if (draggedNodeRef.current?.id !== n.id) {
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.82;
          n.vy *= 0.82;

          // Bounding box limits
          n.x = Math.max(65, Math.min(width - 65, n.x));
          n.y = Math.max(50, Math.min(height - 50, n.y));
        }
      });

      // Apply Pan & Zoom Transformation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.translate(currentPan.x, currentPan.y);
      ctx.scale(currentScale, currentScale);
      ctx.translate(-centerX, -centerY);

      // Clean Background Grid Dots
      ctx.fillStyle = '#CBD5E1';
      const gridSize = 32;
      for (let gx = -width; gx < width * 2; gx += gridSize) {
        for (let gy = -height; gy < height * 2; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const getNodeBoundRadius = (n) => {
        if (n.config.shape === 'roundRect') return 34;
        if (n.config.shape === 'hexagon') return 36;
        if (n.config.shape === 'diamond') return 38;
        return 34; // circle
      };

      // 4. DRAW DIRECTED EDGES WITH ARROWS & LABELS ALONG THE LINE
      edges.forEach(e => {
        const isHoveredEdge = hoveredNode && (hoveredNode.id === e.source.id || hoveredNode.id === e.target.id);
        const dx = e.target.x - e.source.x;
        const dy = e.target.y - e.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const rSource = getNodeBoundRadius(e.source);
        const rTarget = getNodeBoundRadius(e.target);

        const startX = e.source.x + (dx / dist) * rSource;
        const startY = e.source.y + (dy / dist) * rSource;
        const endX = e.target.x - (dx / dist) * (rTarget + 4);
        const endY = e.target.y - (dy / dist) * (rTarget + 4);

        // Draw Edge Line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = isHoveredEdge ? '#0F172A' : '#94A3B8';
        ctx.lineWidth = isHoveredEdge ? 2.5 : 1.75;
        ctx.stroke();

        // Draw Arrowhead pointing to target
        const angle = Math.atan2(dy, dx);
        const arrowLen = 10;
        const arrowAngle = Math.PI / 7;

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowLen * Math.cos(angle - arrowAngle), endY - arrowLen * Math.sin(angle - arrowAngle));
        ctx.lineTo(endX - arrowLen * Math.cos(angle + arrowAngle), endY - arrowLen * Math.sin(angle + arrowAngle));
        ctx.closePath();
        ctx.fillStyle = isHoveredEdge ? '#0F172A' : '#64748B';
        ctx.fill();

        // Draw Relationship Label along the Edge Line
        if (e.label) {
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          let textAngle = angle;
          if (textAngle > Math.PI / 2) textAngle -= Math.PI;
          if (textAngle < -Math.PI / 2) textAngle += Math.PI;

          ctx.save();
          ctx.translate(midX, midY);
          ctx.rotate(textAngle);

          ctx.font = '700 9.5px JetBrains Mono, monospace';
          const textMetrics = ctx.measureText(e.label);
          const pillW = textMetrics.width + 10;
          const pillH = 15;

          // Background box
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(-pillW / 2, -pillH / 2, pillW, pillH);
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1;
          ctx.strokeRect(-pillW / 2, -pillH / 2, pillW, pillH);

          ctx.fillStyle = isHoveredEdge ? '#0F172A' : '#334155';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(e.label, 0, 0);

          ctx.restore();
        }
      });

      // 5. DRAW NODES WITH DISTINCT SHAPES & INTERNAL 2-LINE TEXT
      nodes.forEach(n => {
        const isHovered = hoveredNode && hoveredNode.id === n.id;
        const isSelected = selectedNode && selectedNode.id === n.id;
        const cfg = n.config;

        ctx.save();

        // Outer Glow Ring when hovered or selected
        if (isHovered || isSelected) {
          ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
          ctx.shadowBlur = 16;
        }

        ctx.fillStyle = cfg.fill;
        ctx.strokeStyle = cfg.stroke;
        ctx.lineWidth = cfg.strokeWidth;

        // Render Specific Shape
        if (cfg.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(n.x, n.y, cfg.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (cfg.shape === 'roundRect') {
          ctx.beginPath();
          ctx.roundRect(n.x - cfg.width / 2, n.y - cfg.height / 2, cfg.width, cfg.height, cfg.radius);
          ctx.fill();
          ctx.stroke();
        } else if (cfg.shape === 'hexagon') {
          const r = cfg.radius;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const hAngle = (i * Math.PI) / 3;
            const px = n.x + r * Math.cos(hAngle);
            const py = n.y + r * Math.sin(hAngle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (cfg.shape === 'diamond') {
          const r = cfg.radius;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y - r);
          ctx.lineTo(n.x + r, n.y);
          ctx.lineTo(n.x, n.y + r);
          ctx.lineTo(n.x - r, n.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();

        // Render Crisp Internal Text
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Line 1: Type / Title
        ctx.font = '700 12px Plus Jakarta Sans, sans-serif';
        ctx.fillText(cfg.label, n.x, n.y - 7);

        // Line 2: Value / ID
        ctx.font = '700 11px JetBrains Mono, monospace';
        ctx.fillText(cfg.sublabel, n.x, n.y + 8);
      });

      ctx.restore(); // Restore pan/zoom
      ctx.restore(); // Restore devicePixelRatio

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isExpanded, hoveredNode, selectedNode]);

  // Coordinate Conversion: Screen to Canvas World
  const screenToWorld = useCallback((screenX, screenY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: screenX, y: screenY };
    const rect = canvas.getBoundingClientRect();
    const xRel = screenX - rect.left;
    const yRel = screenY - rect.top;

    const width = rect.width;
    const height = rect.height;
    const { scale: currentScale, pan: currentPan } = transformRef.current;

    const worldX = (xRel - width / 2 - currentPan.x) / currentScale + width / 2;
    const worldY = (yRel - height / 2 - currentPan.y) / currentScale + height / 2;
    return { x: worldX, y: worldY, rawX: xRel, rawY: yRel };
  }, []);

  // Hit test for node under cursor
  const findNodeAtPos = useCallback((worldX, worldY) => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const cfg = n.config;
      const hitRadius = cfg.shape === 'roundRect' ? Math.max(cfg.width, cfg.height) / 2 : 40;
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (dx * dx + dy * dy <= (hitRadius + 8) * (hitRadius + 8)) {
        return n;
      }
    }
    return null;
  }, []);

  // Mouse Handlers for Dragging & Panning
  const handleMouseDown = (e) => {
    const { x, y, rawX, rawY } = screenToWorld(e.clientX, e.clientY);
    const hitNode = findNodeAtPos(x, y);

    if (hitNode) {
      draggedNodeRef.current = hitNode;
      setSelectedNode(hitNode);
    } else {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: rawX - pan.x, y: rawY - pan.y };
    }
  };

  const handleMouseMove = (e) => {
    const { x, y, rawX, rawY } = screenToWorld(e.clientX, e.clientY);

    // Node Dragging
    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    // Canvas Panning
    if (isDraggingCanvasRef.current) {
      setPan({
        x: rawX - dragStartRef.current.x,
        y: rawY - dragStartRef.current.y
      });
      return;
    }

    // Hover detection
    const hitNode = findNodeAtPos(x, y);
    if (hitNode) {
      setHoveredNode(hitNode);
      setTooltipPos({ x: rawX, y: rawY });
    } else if (hoveredNode) {
      setHoveredNode(null);
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingCanvasRef.current = false;
  };

  // Zoom Button Handlers (Mouse wheel zoom disabled so page scrolling does not change graph size)

  const handleZoomIn = () => setScale(prev => Math.min(2.8, prev * 1.25));
  const handleZoomOut = () => setScale(prev => Math.max(0.45, prev * 0.8));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const nodeCount = graphData?.nodes?.length || 0;
  const edgeCount = graphData?.edges?.length || 0;

  return (
    <div 
      ref={containerRef}
      className="glass-panel"
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: isExpanded ? '640px' : '500px', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        background: '#FAF9F7', 
        border: '1.5px solid var(--border-card)',
        boxShadow: 'var(--shadow-card)',
        userSelect: 'none',
        transition: 'height 0.25s ease'
      }}
    >
      {/* Top Left Header & Meta */}
      <div style={{ 
        position: 'absolute', 
        top: 14, 
        left: 18, 
        zIndex: 10, 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          background: '#FFFFFF',
          padding: '7px 16px',
          borderRadius: '9999px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Network size={15} color="#0F172A" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TigerGraph Knowledge Subgraph
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, paddingLeft: '6px', borderLeft: '1.5px solid #CBD5E1' }}>
            {nodeCount} Nodes • {edgeCount} Relationships
          </span>
        </div>
        <span className="badge badge-auto" style={{ fontWeight: 800 }}>Live Topology</span>
      </div>

      {/* Top Right Shape-Coded Legend */}
      <div style={{
        position: 'absolute',
        top: 14,
        right: 18,
        zIndex: 10,
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(8px)',
        padding: '7px 16px',
        borderRadius: '9999px',
        border: '1.5px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
          <span style={{ width: '13px', height: '9px', borderRadius: '2px', background: '#EA580C', border: '1.5px solid #FACC15' }}></span> Txn
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563EB', border: '1.5px solid #FACC15' }}></span> Customer
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
          <span style={{ width: '13px', height: '9px', borderRadius: '2px', background: '#0284C7', border: '1.5px solid #FACC15' }}></span> Card
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
          <span style={{ width: '13px', height: '9px', borderRadius: '2px', background: '#7C3AED', border: '1.5px solid #FACC15' }}></span> Device
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
          <span style={{ width: '10px', height: '10px', transform: 'rotate(30deg)', background: '#0D9488', border: '1.5px solid #FACC15' }}></span> Region
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
          <span style={{ width: '9px', height: '9px', transform: 'rotate(45deg)', background: '#DC2626', border: '1.5px solid #FACC15' }}></span> Similar
        </span>
      </div>

      {/* Floating Zoom Controls (Bottom Right) */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 18,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: '#FFFFFF',
        padding: '5px 8px',
        borderRadius: '9999px',
        border: '1.5px solid var(--border-card)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <button
          onClick={handleZoomIn}
          className="btn-secondary"
          style={{ width: '30px', height: '30px', padding: 0, justifyContent: 'center' }}
          title="Zoom In (+)"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={handleZoomOut}
          className="btn-secondary"
          style={{ width: '30px', height: '30px', padding: 0, justifyContent: 'center' }}
          title="Zoom Out (-)"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={handleResetZoom}
          className="btn-secondary"
          style={{ width: '30px', height: '30px', padding: 0, justifyContent: 'center' }}
          title="Reset View"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="btn-secondary"
          style={{ width: '30px', height: '30px', padding: 0, justifyContent: 'center' }}
          title={isExpanded ? "Collapse View" : "Expand View"}
        >
          {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
        <span className="mono" style={{ fontSize: '11px', color: '#0F172A', fontWeight: 800, padding: '0 8px' }}>
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Helpful Hint (Bottom Left) */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 18,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(6px)',
        padding: '6px 14px',
        borderRadius: '9999px',
        border: '1.5px solid var(--border-subtle)',
        fontSize: '11px',
        color: '#334155',
        fontWeight: 600,
        pointerEvents: 'none'
      }}>
        <Info size={13} color="#2563EB" />
        <span>Directed semantic relationships • Drag nodes to reposition • Zoom buttons (+/-) • Hover for details</span>
      </div>

      {/* Floating Node Hover Preview Card */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltipPos.x + 18, (containerRef.current?.clientWidth || 960) - 290),
          top: Math.max(16, Math.min(tooltipPos.y - 30, (isExpanded ? 640 : 500) - 260)),
          zIndex: 30,
          width: '270px',
          background: '#FFFFFF',
          border: '2px solid #0F172A',
          borderRadius: '12px',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.22)',
          padding: '16px',
          pointerEvents: 'none',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              color: '#FFFFFF', 
              background: hoveredNode.config.fill, 
              padding: '2px 8px', 
              borderRadius: '9999px', 
              border: `1.5px solid ${hoveredNode.config.stroke}`,
              textTransform: 'uppercase'
            }}>
              {hoveredNode.config.badge}
            </span>
            <span className="mono" style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
              {hoveredNode.type}
            </span>
          </div>

          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
            {hoveredNode.config.label} {hoveredNode.config.sublabel}
          </div>

          {hoveredNode.details && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px', 
              fontSize: '11px', 
              borderTop: '1.5px solid #E2E8F0', 
              paddingTop: '10px' 
            }}>
              {Object.entries(hoveredNode.details).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>{k}:</span>
                  <span className="mono" style={{ color: '#0F172A', fontWeight: 700, textAlign: 'right' }}>
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HTML5 Canvas */}
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block', 
          cursor: hoveredNode ? 'grab' : (isDraggingCanvasRef.current ? 'grabbing' : 'default') 
        }} 
      />
    </div>
  );
}
