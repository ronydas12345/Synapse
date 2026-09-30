import type { Edge, Node } from '@xyflow/react';
import { nodeSize } from '../randomizerDrop';
import { nodeCustomName } from '../nodes/nodeName';

export const PAGE_ORIGIN = { x: 80, y: 80 };
export const PAGE_GAP = 72;
export const PAGE_WRAP_WIDTH = 1400;

type Box = { minX: number; minY: number; maxX: number; maxY: number };

function visible(node: Node): boolean {
  return !node.hidden;
}

function bboxOf(nodes: Node[], ids: Set<string>): Box | null {
  let box: Box | null = null;
  for (const node of nodes) {
    if (!ids.has(node.id) || !visible(node)) continue;
    const size = nodeSize(node);
    const minX = node.position.x;
    const minY = node.position.y;
    const maxX = minX + size.width;
    const maxY = minY + size.height;
    if (!box) box = { minX, minY, maxX, maxY };
    else {
      box.minX = Math.min(box.minX, minX);
      box.minY = Math.min(box.minY, minY);
      box.maxX = Math.max(box.maxX, maxX);
      box.maxY = Math.max(box.maxY, maxY);
    }
  }
  return box;
}

function parkedIdsFor(nodes: Node[], ownerIds: Set<string>): Set<string> {
  const extra = new Set<string>();
  for (const node of nodes) {
    if (node.type !== 'randomizer' || !ownerIds.has(node.id)) continue;
    for (const trackId of (node.data?.tracks as string[]) || []) {
      if (trackId) extra.add(trackId);
    }
  }
  return extra;
}

function translate(
  nodes: Node[],
  ids: Set<string>,
  dx: number,
  dy: number
): Node[] {
  if (!dx && !dy) return nodes;
  return nodes.map((node) =>
    ids.has(node.id)
      ? {
          ...node,
          position: { x: node.position.x + dx, y: node.position.y + dy },
        }
      : node
  );
}

function connectedComponents(nodes: Node[], edges: Edge[]): string[][] {
  const visibleIds = new Set(nodes.filter(visible).map((node) => node.id));
  const adj = new Map<string, string[]>();
  for (const id of visibleIds) adj.set(id, []);
  for (const edge of edges) {
    if (!visibleIds.has(edge.source) || !visibleIds.has(edge.target)) continue;
    adj.get(edge.source)!.push(edge.target);
    adj.get(edge.target)!.push(edge.source);
  }
  const seen = new Set<string>();
  const groups: string[][] = [];
  for (const id of visibleIds) {
    if (seen.has(id)) continue;
    const stack = [id];
    const group: string[] = [];
    seen.add(id);
    while (stack.length) {
      const cur = stack.pop()!;
      group.push(cur);
      for (const next of adj.get(cur) || []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    groups.push(group);
  }
  return groups;
}

function packGroups(nodes: Node[], groups: string[][]): Node[] {
  let cursorX = PAGE_ORIGIN.x;
  let cursorY = PAGE_ORIGIN.y;
  let rowHeight = 0;
  let next = nodes;
  for (const group of groups) {
    const ids = new Set(group);
    for (const parked of parkedIdsFor(next, ids)) ids.add(parked);
    const box = bboxOf(next, ids);
    if (!box) continue;
    const width = box.maxX - box.minX;
    const height = box.maxY - box.minY;
    if (cursorX > PAGE_ORIGIN.x && cursorX + width > PAGE_ORIGIN.x + PAGE_WRAP_WIDTH) {
      cursorX = PAGE_ORIGIN.x;
      cursorY += rowHeight + PAGE_GAP;
      rowHeight = 0;
    }
    next = translate(next, ids, cursorX - box.minX, cursorY - box.minY);
    cursorX += width + PAGE_GAP;
    rowHeight = Math.max(rowHeight, height);
  }
  return next;
}

/**
 * Move selected nodes, or all named groups (fallback: connected components),
 * onto one canvas page while keeping relative positions inside each group.
 */
export function bringNodesOntoPage(
  nodes: Node[],
  edges: Edge[],
  scope: 'selected' | 'all',
  selectedIds: string[]
): { nodes: Node[]; focusIds: string[] } | null {
  if (scope === 'selected') {
    const ids = new Set(selectedIds.filter(Boolean));
    if (ids.size === 0) return null;
    for (const parked of parkedIdsFor(nodes, ids)) ids.add(parked);
    const box = bboxOf(nodes, ids);
    if (!box) return null;
    return {
      nodes: translate(nodes, ids, PAGE_ORIGIN.x - box.minX, PAGE_ORIGIN.y - box.minY),
      focusIds: [...ids],
    };
  }

  const named = new Map<string, string[]>();
  for (const node of nodes) {
    if (!visible(node)) continue;
    const name = nodeCustomName(node.data);
    if (!name) continue;
    const key = name.toLowerCase();
    const list = named.get(key);
    if (list) list.push(node.id);
    else named.set(key, [node.id]);
  }

  const groups =
    named.size > 0
      ? [...named.values()]
      : connectedComponents(nodes, edges);

  if (groups.length === 0) return null;
  const next = packGroups(nodes, groups);
  const focusIds = groups.flatMap((group) => group);
  return { nodes: next, focusIds };
}
