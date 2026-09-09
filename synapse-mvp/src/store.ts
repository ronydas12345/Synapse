import {
  addTrackToRandomizerList,
  reconcileAfterNodeRemovals,
  syncParkedTracks,
} from './randomizerDrop';
import { create } from 'zustand';
import type { Node, Edge, Connection } from '@xyflow/react';
import type { PathSummary } from './playlists/library';
import {
  activatePath,
  addImportedPath,
  createPath,
  emptyGraph,
  getPath,
  loadLibrary,
  renamePath,
  saveActiveGraph,
  setPathVisibility,
  summaries,
  type PathLibrary,
} from './playlists/library';
import {
  collectDependentCustomThemes,
  parsePlaylistFile,
  playlistDownloadName,
  remapStyleNodeThemeIds,
  serializePackageJson,
  serializePlaylistJson,
} from './playlists/format';
import { getBuiltinTheme } from './theme/presets';
import { resolveTheme, useThemeStore } from './theme/themeStore';

interface PathState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  commentLinkingId: string | null;
  isPlaying: boolean;
  currentTrackIndex: number;
  currentPlayingNodeId: string | null;
  playbackQueue: string[]; // Queue keys: `track:{nodeId}` | `transition:{nodeId}`
  /**
   * Chosen playback origin from the marker. Transient — not persisted.
   * Null means walk from the graph Start node.
   */
  selectedPlaybackStartNodeId: string | null;
  /** Incremented when user hits Skip — Player owns the actual advance. */
  skipRequestId: number;
  /** Incremented when user hits Previous — Player owns restart vs prior item. */
  previousRequestId: number;
  /** Incremented when the playback marker is dropped on a new origin. */
  playbackOriginRequestId: number;
  /** Current page. Transient — URL is the source of truth. */
  uiMode: 'home' | 'studio' | 'listen' | 'settings' | 'profile';
  activePathId: string;
  pathSummaries: PathSummary[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (id: string | null) => void;
  setSelection: (ids: string[]) => void;
  setCommentLinkingId: (id: string | null) => void;
  updateNodeData: (id: string, data: any) => void;
  setPlaybackQueue: (queue: string[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrackIndex: (index: number) => void;
  setCurrentPlayingNodeId: (id: string | null) => void;
  setPlaybackStartNode: (id: string | null) => void;
  setUiMode: (mode: 'home' | 'studio' | 'listen' | 'settings' | 'profile') => void;
  requestSkip: () => void;
  requestPrevious: () => void;
  deleteEdge: (edgeId: string) => void;
  deleteNode: (nodeId: string) => void;
  initializeFromStorage: () => void;
  normalizeSplitters: () => void;
  createPlaylist: (name?: string) => void;
  switchPlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  setPlaylistVisibility: (id: string, visibility: 'public' | 'private') => void;
  exportPlaylistFile: (
    id: string,
    kind?: 'playlist' | 'package'
  ) => { filename: string; json: string } | null;
  importPlaylistFile: (text: string) => { error: string | null; notices: string[] };
}

let library: PathLibrary = loadLibrary();

const activeGraph = () =>
  library.paths.find((p) => p.id === library.activeId) || library.paths[0];

const saveToStorage = (nodes: Node[], edges: Edge[]) => {
  library = saveActiveGraph(library, nodes, edges);
};

const libraryView = () => {
  const graph = activeGraph();
  const fallback = emptyGraph();
  return {
    nodes: graph?.nodes || fallback.nodes,
    edges: graph?.edges || fallback.edges,
    activePathId: library.activeId,
    pathSummaries: summaries(library),
  };
};

const playbackReset = {
  isPlaying: false,
  currentTrackIndex: 0,
  currentPlayingNodeId: null as string | null,
  playbackQueue: [] as string[],
  selectedPlaybackStartNodeId: null as string | null,
  selectedNodeId: null as string | null,
  selectedNodeIds: [] as string[],
  commentLinkingId: null as string | null,
};

export const usePathStore = create<PathState>((set) => ({
  ...libraryView(),
  selectedNodeId: null,
  selectedNodeIds: [],
  commentLinkingId: null,
  isPlaying: false,
  currentTrackIndex: 0,
  currentPlayingNodeId: null,
  playbackQueue: [],
  selectedPlaybackStartNodeId: null,
  skipRequestId: 0,
  previousRequestId: 0,
  playbackOriginRequestId: 0,
  uiMode: 'studio',

  setNodes: (nodes) => {
    set({ nodes });
    saveToStorage(nodes, usePathStore.getState().edges);
  },
  setEdges: (edges) => {
    set({ edges });
    saveToStorage(usePathStore.getState().nodes, edges);
  },
  onConnect: (connection) =>
    set((state) => {
      const sourceNode = state.nodes.find((n) => n.id === connection.source);
      const targetNode = state.nodes.find((n) => n.id === connection.target);

      // Prevent connections to/from comment nodes
      if (sourceNode?.type === 'comment' || targetNode?.type === 'comment') {
        console.warn('Cannot connect to/from comment nodes');
        return state;
      }

      // Prevent multiple outgoing edges from non-splitter/randomizer nodes
      const isSourceBranching =
        sourceNode?.type === 'splitter' || sourceNode?.type === 'conditional' || sourceNode?.type === 'randomizer';
      if (!isSourceBranching) {
        const existingOutgoing = state.edges.filter(
          (e) => e.source === connection.source
        );
        if (existingOutgoing.length > 0) {
          console.warn(
            'Cannot create multiple outgoing edges from non-branching node'
          );
          return state;
        }
      } else {
        // For branching nodes, prevent multiple edges from the SAME handle
        const existingFromHandle = state.edges.filter(
          (e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle
        );
        if (existingFromHandle.length > 0) {
          console.warn('This output handle is already connected');
          return state;
        }
      }

      // Allow multiple incoming edges only to track, end, randomizer, and transition nodes
      const allowsMultipleInputs = 
        targetNode?.type === 'track' || 
        targetNode?.type === 'end' || 
        targetNode?.type === 'randomizer' ||
        targetNode?.type === 'transition' ||
        targetNode?.type === 'style';
      
      if (!allowsMultipleInputs) {
        const existingIncoming = state.edges.filter(
          (e) => e.target === connection.target
        );
        if (existingIncoming.length > 0) {
          console.warn('Cannot create multiple incoming edges to this node type');
          return state;
        }
      }

      let newEdges = [
        ...state.edges,
        {
          ...connection,
          id: `${connection.source}-${connection.target}-${Date.now()}`,
          markerEnd: { type: 'arrowclosed' as const },
        } as Edge,
      ];

      let newNodes = state.nodes;
      if (sourceNode?.type === 'track' && targetNode?.type === 'randomizer') {
        newNodes = state.nodes.map((n) => {
          if (n.id !== targetNode.id) return n;
          const added = addTrackToRandomizerList(n.data, sourceNode.id);
          if (!added) return n;
          return { ...n, data: { ...n.data, ...added } };
        });
        const parked = syncParkedTracks(newNodes, newEdges);
        newNodes = parked.nodes;
        newEdges = parked.edges;
      }

      saveToStorage(newNodes, newEdges);
      return { nodes: newNodes, edges: newEdges };
    }),
  selectNode: (id) =>
    set({
      selectedNodeId: id,
      selectedNodeIds: id ? [id] : [],
    }),
  setSelection: (ids) =>
    set({
      selectedNodeIds: ids,
      selectedNodeId: ids.length === 1 ? ids[0] : null,
    }),
  setCommentLinkingId: (id) => set({ commentLinkingId: id }),
  updateNodeData: (id, data) =>
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id === id) {
          const { position, ...restData } = data;
          const updatedNode = { ...node, data: { ...node.data, ...restData } };
          if (position) {
            updatedNode.position = position;
          }
          return updatedNode;
        }
        return node;
      });
      saveToStorage(updatedNodes, state.edges);
      return { nodes: updatedNodes };
    }),
  setPlaybackQueue: (queue) => set({ playbackQueue: queue }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
  setCurrentPlayingNodeId: (id) => set({ currentPlayingNodeId: id }),
  setPlaybackStartNode: (id) =>
    set((state) => ({
      selectedPlaybackStartNodeId: id,
      playbackOriginRequestId: state.playbackOriginRequestId + 1,
    })),
  setUiMode: (mode) => set({ uiMode: mode }),
  requestSkip: () =>
    set((state) => ({ skipRequestId: state.skipRequestId + 1 })),
  requestPrevious: () =>
    set((state) => ({ previousRequestId: state.previousRequestId + 1 })),
  deleteEdge: (edgeId) => set((state) => {
    const edge = state.edges.find((e) => e.id === edgeId);
    const newEdges = state.edges.filter((e) => e.id !== edgeId);
    let newNodes = state.nodes;
    if (edge) {
      const sourceNode = state.nodes.find((n) => n.id === edge.source);
      const targetNode = state.nodes.find((n) => n.id === edge.target);
      if (sourceNode?.type === 'track' && targetNode?.type === 'randomizer') {
        newNodes = state.nodes.map((n) => {
          if (n.id !== targetNode.id) return n;
          const tracks = (n.data?.tracks as string[]) || [];
          const idx = tracks.indexOf(sourceNode.id);
          if (idx < 0) return n;
          const weights = [...((n.data?.weights as number[]) || [])];
          weights.splice(idx, 1);
          return {
            ...n,
            data: {
              ...n.data,
              tracks: tracks.filter((id) => id !== sourceNode.id),
              weights,
            },
          };
        });
      }
    }
    const parked = syncParkedTracks(newNodes, newEdges);
    saveToStorage(parked.nodes, parked.edges);
    return { nodes: parked.nodes, edges: parked.edges };
  }),
  deleteNode: (nodeId) => set((state) => {
    // Don't allow deleting the start node
    if (nodeId === 'start') {
      return state;
    }
    const deleted = state.nodes.find((n) => n.id === nodeId);
    const remaining = state.nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => {
        if (n.type === 'comment' && n.data?.linkedNodeId === nodeId) {
          return { ...n, data: { ...n.data, linkedNodeId: null } };
        }
        return n;
      });
    const remainingEdges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    const reconciled = reconcileAfterNodeRemovals(
      remaining,
      remainingEdges,
      deleted ? [deleted] : []
    );
    saveToStorage(reconciled.nodes, reconciled.edges);
    const remainingIds = state.selectedNodeIds.filter((id) => id !== nodeId);
    return {
      nodes: reconciled.nodes,
      edges: reconciled.edges,
      selectedNodeIds: remainingIds,
      selectedNodeId: remainingIds.length === 1 ? remainingIds[0] : null,
      selectedPlaybackStartNodeId:
        state.selectedPlaybackStartNodeId === nodeId
          ? null
          : state.selectedPlaybackStartNodeId,
    };
  }),
  normalizeSplitters: () =>
    set((state) => {
      let newNodes = [...state.nodes];
      let newEdges = [...state.edges];
      let changed = false;

      // Keep flattening until no more stacked splitters/conditionals
      let hasStackedSplitters = true;
      while (hasStackedSplitters) {
        hasStackedSplitters = false;

        // Find parent-child splitter/conditional pairs
        for (const splitter of newNodes.filter((n) => n.type === 'splitter' || n.type === 'conditional')) {
          const directChildren = newEdges
            .filter((e) => e.source === splitter.id)
            .map((e) => ({ edge: e, node: newNodes.find((n) => n.id === e.target) }));

          const splitterChildren = directChildren.filter((item) => item.node?.type === 'splitter' || item.node?.type === 'conditional');

          if (splitterChildren.length > 0) {
            hasStackedSplitters = true;
            changed = true;

            const parentWeights = (splitter.data?.weights as number[]) || [];
            const flatPaths: { target: string; weight: number }[] = [];

            // Process each direct child
            for (const { edge: parentEdge, node: childSplitter } of directChildren) {
              const childIndex = directChildren.findIndex((item) => item.node?.id === childSplitter?.id);
              const parentWeight = parentWeights[childIndex] || 10;

              if (childSplitter?.type === 'splitter' || childSplitter?.type === 'conditional') {
                // Flatten: multiply weights proportionally
                const childWeights = (childSplitter.data?.weights as number[]) || [];
                const childTotalWeight = childWeights.reduce((a: number, b: number) => a + b, 0) || 1;
                const grandchildren = newEdges.filter((e) => e.source === childSplitter.id);

                for (let i = 0; i < grandchildren.length; i++) {
                  const childWeight = childWeights[i] || 10;
                  // Proportional weight: multiply parent weight by child's proportion
                  const proportionalWeight = (parentWeight * childWeight) / childTotalWeight;
                  flatPaths.push({
                    target: grandchildren[i].target,
                    weight: proportionalWeight,
                  });
                }

                // Delete child splitter edges
                for (let i = newEdges.length - 1; i >= 0; i--) {
                  if (newEdges[i].source === childSplitter.id) {
                    newEdges.splice(i, 1);
                  }
                }

                // Delete parent-to-child edge
                newEdges.splice(
                  newEdges.findIndex((e) => e.id === parentEdge.id),
                  1
                );
              } else {
                // Not a splitter, keep as is
                flatPaths.push({
                  target: childSplitter?.id || '',
                  weight: parentWeight,
                });
              }
            }

            // Delete child splitter nodes
            for (let i = newNodes.length - 1; i >= 0; i--) {
              if (
                (newNodes[i].type === 'splitter' || newNodes[i].type === 'conditional') &&
                splitterChildren.some((item) => item.node?.id === newNodes[i].id)
              ) {
                newNodes.splice(i, 1);
              }
            }

            // Update parent splitter with new paths
            const currentSplitter = newNodes.find((n) => n.id === splitter.id);
            if (currentSplitter) {
              // Convert decimal weights to integers, preserving proportions
              const newWeights = flatPaths.map((p) => Math.round(p.weight));
              
              currentSplitter.data = {
                ...currentSplitter.data,
                numPaths: flatPaths.length,
                weights: newWeights,
              };

              // Remove all old edges from this splitter
              for (let i = newEdges.length - 1; i >= 0; i--) {
                if (newEdges[i].source === splitter.id) {
                  newEdges.splice(i, 1);
                }
              }

              // Create new edges from parent to all flattened destinations with correct handle IDs
              for (let i = 0; i < flatPaths.length; i++) {
                newEdges.push({
                  id: `${splitter.id}-${flatPaths[i].target}-${i}-${Date.now()}`,
                  source: splitter.id,
                  sourceHandle: String.fromCharCode(65 + i), // A, B, C, etc.
                  target: flatPaths[i].target,
                  markerEnd: { type: 'arrowclosed' as const },
                } as Edge);
              }
            }

            // Only process one parent per iteration to avoid index issues
            break;
          }
        }
      }

      if (changed) {
        saveToStorage(newNodes, newEdges);
        return { nodes: newNodes, edges: newEdges };
      }
      return state;
    }),
  initializeFromStorage: () => {
    library = loadLibrary();
    set(libraryView());
  },
  createPlaylist: (name) => {
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    library = createPath(library, name);
    set({
      ...libraryView(),
      ...playbackReset,
    });
  },
  switchPlaylist: (id) => {
    if (id === library.activeId) return;
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    const next = activatePath(library, id);
    if (!next) return;
    library = next;
    set({
      ...libraryView(),
      ...playbackReset,
    });
  },
  renamePlaylist: (id, name) => {
    library = renamePath(library, id, name);
    set({ pathSummaries: summaries(library) });
  },
  setPlaylistVisibility: (id, visibility) => {
    library = setPathVisibility(library, id, visibility);
    set({ pathSummaries: summaries(library) });
  },
  exportPlaylistFile: (id, kind = 'playlist') => {
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    const path = getPath(library, id);
    if (!path) return null;
    const themeState = useThemeStore.getState();
    const theme = resolveTheme(themeState.activeId, themeState.customThemes);
    const themes = collectDependentCustomThemes(path.nodes, themeState.customThemes, [
      theme.id,
    ]);
    const json =
      kind === 'package'
        ? serializePackageJson(path, themes, { themeId: theme.id })
        : serializePlaylistJson(path, { themeId: theme.id, themes });
    return { filename: playlistDownloadName(path.name), json };
  },
  importPlaylistFile: (text) => {
    const parsed = parsePlaylistFile(text);
    if (!parsed.ok) return { error: parsed.error, notices: [] };
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    const assigned = new Map<string, string>();
    for (const theme of parsed.themes) {
      const originalId = theme.id;
      const nextId = useThemeStore.getState().addCustomTheme(theme);
      if (nextId) assigned.set(originalId, nextId);
    }
    library = addImportedPath(library, {
      ...parsed.playlist,
      nodes: remapStyleNodeThemeIds(parsed.playlist.nodes, assigned),
    });
    set({
      ...libraryView(),
      ...playbackReset,
    });
    const want = parsed.themeId ? assigned.get(parsed.themeId) || parsed.themeId : null;
    if (want) {
      const themeState = useThemeStore.getState();
      if (
        !themeState.draft &&
        (getBuiltinTheme(want) || themeState.customThemes.some((t) => t.id === want))
      ) {
        themeState.setActiveId(want);
      }
    }
    return { error: null, notices: parsed.notices };
  },
}));