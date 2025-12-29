import { useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  MarkerType,
  OnNodeClick
} from 'react-flow-renderer';
import { motion } from 'framer-motion';
import { useExplorationStore } from '../state/explorationStore';
import { NodeActionMenu } from './NodeActionMenu';
import { useMockApi } from '../hooks/useMockApi';

interface Props {
  onExplain: (text: string, path: string[]) => void;
}

type SelectedNode = { id: string; label: string; x: number; y: number };

export function GraphCanvas({ onExplain }: Props) {
  const { graph, animation } = useExplorationStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const api = useMockApi();

  const baseNodes = useMemo(
    () =>
      graph?.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        category: node.category,
        position: { x: node.position?.x ?? 0, y: node.position?.y ?? 0 }
      })) ?? [],
    [graph]
  );

  const centerPosition = useMemo(() => {
    const centerId = graph?.centerNodeId;
    const node = graph?.nodes.find((n) => n.id === centerId);
    return node?.position ?? { x: 0, y: 0 };
  }, [graph]);

  const [animatedNodes, setAnimatedNodes] = useState<Node[]>([]);

  useEffect(() => {
    let frame: number;
    const startTime = performance.now();

    const animate = () => {
      const t = performance.now() - startTime;
      const updated = baseNodes.map((node, idx) => {
        const { x: bx, y: by } = node.position;
        let x = bx;
        let y = by;
        const dx = bx - centerPosition.x;
        const dy = by - centerPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        switch (animation) {
          case 'gentle-drift': {
            x = bx + Math.sin(t / 1200 + idx) * 6;
            y = by + Math.cos(t / 1300 + idx) * 6;
            break;
          }
          case 'circular-orbit': {
            const baseAngle = Math.atan2(dy, dx);
            const angularSpeed = 0.0004 + (idx % 5) * 0.00005;
            const angle = baseAngle + t * angularSpeed;
            const r = dist;
            x = centerPosition.x + r * Math.cos(angle);
            y = centerPosition.y + r * Math.sin(angle);
            break;
          }
          case 'constellation-pulse': {
            const scale = 1 + 0.04 * Math.sin(t / 800 + idx);
            x = centerPosition.x + dx * scale;
            y = centerPosition.y + dy * scale;
            break;
          }
          default:
            break;
        }
        return {
          id: node.id,
          data: { label: node.label, category: node.category },
          position: { x, y },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          className: 'bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg'
        } as Node;
      });
      setAnimatedNodes(updated);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [animation, baseNodes, centerPosition.x, centerPosition.y]);

  const edges: Edge[] = useMemo(() => {
    return (
      graph?.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'default',
        animated: animation === 'constellation-pulse',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#4a5568' },
        labelStyle: { fill: '#cbd5e1', fontWeight: 500 }
      })) ?? []
    );
  }, [graph, animation]);

  const onNodeClick: OnNodeClick = (event, node) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    const x = bounds ? event.clientX - bounds.left : event.clientX;
    const y = bounds ? event.clientY - bounds.top : event.clientY;
    setSelectedNode({ id: node.id, label: String(node.data?.label ?? node.id), x, y });
  };

  return (
    <div className="h-full bg-background" ref={containerRef}>
      {graph ? (
        <div className="h-full relative">
          <ReactFlow nodes={animatedNodes} edges={edges} fitView onNodeClick={onNodeClick}>
            <Background color="#1f2937" />
            <MiniMap className="bg-slate-900" />
            <Controls position="bottom-right" />
          </ReactFlow>

          {selectedNode && (
            <NodeActionMenu
              nodeId={selectedNode.id}
              label={selectedNode.label}
              x={selectedNode.x}
              y={selectedNode.y}
              onExplain={async () => {
                const explanation = await api.explain(selectedNode.id);
                onExplain(explanation.explanation, explanation.contextPath);
              }}
              onExpand={() => api.expand(selectedNode.id)}
              onClose={() => setSelectedNode(null)}
            />
          )}

          <div className="absolute inset-0 pointer-events-none">
            {animation === 'gentle-drift' && <DriftLayer />}
            {animation === 'constellation-pulse' && <PulseLayer />}
            {animation === 'circular-orbit' && <OrbitLayer />}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-slate-300">Start an exploration to see the graph.</div>
      )}
    </div>
  );
}

function DriftLayer() {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 6, repeat: Infinity }}
    />
  );
}

function PulseLayer() {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ scale: [1, 1.02, 1], opacity: [0.6, 0.8, 0.6] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
  );
}

function OrbitLayer() {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />
  );
}
