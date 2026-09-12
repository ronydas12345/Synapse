import type { Edge, Node } from '@xyflow/react';
import { documentPrefersReducedMotion } from '../settings/motion';
import { applyTheme } from './applyTheme';
import { resolveTheme, themeExists, useThemeStore } from './themeStore';
import { cloneTheme, easeT, lerpTheme, mergeStyleLayers } from '../styleNode/merge';
import { parseStyleNodeData } from '../styleNode/parse';
import { collectUpstreamStyleNodes } from '../styleNode/upstream';
import { buildPlaybackQueueKeys } from '../engine/buildPlaybackQueue';
import { parseQueueKey } from '../engine/types';
import type { StyleEasing, StyleLayerId } from '../styleNode/types';
import type { SynapseTheme } from './types';

export const STYLE_CUE_HOLD_MS = 120;

let sessionActive = false;
let visualTheme: SynapseTheme | null = null;
let destinationTheme: SynapseTheme | null = null;
let lastPathTheme: SynapseTheme | null = null;
let showingPathTheme = false;
let raf = 0;
let delayTimer = 0;
let fromTheme: SynapseTheme | null = null;
let animStart = 0;
let animDuration = 0;
let animEasing: StyleEasing = 'easeInOut';
const themeUiListeners = new Set<() => void>();

function notifyThemeUi(): void {
  for (const listener of themeUiListeners) listener();
}

export function subscribePlaybackThemeUi(listener: () => void): () => void {
  themeUiListeners.add(listener);
  return () => {
    themeUiListeners.delete(listener);
  };
}

export function isShowingPathTheme(): boolean {
  return showingPathTheme;
}

function rememberPathTheme(theme: SynapseTheme): void {
  lastPathTheme = cloneTheme(theme);
  showingPathTheme = true;
  notifyThemeUi();
}

function currentUserTheme(): SynapseTheme {
  const { activeId, customThemes, draft } = useThemeStore.getState();
  return draft ?? resolveTheme(activeId, customThemes);
}

function cancelAnim(): void {
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  if (delayTimer) {
    clearTimeout(delayTimer);
    delayTimer = 0;
  }
}

function tick(now: number): void {
  if (!fromTheme || !destinationTheme) return;
  const t = animDuration <= 0 ? 1 : (now - animStart) / animDuration;
  const eased = easeT(t, animEasing);
  visualTheme = lerpTheme(fromTheme, destinationTheme, eased);
  applyTheme(visualTheme);
  if (t >= 1) {
    visualTheme = destinationTheme;
    applyTheme(destinationTheme);
    rememberPathTheme(destinationTheme);
    raf = 0;
    return;
  }
  raf = requestAnimationFrame(tick);
}

export function isPlaybackStyleSessionActive(): boolean {
  return sessionActive;
}

export function prefersReducedMotion(): boolean {
  return documentPrefersReducedMotion();
}

export function styleCueHoldMs(
  durationMs: number,
  isLast: boolean,
  delayMs = 0
): number {
  const delay = Math.max(0, delayMs);
  const duration = Math.max(0, durationMs);
  if (prefersReducedMotion()) return Math.max(80, isLast ? delay : 0);
  if (isLast) return Math.max(80, delay + duration);
  return STYLE_CUE_HOLD_MS;
}

export function beginPlaybackStyleSession(): void {
  cancelAnim();
  const user = currentUserTheme();
  visualTheme = cloneTheme(user);
  destinationTheme = cloneTheme(user);
  sessionActive = true;
}

export function endPlaybackStyleSession(): void {
  cancelAnim();
  sessionActive = false;
  showingPathTheme = false;
  visualTheme = null;
  destinationTheme = null;
  fromTheme = null;
  applyTheme(currentUserTheme());
  notifyThemeUi();
}

export function resetPlaybackStyleSession(): void {
  beginPlaybackStyleSession();
  applyTheme(visualTheme!);
}

export function applyStyleNodeCue(
  node: Node | undefined,
  snap: boolean
): boolean {
  if (!node || node.type !== 'style') return false;
  const data = parseStyleNodeData(node.data);
  const customThemes = useThemeStore.getState().customThemes;
  if (!themeExists(data.themeId, customThemes)) return false;
  playStyleCue({
    target: resolveTheme(data.themeId, customThemes),
    layers: data.layers,
    durationMs: snap ? 0 : data.durationMs,
    delayMs: snap ? 0 : data.delayMs,
    easing: data.easing,
  });
  return true;
}

/** Snap Style cues on the path from Start up to (but not including) origin. */
export function applyUpstreamStyleCues(
  nodes: Node[],
  edges: Edge[],
  originId: string | undefined
): void {
  beginPlaybackStyleSession();
  applyTheme(visualTheme!);
  if (!originId) return;
  for (const node of collectUpstreamStyleNodes(nodes, edges, originId)) {
    applyStyleNodeCue(node, true);
  }
}

/** Theme that should be in effect when playback is at this node, including a Style origin. */
export function applyStyleCuesAtNode(
  nodes: Node[],
  edges: Edge[],
  nodeId: string | undefined
): void {
  applyUpstreamStyleCues(nodes, edges, nodeId);
  if (!nodeId) return;
  applyStyleNodeCue(
    nodes.find((n) => n.id === nodeId),
    true
  );
}

/** Restore the path look at this node, including Style cues still ahead on the walk. */
export function applyPathTheme(
  nodes: Node[],
  edges: Edge[],
  nodeId: string | undefined
): boolean {
  applyStyleCuesAtNode(nodes, edges, nodeId);
  const keys = buildPlaybackQueueKeys(
    { nodes, edges },
    nodeId ? { startNodeId: nodeId } : {}
  );
  for (const key of keys) {
    const parsed = parseQueueKey(key);
    if (parsed?.kind !== 'style') continue;
    applyStyleNodeCue(
      nodes.find((n) => n.id === parsed.nodeId),
      true
    );
  }
  if (showingPathTheme) return true;
  for (const node of nodes) {
    if (node.hidden) continue;
    applyStyleNodeCue(node, true);
  }
  if (showingPathTheme) return true;
  if (!lastPathTheme) {
    endPlaybackStyleSession();
    return false;
  }
  cancelAnim();
  visualTheme = cloneTheme(lastPathTheme);
  destinationTheme = cloneTheme(lastPathTheme);
  sessionActive = true;
  showingPathTheme = true;
  applyTheme(destinationTheme);
  notifyThemeUi();
  return true;
}

export function playStyleCue(opts: {
  target: SynapseTheme;
  layers: readonly StyleLayerId[];
  durationMs: number;
  delayMs?: number;
  easing: StyleEasing;
}): void {
  if (!sessionActive || !visualTheme || !destinationTheme) {
    beginPlaybackStyleSession();
  }
  const from = cloneTheme(visualTheme!);
  destinationTheme = mergeStyleLayers(destinationTheme!, opts.target, opts.layers);
  visualTheme = from;
  fromTheme = from;
  const reduced = prefersReducedMotion();
  animDuration = reduced ? 0 : Math.max(0, opts.durationMs);
  const delayMs = Math.max(0, opts.delayMs ?? 0);
  animEasing = opts.easing;
  showingPathTheme = true;
  notifyThemeUi();
  cancelAnim();
  applyTheme(from);

  const finish = () => {
    visualTheme = destinationTheme;
    applyTheme(destinationTheme!);
    rememberPathTheme(destinationTheme!);
  };

  const startAnim = () => {
    if (!sessionActive || !fromTheme || !destinationTheme) return;
    if (animDuration <= 0) {
      finish();
      return;
    }
    animStart = performance.now();
    raf = requestAnimationFrame(tick);
  };

  if (delayMs <= 0) {
    startAnim();
    return;
  }
  delayTimer = window.setTimeout(startAnim, delayMs);
}
