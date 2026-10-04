import type { Edge, Node } from '@xyflow/react';
import { scheduleWorkspacePersist } from '../cloud/persistGate';
import { normalizeWorkspaceGraph } from '../randomizerDrop';
import { sanitizeTagIds } from '../workshop/tags';

export const LEGACY_GRAPH_KEY = 'synapse_graph_state';
export const LIBRARY_KEY = 'synapse_path_library';

export type PathVisibility = 'public' | 'private' | 'unlisted';

export interface StoredMusicPath {
  id: string;
  name: string;
  visibility: PathVisibility;
  tags: string[];
  nodes: Node[];
  edges: Edge[];
  updatedAt: string;
  /** Workshop listing this local path publishes to, if any. */
  workshopId?: string;
}

export interface PathLibrary {
  schemaVersion: 1;
  activeId: string;
  paths: StoredMusicPath[];
}

export interface PathSummary {
  id: string;
  name: string;
  visibility: PathVisibility;
  tags: string[];
  workshopId?: string;
}

export function asPathVisibility(value: unknown): PathVisibility {
  if (value === 'public' || value === 'unlisted') return value;
  return 'private';
}

export function pathVisibilityLabel(value: PathVisibility): string {
  if (value === 'public') return 'Public';
  if (value === 'unlisted') return 'Unlisted';
  return 'Private';
}

export function findPathForWorkshop<T extends { id: string; workshopId?: string }>(
  paths: T[],
  match: {
    workshopId?: string;
    sourcePathId?: string;
    shareCode?: string;
    preferId?: string;
  }
): T | undefined {
  const source = match.sourcePathId?.trim() || '';
  const workshopId = match.workshopId?.trim() || '';
  const share = match.shareCode?.trim() || '';
  const preferId = match.preferId?.trim() || '';
  const bound = (p: T) =>
    Boolean(
      (workshopId && p.workshopId === workshopId) || (share && p.workshopId === share)
    );
  if (preferId) {
    const preferred = paths.find((p) => p.id === preferId && (bound(p) || (source && p.id === source)));
    if (preferred) return preferred;
  }
  return (
    paths.find((p) => bound(p)) ||
    paths.find((p) => source && p.id === source)
  );
}

export function defaultStartNode(): Node {
  return {
    id: 'start',
    type: 'start',
    position: { x: 400, y: 300 },
    data: { label: 'Start' },
  };
}

export function emptyGraph(): { nodes: Node[]; edges: Edge[] } {
  return { nodes: [defaultStartNode()], edges: [] };
}

export function makePathId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `path-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function nextUntitledName(existing: string[]): string {
  const used = new Set(existing.map((n) => n.toLowerCase()));
  if (!used.has('untitled playlist')) return 'Untitled playlist';
  let i = 2;
  while (used.has(`untitled playlist ${i}`)) i += 1;
  return `Untitled playlist ${i}`;
}

function normalizePath(raw: Partial<StoredMusicPath> | undefined, fallbackName: string): StoredMusicPath {
  const graph = normalizeWorkspaceGraph<Node, Edge>(
    raw?.nodes?.length ? raw.nodes : emptyGraph().nodes,
    raw?.edges || []
  );
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : makePathId(),
    name: String(raw?.name || fallbackName).slice(0, 60) || fallbackName,
    visibility: asPathVisibility(raw?.visibility),
    tags: sanitizeTagIds('playlist', raw?.tags),
    nodes: graph.nodes,
    edges: graph.edges,
    updatedAt:
      typeof raw?.updatedAt === 'string' && Number.isFinite(Date.parse(raw.updatedAt))
        ? raw.updatedAt
        : new Date().toISOString(),
    workshopId:
      typeof raw?.workshopId === 'string' && raw.workshopId.trim()
        ? raw.workshopId.trim()
        : undefined,
  };
}

export function emptyLibrary(): PathLibrary {
  const first = normalizePath({ name: 'My playlist' }, 'My playlist');
  return { schemaVersion: 1, activeId: first.id, paths: [first] };
}

export function parseLibrary(raw: unknown): PathLibrary {
  if (!raw || typeof raw !== 'object') return emptyLibrary();
  const parsed = raw as Partial<PathLibrary>;
  const paths = Array.isArray(parsed.paths)
    ? parsed.paths.map((p, i) => normalizePath(p, `Playlist ${i + 1}`))
    : [];
  if (paths.length === 0) return emptyLibrary();
  const activeId =
    typeof parsed.activeId === 'string' && paths.some((p) => p.id === parsed.activeId)
      ? parsed.activeId
      : paths[0].id;
  return { schemaVersion: 1, activeId, paths };
}

export function libraryHasUserContent(lib: PathLibrary): boolean {
  return lib.paths.some((path) => path.nodes.length > 1 || path.edges.length > 0);
}

export function readLegacyLibrary(): PathLibrary | null {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) {
      const parsed = parseLibrary(JSON.parse(raw));
      if (libraryHasUserContent(parsed) || parsed.paths.length > 1) return parsed;
    }
  } catch {
    /* ignore */
  }
  try {
    const stored = localStorage.getItem(LEGACY_GRAPH_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { nodes?: Node[]; edges?: Edge[] };
    if (!parsed.nodes?.length && !parsed.edges?.length) return null;
    const path = normalizePath(
      { name: 'My playlist', nodes: parsed.nodes, edges: parsed.edges },
      'My playlist'
    );
    if (!libraryHasUserContent({ schemaVersion: 1, activeId: path.id, paths: [path] })) {
      return null;
    }
    return { schemaVersion: 1, activeId: path.id, paths: [path] };
  } catch {
    return null;
  }
}

export function persistLibrary(_lib: PathLibrary): void {
  scheduleWorkspacePersist();
}

export function summaries(lib: PathLibrary): PathSummary[] {
  return lib.paths.map((p) => ({
    id: p.id,
    name: p.name,
    visibility: p.visibility,
    tags: p.tags,
    workshopId: p.workshopId,
  }));
}

export function saveActiveGraph(
  lib: PathLibrary,
  nodes: Node[],
  edges: Edge[]
): PathLibrary {
  const graph = normalizeWorkspaceGraph<Node, Edge>(nodes, edges);
  const next: PathLibrary = {
    ...lib,
    paths: lib.paths.map((p) =>
      p.id === lib.activeId
        ? { ...p, nodes: graph.nodes, edges: graph.edges, updatedAt: new Date().toISOString() }
        : p
    ),
  };
  persistLibrary(next);
  return next;
}

export function createPath(lib: PathLibrary, name?: string): PathLibrary {
  const graph = emptyGraph();
  const path = normalizePath(
    {
      id: makePathId(),
      name: (name || '').trim() || nextUntitledName(lib.paths.map((p) => p.name)),
      nodes: graph.nodes,
      edges: graph.edges,
    },
    'Untitled playlist'
  );
  const next: PathLibrary = {
    schemaVersion: 1,
    activeId: path.id,
    paths: [...lib.paths, path],
  };
  persistLibrary(next);
  return next;
}

export function activatePath(lib: PathLibrary, id: string): PathLibrary | null {
  if (!lib.paths.some((p) => p.id === id)) return null;
  const next = { ...lib, activeId: id };
  persistLibrary(next);
  return next;
}

export function deletePath(lib: PathLibrary, id: string): PathLibrary {
  if (!lib.paths.some((p) => p.id === id)) return lib;
  const remaining = lib.paths.filter((p) => p.id !== id);
  if (remaining.length === 0) {
    const next = emptyLibrary();
    persistLibrary(next);
    return next;
  }
  const activeId = remaining.some((p) => p.id === lib.activeId)
    ? lib.activeId
    : remaining[0].id;
  const next: PathLibrary = { schemaVersion: 1, activeId, paths: remaining };
  persistLibrary(next);
  return next;
}

export function renamePath(lib: PathLibrary, id: string, name: string): PathLibrary {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) return lib;
  const next: PathLibrary = {
    ...lib,
    paths: lib.paths.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
  };
  persistLibrary(next);
  return next;
}

export function setPathVisibility(
  lib: PathLibrary,
  id: string,
  visibility: PathVisibility
): PathLibrary {
  const next: PathLibrary = {
    ...lib,
    paths: lib.paths.map((p) => (p.id === id ? { ...p, visibility } : p)),
  };
  persistLibrary(next);
  return next;
}

export function setPathTags(lib: PathLibrary, id: string, tags: string[]): PathLibrary {
  const next: PathLibrary = {
    ...lib,
    paths: lib.paths.map((p) =>
      p.id === id ? { ...p, tags: sanitizeTagIds('playlist', tags) } : p
    ),
  };
  persistLibrary(next);
  return next;
}

export function linkPathWorkshop(
  lib: PathLibrary,
  match: { pathId?: string; workshopId?: string },
  patch: { workshopId?: string; visibility?: PathVisibility }
): PathLibrary {
  const pathId = match.pathId?.trim() || '';
  const workshopId = match.workshopId?.trim() || '';
  if (!pathId && !workshopId) return lib;
  let changed = false;
  const paths = lib.paths.map((p) => {
    if ((pathId && p.id === pathId) || (workshopId && p.workshopId === workshopId)) {
      changed = true;
      return {
        ...p,
        visibility: patch.visibility ?? p.visibility,
        workshopId: patch.workshopId ?? p.workshopId,
      };
    }
    return p;
  });
  if (!changed) return lib;
  const next = { ...lib, paths };
  persistLibrary(next);
  return next;
}

/** Replace the active path's graph, keeping id, name, visibility, tags, and workshop bind. */
export function replaceActiveGraph(
  lib: PathLibrary,
  incoming: { nodes: Node[]; edges: Edge[] }
): PathLibrary {
  const current = lib.paths.find((p) => p.id === lib.activeId);
  if (!current) return lib;
  const graph = normalizeWorkspaceGraph<Node, Edge>(
    incoming.nodes?.length ? incoming.nodes : emptyGraph().nodes,
    incoming.edges || []
  );
  const path: StoredMusicPath = {
    ...current,
    nodes: graph.nodes,
    edges: graph.edges,
    updatedAt: new Date().toISOString(),
  };
  const next: PathLibrary = {
    ...lib,
    paths: lib.paths.map((p) => (p.id === path.id ? path : p)),
  };
  persistLibrary(next);
  return next;
}

export function getPath(lib: PathLibrary, id: string): StoredMusicPath | undefined {
  return lib.paths.find((p) => p.id === id);
}

export function uniquePathName(existing: string[], preferred: string): string {
  const base = preferred.trim().slice(0, 60) || 'Imported playlist';
  const used = new Set(existing.map((n) => n.toLowerCase()));
  if (!used.has(base.toLowerCase())) return base;
  const copy = `${base} copy`.slice(0, 60);
  if (!used.has(copy.toLowerCase())) return copy;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base} copy ${n}`.slice(0, 60);
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
  return `${base.slice(0, 40)} ${Date.now()}`;
}

export function addImportedPath(
  lib: PathLibrary,
  incoming: StoredMusicPath,
  options?: { persist?: boolean; keepName?: boolean }
): PathLibrary {
  const names = lib.paths.map((p) => p.name);
  const name = options?.keepName
    ? incoming.name.slice(0, 60) || 'Imported playlist'
    : uniquePathName(names, incoming.name);
  let id = incoming.id;
  if (!id || lib.paths.some((p) => p.id === id)) id = makePathId();
  const path = normalizePath({ ...incoming, id, name }, name);
  const next: PathLibrary = {
    ...lib,
    activeId: path.id,
    paths: [...lib.paths, path],
  };
  if (options?.persist !== false) persistLibrary(next);
  return next;
}

/** Insert or replace an imported path and make it active. */
export function putImportedPath(
  lib: PathLibrary,
  incoming: StoredMusicPath,
  options?: { persist?: boolean; keepName?: boolean }
): PathLibrary {
  const byId = Boolean(incoming.id && lib.paths.some((p) => p.id === incoming.id));
  const byWorkshop = incoming.workshopId
    ? lib.paths.find((p) => p.workshopId === incoming.workshopId)
    : undefined;
  if (byId || byWorkshop) {
    const targetId = byId ? incoming.id : byWorkshop!.id;
    const current = lib.paths.find((p) => p.id === targetId)!;
    const path = normalizePath(
      {
        ...incoming,
        id: targetId,
        name: options?.keepName ? current.name : incoming.name || current.name,
        workshopId: incoming.workshopId || current.workshopId,
        visibility: incoming.visibility || current.visibility,
        tags: incoming.tags?.length ? incoming.tags : current.tags,
      },
      current.name
    );
    const next: PathLibrary = {
      ...lib,
      activeId: path.id,
      paths: lib.paths.map((p) => (p.id === path.id ? path : p)),
    };
    if (options?.persist !== false) persistLibrary(next);
    return next;
  }
  return addImportedPath(lib, incoming, options);
}
