import { Music, GitBranch, Plus, Play, Square, Dice5, MessageSquare, ArrowRight } from 'lucide-react';
import { usePathStore } from '../store';
import { useCallback } from 'react';

interface NodeType {
  type: string;
  label: string;
  icon: React.ReactNode;
  defaultData: Record<string, any>;
}

const NODE_TYPES: NodeType[] = [
  {
    type: 'start',
    label: 'Start Node',
    icon: <Play className="w-4 h-4" />,
    defaultData: { label: 'Start' },
  },
  {
    type: 'track',
    label: 'Track Node',
    icon: <Music className="w-4 h-4" />,
    defaultData: {
      videoId: '',
      songTitle: '',
      artist: '',
      album: '',
      startTime: 0,
      endTime: 0,
      duration: 0,
      volume: 100,
      label: '',
      playCount: 1,
    },
  },
  {
    type: 'conditional',
    label: 'Conditional',
    icon: <GitBranch className="w-4 h-4" />,
    defaultData: { numPaths: 2, weights: [10, 10], mode: 'random', pathTimeRanges: [[{ start: 0, end: 23 }], [{ start: 0, end: 23 }]] },
  },
  {
    type: 'randomizer',
    label: 'Randomizer/Sequence',
    icon: <Dice5 className="w-4 h-4" />,
    defaultData: { tracks: [], weights: [], isCollapsed: false, playCount: 1, mode: 'sequence' },
  },
  {
    type: 'transition',
    label: 'Transition',
    icon: <ArrowRight className="w-4 h-4" />,
    defaultData: { type: 'silence', duration: 1, audioFile: null, videoId: '' },
  },
  {
    type: 'comment',
    label: 'Comment',
    icon: <MessageSquare className="w-4 h-4" />,
    defaultData: { text: '', linkedNodeId: null },
  },
  {
    type: 'end',
    label: 'End Node',
    icon: <Square className="w-4 h-4" />,
    defaultData: { label: 'End' },
  },
];

export default function Sidebar() {
  const { nodes, setNodes, normalizeSplitters } = usePathStore();

  const handleAddNode = useCallback(
    (nodeType: NodeType) => {
      if (nodeType.type === 'start' && nodes.some(n => n.type === 'start')) {
        alert('There can only be one start node');
        return;
      }

      const newNode = {
        id: `${nodeType.type}-${Date.now()}`,
        type: nodeType.type,
        position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
        data: { ...nodeType.defaultData },
      };
      setNodes([...nodes, newNode as any]);
    },
    [nodes, setNodes]
  );

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        type: nodeType.type,
        defaultData: nodeType.defaultData,
      })
    );
  };

  return (
    <aside className="synapse-sidebar">
      <div>
        <p className="synapse-section-label">Module rack</p>
        <h2
          className="text-lg font-semibold tracking-tight m-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Nodes
        </h2>
      </div>

      <div className="space-y-2">
        {NODE_TYPES.map((nodeType, idx) => (
          <div key={`${nodeType.type}-${idx}`}>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, nodeType)}
              onClick={() => handleAddNode(nodeType)}
              className="synapse-rack-item group"
            >
              <div className="synapse-rack-icon">{nodeType.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] m-0">{nodeType.label}</p>
                <p className="text-[0.65rem] text-[var(--text-faint)] m-0 mt-0.5 font-mono tracking-wide">
                  Drag or click
                </p>
              </div>
              <Plus className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--accent)] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {nodes.some((n) => n.type === 'conditional') && (
        <div className="mt-1">
          <button
            onClick={normalizeSplitters}
            className="synapse-btn-secondary"
            title="Flatten stacked conditionals into one with preserved probabilities"
          >
            Normalize Conditionals
          </button>
        </div>
      )}

      <div className="flex-1" />
      <div className="mt-2 pt-3 border-t border-[var(--border)]">
        <p className="synapse-section-label">Guide</p>
        <p className="text-xs text-[var(--text-muted)] mb-3 m-0 leading-relaxed">
          Tip: Click nodes on canvas to edit. Click edges to delete.
        </p>
        <div className="synapse-inspector-card text-xs text-[var(--text-muted)]">
          <p className="font-semibold mb-2 text-[var(--text)] m-0" style={{ fontFamily: 'var(--font-display)' }}>
            Building paths
          </p>
          <ul className="space-y-1.5 list-none p-0 m-0 font-mono text-[0.65rem] tracking-wide">
            <li className="flex gap-2"><span className="text-[var(--accent)]">01</span> Start with Start node</li>
            <li className="flex gap-2"><span className="text-[var(--accent)]">02</span> Add Track nodes</li>
            <li className="flex gap-2"><span className="text-[var(--accent)]">03</span> Use Conditionals to branch</li>
            <li className="flex gap-2"><span className="text-[var(--accent)]">04</span> Randomizer for pools</li>
            <li className="flex gap-2"><span className="text-[var(--accent)]">05</span> Click edges to delete</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
