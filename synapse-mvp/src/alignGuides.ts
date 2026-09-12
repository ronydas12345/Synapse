export const ALIGN_PROXIMITY_PX = 112;
export const SNAP_THRESHOLD_PX = 8;
export const ALIGN_MAX_NODES = 16;
export const SPACING_MIN_GAP = 8;
export const ROW_ALIGN_TOLERANCE = 32;

export type GuideKind = 'side' | 'center' | 'diagonal' | 'spacing';
export type GuideAxis = 'x' | 'y';

export interface NodeBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AxisGuide {
  id: string;
  kind: 'side' | 'center';
  axis: GuideAxis;
  at: number;
}

export interface DiagonalGuide {
  id: string;
  kind: 'diagonal';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SpacingGuide {
  id: string;
  kind: 'spacing';
  axis: GuideAxis;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  gap: number;
}

export type OverlayGuide = AxisGuide | DiagonalGuide | SpacingGuide;

export interface ScreenBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SnapResult {
  dx: number;
  dy: number;
  guides: OverlayGuide[];
}

type AxisCandidate = {
  delta: number;
  guides: OverlayGuide[];
};

function cx(box: NodeBox): number {
  return box.x + box.width / 2;
}

function cy(box: NodeBox): number {
  return box.y + box.height / 2;
}

export function distanceToBox(
  px: number,
  py: number,
  box: { x: number; y: number; width: number; height: number }
): number {
  const dx = Math.max(box.x - px, 0, px - (box.x + box.width));
  const dy = Math.max(box.y - py, 0, py - (box.y + box.height));
  return Math.hypot(dx, dy);
}

export function distanceBetweenBoxes(a: NodeBox, b: NodeBox): number {
  const dx = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width), 0);
  const dy = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height), 0);
  return Math.hypot(dx, dy);
}

export function nodeSideGuides(box: NodeBox): AxisGuide[] {
  return [
    { id: `${box.id}-left`, kind: 'side', axis: 'x', at: box.x },
    { id: `${box.id}-right`, kind: 'side', axis: 'x', at: box.x + box.width },
    { id: `${box.id}-top`, kind: 'side', axis: 'y', at: box.y },
    { id: `${box.id}-bottom`, kind: 'side', axis: 'y', at: box.y + box.height },
  ];
}

export function nodeCenterGuides(box: NodeBox): AxisGuide[] {
  return [
    { id: `${box.id}-cx`, kind: 'center', axis: 'x', at: cx(box) },
    { id: `${box.id}-cy`, kind: 'center', axis: 'y', at: cy(box) },
  ];
}

/** @deprecated Use nodeSideGuides + nodeCenterGuides; centers are not always shown. */
export function nodeGuides(box: NodeBox): AxisGuide[] {
  return [...nodeSideGuides(box), ...nodeCenterGuides(box)];
}

export function nearbyNodeBoxes(
  pointer: { x: number; y: number },
  boxes: NodeBox[],
  maxDist: number,
  maxNodes = ALIGN_MAX_NODES
): NodeBox[] {
  return boxes
    .map((box) => ({ box, dist: distanceToBox(pointer.x, pointer.y, box) }))
    .filter((row) => row.dist <= maxDist)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxNodes)
    .map((row) => row.box);
}

export function hoverGuides(
  pointer: { x: number; y: number },
  boxes: NodeBox[],
  proximity: number,
  centerThresh: number
): OverlayGuide[] {
  const near = nearbyNodeBoxes(pointer, boxes, proximity);
  const guides: OverlayGuide[] = [];
  for (const box of near) {
    guides.push(...nodeSideGuides(box));
    if (Math.abs(pointer.x - cx(box)) <= centerThresh) {
      guides.push({ id: `${box.id}-cx`, kind: 'center', axis: 'x', at: cx(box) });
    }
    if (Math.abs(pointer.y - cy(box)) <= centerThresh) {
      guides.push({ id: `${box.id}-cy`, kind: 'center', axis: 'y', at: cy(box) });
    }
  }
  return guides;
}

export function flowToOverlay(
  x: number,
  y: number,
  viewport: { x: number; y: number; zoom: number }
): { x: number; y: number } {
  return {
    x: x * viewport.zoom + viewport.x,
    y: y * viewport.zoom + viewport.y,
  };
}

export function overlayToFlow(
  x: number,
  y: number,
  viewport: { x: number; y: number; zoom: number }
): { x: number; y: number } {
  const zoom = viewport.zoom || 1;
  return {
    x: (x - viewport.x) / zoom,
    y: (y - viewport.y) / zoom,
  };
}

function xEdges(box: NodeBox): { key: string; at: number; center: boolean }[] {
  return [
    { key: 'left', at: box.x, center: false },
    { key: 'cx', at: cx(box), center: true },
    { key: 'right', at: box.x + box.width, center: false },
  ];
}

function yEdges(box: NodeBox): { key: string; at: number; center: boolean }[] {
  return [
    { key: 'top', at: box.y, center: false },
    { key: 'cy', at: cy(box), center: true },
    { key: 'bottom', at: box.y + box.height, center: false },
  ];
}

function collectAxisCandidates(dragged: NodeBox, others: NodeBox[], thresh: number): {
  x: AxisCandidate[];
  y: AxisCandidate[];
} {
  const x: AxisCandidate[] = [];
  const y: AxisCandidate[] = [];
  for (const other of others) {
    for (const d of xEdges(dragged)) {
      for (const o of xEdges(other)) {
        const delta = o.at - d.at;
        if (Math.abs(delta) > thresh) continue;
        const kind = d.center || o.center ? 'center' : 'side';
        x.push({
          delta,
          guides: [{ id: `${other.id}-${o.key}`, kind, axis: 'x', at: o.at }],
        });
      }
    }
    for (const d of yEdges(dragged)) {
      for (const o of yEdges(other)) {
        const delta = o.at - d.at;
        if (Math.abs(delta) > thresh) continue;
        const kind = d.center || o.center ? 'center' : 'side';
        y.push({
          delta,
          guides: [{ id: `${other.id}-${o.key}`, kind, axis: 'y', at: o.at }],
        });
      }
    }
  }
  return { x, y };
}

function sameLane(a: NodeBox, b: NodeBox, axis: GuideAxis, tol: number): boolean {
  if (axis === 'x') {
    return (
      Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y) ||
      Math.abs(cy(a) - cy(b)) <= tol ||
      Math.abs(a.y - b.y) <= tol ||
      Math.abs(a.y + a.height - (b.y + b.height)) <= tol
    );
  }
  return (
    Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) ||
    Math.abs(cx(a) - cx(b)) <= tol ||
    Math.abs(a.x - b.x) <= tol ||
    Math.abs(a.x + a.width - (b.x + b.width)) <= tol
  );
}

function dominantGap(gaps: number[]): number | null {
  if (gaps.length === 0) return null;
  const counts = new Map<number, number>();
  for (const gap of gaps) {
    const key = Math.round(gap);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestCount = 0;
  for (const [gap, count] of counts) {
    if (count > bestCount || (count === bestCount && best !== null && gap < best)) {
      best = gap;
      bestCount = count;
    }
  }
  return best;
}

function consecutiveGaps(sorted: NodeBox[], axis: GuideAxis): { a: NodeBox; b: NodeBox; gap: number }[] {
  const out: { a: NodeBox; b: NodeBox; gap: number }[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const gap = axis === 'x' ? b.x - (a.x + a.width) : b.y - (a.y + a.height);
    if (gap >= SPACING_MIN_GAP) out.push({ a, b, gap });
  }
  return out;
}

function spacingSegment(a: NodeBox, b: NodeBox, axis: GuideAxis, gap: number): SpacingGuide {
  if (axis === 'x') {
    const x1 = a.x + a.width;
    const x2 = b.x;
    const y = (cy(a) + cy(b)) / 2;
    return {
      id: `space-x-${a.id}-${b.id}`,
      kind: 'spacing',
      axis,
      x1,
      y1: y,
      x2,
      y2: y,
      gap,
    };
  }
  const y1 = a.y + a.height;
  const y2 = b.y;
  const x = (cx(a) + cx(b)) / 2;
  return {
    id: `space-y-${a.id}-${b.id}`,
    kind: 'spacing',
    axis,
    x1: x,
    y1,
    x2: x,
    y2,
    gap,
  };
}

function collectSpacingCandidates(
  dragged: NodeBox,
  others: NodeBox[],
  thresh: number
): { x: AxisCandidate[]; y: AxisCandidate[] } {
  const x: AxisCandidate[] = [];
  const y: AxisCandidate[] = [];
  if (others.length === 0) return { x, y };

  const nearest = others
    .map((box) => ({ box, dist: distanceBetweenBoxes(dragged, box) }))
    .sort((a, b) => a.dist - b.dist)[0]?.box;
  if (!nearest) return { x, y };

  for (const axis of ['x', 'y'] as const) {
    const lane = others.filter((box) => sameLane(box, nearest, axis, ROW_ALIGN_TOLERANCE));
    if (!lane.includes(nearest)) lane.push(nearest);
    const sorted = [...lane].sort((a, b) => (axis === 'x' ? a.x - b.x : a.y - b.y));
    const pairs = consecutiveGaps(sorted, axis);
    const gap = dominantGap(pairs.map((p) => p.gap));
    if (gap === null) continue;

    const equalPairs = pairs.filter((p) => Math.abs(Math.round(p.gap) - gap) <= 1);
    if (equalPairs.length === 0) continue;

    const start = axis === 'x' ? dragged.x : dragged.y;
    const size = axis === 'x' ? dragged.width : dragged.height;
    const targets: { delta: number; neighbor: NodeBox; side: 'before' | 'after' }[] = [];
    for (const node of sorted) {
      const after = (axis === 'x' ? node.x + node.width : node.y + node.height) + gap;
      const before = (axis === 'x' ? node.x : node.y) - gap - size;
      targets.push({ delta: after - start, neighbor: node, side: 'after' });
      targets.push({ delta: before - start, neighbor: node, side: 'before' });
    }

    let best: (typeof targets)[number] | null = null;
    for (const target of targets) {
      if (Math.abs(target.delta) > thresh) continue;
      if (!best || Math.abs(target.delta) < Math.abs(best.delta)) best = target;
    }
    if (!best) continue;

    const movedStart = start + best.delta;
    const phantom: NodeBox =
      axis === 'x'
        ? { ...dragged, x: movedStart }
        : { ...dragged, y: movedStart };
    const chain = [...sorted, phantom].sort((a, b) => (axis === 'x' ? a.x - b.x : a.y - b.y));
    const shown = consecutiveGaps(chain, axis).filter((p) => Math.abs(Math.round(p.gap) - gap) <= 1);
    const guides = shown.map((p) => spacingSegment(p.a, p.b, axis, gap));
    const cand: AxisCandidate = { delta: best.delta, guides };
    if (axis === 'x') x.push(cand);
    else y.push(cand);
  }
  return { x, y };
}

function pickCandidate(cands: AxisCandidate[]): AxisCandidate | null {
  if (cands.length === 0) return null;
  let best = cands[0];
  const merged = new Map<string, OverlayGuide>();
  for (const cand of cands) {
    if (Math.abs(cand.delta) < Math.abs(best.delta) - 0.01) {
      best = cand;
    }
  }
  for (const cand of cands) {
    if (Math.abs(cand.delta - best.delta) > 0.5) continue;
    for (const guide of cand.guides) merged.set(guide.id, guide);
  }
  return { delta: best.delta, guides: [...merged.values()] };
}

function corners(box: NodeBox): { id: string; x: number; y: number }[] {
  return [
    { id: 'tl', x: box.x, y: box.y },
    { id: 'tr', x: box.x + box.width, y: box.y },
    { id: 'br', x: box.x + box.width, y: box.y + box.height },
    { id: 'bl', x: box.x, y: box.y + box.height },
  ];
}

function extendSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pad: number
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: x1 - ux * pad,
    y1: y1 - uy * pad,
    x2: x2 + ux * pad,
    y2: y2 + uy * pad,
  };
}

function diagonalCorrection(
  dragged: NodeBox,
  others: NodeBox[],
  thresh: number,
  lockX: boolean,
  lockY: boolean,
  pad: number
): { dx: number; dy: number; guide: DiagonalGuide } | null {
  let best: { dist: number; dx: number; dy: number; guide: DiagonalGuide } | null = null;
  for (const other of others) {
    for (const oc of corners(other)) {
      for (const dc of corners(dragged)) {
        const relx = dc.x - oc.x;
        const rely = dc.y - oc.y;
        if (Math.abs(relx) < 1 && Math.abs(rely) < 1) continue;

        const options: { dx: number; dy: number }[] = [];
        if (!lockX && !lockY) {
          const err1 = (relx - rely) / 2;
          options.push({ dx: -err1, dy: err1 });
          const err2 = (relx + rely) / 2;
          options.push({ dx: -err2, dy: -err2 });
        } else {
          for (const sign of [1, -1]) {
            if (!lockY) options.push({ dx: 0, dy: sign * Math.abs(relx) - rely });
            if (!lockX) options.push({ dx: sign * Math.abs(rely) - relx, dy: 0 });
          }
        }

        for (const option of options) {
          if (lockX && Math.abs(option.dx) > 0.01) continue;
          if (lockY && Math.abs(option.dy) > 0.01) continue;
          const dist = Math.hypot(option.dx, option.dy);
          if (dist > thresh) continue;
          const ax = dc.x + option.dx;
          const ay = dc.y + option.dy;
          if (Math.abs(Math.abs(ax - oc.x) - Math.abs(ay - oc.y)) > 0.75) continue;
          const seg = extendSegment(oc.x, oc.y, ax, ay, pad);
          const guide: DiagonalGuide = {
            id: `diag-${other.id}-${oc.id}-${dc.id}`,
            kind: 'diagonal',
            ...seg,
          };
          if (!best || dist < best.dist) {
            best = { dist, dx: option.dx, dy: option.dy, guide };
          }
        }
      }
    }
  }
  return best;
}

export function snapDraggedBox(
  dragged: NodeBox,
  others: NodeBox[],
  opts: { zoom: number; snapPx?: number; proximityPx?: number } = { zoom: 1 }
): SnapResult {
  const zoom = Math.max(opts.zoom || 1, 0.001);
  const thresh = (opts.snapPx ?? SNAP_THRESHOLD_PX) / zoom;
  const proximity = (opts.proximityPx ?? ALIGN_PROXIMITY_PX) / zoom;
  const near = others.filter((box) => distanceBetweenBoxes(dragged, box) <= proximity);

  const axis = collectAxisCandidates(dragged, others, thresh);
  const spacing = collectSpacingCandidates(dragged, others, thresh);
  const x = pickCandidate([...axis.x, ...spacing.x]);
  const y = pickCandidate([...axis.y, ...spacing.y]);
  let dx = x?.delta ?? 0;
  let dy = y?.delta ?? 0;
  const guides: OverlayGuide[] = [...(x?.guides ?? []), ...(y?.guides ?? [])];

  const moved: NodeBox = { ...dragged, x: dragged.x + dx, y: dragged.y + dy };
  const diag = diagonalCorrection(moved, near, thresh, Boolean(x), Boolean(y), 28 / zoom);
  if (diag) {
    dx += diag.dx;
    dy += diag.dy;
    guides.push(diag.guide);
  }

  return { dx, dy, guides };
}

export function applySnapToDragChanges<
  T extends { type: string; id?: string; dragging?: boolean; position?: { x: number; y: number } },
  N extends {
    id: string;
    hidden?: boolean;
    parentId?: string;
    position: { x: number; y: number };
    width?: number;
    height?: number;
    type?: string | null;
    measured?: { width?: number; height?: number };
    style?: object;
  },
>(
  changes: T[],
  nodes: N[],
  opts: { shift: boolean; zoom: number; sizeOf: (node: N) => { width: number; height: number }; worldOf: (node: N, byId: Map<string, N>) => { x: number; y: number } }
): { changes: T[]; guides: OverlayGuide[]; dragging: boolean } {
  const draggingChanges = changes.filter(
    (change) => change.type === 'position' && change.dragging && change.position && change.id
  );
  if (draggingChanges.length === 0) {
    return { changes, guides: [], dragging: false };
  }

  if (!opts.shift) {
    return { changes, guides: [], dragging: true };
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const draggingIds = new Set(draggingChanges.map((change) => change.id as string));
  const leader = draggingChanges[0];
  const leaderNode = nodes.find((node) => node.id === leader.id);
  if (!leaderNode || !leader.position) {
    return { changes, guides: [], dragging: true };
  }

  const size = opts.sizeOf(leaderNode);
  const proposed = { ...leaderNode, position: leader.position };
  const world = opts.worldOf(proposed, byId);
  const dragged: NodeBox = {
    id: leaderNode.id,
    x: world.x,
    y: world.y,
    width: size.width,
    height: size.height,
  };
  const others: NodeBox[] = [];
  for (const node of nodes) {
    if (node.hidden || draggingIds.has(node.id)) continue;
    const nodeSize = opts.sizeOf(node);
    const pos = opts.worldOf(node, byId);
    others.push({
      id: node.id,
      x: pos.x,
      y: pos.y,
      width: nodeSize.width,
      height: nodeSize.height,
    });
  }

  const snap = snapDraggedBox(dragged, others, { zoom: opts.zoom });
  const next = changes.map((change) => {
    if (change.type !== 'position' || !change.dragging || !change.position || !change.id) {
      return change;
    }
    if (!draggingIds.has(change.id)) return change;
    return {
      ...change,
      position: {
        x: change.position.x + snap.dx,
        y: change.position.y + snap.dy,
      },
    };
  });
  return { changes: next, guides: snap.guides, dragging: true };
}
