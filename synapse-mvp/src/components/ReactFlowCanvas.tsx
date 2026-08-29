import React from 'react';
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
import DashedCommentEdge from './edges/DashedCommentEdge';
import { useEffect, useCallback, useRef, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';

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

const edgeTypes = {
  dashedComment: DashedCommentEdge,
};

// Valid node type names for filtering
const validNodeTypes = new Set(Object.keys(nodeTypes));

// Custom minimap component that syncs with camera
function CustomMinimap() {
  const { getNodes, getViewport } = useReactFlow();
  const [containerDims, setContainerDims] = React.useState({ width: 1200, height: 800 });
  const [viewportState, setViewportState] = React.useState({ x: 0, y: 0, zoom: 1 });
  const minimapRef = React.useRef<HTMLDivElement>(null);
  const prevViewportRef = React.useRef({ x: 0, y: 0, zoom: 1 });
  const prevNodePositionsRef = React.useRef<Map<string, { x: number; y: number }>>(new Map());

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

  // Default node sizes (in pixels)
  const nodeSizes: Record<string, { width: number; height: number }> = {
    start: { width: 128, height: 80 },
    end: { width: 128, height: 80 },
    track: { width: 288, height: 160 },
    conditional: { width: 288, height: 160 },
    splitter: { width: 288, height: 160 },
    randomizer: { width: 224, height: 180 },
    transition: { width: 256, height: 100 },
    comment: { width: 256, height: 120 },
  };

  // Calculate bounds of all nodes with their actual dimensions
  let minX = 0, minY = 0, maxX = 1000, maxY = 800;
  if (nodes.length > 0) {
    minX = Math.min(...nodes.map((n) => n.position?.x || 0));
    minY = Math.min(...nodes.map((n) => n.position?.y || 0));
    maxX = Math.max(
      ...nodes.map((n) => {
        const size = nodeSizes[n.type] || { width: 200, height: 150 };
        return (n.position?.x || 0) + size.width;
      })
    );
    maxY = Math.max(
      ...nodes.map((n) => {
        const size = nodeSizes[n.type] || { width: 200, height: 150 };
        return (n.position?.y || 0) + size.height;
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
  
  // Guard against NaN values
  if (isNaN(zoom) || isNaN(vpX) || isNaN(vpY)) {
    return (
      <div 
        ref={minimapRef}
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          width: 250,
          height: 180,
          backgroundColor: 'rgba(12, 14, 20, 0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          zIndex: 50,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div style={{ padding: '10px', color: '#999', fontSize: '12px' }}>Minimap loading...</div>
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
    <div 
      ref={minimapRef}
      style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 250,
        height: 180,
        backgroundColor: 'rgba(12, 14, 20, 0.92)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        zIndex: 50,
        overflow: 'hidden',
        pointerEvents: 'none',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 250 180" style={{ display: 'block' }}>
        {/* Render each node with actual dimensions */}
        {nodes.map((node) => {
          const size = nodeSizes[node.type] || { width: 200, height: 150 };
          let x = ((node.position?.x || 0) - minX) * scale + padding;
          let y = ((node.position?.y || 0) - minY) * scale + padding;
          let w = Math.max(2, size.width * scale);
          let h = Math.max(2, size.height * scale);
          const color = typeColors[node.type] || '#64748b';
          
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
  );
}

// Memoize the minimap to prevent constant rerenders of parent
const MemoizedCustomMinimap = React.memo(CustomMinimap);

function ReactFlowContent() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { nodes: storeNodes, edges: storeEdges, setNodes: setStoreNodes, setEdges: setStoreEdges, deleteEdge, onConnect: storeOnConnect, updateNodeData } = usePathStore();

  const [nodes, setNodes] = useNodesState(storeNodes as Node[]);
  // Keep only "real" edges in state. Dashed comment-link edges are derived and should not
  // trigger state updates during node dragging.
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges as Edge[]);
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up invalid nodes on mount (only once)
  useEffect(() => {
    if (!isInitializedRef.current) {
      const validNodes = storeNodes.filter((n: any) => validNodeTypes.has(n.type));
      
      // If we filtered out any nodes, update the store
      if (validNodes.length !== storeNodes.length) {
        console.log('Filtered out invalid nodes:', storeNodes.length - validNodes.length);
        setStoreNodes(validNodes);
        setNodes(validNodes as Node[]);
      }
      
      isInitializedRef.current = true;
    }
  }, []);

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

        // Apply recursive movement to linked comment children
        // Only for nodes that still exist in the result (not deleted)
        for (const [movingNodeId, movement] of movements) {
          if (movement.deltaX === 0 && movement.deltaY === 0) continue;
          
          // Skip if the node was deleted
          if (!result.find((n) => n.id === movingNodeId)) {
            continue;
          }
          
          result = applyMovementRecursive(result, movingNodeId, movement.deltaX, movement.deltaY, new Set());
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
    if (!isInitializedRef.current) {
      setNodes(storeNodes as Node[]);
      setEdges(storeEdges as Edge[]);
      lastSyncedNodesRef.current = storeNodes;
      lastSyncedEdgesRef.current = storeEdges;
      isInitializedRef.current = true;
    }
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
        return n.type !== synced.type || JSON.stringify(n.data) !== JSON.stringify(synced.data);
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
            if (sn && sn.data !== pn.data) {
              console.log('Data updated for node', pn.id);
              return { ...pn, data: sn.data };
            }
            return pn;
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

  // Dashed edges for linked comment nodes are derived from node data only.
  // Important: do not set edges state on every node position update (dragging),
  // otherwise ReactFlow will re-render edges continuously and can "flash".
  const dashedEdges = useMemo((): Edge[] => {
    return nodes
      .filter((n) => n.type === 'comment' && n.data?.linkedNodeId)
      .map((commentNode) => ({
        id: `dashed-${commentNode.id}`,
        source: commentNode.id,
        target: commentNode.data.linkedNodeId as string,
        type: 'dashedComment',
      }));
  }, [
    // Depend only on the aspects that affect dashed edges, not full node objects.
    nodes
      .filter((n) => n.type === 'comment')
      .map((n) => `${n.id}:${String((n.data as any)?.linkedNodeId ?? '')}`)
      .join('|'),
  ]);

  const renderedEdges = useMemo(() => {
    return [...(edges as Edge[]), ...dashedEdges] as Edge[];
  }, [edges, dashedEdges]);

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
      }));

      // Compare only data, not position
      const structureChanged = nodesToSync.length !== lastSyncedNodesRef.current.length;
      let dataChanged = false;

      if (!structureChanged) {
        dataChanged = nodesToSync.some((n) => {
          const synced = lastSyncedNodesRef.current.find((s) => s.id === n.id);
          if (!synced) return true;
          // Compare only data, ignore position changes
          return JSON.stringify(synced.data) !== JSON.stringify(n.data);
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
        
        // Check if dropping a track node onto a randomizer
        if (nodeData.nodeId && nodeData.type === 'track') {
          const rect = reactFlowRef.current.getBoundingClientRect();
          const dropX = event.clientX - rect.left;
          const dropY = event.clientY - rect.top;

          // Find which randomizer node (if any) is closest to drop position
          const randomizers = nodes.filter((n) => n.type === 'randomizer');
          let closestRandomizer: Node | null = null;
          let minDistance = 100; // pixels threshold

          for (const randomizer of randomizers) {
            const distance = Math.hypot(
              dropX - (randomizer.position.x + 112),
              dropY - (randomizer.position.y + 50)
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestRandomizer = randomizer;
            }
          }

          // If dropped on a randomizer, add the track
          if (closestRandomizer) {
            const currentTracks = (closestRandomizer.data?.tracks as string[]) || [];
            if (!currentTracks.includes(nodeData.nodeId)) {
              const newTracks = [...currentTracks, nodeData.nodeId];
              const currentWeights = (closestRandomizer.data?.weights as number[]) || [];
              const newWeights = [...currentWeights, 10];
              updateNodeData(closestRandomizer.id, {
                tracks: newTracks,
                weights: newWeights,
              });
            }
            return;
          }
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
    [nodes, setNodes, updateNodeData]
  );

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
            const next = current.map((n) =>
              positions.has(n.id) ? { ...n, position: positions.get(n.id)! } : n
            );
            setStoreNodes(next);
            lastSyncedNodesRef.current = next;
            return next;
          });
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClickHandler}
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
        <Controls showInteractive={false} />
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