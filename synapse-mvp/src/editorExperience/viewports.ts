export type EditorViewport = { x: number; y: number; zoom: number };

export const PATH_VIEWPORTS_KEY = 'synapse_editor_path_viewports';

type Kv = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

let memory: Record<string, EditorViewport> = {};
let loaded = false;
let undoViewport: EditorViewport | null = null;

export function isEditorViewport(value: unknown): value is EditorViewport {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    Number.isFinite(row.x) &&
    Number.isFinite(row.y) &&
    Number.isFinite(row.zoom) &&
    (row.zoom as number) > 0
  );
}

function storage(): Kv | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function ensureLoaded(kv: Kv | null = storage()): void {
  if (loaded) return;
  loaded = true;
  if (!kv) return;
  try {
    const raw = JSON.parse(kv.getItem(PATH_VIEWPORTS_KEY) || '{}') as unknown;
    if (!raw || typeof raw !== 'object') return;
    const next: Record<string, EditorViewport> = {};
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      if (id && isEditorViewport(value)) next[id] = value;
    }
    memory = next;
  } catch {
    memory = {};
  }
}

function persist(kv: Kv | null = storage()): void {
  if (!kv) return;
  try {
    kv.setItem(PATH_VIEWPORTS_KEY, JSON.stringify(memory));
  } catch {
    /* quota / private mode */
  }
}

export function readPathViewport(
  pathId: string,
  kv?: Kv | null
): EditorViewport | null {
  if (!pathId) return null;
  ensureLoaded(kv === undefined ? storage() : kv);
  return memory[pathId] ?? null;
}

export function writePathViewport(
  pathId: string,
  viewport: EditorViewport,
  kv?: Kv | null
): void {
  if (!pathId || !isEditorViewport(viewport)) return;
  ensureLoaded(kv === undefined ? storage() : kv);
  memory[pathId] = {
    x: viewport.x,
    y: viewport.y,
    zoom: viewport.zoom,
  };
  persist(kv === undefined ? storage() : kv);
}

export function pushUndoViewport(viewport: EditorViewport): void {
  if (!isEditorViewport(viewport)) return;
  undoViewport = { x: viewport.x, y: viewport.y, zoom: viewport.zoom };
}

export function takeUndoViewport(): EditorViewport | null {
  const next = undoViewport;
  undoViewport = null;
  return next;
}

export function resetViewportStoreForTests(): void {
  memory = {};
  loaded = false;
  undoViewport = null;
}
