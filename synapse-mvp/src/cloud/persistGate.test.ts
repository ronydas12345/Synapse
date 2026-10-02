import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  flushWorkspaceNow,
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
    vi.advanceTimersByTime(1000);
    expect(flush).not.toHaveBeenCalled();
  });
});
