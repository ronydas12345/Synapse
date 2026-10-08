import {
  addTrackToRandomizerList,
  reconcileAfterNodeRemovals,
  syncParkedTracks,
} from './randomizerDrop';
import { create } from 'zustand';
import type { Node, Edge, Connection } from '@xyflow/react';
import type { PlaylistPortalPolicy } from './portals/types';
import type { PathSummary, PathVisibility, StoredMusicPath } from './playlists/library';
import {
  activatePath,
  addImportedPath,
  asPathVisibility,
  createPath,
  deletePath,
  putImportedPath,
  emptyGraph,
  getPath,
  emptyLibrary,
  linkPathWorkshop,
  renamePath,
  replaceActiveGraph,
  saveActiveGraph,
  setPathPortalPolicy,
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
import { portalConnectError, portalConnectionHandles } from './portals/connect';
import { collectPortalIds } from './portals/ids';
import { ensurePortalNodeData } from './portals/remap';
import { normalizeStackedConditionals } from './conditional/normalize';
import { bringNodesOntoPage as layoutOntoPage } from './canvas/bringOntoPage';
import { FIT_NODES_EVENT } from './canvas/fitEvents';
import { resolveInspectorNodeId, sequencesContaining } from './nodes/pathContext';

interface PathState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  /** Inspector target; can be a parked sequence track while the owner stays selected. */
  inspectorNodeId: string | null;
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
  /** Published Workshop preview: canvas and inspector stay view-only. */
  graphLocked: boolean;
  /** Listen layout. Graph is the default for published /listen/[id]. */
  listenView: 'graph' | 'list';
  /** Share id or uuid for the published playlist currently held. */
  workshopShareKey: string | null;
  activePathId: string;
  pathSummaries: PathSummary[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (id: string | null) => void;
  setSelection: (ids: string[]) => void;
  inspectNestedTrack: (trackId: string) => void;
  setCommentLinkingId: (id: string | null) => void;
  updateNodeData: (id: string, data: any) => void;
  setPlaybackQueue: (queue: string[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrackIndex: (index: number) => void;
  setCurrentPlayingNodeId: (id: string | null) => void;
  setPlaybackStartNode: (id: string | null) => void;
  setUiMode: (mode: 'home' | 'studio' | 'listen' | 'settings' | 'profile') => void;
  setGraphLocked: (locked: boolean) => void;
  setListenView: (view: 'graph' | 'list') => void;
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
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  setPlaylistVisibility: (id: string, visibility: PathVisibility) => void;
  setPlaylistPortalPolicy: (id: string, policy: PlaylistPortalPolicy) => void;
  setPlaylistTags: (id: string, tags: string[]) => void;
  peekPath: (id: string) => StoredMusicPath | undefined;
  peekLibraryPaths: () => StoredMusicPath[];
  replaceGraphKeepPlayback: (
    nodes: Node[],
    edges: Edge[],
    meta?: { pathId?: string; shareKey?: string | null; locked?: boolean }
  ) => void;
  exportPlaylistFile: (
    id: string,
    kind?: 'playlist' | 'package'
  ) => { filename: string; json: string } | null;
  importPlaylistFile: (
    text: string,
    options?: { replaceActive?: boolean }
  ) => { error: string | null; notices: string[] };
  importWorkshopGraph: (
    name: string,
    nodes: Node[],
    edges: Edge[],
    locked?: boolean,
    shareKey?: string,
    bind?: {
      id?: string;
      workshopId?: string;
      visibility?: PathVisibility;
      keepName?: boolean;
      tags?: string[];
    }
  ) => void;
  syncWorkshopListing: (
    workshopId: string,
    visibility: PathVisibility,
    sourcePathId?: string
  ) => void;
  copySelection: () => NodeClipboard | null;
  pasteClipboard: (payload: NodeClipboard) => string[];
  bringNodesOntoPage: (scope: 'selected' | 'all') => void;
}

let library: PathLibrary = emptyLibrary();

/** Survives cloud hydrate / guest workspace reset after Play or Remix. */
let workshopHold: { path: StoredMusicPath; locked: boolean; shareKey: string | null } | null =
  null;

const activeGraph = () =>
  library.paths.find((p) => p.id === library.activeId) || library.paths[0];

function releaseWorkshopHold(): void {
  workshopHold = null;
}

function restoreWorkshopHold(next: PathLibrary): PathLibrary {
  if (!workshopHold) return next;
  const restored = putImportedPath(next, workshopHold.path, {
    persist: !workshopHold.locked,
  });
  const stored = getPath(restored, restored.activeId);
  if (stored) workshopHold = { ...workshopHold, path: stored };
  return restored;
}

function fromHold() {
  return {
    graphLocked: workshopHold?.locked ?? false,
    workshopShareKey: workshopHold?.shareKey ?? null,
  };
}

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
  inspectorNodeId: null as string | null,
  commentLinkingId: null as string | null,
};

export const usePathStore = create<PathState>((set, get) => ({
  ...libraryView(),
  selectedNodeId: null,
  selectedNodeIds: [],
  inspectorNodeId: null,
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
  graphLocked: false,
  listenView: 'graph',
  workshopShareKey: null,
  setGraphLocked: (locked) => set({ graphLocked: locked }),
  setListenView: (view) => set({ listenView: view }),

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

      if (portalConnectError(connection, state.nodes, state.edges)) {
        return state;
      }
      const portalHandles = portalConnectionHandles(sourceNode?.type, targetNode?.type);

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
          ...portalHandles,
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
      inspectorNodeId: id,
    }),
  setSelection: (ids) =>
    set((state) => ({
      selectedNodeIds: ids,
      selectedNodeId: ids.length === 1 ? ids[0] : null,
      inspectorNodeId: resolveInspectorNodeId(
        state.nodes,
        ids,
        state.inspectorNodeId
      ),
    })),
  inspectNestedTrack: (trackId) =>
    set((state) => {
      const owners = sequencesContaining(state.nodes, trackId);
      const ownerId = owners[0]?.id ?? null;
      if (!ownerId) {
        return {
          selectedNodeId: trackId,
          selectedNodeIds: [trackId],
          inspectorNodeId: trackId,
        };
      }
      return {
        selectedNodeId: ownerId,
        selectedNodeIds: [ownerId],
        inspectorNodeId: trackId,
      };
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
    const inspectorId =
      state.inspectorNodeId === nodeId
        ? remainingIds.length === 1
          ? remainingIds[0]
          : null
        : resolveInspectorNodeId(
            reconciled.nodes,
            remainingIds,
            state.inspectorNodeId
          );
    return {
      nodes: reconciled.nodes,
      edges: reconciled.edges,
      selectedNodeIds: remainingIds,
      selectedNodeId: remainingIds.length === 1 ? remainingIds[0] : null,
      inspectorNodeId: inspectorId,
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
    library = restoreWorkshopHold(emptyLibrary());
    set({
      ...libraryView(),
      ...fromHold(),
      listenView: workshopHold?.locked && usePathStore.getState().listenView === 'list' ? 'list' : 'graph',
    });
  },
  replaceLibrary: (next) => {
    library = restoreWorkshopHold(next);
    set({
      ...libraryView(),
      ...playbackReset,
      ...fromHold(),
    });
  },
  createPlaylist: (name) => {
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    releaseWorkshopHold();
    library = createPath(library, name);
    set({
      ...libraryView(),
      ...playbackReset,
      graphLocked: false,
      workshopShareKey: null,
      listenView: 'graph',
    });
  },
  switchPlaylist: (id) => {
    if (id === library.activeId) return;
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    const next = activatePath(library, id);
    if (!next) return;
    if (workshopHold && id !== workshopHold.path.id) releaseWorkshopHold();
    library = next;
    set({
      ...libraryView(),
      ...playbackReset,
      ...fromHold(),
    });
  },
  deletePlaylist: (id) => {
    if (!library.paths.some((p) => p.id === id)) return;
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    const leaving = library.activeId === id;
    if (workshopHold?.path.id === id) releaseWorkshopHold();
    library = deletePath(library, id);
    set({
      ...libraryView(),
      ...(leaving ? playbackReset : {}),
      graphLocked: leaving ? false : current.graphLocked,
      workshopShareKey: leaving ? null : current.workshopShareKey,
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
  setPlaylistPortalPolicy: (id, policy) => {
    library = setPathPortalPolicy(library, id, policy);
    set({ pathSummaries: summaries(library) });
  },
  peekPath: (id) => getPath(library, id),
  peekLibraryPaths: () => library.paths.map((path) => ({ ...path })),
  replaceGraphKeepPlayback: (nodes, edges, meta) => {
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    if (meta?.pathId && getPath(library, meta.pathId)) {
      const next = activatePath(library, meta.pathId);
      if (next) library = next;
      library = saveActiveGraph(library, nodes, edges);
      set({
        ...libraryView(),
        ...(meta?.shareKey !== undefined ? { workshopShareKey: meta.shareKey } : {}),
        ...(meta?.locked !== undefined ? { graphLocked: meta.locked } : {}),
      });
      return;
    }
    set({
      nodes,
      edges,
      ...(meta?.shareKey !== undefined ? { workshopShareKey: meta.shareKey } : {}),
      ...(meta?.locked !== undefined ? { graphLocked: meta.locked } : {}),
    });
  },
  syncWorkshopListing: (workshopId, visibility, sourcePathId) => {
    library = linkPathWorkshop(
      library,
      { pathId: sourcePathId, workshopId },
      { workshopId, visibility }
    );
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
  importPlaylistFile: (text, options) => {
    const parsed = parsePlaylistFile(text);
    if (!parsed.ok) return { error: parsed.error, notices: [] };
    const current = usePathStore.getState();
    const assigned = new Map<string, string>();
    for (const theme of parsed.themes) {
      const originalId = theme.id;
      const nextId = useThemeStore.getState().addCustomTheme(theme);
      if (nextId) assigned.set(originalId, nextId);
    }
    const nodes = remapStyleNodeThemeIds(parsed.playlist.nodes, assigned);
    const replaceActive = Boolean(options?.replaceActive);
    if (replaceActive) {
      library = replaceActiveGraph(library, {
        nodes,
        edges: parsed.playlist.edges,
      });
      if (workshopHold?.path.id === library.activeId) {
        const stored = getPath(library, library.activeId);
        if (stored) workshopHold = { ...workshopHold, path: stored, locked: false };
      }
    } else {
      library = saveActiveGraph(library, current.nodes, current.edges);
      releaseWorkshopHold();
      library = addImportedPath(library, {
        ...parsed.playlist,
        nodes,
      });
    }
    set({
      ...libraryView(),
      ...playbackReset,
      graphLocked: false,
      workshopShareKey: replaceActive ? current.workshopShareKey : null,
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
  importWorkshopGraph: (name, nodes, edges, locked = false, shareKey, bind) => {
    const current = usePathStore.getState();
    library = saveActiveGraph(library, current.nodes, current.edges);
    const boundId =
      bind?.id ||
      library.paths.find((p) => bind?.workshopId && p.workshopId === bind.workshopId)?.id ||
      workshopHold?.path.id ||
      '';
    const incoming: StoredMusicPath = {
      id: boundId,
      name,
      visibility: asPathVisibility(bind?.visibility),
      tags: bind?.tags ?? [],
      nodes: [...nodes],
      edges: [...edges],
      updatedAt: new Date().toISOString(),
      workshopId: bind?.workshopId,
    };
    library = putImportedPath(library, incoming, {
      persist: !locked,
      keepName: Boolean(bind?.keepName || bind?.workshopId),
    });
    const stored = getPath(library, library.activeId);
    if (stored) workshopHold = { path: stored, locked, shareKey: shareKey ?? null };
    const keepList = current.listenView === 'list';
    set({
      ...libraryView(),
      ...playbackReset,
      graphLocked: locked,
      workshopShareKey: shareKey ?? null,
      listenView: keepList ? 'list' : 'graph',
    });
  },
  copySelection: () => {
    const state = get();
    return collectCopySet(state.nodes, state.edges, state.selectedNodeIds);
  },
  pasteClipboard: (clipboard) => {
    const state = get();
    const pasted = applyPaste(state.nodes, state.edges, clipboard);
    const next = {
      ...pasted,
      nodes: ensurePortalNodeData(pasted.nodes, {
        reissue: true,
        used: collectPortalIds(state.nodes),
      }),
    };
    saveToStorage(next.nodes, next.edges);
    set({
      nodes: next.nodes,
      edges: next.edges,
      selectedNodeIds: next.selectedIds,
      selectedNodeId: next.selectedIds.length === 1 ? next.selectedIds[0] : null,
      inspectorNodeId:
        next.selectedIds.length === 1 ? next.selectedIds[0] : null,
    });
    return next.selectedIds;
  },
}));

export function useGraphReadOnly(): boolean {
  return usePathStore((s) => s.graphLocked);
}

export function snapshotPathLibrary(): PathLibrary {
  const state = usePathStore.getState();
  library = saveActiveGraph(library, state.nodes, state.edges);
  return library;
}