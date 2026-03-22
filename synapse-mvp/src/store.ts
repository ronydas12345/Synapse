import { create } from 'zustand';
import type { Node, Edge, Connection } from '@xyflow/react';

interface PathState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isPlaying: boolean;
  currentTrackIndex: number;
  playbackQueue: string[]; // YouTube videoIds
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (id: string | null) => void;
  updateNodeData: (id: string, data: any) => void;
  setPlaybackQueue: (queue: string[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrackIndex: (index: number) => void;
  deleteEdge: (edgeId: string) => void;
  deleteNode: (nodeId: string) => void;
  initializeFromStorage: () => void;
  normalizeSplitters: () => void;
}

const defaultStartNode: Node = {
  id: 'start',
  type: 'start',
  position: { x: 400, y: 300 },
  data: { label: 'Start' },
};

const STORAGE_KEY = 'synapse_graph_state';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        nodes: parsed.nodes || [defaultStartNode],
        edges: parsed.edges || [],
      };
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return { nodes: [defaultStartNode], edges: [] };
};

const saveToStorage = (nodes: Node[], edges: Edge[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const initialState = loadFromStorage();

export const usePathStore = create<PathState>((set) => ({
  nodes: initialState.nodes,
  edges: initialState.edges,
  selectedNodeId: null,
  isPlaying: false,
  currentTrackIndex: 0,
  playbackQueue: [],

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

      // Prevent multiple outgoing edges from non-splitter/randomizer nodes
      const isSourceBranching =
        sourceNode?.type === 'splitter' || sourceNode?.type === 'randomizer';
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

      // Prevent multiple incoming edges to non-track nodes
      const isTargetTrack = targetNode?.type === 'track';
      if (!isTargetTrack) {
        const existingIncoming = state.edges.filter(
          (e) => e.target === connection.target
        );
        if (existingIncoming.length > 0) {
          console.warn('Cannot create multiple incoming edges to this node type');
          return state;
        }
      }

      const newEdges = [
        ...state.edges,
        {
          ...connection,
          id: `${connection.source}-${connection.target}-${Date.now()}`,
          markerEnd: { type: 'arrowclosed' as const },
        } as Edge,
      ];
      saveToStorage(state.nodes, newEdges);
      return { edges: newEdges };
    }),
  selectNode: (id) => set({ selectedNodeId: id }),
  updateNodeData: (id, data) =>
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      );
      saveToStorage(updatedNodes, state.edges);
      return { nodes: updatedNodes };
    }),
  setPlaybackQueue: (queue) => set({ playbackQueue: queue }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
  deleteEdge: (edgeId) => set((state) => {
    const newEdges = state.edges.filter((e) => e.id !== edgeId);
    saveToStorage(state.nodes, newEdges);
    return { edges: newEdges };
  }),
  deleteNode: (nodeId) => set((state) => {
    // Don't allow deleting the start node
    if (nodeId === 'start') {
      return state;
    }
    const newNodes = state.nodes.filter((n) => n.id !== nodeId);
    const newEdges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    saveToStorage(newNodes, newEdges);
    return { 
      nodes: newNodes, 
      edges: newEdges,
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    };
  }),
  normalizeSplitters: () =>
    set((state) => {
      let newNodes = [...state.nodes];
      let newEdges = [...state.edges];
      let changed = false;

      // Keep flattening until no more stacked splitters
      let hasStackedSplitters = true;
      while (hasStackedSplitters) {
        hasStackedSplitters = false;

        // Find parent-child splitter pairs
        for (const splitter of newNodes.filter((n) => n.type === 'splitter')) {
          const directChildren = newEdges
            .filter((e) => e.source === splitter.id)
            .map((e) => ({ edge: e, node: newNodes.find((n) => n.id === e.target) }));

          const splitterChildren = directChildren.filter((item) => item.node?.type === 'splitter');

          if (splitterChildren.length > 0) {
            hasStackedSplitters = true;
            changed = true;

            const parentWeights = (splitter.data?.weights as number[]) || [];
            const flatPaths: { target: string; weight: number }[] = [];

            // Process each direct child
            for (const { edge: parentEdge, node: childSplitter } of directChildren) {
              const childIndex = directChildren.findIndex((item) => item.node?.id === childSplitter?.id);
              const parentWeight = parentWeights[childIndex] || 10;

              if (childSplitter?.type === 'splitter') {
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
                newNodes[i].type === 'splitter' &&
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
    const state = loadFromStorage();
    set({ nodes: state.nodes, edges: state.edges });
  },
}));