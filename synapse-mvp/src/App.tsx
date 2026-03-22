import ReactFlowCanvas from './components/ReactFlowCanvas';
import Sidebar from './components/Sidebar';
import Player from './Player';
import { usePathStore } from './store';
import { Play, Pause } from 'lucide-react';

function buildPlaybackQueueFromGraph(nodes: any[], edges: any[]): string[] {
  const startNode = nodes.find((n) => n.type === 'start');
  if (!startNode) {
    console.log('No start node found');
    return [];
  }

  const queue: string[] = [];
  const visited = new Set<string>();

  function traverse(nodeId: string, depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}Traversing: ${nodeId}`);
    
    if (visited.has(nodeId)) {
      console.log(`${indent}  Already visited`);
      return;
    }
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) {
      console.log(`${indent}  Node not found`);
      return;
    }

    console.log(`${indent}  Type: ${node.type}`);

    // If it's a track node, add to queue
    if (node.type === 'track' && node.data?.videoId) {
      console.log(`${indent}  Added to queue: ${node.data.videoId}`);
      queue.push(node.data.videoId);
    }

    // If it's an end node, stop traversing
    if (node.type === 'end') {
      console.log(`${indent}  End node - stopping`);
      return;
    }

    // Get all outgoing edges from this node
    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    console.log(`${indent}  Outgoing edges: ${outgoingEdges.length}`);

    if (node.type === 'splitter') {
      // For splitters, randomly choose ONE path based on weights
      const weights = node.data?.weights || [];
      const numPaths = node.data?.numPaths || 2;
      console.log(`${indent}  Splitter with ${numPaths} paths, weights: ${weights}`);
      
      if (weights.length > 0) {
        // Weighted random selection
        const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
        let random = Math.random() * totalWeight;
        let selectedPath = 0;
        
        for (let i = 0; i < weights.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            selectedPath = i;
            break;
          }
        }
        
        console.log(`${indent}  Selected path: ${selectedPath}`);
        
        // Find the corresponding edge for this path
        const pathLabel = String.fromCharCode(65 + selectedPath); // A, B, C, etc.
        console.log(`${indent}  Looking for handle: ${pathLabel}`);
        const selectedEdge = outgoingEdges.find((e) => e.sourceHandle === pathLabel);
        
        if (selectedEdge) {
          console.log(`${indent}  Found edge to: ${selectedEdge.target}`);
          traverse(selectedEdge.target, depth + 1);
        } else {
          console.log(`${indent}  No edge found with handle ${pathLabel}. Available edges:`, outgoingEdges.map(e => ({ target: e.target, handle: e.sourceHandle })));
        }
      } else {
        console.log(`${indent}  No weights defined, following all edges`);
        for (const edge of outgoingEdges) {
          traverse(edge.target, depth + 1);
        }
      }
    } else if (node.type === 'randomizer') {
      // For randomizers, randomly select ONE track from the randomizer's track list
      const tracks = node.data?.tracks || [];
      const weights = node.data?.weights || [];
      console.log(`${indent}  Randomizer with ${tracks.length} tracks, weights: ${weights}`);
      
      if (tracks.length > 0) {
        // Weighted random selection
        const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
        let random = Math.random() * totalWeight;
        let selectedTrackIndex = 0;
        
        for (let i = 0; i < weights.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            selectedTrackIndex = i;
            break;
          }
        }
        
        const selectedTrackId = tracks[selectedTrackIndex];
        console.log(`${indent}  Selected track: ${selectedTrackId}`);
        traverse(selectedTrackId, depth + 1);
      }
    } else {
      // For non-splitter, non-randomizer nodes, follow all outgoing edges
      for (const edge of outgoingEdges) {
        console.log(`${indent}  Following edge to: ${edge.target}`);
        traverse(edge.target, depth + 1);
      }
    }
  }

  traverse(startNode.id);
  console.log('Final queue:', queue);
  return queue;
}

export default function App() {
  const { isPlaying, setIsPlaying, setPlaybackQueue, nodes, edges, currentTrackIndex, setCurrentTrackIndex } = usePathStore();

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // Build queue by traversing graph from Start node
      const queue = buildPlaybackQueueFromGraph(nodes, edges);
      setPlaybackQueue(queue);
      // Only reset to start if no current position
      if (currentTrackIndex >= queue.length) {
        setCurrentTrackIndex(0);
      }
      setIsPlaying(true);
    }
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-slate-950 text-white">
        {/* Top Bar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-700">
          <h1 className="text-2xl font-bold">Synapse</h1>
          <div className="flex gap-4">
            <button
              onClick={togglePlayback}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {isPlaying ? <Pause /> : <Play />} {isPlaying ? 'Pause' : 'Start Path'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden gap-4 p-4">
          <Sidebar />
          <ReactFlowCanvas />
        </div>
      </div>
      <Player />
    </>
  );
}