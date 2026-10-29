import type { Edge, Node } from '@xyflow/react';
import { normalizeSnap } from './history';

export const PATH_DRAFT_KEY = 'synapse_path_draft';

export interface PathDraft {
  version: 1;
  uid: string;
  pathId: string;
  pathName: string;
  updatedAt: string;
  nodes: Node[];
  edges: Edge[];
}

const MAX_BYTES = 1_500_000;

export function parsePathDraft(raw: unknown): PathDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<PathDraft>;
  if (value.version !== 1) return null;
  if (typeof value.uid !== 'string' || !value.uid) return null;
  if (typeof value.pathId !== 'string' || !value.pathId) return null;
  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges)) return null;
  if (typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) {
    return null;
  }
  return {
    version: 1,
    uid: value.uid,
    pathId: value.pathId,
    pathName: typeof value.pathName === 'string' ? value.pathName.slice(0, 60) : '',
    updatedAt: value.updatedAt,
    nodes: value.nodes as Node[],
    edges: value.edges as Edge[],
  };
}

export function readPathDraft(): PathDraft | null {
  try {
    const raw = localStorage.getItem(PATH_DRAFT_KEY);
    if (!raw) return null;
    return parsePathDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writePathDraft(draft: PathDraft): boolean {
  try {
    const snap = normalizeSnap(draft.nodes, draft.edges);
    const payload: PathDraft = { ...draft, nodes: snap.nodes, edges: snap.edges };
    const json = JSON.stringify(payload);
    if (json.length > MAX_BYTES) return false;
    localStorage.setItem(PATH_DRAFT_KEY, json);
    return true;
  } catch {
    return false;
  }
}

export function clearPathDraft(): void {
  try {
    localStorage.removeItem(PATH_DRAFT_KEY);
  } catch {
    /* quota / private mode */
  }
}

export function draftIsNewer(draftUpdatedAt: string, savedUpdatedAt: string | undefined): boolean {
  const draft = Date.parse(draftUpdatedAt);
  const saved = savedUpdatedAt ? Date.parse(savedUpdatedAt) : NaN;
  if (!Number.isFinite(draft)) return false;
  if (!Number.isFinite(saved)) return true;
  return draft > saved + 1500;
}

let timer: ReturnType<typeof setTimeout> | null = null;
let writer: (() => PathDraft | null) | null = null;

export function registerDraftWriter(fn: () => PathDraft | null): void {
  writer = fn;
}

export function schedulePathDraft(): void {
  if (typeof window === 'undefined' || !writer) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const draft = writer?.();
    if (!draft) return;
    writePathDraft(draft);
  }, 400);
}

export function flushPathDraft(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const draft = writer?.();
  if (draft) writePathDraft(draft);
}

let pendingRecovery: PathDraft | null = null;
const recoveryListeners = new Set<() => void>();

export function setPendingRecovery(draft: PathDraft | null): void {
  pendingRecovery = draft;
  recoveryListeners.forEach((fn) => fn());
}

export function getPendingRecovery(): PathDraft | null {
  return pendingRecovery;
}

export function subscribePendingRecovery(fn: () => void): () => void {
  recoveryListeners.add(fn);
  return () => {
    recoveryListeners.delete(fn);
  };
}
