import { describe, expect, it } from 'vitest';
import {
  connectedPathTargetId,
  defaultPathKey,
  defaultPathName,
  formatPathKeyHint,
  parsePathKeys,
  parsePathNames,
  pathDisplayName,
  pathKeyFromEvent,
  pathKeyMatches,
  storedPathNames,
} from './pathMeta';

describe('conditional path names and keys', () => {
  it('fills empty names with Path A / Path B', () => {
    expect(parsePathNames(undefined, 2)).toEqual(['Path A', 'Path B']);
    expect(parsePathNames(['Verse', ''], 2)).toEqual(['Verse', 'Path B']);
    expect(storedPathNames(['Verse', ''], 2)).toEqual(['Verse', '']);
    expect(pathDisplayName({ numPaths: 2, pathNames: ['Chorus'] }, 1)).toBe(
      'Path B'
    );
    expect(defaultPathName(0)).toBe('Path A');
  });

  it('defaults keys to 1, 2, … and keeps an explicit empty bind', () => {
    expect(parsePathKeys(undefined, 2)).toEqual(['1', '2']);
    expect(parsePathKeys(['a', ''], 2)).toEqual(['a', '']);
    expect(defaultPathKey(9)).toBe('0');
    expect(formatPathKeyHint('a')).toBe('A');
    expect(formatPathKeyHint('Space')).toBe('Space');
  });

  it('matches a stored key against a keyboard event', () => {
    const event = { key: '1', ctrlKey: false, metaKey: false, altKey: false };
    expect(pathKeyMatches('1', event as KeyboardEvent)).toBe(true);
    expect(pathKeyMatches('a', { ...event, key: 'A' } as KeyboardEvent)).toBe(
      true
    );
    expect(pathKeyMatches('Space', { ...event, key: ' ' } as KeyboardEvent)).toBe(
      true
    );
    expect(
      pathKeyMatches('1', { ...event, ctrlKey: true } as KeyboardEvent)
    ).toBe(false);
    expect(pathKeyFromEvent({ key: ' ' } as KeyboardEvent)).toBe('Space');
  });

  it('resolves a connected handle target', () => {
    const edges = [
      { source: 'c', target: 'left', sourceHandle: 'A' },
      { source: 'c', target: 'right', sourceHandle: 'B' },
    ];
    expect(connectedPathTargetId('c', 0, edges)).toBe('left');
    expect(connectedPathTargetId('c', 1, edges)).toBe('right');
    expect(connectedPathTargetId('c', 2, edges)).toBeNull();
  });
});
