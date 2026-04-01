import React from 'react';
import { getBezierPath } from '@xyflow/react';

export default function DashedCommentEdge({
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
        stroke="#94a3b8"
        strokeWidth={2}
        strokeDasharray="5,5"
        fill="none"
        opacity="0.6"
      />
    </g>
  );
}
