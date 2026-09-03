import { describe, expect, it } from 'vitest';
import {
  addTrackToRandomizerList,
  applyTrackMovesIntoRandomizers,
  flattenEmbeddedTracks,
  listedTrackIds,
  moveSequenceItemBetweenRandomizers,
  normalizeWorkspaceGraph,
  overlapArea,
  parseSequenceItemPayload,
  pickRandomizerDropTarget,
  reconcileAfterNodeRemovals,
  removeTrackFromRandomizerList,
  reorderRandomizerTracks,
  restoreTrackFromRandomizer,
  restoreTracksFromDeletedRandomizer,
  syncParkedTracks,
  visibleCanvasNodes,
} from './randomizerDrop';

const track = (
  id: string,
  extras: Record<string, unknown> = {}
) => ({
  id,
  type: 'track' as const,
  position: { x: 100, y: 100 },
  data: { videoId: `yt-${id}`, songTitle: `Song ${id}`, artist: 'A', album: 'B', ...extras },
});

const randomizer = (
  id: string,
  tracks: string[] = [],
  position = { x: 120, y: 110 }
) => ({
  id,
  type: 'randomizer' as const,
  position,
  data: { tracks, weights: tracks.map(() => 10), mode: 'sequence' },
});

describe('addTrackToRandomizerList', () => {
  it('appends a track with weight 10', () => {
    expect(addTrackToRandomizerList({ tracks: ['a'], weights: [15] }, 'b')).toEqual({
      tracks: ['a', 'b'],
      weights: [15, 10],
    });
  });

  it('returns null for duplicates', () => {
    expect(addTrackToRandomizerList({ tracks: ['a'], weights: [10] }, 'a')).toBeNull();
  });

  it('starts from empty lists', () => {
    expect(addTrackToRandomizerList(undefined, 't1')).toEqual({
      tracks: ['t1'],
      weights: [10],
    });
  });
});

describe('removeTrackFromRandomizerList', () => {
  it('removes the matching track and weight', () => {
    expect(
      removeTrackFromRandomizerList({ tracks: ['a', 'b'], weights: [3, 8] }, 'a')
    ).toEqual({ tracks: ['b'], weights: [8] });
  });
});

describe('reorderRandomizerTracks', () => {
  it('moves last to first', () => {
    expect(
      reorderRandomizerTracks({ tracks: ['a', 'b', 'c'], weights: [1, 2, 3] }, 2, 0)
    ).toEqual({ tracks: ['c', 'a', 'b'], weights: [3, 1, 2] });
  });

  it('moves first to last', () => {
    expect(
      reorderRandomizerTracks({ tracks: ['a', 'b', 'c'], weights: [1, 2, 3] }, 0, 2)
    ).toEqual({ tracks: ['b', 'c', 'a'], weights: [2, 3, 1] });
  });

  it('reorders a two-item list', () => {
    expect(
      reorderRandomizerTracks({ tracks: ['a', 'b'], weights: [4, 5] }, 0, 1)
    ).toEqual({ tracks: ['b', 'a'], weights: [5, 4] });
  });

  it('is a no-op for a one-item list dropped on itself', () => {
    expect(reorderRandomizerTracks({ tracks: ['a'], weights: [1] }, 0, 0)).toBeNull();
  });

  it('returns null for out-of-range indexes', () => {
    expect(reorderRandomizerTracks({ tracks: ['a', 'b'], weights: [1, 2] }, 0, 9)).toBeNull();
  });
});

describe('pickRandomizerDropTarget', () => {
  it('picks the overlapping randomizer', () => {
    const t1 = track('t1');
    const nodes = [t1, randomizer('r1'), randomizer('r2', [], { x: 800, y: 800 })];
    expect(pickRandomizerDropTarget(t1, nodes)?.id).toBe('r1');
  });

  it('returns null when there is no overlap', () => {
    const t1 = { id: 't1', type: 'track', position: { x: 0, y: 0 } };
    const nodes = [{ id: 'r1', type: 'randomizer', position: { x: 2000, y: 2000 } }];
    expect(pickRandomizerDropTarget(t1, nodes)).toBeNull();
  });
});

describe('overlapArea', () => {
  it('is zero for disjoint rects', () => {
    expect(
      overlapArea({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 })
    ).toBe(0);
  });
});

describe('applyTrackMovesIntoRandomizers', () => {
  it('moves a track into the sequence: listed, hidden from canvas, metadata kept, edges stripped', () => {
    const nodes = [
      track('t1', { volume: 80, speed: 110, playCount: 2, startTime: 3, endTime: 40 }),
      randomizer('r1', ['existing']),
    ];
    const edges = [
      { id: 'e1', source: 'start', target: 't1' },
      { id: 'e2', source: 't1', target: 'r1' },
    ];
    const dragged = [{ id: 't1', type: 'track', position: { x: 100, y: 100 }, data: {} }];
    const next = applyTrackMovesIntoRandomizers(nodes, edges, dragged);
    expect(next).not.toBeNull();
    expect(next!.nodes.find((n) => n.id === 'r1')?.data).toEqual({
      tracks: ['existing', 't1'],
      weights: [10, 10],
      mode: 'sequence',
    });
    const parked = next!.nodes.find((n) => n.id === 't1');
    expect(parked?.hidden).toBe(true);
    expect(parked?.data).toMatchObject({
      videoId: 'yt-t1',
      songTitle: 'Song t1',
      artist: 'A',
      album: 'B',
      volume: 80,
      speed: 110,
      playCount: 2,
      startTime: 3,
      endTime: 40,
    });
    expect(visibleCanvasNodes(next!.nodes).map((n) => n.id)).toEqual(['r1']);
    expect(next!.edges).toEqual([]);
  });

  it('does not duplicate an already-listed parked track', () => {
    const nodes = [
      { ...track('t1'), hidden: true },
      randomizer('r1', ['t1']),
    ];
    const dragged = [{ id: 't1', type: 'track', position: { x: 100, y: 100 }, data: {} }];
    const again = applyTrackMovesIntoRandomizers(nodes, [], dragged);
    expect(again).toBeNull();
  });

  it('parks a listed-but-visible leftover track without duplicating', () => {
    const nodes = [track('t1'), randomizer('r1', ['t1'])];
    const next = applyTrackMovesIntoRandomizers(nodes, [{ id: 'e', source: 't1', target: 'r1' }], [
      { id: 't1', type: 'track', position: { x: 100, y: 100 }, data: {} },
    ]);
    expect(next!.nodes.find((n) => n.id === 'r1')?.data?.tracks).toEqual(['t1']);
    expect(next!.nodes.find((n) => n.id === 't1')?.hidden).toBe(true);
    expect(next!.edges).toEqual([]);
  });

  it('is a no-op when the drop does not overlap a sequence', () => {
    const nodes = [track('t1'), randomizer('r1', [], { x: 2000, y: 2000 })];
    const dragged = [{ id: 't1', type: 'track', position: { x: 0, y: 0 }, data: {} }];
    expect(applyTrackMovesIntoRandomizers(nodes, [], dragged)).toBeNull();
  });
});

describe('restoreTrackFromRandomizer', () => {
  it('restores the parked node at the drop position with metadata intact', () => {
    const nodes = [
      { ...track('t1', { volume: 42 }), hidden: true },
      randomizer('r1', ['t1']),
    ];
    const next = restoreTrackFromRandomizer(nodes, [], 'r1', 't1', { x: 500, y: 600 });
    expect(next).not.toBeNull();
    expect(next!.nodes.find((n) => n.id === 'r1')?.data?.tracks).toEqual([]);
    const restored = next!.nodes.find((n) => n.id === 't1');
    expect(restored?.hidden).toBe(false);
    expect(restored?.position).toEqual({ x: 500, y: 600 });
    expect(restored?.data).toMatchObject({ videoId: 'yt-t1', songTitle: 'Song t1', volume: 42 });
    expect(visibleCanvasNodes(next!.nodes).map((n) => n.id).sort()).toEqual(['r1', 't1']);
  });

  it('removes a stale id without crashing when the track node is gone', () => {
    const nodes = [randomizer('r1', ['missing'])];
    const next = restoreTrackFromRandomizer(nodes, [], 'r1', 'missing', { x: 1, y: 2 });
    expect(next!.nodes.find((n) => n.id === 'r1')?.data?.tracks).toEqual([]);
    expect(next!.nodes.find((n) => n.id === 'missing')).toBeUndefined();
  });
});

describe('restoreTracksFromDeletedRandomizer', () => {
  it('unhides contained tracks near the deleted sequence', () => {
    const seq = randomizer('r1', ['t1', 't2']);
    const nodes = [
      { ...track('t1'), hidden: true, position: { x: 9, y: 9 } },
      { ...track('t2'), hidden: true, position: { x: 8, y: 8 } },
    ];
    const next = restoreTracksFromDeletedRandomizer(nodes, [], seq);
    const t1 = next.nodes.find((n) => n.id === 't1');
    const t2 = next.nodes.find((n) => n.id === 't2');
    expect(t1?.hidden).toBe(false);
    expect(t2?.hidden).toBe(false);
    expect(t1?.position.x).toBeGreaterThan(seq.position.x);
    expect(t1?.data).toMatchObject({ videoId: 'yt-t1' });
  });
});

describe('moveSequenceItemBetweenRandomizers', () => {
  it('moves membership without duplicating', () => {
    const nodes = [
      { ...track('t1'), hidden: true },
      randomizer('r1', ['t1']),
      randomizer('r2', ['other'], { x: 400, y: 400 }),
    ];
    const next = moveSequenceItemBetweenRandomizers(nodes, [], 'r1', 'r2', 't1');
    expect(next!.nodes.find((n) => n.id === 'r1')?.data?.tracks).toEqual([]);
    expect(next!.nodes.find((n) => n.id === 'r2')?.data?.tracks).toEqual(['other', 't1']);
    expect(next!.nodes.find((n) => n.id === 't1')?.hidden).toBe(true);
  });
});

describe('syncParkedTracks / normalizeWorkspaceGraph', () => {
  it('hides tracks listed on a randomizer and strips their edges', () => {
    const nodes = [track('t1'), randomizer('r1', ['t1'])];
    const edges = [{ id: 'e', source: 'start', target: 't1' }];
    const next = syncParkedTracks(nodes, edges);
    expect(next.nodes.find((n) => n.id === 't1')?.hidden).toBe(true);
    expect(next.edges).toEqual([]);
    expect(listedTrackIds(next.nodes).has('t1')).toBe(true);
  });

  it('treats leftover parentId nests as listed-and-parked after flatten', () => {
    const nodes = [
      randomizer('r1', ['t1'], { x: 40, y: 50 }),
      {
        id: 't1',
        type: 'track',
        parentId: 'r1',
        position: { x: 12, y: 80 },
        data: { embeddedIn: 'r1', videoId: 'abc' },
      },
    ];
    const next = normalizeWorkspaceGraph(nodes, [{ id: 'e', source: 't1', target: 'end' }]);
    const parked = next.nodes.find((n) => n.id === 't1');
    expect(parked?.parentId).toBeUndefined();
    expect(parked?.position).toEqual({ x: 52, y: 130 });
    expect(parked?.hidden).toBe(true);
    expect(next.edges).toEqual([]);
  });
});

describe('flattenEmbeddedTracks', () => {
  it('converts nested tracks back to world positions without dropping list membership', () => {
    const nodes = [
      {
        id: 'r1',
        type: 'randomizer',
        position: { x: 40, y: 50 },
        data: { tracks: ['t1'], weights: [10] },
      },
      {
        id: 't1',
        type: 'track',
        parentId: 'r1',
        position: { x: 12, y: 80 },
        data: { embeddedIn: 'r1' },
      },
    ];
    const next = flattenEmbeddedTracks(nodes);
    const t = next.find((n) => n.id === 't1');
    expect(t?.parentId).toBeUndefined();
    expect(t?.position).toEqual({ x: 52, y: 130 });
    expect(next.find((n) => n.id === 'r1')?.data?.tracks).toEqual(['t1']);
  });
});

describe('reconcileAfterNodeRemovals', () => {
  it('restores parked tracks when their sequence is deleted', () => {
    const seq = randomizer('r1', ['t1']);
    const remaining = [{ ...track('t1'), hidden: true }];
    const next = reconcileAfterNodeRemovals(remaining, [], [seq]);
    expect(next.nodes.find((n) => n.id === 't1')?.hidden).toBe(false);
  });
});

describe('parseSequenceItemPayload', () => {
  it('accepts a valid payload and rejects junk', () => {
    expect(
      parseSequenceItemPayload(
        JSON.stringify({ kind: 'sequence-item', randomizerId: 'r1', trackId: 't1', index: 0 })
      )
    ).toEqual({ kind: 'sequence-item', randomizerId: 'r1', trackId: 't1', index: 0 });
    expect(parseSequenceItemPayload('{"kind":"nope"}')).toBeNull();
  });
});
