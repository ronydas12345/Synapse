import type { Edge, Node } from '@xyflow/react';
import { parseStyleNodeData } from '../styleNode/parse';
import { parseTheme, themeToJson } from '../theme/parseTheme';
import { THEME_TYPE, type SynapseTheme } from '../theme/types';
import { normalizeWorkspaceGraph } from '../randomizerDrop';
import { makePathId, type StoredMusicPath } from './library';

export const PLAYLIST_TYPE = 'synapse-playlist';
export const PACKAGE_TYPE = 'synapse-package';
export const PLAYLIST_SCHEMA_VERSION = 1;

export const ZIP_PLAYLIST_ERROR =
  'ZIP playlist packages are not supported yet. Export a .synapse JSON file from Settings.';

const ALLOWED_NODE_TYPES = new Set([
  'start',
  'track',
  'conditional',
  'splitter',
  'randomizer',
  'transition',
  'style',
  'comment',
  'end',
]);

const MAX_FILE_CHARS = 8_000_000;
const MAX_NODES = 400;
const MAX_EDGES = 800;
const MAX_ID_LEN = 80;
const MAX_NAME = 60;
const MAX_STRING = 20_000;
const MAX_DATA_URL = 500_000;
const MAX_ARRAY = 200;
const MAX_OBJECT_KEYS = 40;
const MAX_DEPTH = 8;

const SAFE_ID = /^[\w.-]+$/;

export interface PlaylistFile {
  schemaVersion: typeof PLAYLIST_SCHEMA_VERSION;
  type: typeof PLAYLIST_TYPE;
  id: string;
  name: string;
  visibility: 'public' | 'private';
  updatedAt: string;
  nodes: Node[];
  edges: Edge[];
  settings: Record<string, unknown>;
  themeId: string | null;
}

export interface PlaylistPackageFile {
  schemaVersion: typeof PLAYLIST_SCHEMA_VERSION;
  type: typeof PACKAGE_TYPE;
  manifest: {
    schemaVersion: typeof PLAYLIST_SCHEMA_VERSION;
    playlist: 'playlist.synapse';
    themes: string[];
    overlays: string[];
  };
  playlist: PlaylistFile;
  themes: unknown[];
}

export type PlaylistParseOk = {
  ok: true;
  playlist: StoredMusicPath;
  themes: SynapseTheme[];
  themeId: string | null;
  notices: string[];
  packaged: boolean;
};

export type PlaylistParseFail = {
  ok: false;
  error: string;
};

export type PlaylistParseResult = PlaylistParseOk | PlaylistParseFail;

export function looksLikeZipBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  );
}

export function looksLikeZipText(text: string): boolean {
  if (!text) return false;
  if (text.startsWith('PK\u0003') || text.startsWith('PK\u0005') || text.startsWith('PK\u0007')) {
    return true;
  }
  if (text.charCodeAt(0) === 0x50 && text.charCodeAt(1) === 0x4b) {
    const third = text.charCodeAt(2);
    return third === 0x03 || third === 0x05 || third === 0x07;
  }
  return false;
}

export function sanitizePlaylistName(value: unknown): string {
  const text = typeof value === 'string' ? value : '';
  return text.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) || 'Imported playlist';
}

export function playlistDownloadName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${slug || 'playlist'}.synapse`;
}

function sanitizeId(raw: unknown, fallback: string): string {
  const s = String(raw ?? '').trim();
  if (!s || s.length > MAX_ID_LEN || s.includes('..') || /[\\/<>]/.test(s) || !SAFE_ID.test(s)) {
    return fallback;
  }
  return s;
}

function cloneJson(value: unknown, depth: number, notices: string[], path: string): unknown {
  if (depth > MAX_DEPTH) return null;
  if (value == null) return value;
  if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value === 'bigint') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.startsWith('data:') && value.length > MAX_DATA_URL) {
      notices.push(`Dropped oversized embedded file at ${path}.`);
      return '';
    }
    return value.length > MAX_STRING ? value.slice(0, MAX_STRING) : value;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY)
      .map((item, i) => cloneJson(item, depth + 1, notices, `${path}[${i}]`))
      .filter((item) => item !== undefined);
  }
  if (typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).slice(0, MAX_OBJECT_KEYS)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      const cloned = cloneJson(src[key], depth + 1, notices, `${path}.${key}`);
      if (cloned !== undefined) out[key] = cloned;
    }
    return out;
  }
  return null;
}

function remapIdRefs(data: Record<string, unknown>, idMap: Map<string, string>): Record<string, unknown> {
  const next = { ...data };
  if (typeof next.linkedNodeId === 'string') {
    next.linkedNodeId = idMap.get(next.linkedNodeId) ?? null;
  }
  if (Array.isArray(next.tracks)) {
    next.tracks = next.tracks
      .map((id) => (typeof id === 'string' ? idMap.get(id) : undefined))
      .filter((id): id is string => Boolean(id));
  }
  if (typeof next.embeddedIn === 'string') {
    const mapped = idMap.get(next.embeddedIn);
    if (mapped) next.embeddedIn = mapped;
    else delete next.embeddedIn;
  }
  return next;
}

function sanitizeGraph(
  nodesRaw: unknown,
  edgesRaw: unknown,
  notices: string[]
): { nodes: Node[]; edges: Edge[] } {
  const incoming = Array.isArray(nodesRaw) ? nodesRaw.slice(0, MAX_NODES + 8) : [];
  const used = new Set<string>();
  const idMap = new Map<string, string>();
  let droppedTypes = 0;
  const nodes: Node[] = [];

  for (const raw of incoming) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;
    const type = typeof rec.type === 'string' ? rec.type : '';
    if (!ALLOWED_NODE_TYPES.has(type)) {
      droppedTypes += 1;
      continue;
    }
    if (nodes.length >= MAX_NODES) {
      notices.push(`Kept the first ${MAX_NODES} nodes.`);
      break;
    }
    let id = sanitizeId(rec.id, '');
    if (!id || used.has(id)) {
      id = `node-${nodes.length + 1}-${makePathId().slice(0, 8)}`;
    }
    used.add(id);
    if (typeof rec.id === 'string' && rec.id) idMap.set(rec.id, id);

    const posRaw = rec.position && typeof rec.position === 'object' ? (rec.position as Record<string, unknown>) : {};
    const x = Number(posRaw.x);
    const y = Number(posRaw.y);
    const dataRaw = rec.data && typeof rec.data === 'object' ? rec.data : {};
    const data = cloneJson(dataRaw, 0, notices, `nodes.${id}.data`);
    const hidden = rec.hidden === true;

    nodes.push({
      id,
      type,
      position: {
        x: Number.isFinite(x) ? Math.min(50_000, Math.max(-50_000, x)) : 0,
        y: Number.isFinite(y) ? Math.min(50_000, Math.max(-50_000, y)) : 0,
      },
      data: data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {},
      ...(hidden ? { hidden: true } : {}),
    });
  }

  if (droppedTypes > 0) {
    notices.push(
      droppedTypes === 1
        ? 'Dropped 1 unsupported node.'
        : `Dropped ${droppedTypes} unsupported nodes.`
    );
  }

  const remapped = nodes.map((node) => ({
    ...node,
    data: remapIdRefs((node.data || {}) as Record<string, unknown>, idMap),
  }));

  const known = new Set(remapped.map((n) => n.id));
  const incomingEdges = Array.isArray(edgesRaw) ? edgesRaw : [];
  const edges: Edge[] = [];
  const edgeIds = new Set<string>();

  for (const raw of incomingEdges) {
    if (edges.length >= MAX_EDGES) {
      notices.push(`Kept the first ${MAX_EDGES} connections.`);
      break;
    }
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;
    const source = idMap.get(String(rec.source ?? '')) || sanitizeId(rec.source, '');
    const target = idMap.get(String(rec.target ?? '')) || sanitizeId(rec.target, '');
    if (!source || !target || !known.has(source) || !known.has(target) || source === target) continue;
    let id = sanitizeId(rec.id, `${source}-${target}-${edges.length}`);
    if (!id || edgeIds.has(id)) id = `${source}-${target}-${edges.length}`;
    edgeIds.add(id);
    const edge: Edge = { id, source, target };
    const sourceHandle = typeof rec.sourceHandle === 'string' ? rec.sourceHandle.slice(0, 32) : '';
    const targetHandle = typeof rec.targetHandle === 'string' ? rec.targetHandle.slice(0, 32) : '';
    if (sourceHandle) edge.sourceHandle = sourceHandle;
    if (targetHandle) edge.targetHandle = targetHandle;
    edges.push(edge);
  }

  return normalizeWorkspaceGraph<Node, Edge>(remapped, edges);
}

function asPlaylistRecord(raw: Record<string, unknown>): Record<string, unknown> | null {
  if (raw.type === PLAYLIST_TYPE) return raw;
  if (raw.type == null && (raw.nodes != null || raw.version != null || raw.name != null)) {
    return raw;
  }
  return null;
}

function parsePlaylistObject(raw: Record<string, unknown>, notices: string[]): StoredMusicPath | null {
  const schemaVersion = Number(raw.schemaVersion ?? raw.version ?? PLAYLIST_SCHEMA_VERSION);
  if (raw.type === PLAYLIST_TYPE && schemaVersion !== PLAYLIST_SCHEMA_VERSION) return null;
  if (raw.type == null && raw.version != null && schemaVersion !== PLAYLIST_SCHEMA_VERSION) return null;

  const graph = sanitizeGraph(raw.nodes, raw.edges, notices);
  const id = sanitizeId(raw.id, makePathId());
  return {
    id: id || makePathId(),
    name: sanitizePlaylistName(raw.name),
    visibility: raw.visibility === 'public' ? 'public' : 'private',
    nodes: graph.nodes,
    edges: graph.edges,
    updatedAt:
      typeof raw.updatedAt === 'string' && Number.isFinite(Date.parse(raw.updatedAt))
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

function collectThemes(raw: unknown, notices: string[]): SynapseTheme[] {
  if (!Array.isArray(raw)) return [];
  const themes: SynapseTheme[] = [];
  let skipped = 0;
  for (const item of raw.slice(0, 25)) {
    const theme = parseTheme(item);
    if (!theme) {
      skipped += 1;
      continue;
    }
    themes.push(theme);
  }
  if (skipped > 0) {
    notices.push(
      skipped === 1 ? 'Skipped 1 invalid theme.' : `Skipped ${skipped} invalid themes.`
    );
  }
  return themes;
}

function overlayNotice(raw: unknown, notices: string[]): void {
  const overlays =
    (raw && typeof raw === 'object' ? (raw as Record<string, unknown>).overlays : null) ??
    (raw && typeof raw === 'object'
      ? ((raw as Record<string, unknown>).manifest as { overlays?: unknown } | undefined)?.overlays
      : null);
  const count = Array.isArray(overlays) ? overlays.length : overlays ? 1 : 0;
  if (count > 0) {
    notices.push(
      'Image and GIF overlays are not imported yet. The playlist graph was kept; overlay files were skipped.'
    );
  }
}

export function parsePlaylistDocument(input: unknown): PlaylistParseResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Invalid playlist file.' };
  }
  const raw = input as Record<string, unknown>;
  const notices: string[] = [];

  if (raw.type === THEME_TYPE) {
    return { ok: false, error: 'This is a theme file. Import it under Themes, not Playlists.' };
  }

  if (raw.type === PACKAGE_TYPE) {
    const schemaVersion = Number(raw.schemaVersion);
    if (schemaVersion !== PLAYLIST_SCHEMA_VERSION) {
      return { ok: false, error: 'Unsupported playlist package version.' };
    }
    const playlistRaw =
      raw.playlist && typeof raw.playlist === 'object'
        ? asPlaylistRecord(raw.playlist as Record<string, unknown>)
        : null;
    if (!playlistRaw) return { ok: false, error: 'Package is missing a valid playlist.' };
    overlayNotice(raw, notices);
    const playlist = parsePlaylistObject(playlistRaw, notices);
    if (!playlist) return { ok: false, error: 'Unsupported playlist schema version.' };
    const themes = collectThemes(raw.themes, notices);
    const themeId =
      typeof playlistRaw.themeId === 'string' && playlistRaw.themeId
        ? playlistRaw.themeId
        : typeof raw.themeId === 'string'
          ? raw.themeId
          : null;
    return { ok: true, playlist, themes, themeId, notices, packaged: true };
  }

  const playlistRaw = asPlaylistRecord(raw);
  if (!playlistRaw) return { ok: false, error: 'Invalid playlist file.' };
  overlayNotice(raw, notices);
  const playlist = parsePlaylistObject(playlistRaw, notices);
  if (!playlist) return { ok: false, error: 'Unsupported playlist schema version.' };
  const themeId = typeof raw.themeId === 'string' && raw.themeId ? raw.themeId : null;
  const themes = collectThemes(raw.themes, notices);
  return {
    ok: true,
    playlist,
    themes,
    themeId,
    notices,
    packaged: false,
  };
}

export function collectStyleThemeIds(nodes: Node[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    if (node.type !== 'style') continue;
    const themeId = parseStyleNodeData(node.data).themeId.trim();
    if (!themeId || seen.has(themeId)) continue;
    seen.add(themeId);
    ids.push(themeId);
  }
  return ids;
}

export function collectDependentCustomThemes(
  nodes: Node[],
  customThemes: SynapseTheme[],
  extraThemeIds: Array<string | null | undefined> = []
): SynapseTheme[] {
  const wanted = new Set(collectStyleThemeIds(nodes));
  for (const id of extraThemeIds) {
    if (id) wanted.add(id);
  }
  const byId = new Map(customThemes.filter((theme) => !theme.builtin).map((theme) => [theme.id, theme]));
  const out: SynapseTheme[] = [];
  for (const id of wanted) {
    const theme = byId.get(id);
    if (theme) out.push(theme);
  }
  return out;
}

export function remapStyleNodeThemeIds(
  nodes: Node[],
  assigned: ReadonlyMap<string, string>
): Node[] {
  if (assigned.size === 0) return nodes;
  let changed = false;
  const next = nodes.map((node) => {
    if (node.type !== 'style' || !node.data || typeof node.data !== 'object') return node;
    const themeId = parseStyleNodeData(node.data).themeId;
    const mapped = assigned.get(themeId);
    if (!mapped || mapped === themeId) return node;
    changed = true;
    return { ...node, data: { ...(node.data as Record<string, unknown>), themeId: mapped } };
  });
  return changed ? next : nodes;
}

function exportableThemeJson(theme: SynapseTheme): unknown {
  const clean = parseTheme({ ...theme, overlays: [], builtin: false }) ?? theme;
  return JSON.parse(themeToJson(clean));
}

export function parsePlaylistFile(text: string): PlaylistParseResult {
  if (looksLikeZipText(text)) {
    return { ok: false, error: ZIP_PLAYLIST_ERROR };
  }
  if (text.length > MAX_FILE_CHARS) {
    return { ok: false, error: 'Playlist file is too large.' };
  }
  try {
    return parsePlaylistDocument(JSON.parse(text));
  } catch {
    return { ok: false, error: 'Invalid playlist file.' };
  }
}

function exportableNodes(nodes: Node[]): Node[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
    },
    data: (node.data && typeof node.data === 'object' ? node.data : {}) as Record<string, unknown>,
    ...(node.hidden ? { hidden: true } : {}),
  }));
}

function exportableEdges(edges: Edge[]): Edge[] {
  return edges.map((edge) => {
    const next: Edge = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
    };
    if (edge.sourceHandle) next.sourceHandle = edge.sourceHandle;
    if (edge.targetHandle) next.targetHandle = edge.targetHandle;
    return next;
  });
}

export function serializePlaylist(
  path: StoredMusicPath,
  options?: { themeId?: string | null; settings?: Record<string, unknown> }
): PlaylistFile {
  return {
    schemaVersion: PLAYLIST_SCHEMA_VERSION,
    type: PLAYLIST_TYPE,
    id: path.id,
    name: sanitizePlaylistName(path.name),
    visibility: path.visibility === 'public' ? 'public' : 'private',
    updatedAt: path.updatedAt,
    nodes: exportableNodes(path.nodes),
    edges: exportableEdges(path.edges),
    settings: options?.settings && typeof options.settings === 'object' ? options.settings : {},
    themeId: options?.themeId || null,
  };
}

export function serializePlaylistJson(
  path: StoredMusicPath,
  options?: { themeId?: string | null; settings?: Record<string, unknown>; themes?: SynapseTheme[] }
): string {
  const playlist = serializePlaylist(path, options);
  if (!options?.themes?.length) return JSON.stringify(playlist, null, 2);
  return JSON.stringify({ ...playlist, themes: options.themes.map(exportableThemeJson) }, null, 2);
}

export function serializePackageJson(
  path: StoredMusicPath,
  themes: SynapseTheme[],
  options?: { themeId?: string | null }
): string {
  const playlist = serializePlaylist(path, { themeId: options?.themeId ?? null });
  const themeFiles = themes.map(exportableThemeJson);
  const doc: PlaylistPackageFile = {
    schemaVersion: PLAYLIST_SCHEMA_VERSION,
    type: PACKAGE_TYPE,
    manifest: {
      schemaVersion: PLAYLIST_SCHEMA_VERSION,
      playlist: 'playlist.synapse',
      themes: themes.map((theme) => `themes/${theme.id}.json`),
      overlays: [],
    },
    playlist,
    themes: themeFiles,
  };
  return JSON.stringify(doc, null, 2);
}

export function parsePlaylistBytes(bytes: Uint8Array): PlaylistParseResult {
  if (looksLikeZipBytes(bytes)) {
    return { ok: false, error: ZIP_PLAYLIST_ERROR };
  }
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  return parsePlaylistFile(text);
}
