import type { Edge, Node } from '@xyflow/react';
import { defaultTrackNodeData } from '../settings/nodeDefaults';
import {
  addImportedPath,
  uniquePathName,
  type StoredMusicPath,
} from '../playlists/library';
import { snapshotPathLibrary, usePathStore } from '../store';

export const EXAMPLE_PLAYLIST_NAME = 'Example path';

function track(id: string, title: string, position: { x: number; y: number }, extra?: Partial<Node>): Node {
  return {
    id,
    type: 'track',
    position,
    data: { ...defaultTrackNodeData(), songTitle: title, name: title },
    ...extra,
  };
}

/** Visible sizes used to keep the example graph from stacking nodes. */
export const EXAMPLE_NODE_SIZE: Record<string, { width: number; height: number }> = {
  start: { width: 160, height: 110 },
  end: { width: 160, height: 110 },
  track: { width: 288, height: 180 },
  randomizer: { width: 320, height: 480 },
  comment: { width: 256, height: 280 },
};

export function buildExamplePath(): StoredMusicPath {
  const nodes: Node[] = [
    {
      id: 'ex-comment-start',
      type: 'comment',
      position: { x: 80, y: 40 },
      data: {
        name: '',
        text: 'Playback starts here. Follow the lines — not the layout — to hear the next node.',
        linkedNodeId: 'ex-start',
      },
    },
    {
      id: 'ex-start',
      type: 'start',
      position: { x: 80, y: 380 },
      data: { label: 'Start', name: '' },
    },
    track('ex-track-a', 'First song', { x: 80, y: 560 }),
    {
      id: 'ex-rand',
      type: 'randomizer',
      position: { x: 460, y: 360 },
      data: {
        name: 'A or B',
        tracks: ['ex-track-b', 'ex-track-c'],
        weights: [10, 10],
        isCollapsed: false,
        playCount: 1,
        mode: 'randomizer',
      },
    },
    track('ex-track-b', 'Pool song A', { x: 460, y: 40 }, {
      hidden: true,
      data: {
        ...defaultTrackNodeData(),
        songTitle: 'Pool song A',
        name: 'Pool song A',
        embeddedIn: 'ex-rand',
      },
    }),
    track('ex-track-c', 'Pool song B', { x: 720, y: 40 }, {
      hidden: true,
      data: {
        ...defaultTrackNodeData(),
        songTitle: 'Pool song B',
        name: 'Pool song B',
        embeddedIn: 'ex-rand',
      },
    }),
    {
      id: 'ex-comment-rand',
      type: 'comment',
      position: { x: 840, y: 40 },
      data: {
        name: '',
        text: 'A Randomizer picks one parked track each visit. This is an example, not your playlist.',
        linkedNodeId: 'ex-rand',
      },
    },
    {
      id: 'ex-end',
      type: 'end',
      position: { x: 880, y: 500 },
      data: { label: 'End', name: '' },
    },
  ];
  const edges: Edge[] = [
    { id: 'ex-e1', source: 'ex-start', target: 'ex-track-a' },
    { id: 'ex-e2', source: 'ex-track-a', target: 'ex-rand' },
    { id: 'ex-e3', source: 'ex-rand', target: 'ex-end' },
  ];
  return {
    id: 'example-path',
    name: EXAMPLE_PLAYLIST_NAME,
    visibility: 'private',
    tags: [],
    nodes,
    edges,
    updatedAt: new Date().toISOString(),
  };
}

export function openExamplePlaylist(): void {
  const lib = snapshotPathLibrary();
  const incoming = {
    ...buildExamplePath(),
    id: '',
    name: uniquePathName(lib.paths.map((path) => path.name), EXAMPLE_PLAYLIST_NAME),
  };
  const next = addImportedPath(lib, incoming, { keepName: true });
  usePathStore.getState().replaceLibrary(next);
}
