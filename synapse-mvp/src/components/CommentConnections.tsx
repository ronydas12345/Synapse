import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@xyflow/react';
import type { Node } from '@xyflow/react';

interface CommentConnectionsProps {
  nodes: Node[];
}

const FALLBACK: Record<string, { width: number; height: number }> = {
  comment: { width: 256, height: 200 },
  track: { width: 288, height: 160 },
  splitter: { width: 288, height: 160 },
  conditional: { width: 288, height: 160 },
  randomizer: { width: 224, height: 220 },
  transition: { width: 256, height: 100 },
  start: { width: 128, height: 80 },
  end: { width: 128, height: 80 },
};

function nodeCenter(node: Node): [number, number] {
  const fallback = FALLBACK[node.type || ''] || { width: 160, height: 100 };
  const w = node.measured?.width ?? node.width ?? fallback.width;
  const h = node.measured?.height ?? node.height ?? fallback.height;
  const x = node.position?.x || 0;
  const y = node.position?.y || 0;
  return [x + w / 2, y + h / 2];
}

/**
 * Center-to-center dotted annotation lines, portaled into React Flow's edges
 * pane so they render behind nodes (same layer as playback edges, not above).
 * Uses data.linkedNodeId — not play-path connectivity.
 */
export default function CommentConnections({ nodes }: CommentConnectionsProps) {
  const edgesPane = useStore(
    (s) => s.domNode?.querySelector('.react-flow__edges') ?? null
  );

  const lines = useMemo(() => {
    const lineList: { pathData: string; key: string }[] = [];
    for (const commentNode of nodes) {
      if (commentNode.type !== 'comment' || commentNode.hidden) continue;
      const linkedId = commentNode.data?.linkedNodeId;
      if (!linkedId || typeof linkedId !== 'string') continue;
      const linkedNode = nodes.find((n) => n.id === linkedId);
      if (!linkedNode || linkedNode.hidden) continue;

      const [cx0, cy0] = nodeCenter(commentNode);
      const [cx1, cy1] = nodeCenter(linkedNode);
      const dx = cx1 - cx0;
      const dy = cy1 - cy0;
      const qx = cx0 + dx * 0.3;
      const qy = cy0 + dy * 0.5;
      lineList.push({
        key: `${commentNode.id}-${linkedNode.id}`,
        pathData: `M ${cx0} ${cy0} Q ${qx} ${qy} ${cx1} ${cy1}`,
      });
    }
    return lineList;
  }, [nodes]);

  if (!edgesPane || lines.length === 0) return null;

  return createPortal(
    <svg aria-hidden="true">
      {lines.map((line) => (
        <path
          key={line.key}
          d={line.pathData}
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="6,4"
          fill="none"
          opacity="0.7"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>,
    edgesPane
  );
}
