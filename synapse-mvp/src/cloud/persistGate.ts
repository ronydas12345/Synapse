let enabled = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let flush: (() => void | Promise<void>) | null = null;

export function registerWorkspaceFlush(fn: () => void | Promise<void>): void {
  flush = fn;
}

export function setCloudPersistEnabled(on: boolean): void {
  enabled = on;
}

export function isCloudPersistEnabled(): boolean {
  return enabled;
}

export function scheduleWorkspacePersist(): void {
  if (!enabled || !flush) return;
  if (typeof window === 'undefined') {
    void flush();
    return;
  }
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flush?.();
  }, 700);
}

export async function flushWorkspaceNow(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (enabled && flush) await flush();
}
