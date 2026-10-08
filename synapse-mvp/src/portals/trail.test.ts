import { describe, expect, it } from 'vitest';
import { makeEdge, makeNode } from '../engine/graphFixtures';
import {
  appendPortalHop,
  formatPortalTrailStop,
  hopContextFromTrail,
  snapshotPortalTrailStop,
  type PortalTrailStop,
} from './trail';

function stop(
  partial: Pick<PortalTrailStop, 'playlistId' | 'playlistName' | 'portalId'> &
    Partial<PortalTrailStop>
): PortalTrailStop {
  return snapshotPortalTrailStop({
    landingNodeId: partial.landingNodeId || 'start',
    workshopShareKey: partial.workshopShareKey ?? null,
    locked: partial.locked ?? false,
    memoryOnly: partial.memoryOnly ?? false,
    nodes: partial.nodes || [makeNode('start', 'start')],
    edges: partial.edges || [makeEdge('start', 't1')],
    playlistId: partial.playlistId,
    playlistName: partial.playlistName,
    portalId: partial.portalId,
  });
}

describe('portal trail', () => {
  it('formats a hop as [playlist, portal id]', () => {
    expect(
      formatPortalTrailStop({ playlistName: 'Morning', portalId: 'P-SRC11SRC' })
    ).toBe('[Morning, P-SRC11SRC]');
    expect(formatPortalTrailStop({ playlistName: 'Night', portalId: '' })).toBe(
      '[Night, Start]'
    );
  });

  it('starts a trail with the exit then the landing', () => {
    const trail = appendPortalHop(
      [],
      stop({ playlistId: 'a', playlistName: 'A', portalId: 'P-SRC11SRC' }),
      stop({ playlistId: 'b', playlistName: 'B', portalId: 'P-DST11DST' })
    );
    expect(trail.map(formatPortalTrailStop)).toEqual([
      '[A, P-SRC11SRC]',
      '[B, P-DST11DST]',
    ]);
  });

  it('keeps the landing node when leaving the current playlist again', () => {
    const first = appendPortalHop(
      [],
      stop({ playlistId: 'a', playlistName: 'A', portalId: 'P-AAAA1111' }),
      stop({
        playlistId: 'b',
        playlistName: 'B',
        portalId: 'P-BBBB2222',
        landingNodeId: 'gate',
      })
    );
    const next = appendPortalHop(
      first,
      stop({
        playlistId: 'b',
        playlistName: 'B',
        portalId: 'P-BEXIT333',
        landingNodeId: 'start',
      }),
      stop({ playlistId: 'c', playlistName: 'C', portalId: 'Start' })
    );
    expect(next.map((item) => item.landingNodeId)).toEqual(['start', 'gate', 'start']);
    expect(next[1].portalId).toBe('P-BEXIT333');
    expect(hopContextFromTrail(next)).toEqual({
      hops: 2,
      visited: ['b:P-AAAA1111', 'c:P-BEXIT333'],
    });
  });
});
