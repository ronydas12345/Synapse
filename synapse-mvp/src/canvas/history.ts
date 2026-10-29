import type { Edge, Node } from '@xyflow/react';

export interface GraphSnap {
  nodes: Node[];
  edges: Edge[];
}

const MAX_PAST = 80;
const COALESCE_MS = 450;

let past: GraphSnap[] = [];
let future: GraphSnap[] = [];
let current: GraphSnap | null = null;
let lastCoalesceKey = '';
let lastCoalesceAt = 0;
let groupDepth = 0;
let groupedInSession = false;

export function resetHistory(nodes: Node[], edges: Edge[]): void {
  past = [];
  future = [];
  current = normalizeSnap(nodes, edges);
  lastCoalesceKey = '';
  lastCoalesceAt = 0;
  groupDepth = 0;
  groupedInSession = false;
}

export function beginHistoryGroup(): void {
  groupDepth += 1;
  groupedInSession = false;
}

export function endHistoryGroup(): void {
  groupDepth = Math.max(0, groupDepth - 1);
  if (groupDepth === 0) {
    groupedInSession = false;
    lastCoalesceKey = '';
  }
}

export function recordEdit(
  nodes: Node[],
  edges: Edge[],
  opts?: { coalesceKey?: string }
): void {
  const next = normalizeSnap(nodes, edges);
  if (!current) {
    current = next;
    return;
  }
  if (snapEqual(current, next)) return;

  const now = Date.now();
  const coalesce =
    Boolean(opts?.coalesceKey) &&
    opts!.coalesceKey === lastCoalesceKey &&
    now - lastCoalesceAt < COALESCE_MS;

  if ((groupDepth > 0 && groupedInSession) || coalesce) {
    current = next;
    lastCoalesceAt = now;
    if (opts?.coalesceKey) lastCoalesceKey = opts.coalesceKey;
    return;
  }

  past.push(current);
  if (past.length > MAX_PAST) past.shift();
  future = [];
  current = next;
  lastCoalesceKey = opts?.coalesceKey ?? '';
  lastCoalesceAt = now;
  if (groupDepth > 0) groupedInSession = true;
}

export function undo(): GraphSnap | null {
  if (past.length === 0 || !current) return null;
  future.push(current);
  current = past.pop()!;
  lastCoalesceKey = '';
  return cloneSnap(current);
}

export function redo(): GraphSnap | null {
  if (future.length === 0 || !current) return null;
  past.push(current);
  current = future.pop()!;
  lastCoalesceKey = '';
  return cloneSnap(current);
}

export function canUndo(): boolean {
  return past.length > 0;
}

export function canRedo(): boolean {
  return future.length > 0;
}

export function historyDepth(): { past: number; future: number } {
  return { past: past.length, future: future.length };
}

function nodeFields(node: Node): unknown {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    hidden: Boolean(node.hidden),
    parentId: node.parentId ?? null,
  };
}

function edgeFields(edge: Edge): unknown {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  };
}

export function normalizeSnap(nodes: Node[], edges: Edge[]): GraphSnap {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: { ...node.position },
      data: node.data,
      hidden: node.hidden,
      parentId: node.parentId,
      style: node.style,
      width: node.width,
      height: node.height,
    })),
    edges: edges
      .filter((edge) => !String(edge.id).startsWith('dashed-'))
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        markerEnd: edge.markerEnd,
        type: edge.type,
      })),
  };
}

function snapEqual(a: GraphSnap, b: GraphSnap): boolean {
  if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) {
    return false;
  }
  return JSON.stringify(a.nodes.map(nodeFields)) === JSON.stringify(b.nodes.map(nodeFields))
    && JSON.stringify(a.edges.map(edgeFields)) === JSON.stringify(b.edges.map(edgeFields));
}

function cloneSnap(snap: GraphSnap): GraphSnap {
  return {
    nodes: snap.nodes.map((node) => ({ ...node, position: { ...node.position } })),
    edges: snap.edges.map((edge) => ({ ...edge })),
  };
}
