import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  flushWorkspaceNow,
  PERSIST_DEBOUNCE_MS,
  registerWorkspaceFlush,
  scheduleWorkspacePersist,
  setCloudPersistEnabled,
} from './persistGate';

describe('persistGate', () => {
  afterEach(() => {
    setCloudPersistEnabled(false);
    registerWorkspaceFlush(() => undefined);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does not flush while persist is disabled', async () => {
    const flush = vi.fn();
    registerWorkspaceFlush(flush);
    setCloudPersistEnabled(false);
    await flushWorkspaceNow();
    expect(flush).not.toHaveBeenCalled();
  });

  it('does not flush a scheduled persist after persist is disabled', () => {
    vi.stubGlobal('window', {});
    vi.useFakeTimers();
    const flush = vi.fn();
    registerWorkspaceFlush(flush);
    setCloudPersistEnabled(true);
    scheduleWorkspacePersist();
    setCloudPersistEnabled(false);
    vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS + 50);
    expect(flush).not.toHaveBeenCalled();
  });

  it('flushes a persist that was scheduled while disabled', () => {
    vi.stubGlobal('window', {});
    vi.useFakeTimers();
    const flush = vi.fn();
    registerWorkspaceFlush(flush);
    setCloudPersistEnabled(false);
    scheduleWorkspacePersist();
    expect(flush).not.toHaveBeenCalled();
    setCloudPersistEnabled(true);
    vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS + 50);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('waits out the debounce before a second write if edits arrive during a flush', async () => {
    vi.stubGlobal('window', {});
    vi.useFakeTimers();
    let resolveFlush: (() => void) | undefined;
    const flush = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFlush = resolve;
        })
    );
    registerWorkspaceFlush(flush);
    setCloudPersistEnabled(true);
    scheduleWorkspacePersist();
    vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS + 50);
    expect(flush).toHaveBeenCalledTimes(1);
    scheduleWorkspacePersist();
    resolveFlush?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(flush).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS + 50);
    expect(flush).toHaveBeenCalledTimes(2);
  });
});
