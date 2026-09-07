import type { Edge, Node } from '@xyflow/react';
import { normalizeWorkspaceGraph } from '../randomizerDrop';

export const LEGACY_GRAPH_KEY = 'synapse_graph_state';
export const LIBRARY_KEY = 'synapse_path_library';

export interface StoredMusicPath {
  id: string;
  name: string;
  visibility: 'public' | 'private';
  nodes: Node[];
  edges: Edge[];
  updatedAt: string;
}

export interface PathLibrary {
  schemaVersion: 1;
  activeId: string;
  paths: StoredMusicPath[];
}

export interface PathSummary {
  id: string;
  name: string;
  visibility: 'public' | 'private';
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

function newId(): string {
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
    id: typeof raw?.id === 'string' && raw.id ? raw.id : newId(),
    name: String(raw?.name || fallbackName).slice(0, 60) || fallbackName,
    visibility: raw?.visibility === 'public' ? 'public' : 'private',
    nodes: graph.nodes,
    edges: graph.edges,
    updatedAt:
      typeof raw?.updatedAt === 'string' && Number.isFinite(Date.parse(raw.updatedAt))
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

export function loadLibrary(): PathLibrary {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PathLibrary>;
      const paths = Array.isArray(parsed.paths)
        ? parsed.paths.map((p, i) => normalizePath(p, `Playlist ${i + 1}`))
        : [];
      if (paths.length > 0) {
        const activeId =
          typeof parsed.activeId === 'string' && paths.some((p) => p.id === parsed.activeId)
            ? parsed.activeId
            : paths[0].id;
        return { schemaVersion: 1, activeId, paths };
      }
    }
  } catch {
    // ignore
  }

  let legacy = emptyGraph();
  try {
    const stored = localStorage.getItem(LEGACY_GRAPH_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { nodes?: Node[]; edges?: Edge[] };
      legacy = normalizeWorkspaceGraph<Node, Edge>(
        parsed.nodes?.length ? parsed.nodes : emptyGraph().nodes,
        parsed.edges || []
      );
    }
  } catch {
    // ignore
  }

  const first = normalizePath(
    {
      id: newId(),
      name: 'My playlist',
      nodes: legacy.nodes,
      edges: legacy.edges,
    },
    'My playlist'
  );
  const lib: PathLibrary = { schemaVersion: 1, activeId: first.id, paths: [first] };
  persistLibrary(lib);
  return lib;
}

export function persistLibrary(lib: PathLibrary): void {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
    const active = lib.paths.find((p) => p.id === lib.activeId) || lib.paths[0];
    if (active) {
      localStorage.setItem(
        LEGACY_GRAPH_KEY,
        JSON.stringify({ nodes: active.nodes, edges: active.edges })
      );
    }
  } catch (e) {
    console.error('Failed to save playlists:', e);
  }
}

export function summaries(lib: PathLibrary): PathSummary[] {
  return lib.paths.map((p) => ({
    id: p.id,
    name: p.name,
    visibility: p.visibility,
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
      id: newId(),
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
  visibility: 'public' | 'private'
): PathLibrary {
  const next: PathLibrary = {
    ...lib,
    paths: lib.paths.map((p) => (p.id === id ? { ...p, visibility } : p)),
  };
  persistLibrary(next);
  return next;
}
