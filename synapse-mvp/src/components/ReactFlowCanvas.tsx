import React from 'react';
import { Map as MapIcon, Minimize2 } from 'lucide-react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, ReactFlowProvider, useReactFlow, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { usePathStore } from '../store';
import TrackNode from './nodes/TrackNode';
import ConditionalNode from './nodes/ConditionalNode';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import RandomizerNode from './nodes/RandomizerNode';
import TransitionNode from './nodes/TransitionNode';
import CommentNode from './nodes/CommentNode';
import CommentConnections from './CommentConnections';
import PlaybackMarker from './PlaybackMarker';
import StartDirectionArrow from './StartDirectionArrow';
import { useEffect, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import {
  applyTrackMovesIntoRandomizers,
  dataTransferHasSequenceItem,
  moveSequenceItemBetweenRandomizers,
  normalizeWorkspaceGraph,
  reconcileAfterNodeRemovals,
  restoreTrackFromRandomizer,
  sequenceItemFromDataTransfer,
  worldPosition,
} from '../randomizerDrop';
import {
  canDropPlaybackMarkerOn,
  dataTransferIsPlaybackMarker,
  isPlaybackMarkerDrag,
} from '../playbackMarker';

const nodeTypes = {
  track: TrackNode,
  splitter: ConditionalNode,
  conditional: ConditionalNode,
  start: StartNode,
  end: EndNode,
  randomizer: RandomizerNode,
  transition: TransitionNode,
  comment: CommentNode,
};

// Valid node type names for filtering
const validNodeTypes = new Set(Object.keys(nodeTypes));

// Custom minimap component that syncs with camera
function CustomMinimap() {
  const { getNodes, getViewport } = useReactFlow();
  const [containerDims, setContainerDims] = React.useState({ width: 1200, height: 800 });
  const [viewportState, setViewportState] = React.useState({ x: 0, y: 0, zoom: 1 });
  const [collapsed, setCollapsed] = React.useState(false);
  const minimapRef = React.useRef<HTMLDivElement>(null);
  const prevViewportRef = React.useRef({ x: 0, y: 0, zoom: 1 });

  // Update minimap when changing, using React Flow's internal updates
  React.useEffect(() => {
    // Just initialize on mount
    const viewport = getViewport();
    prevViewportRef.current = viewport;
    setViewportState(viewport);
  }, []);

  // Keep viewport state in sync during panning and zooming
  React.useEffect(() => {
    const handleViewportChange = () => {
      const viewport = getViewport();
      // Validate that viewport has valid numbers
      if (viewport && 
          typeof viewport.x === 'number' && !isNaN(viewport.x) &&
          typeof viewport.y === 'number' && !isNaN(viewport.y) &&
          typeof viewport.zoom === 'number' && !isNaN(viewport.zoom)) {
        setViewportState(viewport);
      }
    };

    // Poll for viewport changes since there's no direct viewport change event
    const interval = setInterval(handleViewportChange, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, []);

  // Measure the actual React Flow container on mount and when it changes
  React.useEffect(() => {
    const updateDims = () => {
      if (minimapRef.current?.parentElement) {
        const parent = minimapRef.current.parentElement;
        // Get the actual rendered size of the React Flow container
        const rect = parent.getBoundingClientRect();
        setContainerDims({
          width: rect.width || 1200,
          height: rect.height || 800,
        });
      }
    };

    updateDims();
    
    // Listen for window resize
    const resizeObserver = new ResizeObserver(updateDims);
    if (minimapRef.current?.parentElement) {
      resizeObserver.observe(minimapRef.current.parentElement);
    }

    window.addEventListener('resize', updateDims);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDims);
    };
  }, []);

  const nodes = getNodes();
  const viewport = viewportState;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const nodeWorld = (n: (typeof nodes)[number]) => worldPosition(n, byId as Map<string, typeof n>);

  // Default node sizes (in pixels)
  const nodeSizes: Record<string, { width: number; height: number }> = {
    start: { width: 128, height: 80 },
    end: { width: 128, height: 80 },
    track: { width: 288, height: 160 },
    conditional: { width: 288, height: 160 },
    splitter: { width: 288, height: 160 },
    randomizer: { width: 292, height: 220 },
    transition: { width: 256, height: 100 },
    comment: { width: 256, height: 120 },
  };

  const visibleNodes = nodes.filter((n) => !n.hidden);

  // Calculate bounds of all nodes with their actual dimensions
  let minX = 0, minY = 0, maxX = 1000, maxY = 800;
  if (visibleNodes.length > 0) {
    minX = Math.min(...visibleNodes.map((n) => nodeWorld(n).x));
    minY = Math.min(...visibleNodes.map((n) => nodeWorld(n).y));
    maxX = Math.max(
      ...visibleNodes.map((n) => {
        const size = nodeSizes[n.type ?? ''] || { width: 200, height: 150 };
        const w = n.measured?.width ?? n.width ?? size.width;
        return nodeWorld(n).x + w;
      })
    );
    maxY = Math.max(
      ...visibleNodes.map((n) => {
        const size = nodeSizes[n.type ?? ''] || { width: 200, height: 150 };
        const h = n.measured?.height ?? n.height ?? size.height;
        return nodeWorld(n).y + h;
      })
    );
  }

  const boundsWidth = maxX - minX || 1000;
  const boundsHeight = maxY - minY || 800;

  // Scale to fit minimap with padding
  const minimapWidth = 250;
  const minimapHeight = 180;
  const padding = 20;
  const scaleX = (minimapWidth - padding * 2) / boundsWidth;
  const scaleY = (minimapHeight - padding * 2) / boundsHeight;
  let scale = Math.min(scaleX, scaleY);
  
  // Ensure scale is a valid finite number
  if (!isFinite(scale)) {
    scale = 0.5;
  }

  // Border colors matching the actual node borders in workspace
  const typeColors: Record<string, string> = {
    start: '#22c55e',      // border-green-500
    end: '#ef4444',        // border-red-500
    track: '#64748b',      // border-slate-600
    conditional: '#6366f1', // border-indigo-500
    splitter: '#6366f1',   // border-indigo-500
    randomizer: '#a855f7', // border-purple-500
    transition: '#b45309', // border-amber-600
    comment: '#64748b',    // border-slate-500
  };

  // Calculate the visible area in world coordinates
  // viewport.x and viewport.y are camera position (screen offset)
  // viewport.zoom is the camera zoom level
  // The visible area in canvas coordinates is:
  const zoom = viewport?.zoom || 1;
  const vpX = viewport?.x || 0;
  const vpY = viewport?.y || 0;
  
  const wrapStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 10,
    left: 52,
    zIndex: 50,
  };

  const collapseBtn = (
    <button
      type="button"
      className="synapse-minimap-toggle"
      title={collapsed ? 'Show minimap' : 'Hide minimap'}
      aria-label={collapsed ? 'Show minimap' : 'Hide minimap'}
      onClick={() => setCollapsed((v) => !v)}
    >
      {collapsed ? <MapIcon className="w-4 h-4" /> : <Minimize2 className="w-3.5 h-3.5" />}
    </button>
  );

  // Guard against NaN values
  if (isNaN(zoom) || isNaN(vpX) || isNaN(vpY)) {
    return (
      <div ref={minimapRef} className="synapse-minimap-wrap" style={wrapStyle}>
        {collapsed ? (
          collapseBtn
        ) : (
          <div className="synapse-minimap synapse-minimap-panel">
            <div className="synapse-minimap-toolbar">{collapseBtn}</div>
            <div style={{ padding: '10px', color: '#999', fontSize: '12px' }}>Minimap loading...</div>
          </div>
        )}
        <StartDirectionArrow />
      </div>
    );
  }
  
  const visibleLeft = -vpX / zoom;
  const visibleTop = -vpY / zoom;
  const visibleWidth = containerDims.width / zoom;
  const visibleHeight = containerDims.height / zoom;

  // Convert visible area to minimap coordinates
  let viewportX = (visibleLeft - minX) * scale + padding;
  let viewportY = (visibleTop - minY) * scale + padding;
  let viewportWidth = visibleWidth * scale;
  let viewportHeight = visibleHeight * scale;
  
  // Ensure all viewport dimensions are valid finite numbers
  if (!isFinite(viewportX)) viewportX = padding;
  if (!isFinite(viewportY)) viewportY = padding;
  if (!isFinite(viewportWidth)) viewportWidth = 50;
  if (!isFinite(viewportHeight)) viewportHeight = 50;

  return (
    <div ref={minimapRef} className="synapse-minimap-wrap" style={wrapStyle}>
      {collapsed ? (
        collapseBtn
      ) : (
    <div className="synapse-minimap synapse-minimap-panel">
      <div className="synapse-minimap-toolbar">{collapseBtn}</div>
      <svg width="100%" height="100%" viewBox="0 0 250 180" style={{ display: 'block' }}>
        {/* Render each node with actual dimensions */}
        {visibleNodes.map((node) => {
          const size = nodeSizes[node.type ?? ''] || { width: 200, height: 150 };
          const world = nodeWorld(node);
          const nw = node.measured?.width ?? node.width ?? size.width;
          const nh = node.measured?.height ?? node.height ?? size.height;
          let x = (world.x - minX) * scale + padding;
          let y = (world.y - minY) * scale + padding;
          let w = Math.max(2, nw * scale);
          let h = Math.max(2, nh * scale);
          const color = typeColors[node.type ?? ''] || '#64748b';
          
          // Ensure all values are valid finite numbers
          if (!isFinite(x)) x = padding;
          if (!isFinite(y)) y = padding;
          if (!isFinite(w)) w = 20;
          if (!isFinite(h)) h = 20;

          return (
            <g key={node.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={color}
                fillOpacity="0.7"
                stroke={color}
                strokeWidth="1"
                rx="2"
              />
            </g>
          );
        })}

        {/* Viewport indicator - shows current camera view */}
        <rect
          x={viewportX}
          y={viewportY}
          width={Math.max(5, viewportWidth)}
          height={Math.max(5, viewportHeight)}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="1.5"
          strokeDasharray="4,3"
          opacity="0.9"
        />
      </svg>
    </div>
      )}
      <StartDirectionArrow />
    </div>
  );
}

// Memoize the minimap to prevent constant rerenders of parent
const MemoizedCustomMinimap = React.memo(CustomMinimap);

function ReactFlowContent() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { nodes: storeNodes, edges: storeEdges, setNodes: setStoreNodes, setEdges: setStoreEdges, deleteEdge, onConnect: storeOnConnect, updateNodeData } = usePathStore();
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes] = useNodesState(storeNodes as Node[]);
  // Keep only "real" edges in state. Dashed comment-link edges are derived and should not
  // trigger state updates during node dragging.
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges as Edge[]);
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Full init (filter + flatten/park) runs after refs are declared.

  // Custom handler that applies recursive movement to linked comments
  const handleNodesChange = useCallback(
    (changes: any) => {
      setNodes((currentNodes) => {
        // Track position movements BEFORE applying changes so we can compute deltas
        const movements: Map<string, { deltaX: number; deltaY: number }> = new Map();

        for (const change of changes) {
          if (change.type === 'position' && change.position) {
            const node = currentNodes.find((n) => n.id === change.id);
            if (node && node.position) {
              movements.set(change.id, {
                deltaX: change.position.x - node.position.x,
                deltaY: change.position.y - node.position.y,
              });
            }
          }
        }

        // Apply ALL changes using React Flow's built-in handler
        // This properly handles dimensions, position, select, add, remove, etc.
        let result = applyNodeChanges(changes, currentNodes) as typeof currentNodes;

        const removedIds = new Set(
          (changes as { type?: string; id?: string }[])
            .filter((change) => change.type === 'remove' && change.id)
            .map((change) => change.id as string)
        );
        if (removedIds.size > 0) {
          const removedNodes = currentNodes.filter((n) => removedIds.has(n.id));
          const currentEdges = usePathStore.getState().edges as Edge[];
          const remainingEdges = currentEdges.filter(
            (e) => !removedIds.has(e.source) && !removedIds.has(e.target)
          );
          const reconciled = reconcileAfterNodeRemovals(result, remainingEdges, removedNodes);
          result = reconciled.nodes as typeof currentNodes;
          setEdges(reconciled.edges as Edge[]);
          setStoreNodes(result);
          setStoreEdges(reconciled.edges as Edge[]);
          lastSyncedNodesRef.current = result;
          lastSyncedEdgesRef.current = reconciled.edges as Edge[];
        }

        // Apply recursive movement to linked comment children
        // Only for nodes that still exist in the result (not deleted)
        for (const [movingNodeId, movement] of movements) {
          if (movement.deltaX === 0 && movement.deltaY === 0) continue;
          
          // Skip if the node was deleted
          if (!result.find((n) => n.id === movingNodeId)) {
            continue;
          }
          
          result = applyMovementRecursive(result, movingNodeId, movement.deltaX, movement.deltaY, new Set());
          const nested = result.filter((n) => n.parentId === movingNodeId);
          for (const child of nested) {
            result = applyMovementRecursive(result, child.id, movement.deltaX, movement.deltaY, new Set());
          }
        }

        return result;

        function applyMovementRecursive(
          nodes: typeof currentNodes,
          parentId: string,
          deltaX: number,
          deltaY: number,
          processed: Set<string>
        ): typeof currentNodes {
          if (processed.has(parentId)) return nodes;
          processed.add(parentId);

          let updated = nodes.map((n) => {
            if (n.type === 'comment' && n.data?.linkedNodeId === parentId && n.position) {
              return {
                ...n,
                position: {
                  x: n.position.x + deltaX,
                  y: n.position.y + deltaY,
                },
              };
            }
            return n;
          });

          const childrenIds = updated
            .filter((n) => n.type === 'comment' && n.data?.linkedNodeId === parentId)
            .map((n) => n.id);

          for (const childId of childrenIds) {
            updated = applyMovementRecursive(updated, childId, deltaX, deltaY, processed);
          }

          return updated;
        }
      });
    },
    [setNodes]
  );
  const lastSyncedNodesRef = useRef<Node[]>(storeNodes);
  const lastSyncedEdgesRef = useRef<Edge[]>(storeEdges);

  // Initialize from store on mount only
  useEffect(() => {
    if (isInitializedRef.current) return;
    const validNodes = storeNodes.filter((n: any) => validNodeTypes.has(n.type));
    const normalized = normalizeWorkspaceGraph(validNodes as Node[], storeEdges as Edge[]);
    setNodes(normalized.nodes);
    setEdges(normalized.edges as Edge[]);
    lastSyncedNodesRef.current = normalized.nodes;
    lastSyncedEdgesRef.current = normalized.edges as Edge[];
    if (normalized.nodes !== storeNodes || normalized.edges !== storeEdges) {
      setStoreNodes(normalized.nodes);
      setStoreEdges(normalized.edges as Edge[]);
    }
    isInitializedRef.current = true;
  }, []);

  // Sync store changes to React Flow (when settings are updated or nodes deleted from sidebar)
  // IMPORTANT: This only runs when structure or data actually changes, not on every position update
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    // Check if nodes actually changed (not just position)
    const structureChanged = storeNodes.length !== lastSyncedNodesRef.current.length;
    let dataChanged = false;

    if (!structureChanged && storeNodes.length > 0) {
      dataChanged = storeNodes.some((n) => {
        const synced = lastSyncedNodesRef.current.find((s) => s.id === n.id);
        if (!synced) return true;
        // Only compare type and data, ignore position
        return (
          n.type !== synced.type ||
          JSON.stringify(n.data) !== JSON.stringify(synced.data) ||
          n.parentId !== synced.parentId ||
          Boolean(n.hidden) !== Boolean(synced.hidden)
        );
      });
    }

    if (structureChanged || dataChanged) {
      console.log('Store nodes changed (data/structure), syncing to React Flow. Count:', storeNodes.length);
      lastSyncedNodesRef.current = storeNodes;

      if (structureChanged) {
        // Node added/removed - replace all
        console.log('Node count changed, replacing all nodes');
        setNodes(storeNodes as Node[]);
      } else {
        // Data changed on existing nodes - update data only, preserve positions
        setNodes((prevNodes) =>
          prevNodes.map((pn) => {
            const sn = storeNodes.find((s) => s.id === pn.id);
            if (!sn) return pn;
            const nestingChanged =
              pn.parentId !== sn.parentId || Boolean(pn.hidden) !== Boolean(sn.hidden);
            const nodeDataChanged =
              sn.data !== pn.data && JSON.stringify(sn.data) !== JSON.stringify(pn.data);
            if (!nestingChanged && !nodeDataChanged) return pn;
            return {
              ...pn,
              data: sn.data,
              parentId: sn.parentId,
              hidden: sn.hidden,
              style: sn.style ?? pn.style,
              width: sn.width ?? pn.width,
              height: sn.height ?? pn.height,
              ...(nestingChanged || sn.parentId ? { position: sn.position } : {}),
            };
          })
        );
      }
    }
  }, [storeNodes, setNodes]);

  // Sync store edge changes to React Flow (when new edges are created via storeOnConnect)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    // Check if edges in store differ from what React Flow has
    if (JSON.stringify(storeEdges) !== JSON.stringify(lastSyncedEdgesRef.current)) {
      console.log('Store edges changed, syncing to React Flow. Edge count:', storeEdges.length);
      setEdges(storeEdges as Edge[]);
      lastSyncedEdgesRef.current = storeEdges;
    }
  }, [storeEdges, setEdges]);

  const renderedEdges = edges as Edge[];

  // Sync React Flow changes back to store (debounced to avoid excessive updates during drag)
  // IMPORTANT: Only sync data changes, NOT position changes. Position is transient UI state.
  useEffect(() => {
    if (!isInitializedRef.current) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce sync to avoid excessive updates - wait for drag to complete
    syncTimeoutRef.current = setTimeout(() => {
      // Create a version of nodes with only id, type, position, data (not including derived state)
      const nodesToSync = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
        selected: n.selected,
        hidden: n.hidden,
      }));

      // Compare only data, not position
      const structureChanged = nodesToSync.length !== lastSyncedNodesRef.current.length;
      let dataChanged = false;

      if (!structureChanged) {
        dataChanged = nodesToSync.some((n) => {
          const synced = lastSyncedNodesRef.current.find((s) => s.id === n.id);
          if (!synced) return true;
          // Compare only data, ignore position changes
          return (
            JSON.stringify(synced.data) !== JSON.stringify(n.data) ||
            Boolean(synced.hidden) !== Boolean(n.hidden)
          );
        });
      }

      if (structureChanged || dataChanged) {
        console.log('Syncing node data to store (position changes ignored). Node count:', nodesToSync.length);
        setStoreNodes(nodes); // Send full nodes to store
        lastSyncedNodesRef.current = nodes;
      }
    }, 500); // Debounce for 500ms

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [nodes, setStoreNodes]);

  useEffect(() => {
    if (isInitializedRef.current) {
      // Sync only the real edges back to the store (derived dashed edges are not persisted).
      const regularEdges = edges.filter((e) => !e.id.startsWith('dashed-'));
      
      // Only sync back if React Flow edges differ from what we synced TO the store
      if (JSON.stringify(regularEdges) !== JSON.stringify(lastSyncedEdgesRef.current)) {
        console.log('Syncing edges back to store. Edge count:', regularEdges.length);
        setStoreEdges(regularEdges);
        lastSyncedEdgesRef.current = regularEdges;
      }
    }
  }, [edges, setStoreEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const data = event.dataTransfer.getData('application/reactflow');
      if (!data || !reactFlowRef.current) return;

      try {
        const nodeData = JSON.parse(data);
        
        // Palette HTML5 drop of an existing track (nodeId) onto a randomizer.
        // Canvas node drags use onNodeDragStop instead — React Flow does not set dataTransfer.
        if (nodeData.nodeId && nodeData.type === 'track') {
          const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
          const pointer = {
            id: nodeData.nodeId,
            type: 'track' as const,
            position: { x: flowPos.x - 8, y: flowPos.y - 8 },
            width: 16,
            height: 16,
            data: {},
          };
          const currentEdges = (usePathStore.getState().edges as Edge[]) ?? edges;
          const next = applyTrackMovesIntoRandomizers(nodes, currentEdges, [pointer]);
          if (next) {
            setNodes(next.nodes);
            setEdges(next.edges as Edge[]);
            setStoreNodes(next.nodes);
            setStoreEdges(next.edges as Edge[]);
            lastSyncedNodesRef.current = next.nodes;
            lastSyncedEdgesRef.current = next.edges as Edge[];
          }
          return;
        }

        // Otherwise, create new node from palette
        if (!nodeData.defaultData) return;

        // Prevent multiple start nodes
        if (nodeData.type === 'start' && nodes.some(n => n.type === 'start')) {
          alert('There can only be one start node');
          return;
        }

        const rect = reactFlowRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const newNode: any = {
          id: `${nodeData.type}-${Date.now()}`,
          type: nodeData.type,
          position: { x, y },
          data: { ...nodeData.defaultData },
        };

        setNodes([...nodes, newNode]);
      } catch (e) {
        console.error('Error parsing dropped node', e);
      }
    },
    [nodes, setNodes, setEdges, setStoreNodes, setStoreEdges, screenToFlowPosition]
  );

  useEffect(() => {
    const root = reactFlowRef.current;
    if (!root) return;

    const applyGraph = (next: { nodes: Node[]; edges: Edge[] }) => {
      setNodes(next.nodes);
      setEdges(next.edges);
      setStoreNodes(next.nodes);
      setStoreEdges(next.edges);
      lastSyncedNodesRef.current = next.nodes;
      lastSyncedEdgesRef.current = next.edges;
    };

    const clearPlaybackDropHighlights = () => {
      root
        .querySelectorAll('.synapse-playback-drop-ok')
        .forEach((el) => el.classList.remove('synapse-playback-drop-ok'));
    };

    const highlightPlaybackDrop = (event: DragEvent) => {
      clearPlaybackDropHighlights();
      const nodeEl = (event.target as HTMLElement | null)?.closest?.(
        '.react-flow__node'
      ) as HTMLElement | null;
      const id = nodeEl?.getAttribute('data-id');
      if (!id) return;
      const node = usePathStore.getState().nodes.find((n) => n.id === id);
      if (nodeEl && node && !node.hidden && canDropPlaybackMarkerOn(node.type)) {
        nodeEl.classList.add('synapse-playback-drop-ok');
      }
    };

    const onDragOverCapture = (event: DragEvent) => {
      if (isPlaybackMarkerDrag(event.dataTransfer)) {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        highlightPlaybackDrop(event);
        return;
      }
      if (dataTransferHasSequenceItem(event.dataTransfer)) {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      }
    };

    const onDropCapture = (event: DragEvent) => {
      if (isPlaybackMarkerDrag(event.dataTransfer) || dataTransferIsPlaybackMarker(event.dataTransfer)) {
        event.preventDefault();
        event.stopPropagation();
        clearPlaybackDropHighlights();
        const nodeEl = (event.target as HTMLElement | null)?.closest?.(
          '.react-flow__node'
        );
        const id = nodeEl?.getAttribute('data-id');
        const node = id
          ? usePathStore.getState().nodes.find((n) => n.id === id)
          : undefined;
        if (node && !node.hidden && canDropPlaybackMarkerOn(node.type)) {
          usePathStore.getState().setPlaybackStartNode(node.id);
        }
        return;
      }
      const payload = sequenceItemFromDataTransfer(event.dataTransfer);
      if (!payload) return;

      const over = (event.target as HTMLElement | null)?.closest?.('[data-randomizer-id]');
      const overId = over?.getAttribute('data-randomizer-id');
      if (overId === payload.randomizerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const currentNodes = usePathStore.getState().nodes as Node[];
      const currentEdges = usePathStore.getState().edges as Edge[];

      if (overId) {
        const moved = moveSequenceItemBetweenRandomizers(
          currentNodes,
          currentEdges,
          payload.randomizerId,
          overId,
          payload.trackId
        );
        if (moved) applyGraph(moved as { nodes: Node[]; edges: Edge[] });
        return;
      }

      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const restored = restoreTrackFromRandomizer(
        currentNodes,
        currentEdges,
        payload.randomizerId,
        payload.trackId,
        flowPos
      );
      if (restored) applyGraph(restored as { nodes: Node[]; edges: Edge[] });
    };

    const onDragEndCapture = () => clearPlaybackDropHighlights();

    root.addEventListener('dragover', onDragOverCapture, true);
    root.addEventListener('drop', onDropCapture, true);
    window.addEventListener('dragend', onDragEndCapture);
    return () => {
      root.removeEventListener('dragover', onDragOverCapture, true);
      root.removeEventListener('drop', onDropCapture, true);
      window.removeEventListener('dragend', onDragEndCapture);
    };
  }, [screenToFlowPosition, setNodes, setEdges, setStoreNodes, setStoreEdges]);

  // Wrapper for connect that validates through store
  const handleConnect = useCallback(
    (connection: any) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) {
        console.warn('Connect failed: source or target node not found');
        return;
      }

      if (sourceNode.type === 'comment' || targetNode.type === 'comment') {
        window.alert('Comment nodes cannot be part of the play path.');
        return;
      }

      // Prevent multiple outgoing edges from non-branching nodes
      const isSourceBranching =
        sourceNode.type === 'splitter' ||
        sourceNode.type === 'conditional' ||
        sourceNode.type === 'randomizer';

      if (!isSourceBranching) {
        const existingOutgoing = edges.filter(
          (e) => e.source === connection.source && !e.id.startsWith('dashed-')
        );
        if (existingOutgoing.length > 0) {
          window.alert(
            `"${sourceNode.type}" already has an outgoing connection.\n\n` +
              'For a chain like Start → Track 1 → Track 2:\n' +
              '• Drag from Track 1’s RIGHT handle to Track 2’s LEFT handle\n' +
              '• Or click the old line and press Delete, then reconnect'
          );
          return;
        }
      } else {
        const existingFromHandle = edges.filter(
          (e) =>
            e.source === connection.source &&
            e.sourceHandle === connection.sourceHandle &&
            !e.id.startsWith('dashed-')
        );
        if (existingFromHandle.length > 0) {
          window.alert('That output path is already connected. Delete the existing line first.');
          return;
        }
      }

      const allowsMultipleInputs =
        targetNode.type === 'track' ||
        targetNode.type === 'end' ||
        targetNode.type === 'randomizer' ||
        targetNode.type === 'transition';

      if (!allowsMultipleInputs) {
        const existingIncoming = edges.filter(
          (e) => e.target === connection.target && !e.id.startsWith('dashed-')
        );
        if (existingIncoming.length > 0) {
          window.alert(
            `This ${targetNode.type} node already has an incoming connection. Delete it first, or use a Track/Randomizer as the target.`
          );
          return;
        }
      }

      storeOnConnect(connection);
    },
    [storeOnConnect, nodes, edges]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      // Prevent deleting dashed comment edges
      if (edge.id.startsWith('dashed-')) {
        return;
      }
      if (window.confirm('Delete this connection?')) {
        // Remove from local state
        setEdges((prevEdges) => prevEdges.filter((e) => e.id !== edge.id));
        // Also update store
        deleteEdge(edge.id);
      }
    },
    [setEdges, deleteEdge]
  );

  const handleRemoveAll = useCallback(() => {
    if (!window.confirm('Remove all nodes and connections?')) return;
    setNodes([]);
    setEdges([]);
    setStoreNodes([]);
    setStoreEdges([]);
    usePathStore.getState().setSelection([]);
    usePathStore.getState().setPlaybackStartNode(null);
  }, [setNodes, setEdges, setStoreNodes, setStoreEdges]);

  const onNodeClickHandler = useCallback(
    (_: any, node: any) => {
      const store = usePathStore.getState();
      // If a comment node is in linking mode, link it to this clicked node
      if (store.commentLinkingId && node.id !== store.commentLinkingId) {
        updateNodeData(store.commentLinkingId, { linkedNodeId: node.id });
        store.setCommentLinkingId(null); // Exit linking mode
      } else {
        // Normal selection
        store.selectNode(node.id);
      }
    },
    [updateNodeData]
  );

  return (
    <div ref={reactFlowRef} className="synapse-canvas-wrap" style={{ minHeight: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={renderedEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDragStop={(_event, _node, draggedNodes) => {
          const positions = new Map(
            draggedNodes.map((n) => [n.id, n.position] as const)
          );
          setNodes((current) => {
            const moved = current.map((n) =>
              positions.has(n.id) ? { ...n, position: positions.get(n.id)! } : n
            );
            const currentEdges = (usePathStore.getState().edges as Edge[]) ?? edges;
            const next = applyTrackMovesIntoRandomizers(moved, currentEdges, draggedNodes);
            if (!next) {
              setStoreNodes(moved);
              lastSyncedNodesRef.current = moved;
              return moved;
            }
            setEdges(next.edges as Edge[]);
            setStoreNodes(next.nodes);
            setStoreEdges(next.edges as Edge[]);
            lastSyncedNodesRef.current = next.nodes;
            lastSyncedEdgesRef.current = next.edges as Edge[];
            const selected = usePathStore.getState().selectedNodeId;
            if (selected && next.nodes.find((n) => n.id === selected)?.hidden) {
              usePathStore.getState().setSelection([]);
            }
            return next.nodes;
          });
        }}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClickHandler}
        onPaneClick={() => usePathStore.getState().setSelection([])}
        onSelectionChange={({ nodes: selected }) => {
          const ids = selected.filter((n) => !n.hidden).map((n) => n.id);
          const prev = usePathStore.getState().selectedNodeIds;
          if (ids.length === prev.length && ids.every((id) => prev.includes(id))) return;
          usePathStore.getState().setSelection(ids);
        }}
        onEdgeClick={onEdgeClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        colorMode="dark"
      >
        <Background color="rgba(255,255,255,0.045)" gap={24} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
        <PlaybackMarker />
        <CommentConnections nodes={nodes} />
      </ReactFlow>

      <button type="button" onClick={handleRemoveAll} className="synapse-canvas-action">
        Remove All
      </button>

      <MemoizedCustomMinimap />
    </div>
  );
}

export default function ReactFlowCanvas() {
  return (
    <div className="flex-1 h-full min-w-0 bg-[var(--bg-deep)]">
      <ReactFlowProvider>
        <ReactFlowContent />
      </ReactFlowProvider>
    </div>
  );
}