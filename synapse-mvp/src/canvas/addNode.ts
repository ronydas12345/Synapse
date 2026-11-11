import type { Node } from '@xyflow/react';
import { overlapArea, type FlowRect } from '../randomizerDrop';
import { defaultStyleNodeData } from '../styleNode/parse';
import { defaultTrackNodeData } from '../settings/nodeDefaults';
import { usePathStore } from '../store';

export const CANVAS_NODE_TYPES = [
  { type: 'start', label: 'Start' },
  { type: 'track', label: 'Track' },
  { type: 'conditional', label: 'Conditional' },
  { type: 'randomizer', label: 'Randomizer' },
  { type: 'transition', label: 'Transition' },
  { type: 'style', label: 'Style' },
  { type: 'comment', label: 'Comment' },
  { type: 'end', label: 'End' },
] as const;

export type CanvasNodeType = (typeof CANVAS_NODE_TYPES)[number]['type'];

function defaultData(type: CanvasNodeType): Record<string, unknown> {
  if (type === 'start') return { label: 'Start', name: '' };
  if (type === 'track') return defaultTrackNodeData();
  if (type === 'conditional') {
    return {
      name: '',
      numPaths: 2,
      weights: [10, 10],
      mode: 'random',
      pathNames: ['', ''],
      pathKeys: ['1', '2'],
      pathTimeRanges: [[{ start: 0, end: 23 }], [{ start: 0, end: 23 }]],
    };
  }
  if (type === 'randomizer') {
    return {
      name: '',
      tracks: [],
      weights: [],
      isCollapsed: false,
      playCount: 1,
      mode: 'sequence',
    };
  }
  if (type === 'transition') {
    return { name: '', type: 'silence', duration: 1, audioFile: null, videoId: '' };
  }
  if (type === 'style') return { ...defaultStyleNodeData(), name: '' };
  if (type === 'comment') return { name: '', text: '', linkedNodeId: null };
  return { label: 'End', name: '' };
}

export type CanvasPoint = { x: number; y: number };

export function canvasNodeDragPayload(type: CanvasNodeType): {
  type: CanvasNodeType;
  defaultData: Record<string, unknown>;
} {
  return { type, defaultData: defaultData(type) };
}

export function isCanvasNodeType(value: unknown): value is CanvasNodeType {
  return CANVAS_NODE_TYPES.some((item) => item.type === value);
}

export function canvasAddError(
  type: CanvasNodeType,
  nodes: { type?: string }[]
): string | null {
  if (type === 'start' && nodes.some((node) => node.type === 'start')) {
    return 'There can only be one Start node.';
  }
  return null;
}

const PLACE_SIZE: Record<CanvasNodeType, { width: number; height: number }> = {
  start: { width: 160, height: 72 },
  track: { width: 288, height: 160 },
  conditional: { width: 220, height: 140 },
  randomizer: { width: 224, height: 180 },
  transition: { width: 200, height: 120 },
  style: { width: 200, height: 120 },
  comment: { width: 200, height: 120 },
  end: { width: 160, height: 72 },
};

const PLACE_GAP = 32;
const PLACE_STEP = 56;

export function canvasNodeSize(type: CanvasNodeType): { width: number; height: number } {
  return PLACE_SIZE[type];
}

export function canvasPositionAtPointer(
  pointer: CanvasPoint,
  type: CanvasNodeType
): CanvasPoint {
  const size = PLACE_SIZE[type];
  return {
    x: pointer.x - size.width / 2,
    y: pointer.y - size.height / 2,
  };
}

function occupiedRect(node: {
  type?: string;
  position: CanvasPoint;
  hidden?: boolean;
  width?: number;
  height?: number;
  measured?: { width?: number; height?: number };
}): FlowRect | null {
  if (node.hidden) return null;
  const fallback =
    node.type && node.type in PLACE_SIZE
      ? PLACE_SIZE[node.type as CanvasNodeType]
      : { width: 200, height: 150 };
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.measured?.width ?? node.width ?? fallback.width,
    height: node.measured?.height ?? node.height ?? fallback.height,
  };
}

function overlapsExisting(candidate: FlowRect, occupied: FlowRect[]): boolean {
  const padded: FlowRect = {
    x: candidate.x - PLACE_GAP / 2,
    y: candidate.y - PLACE_GAP / 2,
    width: candidate.width + PLACE_GAP,
    height: candidate.height + PLACE_GAP,
  };
  return occupied.some((rect) => overlapArea(padded, rect) > 1);
}

/** Top-left of `type` near `center`, shifted so it does not cover existing nodes. */
export function clearCanvasPosition(
  center: CanvasPoint,
  type: CanvasNodeType,
  nodes: Parameters<typeof occupiedRect>[0][]
): CanvasPoint {
  const size = PLACE_SIZE[type];
  const origin = canvasPositionAtPointer(center, type);
  const occupied = nodes
    .map(occupiedRect)
    .filter((rect): rect is FlowRect => rect != null);
  const fits = (pos: CanvasPoint) =>
    !overlapsExisting({ x: pos.x, y: pos.y, width: size.width, height: size.height }, occupied);
  if (fits(origin)) return origin;

  for (let ring = 1; ring <= 20; ring++) {
    const step = PLACE_STEP * ring;
    const candidates: CanvasPoint[] = [];
    for (let y = -ring; y <= ring; y++) {
      candidates.push({ x: origin.x + step, y: origin.y + y * PLACE_STEP });
    }
    for (let x = ring - 1; x >= -ring; x--) {
      candidates.push({ x: origin.x + x * PLACE_STEP, y: origin.y + step });
    }
    for (let y = ring - 1; y >= -ring; y--) {
      candidates.push({ x: origin.x - step, y: origin.y + y * PLACE_STEP });
    }
    for (let x = -ring + 1; x < ring; x++) {
      candidates.push({ x: origin.x + x * PLACE_STEP, y: origin.y - step });
    }
    for (const pos of candidates) {
      if (fits(pos)) return pos;
    }
  }
  return origin;
}

let placeSeq = 0;

export function buildCanvasNode(type: CanvasNodeType, position: CanvasPoint): Node {
  placeSeq += 1;
  return {
    id: `${type}-${Date.now()}-${placeSeq}`,
    type,
    position,
    data: defaultData(type),
  };
}

let viewportCenter: (() => CanvasPoint) | null = null;

export function registerCanvasPlacement(getCenter: () => CanvasPoint): () => void {
  viewportCenter = getCenter;
  return () => {
    if (viewportCenter === getCenter) viewportCenter = null;
  };
}

function clickPlacement(): CanvasPoint {
  return viewportCenter?.() ?? { x: 240, y: 180 };
}

export function addCanvasNode(
  type: CanvasNodeType,
  position?: CanvasPoint
): string | null {
  const { nodes, setNodes } = usePathStore.getState();
  const error = canvasAddError(type, nodes);
  if (error) return error;
  const topLeft = position
    ? canvasPositionAtPointer(position, type)
    : clearCanvasPosition(clickPlacement(), type, nodes);
  setNodes([...nodes, buildCanvasNode(type, topLeft)]);
  return null;
}
