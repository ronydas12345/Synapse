import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';

interface CommentConnectionsProps {
  nodes: Node[];
}

// Get approximate center point of a node based on its type
function getNodeCenter(node: Node): [number, number] {
  const x = node.position?.x || 0;
  const y = node.position?.y || 0;

  // Approximate dimensions for each node type (based on Tailwind w-* classes)
  const widths: Record<string, number> = {
    comment: 256,      // w-64
    track: 288,        // w-72
    splitter: 224,     // w-56
    randomizer: 224,   // w-56
    transition: 224,   // w-56
    start: 120,        // smaller
    end: 120,          // smaller
  };

  const heights: Record<string, number> = {
    comment: 240,      // header + buttons + textarea
    track: 500,        // expanded, can collapse to ~140
    splitter: 160,     // paths section + header
    randomizer: 240,   // tracks + weights + header
    transition: 160,   // type selector + settings
    start: 80,         // minimal
    end: 80,           // minimal
  };

  const nodeType = node.type || 'comment';
  const w = widths[nodeType] || 100;
  const h = heights[nodeType] || 80;

  return [x + w / 2, y + h / 2];
}

export default function CommentConnections({ nodes }: CommentConnectionsProps) {
  const { getViewport } = useReactFlow();
  const viewport = getViewport();

  const lines = useMemo(() => {
    const lineList = [];
    for (const commentNode of nodes) {
      if (commentNode.type === 'comment' && commentNode.data?.linkedNodeId) {
        const linkedNode = nodes.find((n) => n.id === commentNode.data?.linkedNodeId);
        if (!linkedNode) continue;

        // Get world coordinates
        const [commentWorldX, commentWorldY] = getNodeCenter(commentNode);
        const [linkedWorldX, linkedWorldY] = getNodeCenter(linkedNode);

        // Create bezier path with world coordinates
        const dx = linkedWorldX - commentWorldX;
        const dy = linkedWorldY - commentWorldY;
        const cx = commentWorldX + dx * 0.3;
        const cy = commentWorldY + dy * 0.5;

        const pathData = `M ${commentWorldX} ${commentWorldY} Q ${cx} ${cy} ${linkedWorldX} ${linkedWorldY}`;

        lineList.push({
          pathData,
          key: `${commentNode.id}-${linkedNode.id}`,
        });
      }
    }
    return lineList;
  }, [nodes]);

  // Apply React Flow's viewport transform to the SVG
  const transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        transform,
        transformOrigin: '0 0',
      }}
    >
      {lines.map((line) =>
        line ? (
          <path
            key={line.key}
            d={line.pathData}
            stroke="#6b7280"
            strokeWidth="2"
            strokeDasharray="6,4"
            fill="none"
            opacity="0.6"
            vectorEffect="non-scaling-stroke"
          />
        ) : null
      )}
    </svg>
  );
}

