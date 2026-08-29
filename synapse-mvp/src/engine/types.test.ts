import { describe, expect, it } from 'vitest';
import { parseQueueKey, toQueueKey } from './types';

describe('queue keys', () => {
  it('round-trips track and transition keys', () => {
    expect(parseQueueKey(toQueueKey('track', 'n1'))).toEqual({
      kind: 'track',
      nodeId: 'n1',
      key: 'track:n1',
    });
    expect(parseQueueKey(toQueueKey('transition', 'tx'))).toEqual({
      kind: 'transition',
      nodeId: 'tx',
      key: 'transition:tx',
    });
  });

  it('rejects malformed keys', () => {
    expect(parseQueueKey('')).toBeNull();
    expect(parseQueueKey('track')).toBeNull();
    expect(parseQueueKey(':id')).toBeNull();
    expect(parseQueueKey('other:id')).toBeNull();
    expect(parseQueueKey('track:')).toBeNull();
  });
});
