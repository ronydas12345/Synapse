import { BaseEdge, type EdgeProps } from '@xyflow/react';
import { getTriangularPath } from '../../theme/edgeType';

export default function TriangularEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const { path } = getTriangularPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
}
