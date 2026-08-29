
import { getBezierPath } from '@xyflow/react';

export default function CommentEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: any) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <g>
      <path
        d={edgePath}
        stroke="#6b7280"
        strokeWidth={2}
        strokeDasharray="6,4"
        fill="none"
        opacity="0.6"
      />
    </g>
  );
}
