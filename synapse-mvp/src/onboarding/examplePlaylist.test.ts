import { describe, expect, it } from 'vitest';
import {
  buildExamplePath,
  EXAMPLE_NODE_SIZE,
  EXAMPLE_PLAYLIST_NAME,
} from './examplePlaylist';

function box(node: { type?: string; position: { x: number; y: number } }) {
  const size = EXAMPLE_NODE_SIZE[node.type ?? ''] ?? { width: 200, height: 150 };
  return {
    id: `${node.type}:${node.position.x},${node.position.y}`,
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + size.width,
    bottom: node.position.y + size.height,
  };
}

function overlap(a: ReturnType<typeof box>, b: ReturnType<typeof box>): boolean {
  return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
}

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
    const videos = path.nodes
      .filter((node) => node.type === 'track')
      .map((node) => String((node.data as { videoId?: string }).videoId || ''));
    expect(videos.every((id) => /^[\w-]{11}$/.test(id))).toBe(true);
    expect(new Set(videos).size).toBe(3);
    const randomizer = path.nodes.find((node) => node.type === 'randomizer');
    const weights = (randomizer?.data as { weights?: number[] }).weights ?? [];
    expect(weights).toHaveLength(2);
    expect(weights[0]).not.toBe(weights[1]);
  });

  it('keeps visible nodes from covering each other, including an expanded Randomizer', () => {
    const visible = buildExamplePath().nodes.filter((node) => !node.hidden);
    const boxes = visible.map(box);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlap(boxes[i], boxes[j]), `${boxes[i].id} overlaps ${boxes[j].id}`).toBe(
          false
        );
      }
    }
  });
});
