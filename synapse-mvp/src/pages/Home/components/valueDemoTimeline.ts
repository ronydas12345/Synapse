export const VALUE_BEATS = ['build', 'branch', 'play'] as const;
export type ValueBeat = (typeof VALUE_BEATS)[number];

export const VALUE_BEAT_MS: Record<ValueBeat, number> = {
  build: 7400,
  branch: 9200,
  play: 8800,
};

export const VALUE_BEAT_MS_REDUCED = 2600;

export function nextValueBeat(beat: ValueBeat): ValueBeat {
  return VALUE_BEATS[(VALUE_BEATS.indexOf(beat) + 1) % VALUE_BEATS.length];
}

export const H = 44;

export type NodeKind = 'start' | 'end' | 'track' | 'conditional' | 'randomizer' | 'transition';

export type DemoNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  label: string;
  kind: NodeKind;
  ports: 'start' | 'end' | 'both' | 'split';
  className: string;
};

export type Pt = { x: number; y: number };

export const NODES: DemoNode[] = [
  { id: 'start', x: 100, y: 186, w: 88, label: 'Start', kind: 'start', ports: 'start', className: 'is-node-start' },
  { id: 'trackA', x: 214, y: 186, w: 118, label: 'Track', kind: 'track', ports: 'both', className: 'is-node-track' },
  { id: 'iff', x: 358, y: 186, w: 118, label: 'If', kind: 'conditional', ports: 'split', className: 'is-node-if' },
  { id: 'trackB', x: 516, y: 68, w: 118, label: 'Track', kind: 'track', ports: 'both', className: 'is-node-b' },
  { id: 'fx', x: 516, y: 186, w: 118, label: 'FX', kind: 'transition', ports: 'both', className: 'is-node-fx' },
  { id: 'rnd', x: 516, y: 304, w: 118, label: 'Rnd', kind: 'randomizer', ports: 'both', className: 'is-node-rnd' },
  { id: 'trackC', x: 658, y: 68, w: 118, label: 'Track', kind: 'track', ports: 'both', className: 'is-node-c' },
  { id: 'trackD', x: 658, y: 304, w: 118, label: 'Track', kind: 'track', ports: 'both', className: 'is-node-d' },
  { id: 'end', x: 800, y: 186, w: 88, label: 'End', kind: 'end', ports: 'end', className: 'is-node-end' },
];

export const BY_ID = Object.fromEntries(NODES.map((node) => [node.id, node])) as Record<string, DemoNode>;

export function cx(node: DemoNode): number {
  return node.x + node.w / 2;
}

export function cy(node: DemoNode): number {
  return node.y + H / 2;
}

export function right(node: DemoNode): number {
  return node.x + node.w;
}

export function splitPortY(node: DemoNode, index: 0 | 1 | 2): number {
  return node.y + (index === 0 ? 10 : index === 1 ? H / 2 : H - 10);
}

function leftPort(node: DemoNode): Pt {
  return { x: node.x, y: cy(node) };
}

function rightPort(node: DemoNode): Pt {
  return { x: right(node), y: cy(node) };
}

function ifOut(node: DemoNode, index: 0 | 1 | 2): Pt {
  return { x: right(node), y: splitPortY(node, index) };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function cubicPoint(a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

export function fromTx(node: DemoNode): number {
  return -node.x - node.w - 16;
}

export function grabPoint(node: DemoNode, tx = 0, ty = 0): Pt {
  return { x: node.x + tx + node.w * 0.58, y: node.y + ty + 26 };
}

const S = BY_ID.start;
const TA = BY_ID.trackA;
const IFF = BY_ID.iff;
const TB = BY_ID.trackB;
const FX = BY_ID.fx;
const RND = BY_ID.rnd;
const TC = BY_ID.trackC;
const TD = BY_ID.trackD;
const EN = BY_ID.end;

export const EDGES: { id: string; d: string }[] = [
  { id: 'start-track', d: `M${right(S)} ${cy(S)} H${TA.x}` },
  { id: 'track-if', d: `M${right(TA)} ${cy(TA)} H${IFF.x}` },
  {
    id: 'up',
    d: `M${right(IFF)} ${splitPortY(IFF, 0)} C500 ${splitPortY(IFF, 0)} 500 ${cy(TB)} ${TB.x} ${cy(TB)}`,
  },
  { id: 'mid', d: `M${right(IFF)} ${splitPortY(IFF, 1)} H${FX.x}` },
  {
    id: 'down',
    d: `M${right(IFF)} ${splitPortY(IFF, 2)} C500 ${splitPortY(IFF, 2)} 500 ${cy(RND)} ${RND.x} ${cy(RND)}`,
  },
  { id: 'b-c', d: `M${right(TB)} ${cy(TB)} H${TC.x}` },
  {
    id: 'c-end',
    d: `M${right(TC)} ${cy(TC)} C790 ${cy(TC)} 800 ${cy(EN)} ${EN.x} ${cy(EN)}`,
  },
  { id: 'fx-end', d: `M${right(FX)} ${cy(FX)} H${EN.x}` },
  { id: 'rnd-d', d: `M${right(RND)} ${cy(RND)} H${TD.x}` },
  {
    id: 'd-end',
    d: `M${right(TD)} ${cy(TD)} C790 ${cy(TD)} 800 ${cy(EN)} ${EN.x} ${cy(EN)}`,
  },
];

const PLAY_POINTS: Pt[] = [
  { x: cx(S), y: cy(S) },
  { x: right(S), y: cy(S) },
  { x: TA.x, y: cy(TA) },
  { x: cx(TA), y: cy(TA) },
  { x: right(TA), y: cy(TA) },
  { x: IFF.x, y: cy(IFF) },
  { x: cx(IFF), y: cy(IFF) },
  { x: right(IFF), y: splitPortY(IFF, 2) },
];

function flattenCubic(a: Pt, c1: Pt, c2: Pt, b: Pt, steps = 28): Pt[] {
  const pts: Pt[] = [];
  for (let i = 1; i <= steps; i += 1) pts.push(cubicPoint(a, c1, c2, b, i / steps));
  return pts;
}

const PLAY_POLY: Pt[] = [
  ...PLAY_POINTS,
  ...flattenCubic(
    { x: right(IFF), y: splitPortY(IFF, 2) },
    { x: 500, y: splitPortY(IFF, 2) },
    { x: 500, y: cy(RND) },
    { x: RND.x, y: cy(RND) }
  ),
  { x: cx(RND), y: cy(RND) },
  { x: right(RND), y: cy(RND) },
  { x: TD.x, y: cy(TD) },
  { x: cx(TD), y: cy(TD) },
  { x: right(TD), y: cy(TD) },
  ...flattenCubic(
    { x: right(TD), y: cy(TD) },
    { x: 790, y: cy(TD) },
    { x: 800, y: cy(EN) },
    { x: EN.x, y: cy(EN) }
  ),
  { x: cx(EN), y: cy(EN) },
];

const PLAY_CUM: number[] = [0];
for (let i = 1; i < PLAY_POLY.length; i += 1) {
  PLAY_CUM.push(PLAY_CUM[i - 1] + dist(PLAY_POLY[i - 1], PLAY_POLY[i]));
}
const PLAY_LEN = PLAY_CUM[PLAY_CUM.length - 1] || 1;

function unitAtPoint(target: Pt): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < PLAY_POLY.length; i += 1) {
    const d = dist(PLAY_POLY[i], target);
    if (d < bestD) {
      bestD = d;
      best = PLAY_CUM[i] / PLAY_LEN;
    }
  }
  return best;
}

export const PLAY_STOP_UNITS = [
  unitAtPoint({ x: cx(S), y: cy(S) }),
  unitAtPoint({ x: cx(TA), y: cy(TA) }),
  unitAtPoint({ x: cx(IFF), y: cy(IFF) }),
  unitAtPoint({ x: cx(RND), y: cy(RND) }),
  unitAtPoint({ x: cx(TD), y: cy(TD) }),
  unitAtPoint({ x: cx(EN), y: cy(EN) }),
];

export const PLAY_D = [
  `M${cx(S)} ${cy(S)}`,
  `L${right(S)} ${cy(S)}`,
  `L${TA.x} ${cy(TA)}`,
  `L${cx(TA)} ${cy(TA)}`,
  `L${right(TA)} ${cy(TA)}`,
  `L${IFF.x} ${cy(IFF)}`,
  `L${cx(IFF)} ${cy(IFF)}`,
  `L${right(IFF)} ${splitPortY(IFF, 2)}`,
  `C500 ${splitPortY(IFF, 2)} 500 ${cy(RND)} ${RND.x} ${cy(RND)}`,
  `L${cx(RND)} ${cy(RND)}`,
  `L${right(RND)} ${cy(RND)}`,
  `L${TD.x} ${cy(TD)}`,
  `L${cx(TD)} ${cy(TD)}`,
  `L${right(TD)} ${cy(TD)}`,
  `C790 ${cy(TD)} 800 ${cy(EN)} ${EN.x} ${cy(EN)}`,
  `L${cx(EN)} ${cy(EN)}`,
].join(' ');

export function pointAlongPlayPath(u: number): Pt {
  const d = clamp01(u) * PLAY_LEN;
  if (d <= 0) return PLAY_POLY[0];
  if (d >= PLAY_LEN) return PLAY_POLY[PLAY_POLY.length - 1];
  let i = 1;
  while (i < PLAY_CUM.length && PLAY_CUM[i] < d) i += 1;
  const a = PLAY_POLY[i - 1];
  const b = PLAY_POLY[i];
  const span = PLAY_CUM[i] - PLAY_CUM[i - 1];
  const t = span <= 0 ? 1 : (d - PLAY_CUM[i - 1]) / span;
  return lerpPt(a, b, t);
}

export type NodeFrame = { tx: number; ty: number; opacity: number };

export type DemoFrame = {
  node: Record<string, NodeFrame>;
  cursor: { x: number; y: number; opacity: number };
  edgeOn: Record<string, boolean>;
  rubber: { x1: number; y1: number; x2: number; y2: number } | null;
  playhead: { x: number; y: number; opacity: number } | null;
  playBurst: number;
  marquee: { x: number; y: number; w: number; h: number; opacity: number } | null;
  graphOpacity: number;
};

function placedNodes(opacity = 1): Record<string, NodeFrame> {
  return Object.fromEntries(NODES.map((node) => [node.id, { tx: 0, ty: 0, opacity }]));
}

function allEdges(on: boolean): Record<string, boolean> {
  return Object.fromEntries(EDGES.map((edge) => [edge.id, on]));
}

function hiddenCursor(): DemoFrame['cursor'] {
  return { x: 40, y: 208, opacity: 0 };
}

const BUILD_DRAGS: { id: string; start: number; dur: number }[] = [
  { id: 'start', start: 0.12, dur: 0.88 },
  { id: 'trackA', start: 1.22, dur: 0.88 },
  { id: 'iff', start: 2.32, dur: 0.88 },
  { id: 'trackB', start: 3.72, dur: 0.5 },
  { id: 'fx', start: 4.36, dur: 0.45 },
  { id: 'rnd', start: 4.93, dur: 0.45 },
  { id: 'trackC', start: 5.5, dur: 0.4 },
  { id: 'trackD', start: 6.02, dur: 0.4 },
  { id: 'end', start: 6.54, dur: 0.5 },
];

function sampleBuild(t: number): DemoFrame {
  const node = placedNodes(0);
  for (const n of NODES) {
    node[n.id] = { tx: fromTx(n), ty: 0, opacity: 0 };
  }

  let cursor = hiddenCursor();
  for (let i = 0; i < BUILD_DRAGS.length; i += 1) {
    const drag = BUILD_DRAGS[i];
    const demoNode = BY_ID[drag.id];
    const origin = { tx: fromTx(demoNode), ty: 0 };
    const startGrab = grabPoint(demoNode, origin.tx, origin.ty);
    const endGrab = grabPoint(demoNode, 0, 0);
    const end = drag.start + drag.dur;
    const next = BUILD_DRAGS[i + 1];

    if (t >= drag.start) {
      const p = clamp01((t - drag.start) / drag.dur);
      const tx = lerp(origin.tx, 0, p);
      const ty = -Math.sin(p * Math.PI) * 28;
      node[drag.id] = { tx, ty, opacity: 1 };
      if (t <= end) {
        const grab = grabPoint(demoNode, tx, ty);
        cursor = { x: grab.x, y: grab.y, opacity: 1 };
      }
    }

    if (next && t > end && t < next.start) {
      const dest = grabPoint(demoNode, 0, 0);
      const nxt = BY_ID[next.id];
      const nxtGrab = grabPoint(nxt, fromTx(nxt), 0);
      const gap = next.start - end;
      const hold = drag.id === 'iff' ? Math.min(0.42, gap * 0.72) : Math.min(0.1, gap * 0.28);
      if (t < end + hold) {
        cursor = { x: dest.x, y: dest.y, opacity: 1 };
      } else {
        const g = clamp01((t - end - hold) / Math.max(0.04, gap - hold));
        const pt = lerpPt(dest, nxtGrab, g);
        cursor = { x: pt.x, y: pt.y, opacity: 1 };
      }
    }

    if (!next && t > end) {
      cursor = { x: endGrab.x, y: endGrab.y, opacity: Math.max(0, 1 - (t - end) / 0.25) };
    }

    if (i === 0 && t < drag.start && t > 0.04) {
      cursor = { x: startGrab.x, y: startGrab.y, opacity: 1 };
      node[drag.id] = { tx: origin.tx, ty: 0, opacity: 1 };
    }
  }

  return {
    node,
    cursor,
    edgeOn: allEdges(false),
    rubber: null,
    playhead: null,
    playBurst: 0,
    marquee: null,
    graphOpacity: 1,
  };
}

const CONNECTION_SPECS = [
  { id: 'start-track', from: rightPort(S), to: leftPort(TA) },
  { id: 'track-if', from: rightPort(TA), to: leftPort(IFF) },
  { id: 'up', from: ifOut(IFF, 0), to: leftPort(TB) },
  { id: 'b-c', from: rightPort(TB), to: leftPort(TC) },
  { id: 'c-end', from: rightPort(TC), to: leftPort(EN) },
  { id: 'mid', from: ifOut(IFF, 1), to: leftPort(FX) },
  { id: 'fx-end', from: rightPort(FX), to: leftPort(EN) },
  { id: 'down', from: ifOut(IFF, 2), to: leftPort(RND) },
  { id: 'rnd-d', from: rightPort(RND), to: leftPort(TD) },
  { id: 'd-end', from: rightPort(TD), to: leftPort(EN) },
];

const CONNECTIONS = CONNECTION_SPECS.map((c, i) => ({
  ...c,
  start: 0.1 + i * 0.74,
  dur: 0.74,
}));

const BURST_AT = CONNECTIONS[CONNECTIONS.length - 1].start + CONNECTIONS[CONNECTIONS.length - 1].dur + 0.12;
const BURST_DUR = 1.05;

function sampleBranch(t: number): DemoFrame {
  const edgeOn = allEdges(false);
  let cursor = hiddenCursor();
  let rubber: DemoFrame['rubber'] = null;

  for (let i = 0; i < CONNECTIONS.length; i += 1) {
    const c = CONNECTIONS[i];
    const prev = CONNECTIONS[i - 1];
    const local = (t - c.start) / c.dur;
    if (t >= c.start + c.dur * 0.88) edgeOn[c.id] = true;
    if (local < 0 || local > 1) continue;

    const approach = 0.18;
    const commit = 0.88;
    if (local < approach) {
      const from = prev ? prev.to : { x: c.from.x - 36, y: c.from.y };
      const pt = lerpPt(from, c.from, local / approach);
      cursor = { x: pt.x, y: pt.y, opacity: 1 };
    } else if (local < commit) {
      const p = (local - approach) / (commit - approach);
      const pt = lerpPt(c.from, c.to, p);
      cursor = { x: pt.x, y: pt.y, opacity: 1 };
      rubber = { x1: c.from.x, y1: c.from.y, x2: pt.x, y2: pt.y };
    } else {
      cursor = { x: c.to.x, y: c.to.y, opacity: 1 };
    }
  }

  let playBurst = 0;
  if (t >= BURST_AT) {
    const b = clamp01((t - BURST_AT) / BURST_DUR);
    if (b < 0.22) playBurst = b / 0.22;
    else if (b < 0.68) playBurst = 1;
    else playBurst = 1 - (b - 0.68) / 0.32;
    cursor = { ...cursor, opacity: Math.max(0, 1 - (t - BURST_AT) / 0.18) };
  }

  return {
    node: placedNodes(1),
    cursor,
    edgeOn,
    rubber,
    playhead: null,
    playBurst,
    marquee: null,
    graphOpacity: 1,
  };
}

const PLAY_MOVE = [0.72, 0.72, 1.05, 0.68, 1.02];
const PLAY_PAUSE = [0.32, 0.38, 0.38, 0.38, 0.38, 0.48];
const SELECT_AT = 6.52;
const SELECT_DUR = 1.02;
const FADE_AT = 7.55;
const FADE_DUR = 0.5;
const MARQUEE = { x: 88, y: 48, w: 812, h: 320 };

function playheadUnit(t: number): number | null {
  let time = PLAY_PAUSE[0];
  if (t < time) return PLAY_STOP_UNITS[0];
  for (let i = 0; i < PLAY_MOVE.length; i += 1) {
    const move = PLAY_MOVE[i];
    if (t < time + move) {
      const p = (t - time) / move;
      return lerp(PLAY_STOP_UNITS[i], PLAY_STOP_UNITS[i + 1], p);
    }
    time += move;
    const pause = PLAY_PAUSE[i + 1];
    if (t < time + pause) return PLAY_STOP_UNITS[i + 1];
    time += pause;
  }
  if (t < SELECT_AT) return 1;
  return 1;
}

function samplePlay(t: number): DemoFrame {
  const fade = t < FADE_AT ? 1 : 1 - clamp01((t - FADE_AT) / FADE_DUR);
  const u = playheadUnit(t);
  const along = pointAlongPlayPath(u ?? 1);
  const playhead =
    fade > 0.02 && t < FADE_AT + 0.08
      ? { x: along.x, y: along.y, opacity: t < SELECT_AT ? 1 : Math.max(0.35, fade) }
      : null;

  let marquee: DemoFrame['marquee'] = null;
  let cursor = hiddenCursor();
  if (t >= SELECT_AT && fade > 0.02) {
    const p = clamp01((t - SELECT_AT) / SELECT_DUR);
    const w = lerp(16, MARQUEE.w, p);
    const h = lerp(16, MARQUEE.h, p);
    marquee = { x: MARQUEE.x, y: MARQUEE.y, w, h, opacity: fade };
    cursor = { x: MARQUEE.x + w, y: MARQUEE.y + h, opacity: fade > 0.15 ? 1 : fade };
  }

  return {
    node: placedNodes(1),
    cursor,
    edgeOn: allEdges(true),
    rubber: null,
    playhead,
    playBurst: 0,
    marquee,
    graphOpacity: fade,
  };
}

function staticFrame(beat: ValueBeat): DemoFrame {
  if (beat === 'build') {
    return {
      node: placedNodes(1),
      cursor: hiddenCursor(),
      edgeOn: allEdges(false),
      rubber: null,
      playhead: null,
      playBurst: 0,
      marquee: null,
      graphOpacity: 1,
    };
  }
  if (beat === 'branch') {
    return {
      node: placedNodes(1),
      cursor: hiddenCursor(),
      edgeOn: allEdges(true),
      rubber: null,
      playhead: null,
      playBurst: 0,
      marquee: null,
      graphOpacity: 1,
    };
  }
  const start = pointAlongPlayPath(0);
  return {
    node: placedNodes(1),
    cursor: hiddenCursor(),
    edgeOn: allEdges(true),
    rubber: null,
    playhead: { x: start.x, y: start.y, opacity: 0.9 },
    playBurst: 0,
    marquee: null,
    graphOpacity: 1,
  };
}

export function sampleDemo(beat: ValueBeat, tMs: number, motion: boolean): DemoFrame {
  if (!motion) return staticFrame(beat);
  const t = Math.max(0, tMs / 1000);
  if (beat === 'build') return sampleBuild(t);
  if (beat === 'branch') return sampleBranch(t);
  return samplePlay(t);
}
