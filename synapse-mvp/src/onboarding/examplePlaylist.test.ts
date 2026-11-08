import { describe, expect, it } from 'vitest';
import { buildExamplePath, EXAMPLE_PLAYLIST_NAME } from './examplePlaylist';

describe('example playlist', () => {
  it('builds a labeled path with comments, a randomizer pool, and an end', () => {
    const path = buildExamplePath();
    expect(path.name).toBe(EXAMPLE_PLAYLIST_NAME);
    expect(path.nodes.some((node) => node.type === 'start')).toBe(true);
    expect(path.nodes.some((node) => node.type === 'randomizer')).toBe(true);
    expect(path.nodes.some((node) => node.type === 'end')).toBe(true);
    expect(path.nodes.filter((node) => node.type === 'comment')).toHaveLength(2);
    expect(path.nodes.filter((node) => node.type === 'track')).toHaveLength(3);
    expect(path.edges.length).toBeGreaterThanOrEqual(3);
    const parked = path.nodes.filter(
      (node) => node.type === 'track' && Boolean((node.data as { embeddedIn?: string }).embeddedIn)
    );
    expect(parked).toHaveLength(2);
  });
});
