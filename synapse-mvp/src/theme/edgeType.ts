import {
  THEME_EDGE_TYPES,
  type ThemeEdgeType,
} from './types';

export type HandleSide = 'left' | 'right' | 'top' | 'bottom';

export const THEME_EDGE_TYPE_OPTIONS: {
  id: ThemeEdgeType;
  label: string;
  hint: string;
}[] = [
  { id: 'bezier', label: 'Bezier', hint: 'Smooth cubic curves' },
  { id: 'simpleBezier', label: 'Simple bezier', hint: 'Softer two-handle curve' },
  { id: 'straight', label: 'Straight', hint: 'Direct line between handles' },
  { id: 'rectangular', label: 'Rectangular', hint: 'Right-angle elbows' },
  { id: 'rounded', label: 'Rounded', hint: 'Right angles with rounded corners' },
  { id: 'triangular', label: 'Triangular', hint: 'Straight, then 45°, then straight' },
];

export function sanitizeEdgeType(
  value: unknown,
  fallback: ThemeEdgeType = 'bezier'
): ThemeEdgeType {
  if (typeof value === 'string' && (THEME_EDGE_TYPES as readonly string[]).includes(value)) {
    return value as ThemeEdgeType;
  }
  return fallback;
}

export function toReactFlowEdgeType(type: ThemeEdgeType): string {
  switch (type) {
    case 'simpleBezier':
      return 'simplebezier';
    case 'straight':
      return 'straight';
    case 'rectangular':
      return 'step';
    case 'rounded':
      return 'smoothstep';
    case 'triangular':
      return 'triangular';
    default:
      return 'default';
  }
}

function outward(side: HandleSide): { x: number; y: number } {
  if (side === 'left') return { x: -1, y: 0 };
  if (side === 'right') return { x: 1, y: 0 };
  if (side === 'top') return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

function asSide(value: string | undefined): HandleSide {
  if (value === 'left' || value === 'right' || value === 'top' || value === 'bottom') {
    return value;
  }
  return 'right';
}

export function getTriangularPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = 'right',
  targetPosition = 'left',
  stub = 20,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: string;
  targetPosition?: string;
  stub?: number;
}): { path: string; labelX: number; labelY: number } {
  const s = outward(asSide(sourcePosition));
  const t = outward(asSide(targetPosition));
  const dist = Math.hypot(targetX - sourceX, targetY - sourceY);
  const lead = Math.max(8, Math.min(stub, dist / 4));
  const p0 = { x: sourceX, y: sourceY };
  const p1 = { x: sourceX + s.x * lead, y: sourceY + s.y * lead };
  const pLast = { x: targetX + t.x * lead, y: targetY + t.y * lead };
  const pEnd = { x: targetX, y: targetY };

  const dx = pLast.x - p1.x;
  const dy = pLast.y - p1.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);

  const pts = [p0, p1];
  if (adx > 0.5 || ady > 0.5) {
    if (Math.abs(adx - ady) >= 0.5) {
      if (adx > ady) {
        pts.push({ x: p1.x + sx * (adx - ady), y: p1.y });
      } else {
        pts.push({ x: p1.x, y: p1.y + sy * (ady - adx) });
      }
    }
  }
  pts.push(pLast, pEnd);

  const unique: { x: number; y: number }[] = [];
  for (const point of pts) {
    const prev = unique[unique.length - 1];
    if (prev && Math.hypot(point.x - prev.x, point.y - prev.y) < 0.25) continue;
    unique.push(point);
  }
  if (unique.length === 1) unique.push(pEnd);

  const path = unique
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const mid = unique[Math.floor(unique.length / 2)] ?? pEnd;
  return { path, labelX: mid.x, labelY: mid.y };
}

export function previewEdgePath(type: ThemeEdgeType, width = 72, height = 28): string {
  const sx = 2;
  const tx = width - 2;
  const midY = height / 2;
  switch (type) {
    case 'straight':
      return `M ${sx} ${midY} L ${tx} ${midY}`;
    case 'simpleBezier':
      return `M ${sx} ${midY} C ${sx + 22} ${4}, ${tx - 22} ${height - 4}, ${tx} ${midY}`;
    case 'rectangular': {
      const mx = width / 2;
      return `M ${sx} ${midY} L ${mx} ${midY} L ${mx} ${height - 4} L ${tx} ${height - 4}`;
    }
    case 'rounded': {
      const mx = width / 2;
      return `M ${sx} ${midY} L ${mx - 6} ${midY} Q ${mx} ${midY} ${mx} ${midY + 6} L ${mx} ${height - 10} Q ${mx} ${height - 4} ${mx + 6} ${height - 4} L ${tx} ${height - 4}`;
    }
    case 'triangular':
      return getTriangularPath({
        sourceX: sx,
        sourceY: 6,
        targetX: tx,
        targetY: height - 6,
        sourcePosition: 'right',
        targetPosition: 'left',
        stub: 12,
      }).path;
    default:
      return `M ${sx} ${midY} C ${sx + 24} ${midY}, ${tx - 24} ${midY}, ${tx} ${midY}`;
  }
}
