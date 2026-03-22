import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { usePathStore } from '../store';
import TrackNode from './nodes/TrackNode';
import SplitterNode from './nodes/SplitterNode';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import RandomizerNode from './nodes/RandomizerNode';
import { useEffect, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

const nodeTypes = {
  track: TrackNode,
  splitter: SplitterNode,
  start: StartNode,
  end: EndNode,
  randomizer: RandomizerNode,
};

function ReactFlowContent() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { nodes: storeNodes, edges: storeEdges, setNodes: setStoreNodes, setEdges: setStoreEdges, deleteEdge, onConnect: storeOnConnect, updateNodeData } = usePathStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges as Edge[]);
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
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
  useEffect(() => {
    if (isInitializedRef.current && storeNodes !== lastSyncedNodesRef.current) {
      lastSyncedNodesRef.current = storeNodes;
      
      // Check if nodes structure changed (added/removed)
      if (storeNodes.length !== nodes.length) {
        setNodes(storeNodes as Node[]);
      } else {
        // Update data only without replacing structure
        setNodes((prevNodes) =>
          prevNodes.map((pn) => {
            const sn = storeNodes.find((s) => s.id === pn.id);
            if (sn && JSON.stringify(sn.data) !== JSON.stringify(pn.data)) {
              return { ...pn, data: sn.data };
            }
            return pn;
          })
        );
      }
    }
  }, [storeNodes, nodes, setNodes]);

  useEffect(() => {
    if (isInitializedRef.current && storeEdges !== lastSyncedEdgesRef.current) {
      lastSyncedEdgesRef.current = storeEdges;
      setEdges(storeEdges as Edge[]);
    }
  }, [storeEdges, setEdges]);

  // Sync React Flow changes back to store (but only if actually different)
  useEffect(() => {
    if (isInitializedRef.current) {
      // Only sync back if React Flow nodes differ from what we synced TO the store
      if (JSON.stringify(nodes) !== JSON.stringify(lastSyncedNodesRef.current)) {
        setStoreNodes(nodes);
        lastSyncedNodesRef.current = nodes;
      }
    }
  }, [nodes, setStoreNodes]);

  useEffect(() => {
    if (isInitializedRef.current) {
      // Only sync back if React Flow edges differ from what we synced TO the store
      if (JSON.stringify(edges) !== JSON.stringify(lastSyncedEdgesRef.current)) {
        setStoreEdges(edges);
        lastSyncedEdgesRef.current = edges;
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
      const sourceNode = storeNodes.find((n) => n.id === connection.source);
      const targetNode = storeNodes.find((n) => n.id === connection.target);

      // Prevent multiple outgoing edges from non-splitter/randomizer nodes
      const isSourceBranching =
        sourceNode?.type === 'splitter' || sourceNode?.type === 'randomizer';
      if (!isSourceBranching) {
        const existingOutgoing = storeEdges.filter(
          (e) => e.source === connection.source
        );
        if (existingOutgoing.length > 0) {
          console.warn(
            'Cannot create multiple outgoing edges from non-branching node'
          );
          return;
        }
      } else {
        // For branching nodes, prevent multiple edges from the SAME handle
        const existingFromHandle = storeEdges.filter(
          (e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle
        );
        if (existingFromHandle.length > 0) {
          console.warn('This output handle is already connected');
          return;
        }
      }

      // Prevent multiple incoming edges to non-track nodes
      const isTargetTrack = targetNode?.type === 'track';
      if (!isTargetTrack) {
        const existingIncoming = storeEdges.filter(
          (e) => e.target === connection.target
        );
        if (existingIncoming.length > 0) {
          console.warn('Cannot create multiple incoming edges to this node type');
          return;
        }
      }

      // Valid connection - add through store which handles persistence
      storeOnConnect(connection);
    },
    [storeOnConnect, storeNodes, storeEdges]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      if (window.confirm('Delete this connection?')) {
        // Remove from local state
        setEdges((prevEdges) => prevEdges.filter((e) => e.id !== edge.id));
        // Also update store
        deleteEdge(edge.id);
      }
    },
    [setEdges, deleteEdge]
  );

  return (
    <div ref={reactFlowRef} className="w-full h-full relative rounded-lg overflow-hidden border border-slate-700" style={{ minHeight: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        onNodeClick={(_: any, node: any) => usePathStore.getState().selectNode(node.id)}
        onEdgeClick={onEdgeClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
      >
        <Background color="#1e293b" gap={16} size={1} />
        <Controls />
        <MiniMap style={{
          backgroundColor: '#0f172a',
          border: '1px solid #475569',
        }} />
      </ReactFlow>
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