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
  if (type === 'start') return { label: 'Start' };
  if (type === 'track') return defaultTrackNodeData();
  if (type === 'conditional') {
    return {
      numPaths: 2,
      weights: [10, 10],
      mode: 'random',
      pathTimeRanges: [[{ start: 0, end: 23 }], [{ start: 0, end: 23 }]],
    };
  }
  if (type === 'randomizer') {
    return {
      tracks: [],
      weights: [],
      isCollapsed: false,
      playCount: 1,
      mode: 'sequence',
    };
  }
  if (type === 'transition') {
    return { type: 'silence', duration: 1, audioFile: null, videoId: '' };
  }
  if (type === 'style') return { ...defaultStyleNodeData() };
  if (type === 'comment') return { text: '', linkedNodeId: null };
  return { label: 'End' };
}

export function canvasNodeDragPayload(type: CanvasNodeType): {
  type: CanvasNodeType;
  defaultData: Record<string, unknown>;
} {
  return { type, defaultData: defaultData(type) };
}

export function addCanvasNode(type: CanvasNodeType): string | null {
  const { nodes, setNodes } = usePathStore.getState();
  if (type === 'start' && nodes.some((node) => node.type === 'start')) {
    return 'There can only be one Start node.';
  }
  const node: Node = {
    id: `${type}-${Date.now()}`,
    type,
    position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
    data: defaultData(type),
  };
  setNodes([...nodes, node]);
  return null;
}
