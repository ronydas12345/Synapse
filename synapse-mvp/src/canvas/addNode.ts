import type { Node } from '@xyflow/react';
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

export function buildCanvasNode(type: CanvasNodeType, position: CanvasPoint): Node {
  return {
    id: `${type}-${Date.now()}`,
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
  setNodes([
    ...nodes,
    buildCanvasNode(
      type,
      canvasPositionAtPointer(position ?? clickPlacement(), type)
    ),
  ]);
  return null;
}
