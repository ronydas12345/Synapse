import { describe, expect, it } from 'vitest';
import type { Node } from '@xyflow/react';
import { isPlaybackStartNodeType } from './engine';
import {
  canDropPlaybackMarkerOn,
  resolvePlaybackMarkerNodeId,
  visiblePlaybackMarkerNodeId,
} from './playbackMarker';

const node = (
  id: string,
  type: string,
  extra: Partial<Node> = {}
): Node => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {},
  ...extra,
});

describe('playback marker targeting', () => {
  it('allows playable types and rejects comments', () => {
    expect(canDropPlaybackMarkerOn('track')).toBe(true);
    expect(canDropPlaybackMarkerOn('conditional')).toBe(true);
    expect(canDropPlaybackMarkerOn('randomizer')).toBe(true);
    expect(canDropPlaybackMarkerOn('start')).toBe(true);
    expect(canDropPlaybackMarkerOn('end')).toBe(true);
    expect(canDropPlaybackMarkerOn('comment')).toBe(false);
    expect(isPlaybackStartNodeType('comment')).toBe(false);
  });

  it('maps parked sequence tracks onto the owning randomizer', () => {
    const nodes: Node[] = [
      node('seq', 'randomizer', { data: { tracks: ['t-hidden'] } }),
      node('t-hidden', 'track', { hidden: true }),
    ];
    expect(visiblePlaybackMarkerNodeId('t-hidden', nodes)).toBe('seq');
  });

  it('prefers the current playing node, then chosen start, then Start', () => {
    const nodes: Node[] = [
      node('start', 'start'),
      node('t1', 'track'),
      node('t2', 'track'),
    ];
    expect(resolvePlaybackMarkerNodeId('t2', 't1', nodes)).toBe('t2');
    expect(resolvePlaybackMarkerNodeId(null, 't1', nodes)).toBe('t1');
    expect(resolvePlaybackMarkerNodeId(null, null, nodes)).toBe('start');
  });
});
