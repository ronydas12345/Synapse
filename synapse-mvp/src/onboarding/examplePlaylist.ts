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

export function buildExamplePath(): StoredMusicPath {
  const nodes: Node[] = [
    {
      id: 'ex-start',
      type: 'start',
      position: { x: 80, y: 200 },
      data: { label: 'Start', name: '' },
    },
    track('ex-track-a', 'First song', { x: 80, y: 360 }),
    {
      id: 'ex-rand',
      type: 'randomizer',
      position: { x: 440, y: 280 },
      data: {
        name: 'A or B',
        tracks: ['ex-track-b', 'ex-track-c'],
        weights: [10, 10],
        isCollapsed: false,
        playCount: 1,
        mode: 'randomizer',
      },
    },
    track('ex-track-b', 'Pool song A', { x: 440, y: 80 }, {
      hidden: true,
      data: {
        ...defaultTrackNodeData(),
        songTitle: 'Pool song A',
        name: 'Pool song A',
        embeddedIn: 'ex-rand',
      },
    }),
    track('ex-track-c', 'Pool song B', { x: 700, y: 80 }, {
      hidden: true,
      data: {
        ...defaultTrackNodeData(),
        songTitle: 'Pool song B',
        name: 'Pool song B',
        embeddedIn: 'ex-rand',
      },
    }),
    {
      id: 'ex-end',
      type: 'end',
      position: { x: 760, y: 300 },
      data: { label: 'End', name: '' },
    },
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
      id: 'ex-comment-rand',
      type: 'comment',
      position: { x: 440, y: 500 },
      data: {
        name: '',
        text: 'A Randomizer picks one parked track each visit. This is an example, not your playlist.',
        linkedNodeId: 'ex-rand',
      },
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
