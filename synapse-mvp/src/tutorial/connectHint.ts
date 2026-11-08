import type { Edge, Node } from '@xyflow/react';
import type { TutorialStep } from './tutorialTypes';

export interface ConnectPair {
  sourceId: string;
  targetId: string;
}

export interface HandlePoint {
  x: number;
  y: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ConnectHintGeom {
  source: HandlePoint;
  target: HandlePoint;
}

export function stepAsksForConnection(step: TutorialStep | undefined): boolean {
  if (!step) return false;
  if (step.expectedAction?.type === 'nodes-connected') return true;
  return /(?:^|-)connect$/.test(step.id);
}

function hasDirected(edges: Edge[], source: string, target: string): boolean {
  return edges.some((edge) => edge.source === source && edge.target === target);
}

function byCanvasOrder(a: Node, b: Node): number {
  return a.position.x - b.position.x || a.position.y - b.position.y;
}

export function findSuggestedConnection(
  nodes: Node[],
  edges: Edge[]
): ConnectPair | null {
  const visible = nodes.filter((node) => !node.hidden && node.type !== 'comment');
  const start = visible.find((node) => node.type === 'start');
  const randomizer = visible.find((node) => node.type === 'randomizer');
  const end = visible.find((node) => node.type === 'end');
  const tracks = visible.filter((node) => node.type === 'track').sort(byCanvasOrder);

  if (start && randomizer && !hasDirected(edges, start.id, randomizer.id)) {
    return { sourceId: start.id, targetId: randomizer.id };
  }
  if (randomizer && end && !hasDirected(edges, randomizer.id, end.id)) {
    return { sourceId: randomizer.id, targetId: end.id };
  }
  if (start && tracks[0] && !hasDirected(edges, start.id, tracks[0].id)) {
    return { sourceId: start.id, targetId: tracks[0].id };
  }

  for (let i = 0; i < tracks.length - 1; i++) {
    if (!hasDirected(edges, tracks[i].id, tracks[i + 1].id)) {
      return { sourceId: tracks[i].id, targetId: tracks[i + 1].id };
    }
  }

  const transitions = visible.filter((node) => node.type === 'transition').sort(byCanvasOrder);
  if (tracks[0] && transitions[0] && !hasDirected(edges, tracks[0].id, transitions[0].id)) {
    return { sourceId: tracks[0].id, targetId: transitions[0].id };
  }
  if (transitions[0] && tracks[1] && !hasDirected(edges, transitions[0].id, tracks[1].id)) {
    return { sourceId: transitions[0].id, targetId: tracks[1].id };
  }

  if (!randomizer && !end && transitions.length === 0) {
    return null;
  }

  const sources = visible.filter((node) => node.type !== 'end');
  const targets = visible.filter((node) => node.type !== 'start');
  for (const src of sources) {
    if (edges.some((edge) => edge.source === src.id)) continue;
    const tgt = targets.find((node) => node.id !== src.id && !hasDirected(edges, src.id, node.id));
    if (tgt) return { sourceId: src.id, targetId: tgt.id };
  }
  return null;
}

function nodeEl(nodeId: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(`.react-flow__node[data-id="${CSS.escape(nodeId)}"]`);
}

function handleEl(nodeId: string, kind: 'source' | 'target'): HTMLElement | null {
  const node = nodeEl(nodeId);
  if (!node) return null;
  return node.querySelector(`.react-flow__handle-${kind}`);
}

function pointFromEl(el: HTMLElement): HandlePoint {
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
  };
}

function fallbackPoint(nodeId: string, kind: 'source' | 'target'): HandlePoint | null {
  const node = nodeEl(nodeId);
  if (!node) return null;
  const r = node.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  const x = kind === 'source' ? r.right : r.left;
  const y = r.top + r.height / 2;
  return { x, y, left: x - 5, top: y - 5, width: 10, height: 10 };
}

export function measureConnectHint(pair: ConnectPair): ConnectHintGeom | null {
  const sourceEl = handleEl(pair.sourceId, 'source');
  const targetEl = handleEl(pair.targetId, 'target');
  const source = sourceEl ? pointFromEl(sourceEl) : fallbackPoint(pair.sourceId, 'source');
  const target = targetEl ? pointFromEl(targetEl) : fallbackPoint(pair.targetId, 'target');
  if (!source || !target) return null;
  return { source, target };
}

export function connectGeomClose(a: ConnectHintGeom | null, b: ConnectHintGeom | null, eps = 0.6): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.source.x - b.source.x) < eps &&
    Math.abs(a.source.y - b.source.y) < eps &&
    Math.abs(a.target.x - b.target.x) < eps &&
    Math.abs(a.target.y - b.target.y) < eps
  );
}
