export type CloudSaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'failed';

export interface SaveSnapshot {
  status: CloudSaveStatus;
  error: string | null;
}

let enabled = false;
let pending = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let flush: (() => void | Promise<void>) | null = null;
let writing = false;
let queued = false;
let snapshot: SaveSnapshot = { status: 'idle', error: null };
const listeners = new Set<() => void>();

function emit(next: SaveSnapshot): void {
  snapshot = next;
  listeners.forEach((fn) => fn());
}

export function subscribeSaveStatus(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getSaveSnapshot(): SaveSnapshot {
  return snapshot;
}

export function registerWorkspaceFlush(fn: () => void | Promise<void>): void {
  flush = fn;
}

export function setCloudPersistEnabled(on: boolean): void {
  enabled = on;
  if (!on && timer) {
    clearTimeout(timer);
    timer = null;
    pending = true;
  }
  if (on && pending) {
    pending = false;
    scheduleWorkspacePersist();
  }
}

export function isCloudPersistEnabled(): boolean {
  return enabled;
}

export function scheduleWorkspacePersist(): void {
  if (!flush) return;
  if (snapshot.status !== 'saving') {
    emit({ status: 'unsaved', error: null });
  }
  if (!enabled) {
    pending = true;
    return;
  }
  if (typeof window === 'undefined') {
    void runFlush();
    return;
  }
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    if (!enabled) {
      pending = true;
      return;
    }
    void runFlush();
  }, 700);
}

async function runFlush(): Promise<void> {
  if (!flush) return;
  if (writing) {
    queued = true;
    return;
  }
  writing = true;
  emit({ status: 'saving', error: null });
  try {
    do {
      queued = false;
      await flush();
    } while (queued);
    emit({ status: 'saved', error: null });
  } catch (err) {
    emit({
      status: 'failed',
      error: err instanceof Error ? err.message : 'Could not save changes.',
    });
  } finally {
    writing = false;
  }
}

export async function flushWorkspaceNow(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (enabled && flush) await runFlush();
}

export async function retryWorkspaceSave(): Promise<void> {
  await flushWorkspaceNow();
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    setCloudPersistEnabled(false);
    flush = null;
  });
}
