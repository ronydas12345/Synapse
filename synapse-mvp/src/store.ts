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
  emptyLibrary,
  renamePath,
  saveActiveGraph,
  setPathTags,
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
import {
  applyPaste,
  collectCopySet,
  type NodeClipboard,
} from './canvas/clipboard';
import { normalizeStackedConditionals } from './conditional/normalize';
import { bringNodesOntoPage as layoutOntoPage } from './canvas/bringOntoPage';
import { FIT_NODES_EVENT } from './canvas/fitEvents';

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
  /** Incremented when user hits Stop — Player ends the session. */
  stopRequestId: number;
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
  requestStop: () => void;
  deleteEdge: (edgeId: string) => void;
  deleteNode: (nodeId: string) => void;
  initializeFromStorage: () => void;
  replaceLibrary: (next: PathLibrary) => void;
  normalizeSplitters: () => void;
  createPlaylist: (name?: string) => void;
  switchPlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  setPlaylistVisibility: (id: string, visibility: 'public' | 'private') => void;
  setPlaylistTags: (id: string, tags: string[]) => void;
  exportPlaylistFile: (
    id: string,
    kind?: 'playlist' | 'package'
  ) => { filename: string; json: string } | null;
  importPlaylistFile: (text: string) => { error: string | null; notices: string[] };
  importWorkshopGraph: (name: string, nodes: Node[], edges: Edge[]) => void;
  copySelection: () => NodeClipboard | null;
  pasteClipboard: (payload: NodeClipboard) => string[];
  bringNodesOntoPage: (scope: 'selected' | 'all') => void;
}

let library: PathLibrary = emptyLibrary();

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

export const usePathStore = create<PathState>((set, get) => ({
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
  stopRequestId: 0,
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
          return state;
        }
      } else {
        // For branching nodes, prevent multiple edges from the SAME handle
        const existingFromHandle = state.edges.filter(
          (e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle
        );
        if (existingFromHandle.length > 0) {
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
  requestStop: () =>
    set((state) => ({ stopRequestId: state.stopRequestId + 1 })),
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
      const next = normalizeStackedConditionals(state.nodes, state.edges);
      if (next.nodes === state.nodes) return state;
      saveToStorage(next.nodes, next.edges);
      return { nodes: next.nodes, edges: next.edges };
    }),
  bringNodesOntoPage: (scope) =>
    set((state) => {
      const laid = layoutOntoPage(
        state.nodes,
        state.edges,
        scope,
        state.selectedNodeIds
      );
      if (!laid) return state;
      saveToStorage(laid.nodes, state.edges);
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(FIT_NODES_EVENT, { detail: { nodeIds: laid.focusIds } })
        );
      }, 30);
      return { nodes: laid.nodes };
    }),
  initializeFromStorage: () => {
    library = emptyLibrary();
    set(libraryView());
  },
  replaceLibrary: (next) => {
    library = next;
    set({
      ...libraryView(),
      ...playbackReset,
    });
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
  setPlaylistTags: (id, tags) => {
    library = setPathTags(library, id, tags);
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
  importWorkshopGraph: (name, nodes, edges) => {
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    library = addImportedPath(library, {
      id: '',
      name,
      visibility: 'private',
      tags: [],
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    });
    set({
      ...libraryView(),
      ...playbackReset,
    });
  },
  copySelection: () => {
    const state = get();
    return collectCopySet(state.nodes, state.edges, state.selectedNodeIds);
  },
  pasteClipboard: (clipboard) => {
    const state = get();
    const next = applyPaste(state.nodes, state.edges, clipboard);
    saveToStorage(next.nodes, next.edges);
    set({
      nodes: next.nodes,
      edges: next.edges,
      selectedNodeIds: next.selectedIds,
      selectedNodeId: next.selectedIds.length === 1 ? next.selectedIds[0] : null,
    });
    return next.selectedIds;
  },
}));

export function snapshotPathLibrary(): PathLibrary {
  const state = usePathStore.getState();
  library = saveActiveGraph(library, state.nodes, state.edges);
  return library;
}