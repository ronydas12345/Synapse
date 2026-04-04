import React from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, ReactFlowProvider, useReactFlow } from '@xyflow/react';
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
import { useEffect, useCallback, useRef } from 'react';
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
  const scale = Math.min(scaleX, scaleY);

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
  const visibleLeft = -viewport.x / viewport.zoom;
  const visibleTop = -viewport.y / viewport.zoom;
  const visibleWidth = containerDims.width / viewport.zoom;
  const visibleHeight = containerDims.height / viewport.zoom;

  // Convert visible area to minimap coordinates
  const viewportX = (visibleLeft - minX) * scale + padding;
  const viewportY = (visibleTop - minY) * scale + padding;
  const viewportWidth = visibleWidth * scale;
  const viewportHeight = visibleHeight * scale;

  return (
    <div 
      ref={minimapRef}
      style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 250,
        height: 180,
        backgroundColor: '#0f172a',
        border: '2px solid #475569',
        borderRadius: 4,
        zIndex: 50,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 250 180" style={{ display: 'block' }}>
        {/* Render each node with actual dimensions */}
        {nodes.map((node) => {
          const size = nodeSizes[node.type] || { width: 200, height: 150 };
          const x = ((node.position?.x || 0) - minX) * scale + padding;
          const y = ((node.position?.y || 0) - minY) * scale + padding;
          const w = Math.max(2, size.width * scale);
          const h = Math.max(2, size.height * scale);
          const color = typeColors[node.type] || '#64748b';

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
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges as Edge[]);
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragCounterRef = useRef(0);

  // Custom handler that applies recursive movement to linked comments
  const handleNodesChange = useCallback(
    (changes: any) => {
      // Track if this is a drag change
      const isDragChange = changes.some((c: any) => c.type === 'position');
      
      if (isDragChange) {
        dragCounterRef.current++;
        if (dragCounterRef.current % 20 === 0) {
          console.log(`📍 Drag update batch #${dragCounterRef.current} (${changes.length} changes)`);
        }
      }
      
      // Only log non-position changes to reduce console spam
      const nonPositionChanges = changes.filter((c: any) => c.type !== 'position');
      if (nonPositionChanges.length > 0) {
        console.log('handleNodesChange (non-position):', nonPositionChanges.map((c: any) => ({ type: c.type, id: c.id })));
      }
      
      setNodes((currentNodes) => {
        // Process all changes (selection, position, etc)
        let result = currentNodes;
        const movements: Map<string, { deltaX: number; deltaY: number }> = new Map();

        // Apply all non-position changes and track position movements
        for (const change of changes) {
          if (change.type === 'position' && change.position) {
            // Track the movement delta
            const node = result.find((n) => n.id === change.id);
            if (node && node.position) {
              movements.set(change.id, {
                deltaX: change.position.x - node.position.x,
                deltaY: change.position.y - node.position.y,
              });
            }
            // Apply the position change
            result = result.map((n) =>
              n.id === change.id ? { ...n, position: change.position } : n
            );
          } else if (change.type === 'select') {
            // Selection changes are ignored here (handled by node click)
          }
        }

        // Apply recursive movement to linked children for nodes that moved
        for (const [movingNodeId, movement] of movements) {
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
          // Prevent infinite recursion
          if (processed.has(parentId)) return nodes;
          processed.add(parentId);

          // Move direct children
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

          // Find children that need their children moved too
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
  const dragEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track when drag completes
  useEffect(() => {
    if (dragCounterRef.current > 0) {
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }
      dragEndTimeoutRef.current = setTimeout(() => {
        console.log(`✅ Drag completed: ${dragCounterRef.current} update batches`);
        dragCounterRef.current = 0;
      }, 100);
    }

    return () => {
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }
    };
  }, [nodes]);

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

  // Combined edge sync - regular edges from store + dashed edges for comments
  useEffect(() => {
    // Generate dashed edges for linked comment nodes
    const dashedEdges: Edge[] = nodes
      .filter((n) => n.type === 'comment' && n.data?.linkedNodeId)
      .map((commentNode) => ({
        id: `dashed-${commentNode.id}`,
        source: commentNode.id,
        target: commentNode.data.linkedNodeId as string,
        type: 'dashedComment',
      }));

    // Combine regular edges with dashed edges
    const allEdges = [...storeEdges, ...dashedEdges] as Edge[];
    setEdges(allEdges);
  }, [storeEdges, nodes, setEdges]);

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
      // Filter out dashed comment edges before syncing back to store
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
      console.log('handleConnect called with:', {
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: connection.target,
        targetHandle: connection.targetHandle,
      });

      // Use React Flow's nodes/edges (most current) not store nodes/edges (may be out of sync)
      console.log('Available nodes in React Flow:', nodes.map((n) => ({ id: n.id, type: n.type })));

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      console.log('Source node found?', !!sourceNode, 'type:', sourceNode?.type);
      console.log('Target node found?', !!targetNode, 'type:', targetNode?.type);

      // Prevent multiple outgoing edges from non-splitter/randomizer nodes
      const isSourceBranching =
        sourceNode?.type === 'splitter' || sourceNode?.type === 'conditional' || sourceNode?.type === 'randomizer';
      console.log('Is source branching?', isSourceBranching, 'sourceNode type:', sourceNode?.type);

      if (!isSourceBranching) {
        const existingOutgoing = edges.filter(
          (e) => e.source === connection.source
        );
        console.log('Non-branching node existing outgoing edges:', existingOutgoing.length);
        console.log('All edges from source:', edges.filter((e) => e.source === connection.source));
        if (existingOutgoing.length > 0) {
          console.warn(
            'Cannot create multiple outgoing edges from non-branching node',
            { sourceType: sourceNode?.type, sourceId: connection.source }
          );
          return;
        }
      } else {
        // For branching nodes, prevent multiple edges from the SAME handle
        const existingFromHandle = edges.filter(
          (e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle
        );
        console.log('Branching node existing edges from handle:', existingFromHandle.length, 'Handle:', connection.sourceHandle);
        console.log('All edges from this source:', edges.filter((e) => e.source === connection.source));
        if (existingFromHandle.length > 0) {
          console.warn('This output handle is already connected');
          return;
        }
      }

      // Allow multiple incoming edges to track nodes and end nodes
      const isTargetTrack = targetNode?.type === 'track';
      const isTargetEnd = targetNode?.type === 'end';
      if (!isTargetTrack && !isTargetEnd) {
        const existingIncoming = edges.filter(
          (e) => e.target === connection.target
        );
        if (existingIncoming.length > 0) {
          console.warn('Cannot create multiple incoming edges to this node type');
          return;
        }
      }

      // Valid connection - add through store which handles persistence
      console.log('✓ Connection ACCEPTED - calling storeOnConnect');
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
    <div ref={reactFlowRef} className="w-full h-full relative rounded-lg overflow-hidden border border-slate-700" style={{ minHeight: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClickHandler}
        onEdgeClick={onEdgeClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background color="#1e293b" gap={16} size={1} />
        <Controls />
      </ReactFlow>

      {/* Minimap positioned outside ReactFlow but absolutely in parent container */}
      <MemoizedCustomMinimap />
    </div>
  );
}

export default function ReactFlowCanvas() {
  return (
    <div className="flex-1 h-full">
      <ReactFlowProvider>
        <ReactFlowContent />
      </ReactFlowProvider>
    </div>
  );
}