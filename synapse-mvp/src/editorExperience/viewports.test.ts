import { describe, expect, it, beforeEach } from 'vitest';
import {
  PATH_VIEWPORTS_KEY,
  isEditorViewport,
  pushUndoViewport,
  readPathViewport,
  resetViewportStoreForTests,
  takeUndoViewport,
  writePathViewport,
} from './viewports';

function memoryKv(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem(key: string) {
      return data[key] ?? null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
    data,
  };
}

describe('editor viewports', () => {
  beforeEach(() => {
    resetViewportStoreForTests();
  });

  it('rejects junk viewports', () => {
    expect(isEditorViewport({ x: 1, y: 2, zoom: 0 })).toBe(false);
    expect(isEditorViewport({ x: 1, y: 2, zoom: 1.2 })).toBe(true);
  });

  it('round-trips a playlist viewport', () => {
    const kv = memoryKv();
    writePathViewport('path-1', { x: 10, y: -4, zoom: 1.25 }, kv);
    expect(readPathViewport('path-1', kv)).toEqual({ x: 10, y: -4, zoom: 1.25 });
    expect(JSON.parse(kv.data[PATH_VIEWPORTS_KEY])).toEqual({
      'path-1': { x: 10, y: -4, zoom: 1.25 },
    });
  });

  it('stores one previous viewport for restore', () => {
    pushUndoViewport({ x: 1, y: 2, zoom: 0.5 });
    expect(takeUndoViewport()).toEqual({ x: 1, y: 2, zoom: 0.5 });
    expect(takeUndoViewport()).toBeNull();
  });
});
