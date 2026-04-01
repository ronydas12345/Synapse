import ReactFlowCanvas from './components/ReactFlowCanvas';
import Sidebar from './components/Sidebar';
import Player from './Player';
import { usePathStore } from './store';

export default function App() {
  const { isPlaying, setIsPlaying } = usePathStore();

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col text-slate-100">
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cyan-400">Synapse</h1>
        <button
          onClick={togglePlayback}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition-colors"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ReactFlowCanvas />
      </div>

      <Player />
    </div>
  );
}
