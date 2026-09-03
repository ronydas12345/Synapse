import ReactFlowCanvas from './components/ReactFlowCanvas';
import Sidebar from './components/Sidebar';
import InspectorPanel from './components/InspectorPanel';
import Player from './Player';
import TrackMetadataAutofill from './TrackMetadataAutofill';
import { usePathStore } from './store';

export default function App() {
  const { isPlaying, setIsPlaying, playbackQueue, requestSkip } = usePathStore();

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="synapse-app w-full h-screen flex flex-col text-[var(--text)]">
      <header className="synapse-topbar">
        <div className="synapse-topbar-brand">
          <div className="synapse-brand">Synapse</div>
          <div className="synapse-brand-meta">Music path · Studio</div>
        </div>
        <div className="synapse-transport">
          <button
            type="button"
            onClick={togglePlayback}
            className={`synapse-btn ${isPlaying ? 'synapse-btn-ghost' : 'synapse-btn-play'}`}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => requestSkip()}
            disabled={playbackQueue.length === 0}
            className="synapse-btn synapse-btn-ghost"
          >
            Skip
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <ReactFlowCanvas />
        <InspectorPanel />
      </div>

      <TrackMetadataAutofill />
      <Player />
    </div>
  );
}
