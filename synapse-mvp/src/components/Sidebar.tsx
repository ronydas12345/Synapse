import { Music, GitBranch, Plus, Play, Square, Dice5, MessageSquare, ArrowRight, Palette } from 'lucide-react';
import { useCallback, type ReactNode } from 'react';
import { usePathStore, useGraphReadOnly } from '../store';
import {
  addCanvasNode,
  canvasNodeDragPayload,
  CANVAS_NODE_TYPES,
  type CanvasNodeType,
} from '../canvas/addNode';
import { BringOntoPageButtons } from './inspector/InspectorChrome';

const NODE_ICONS: Record<CanvasNodeType, ReactNode> = {
  start: <Play className="w-4 h-4" />,
  track: <Music className="w-4 h-4" />,
  conditional: <GitBranch className="w-4 h-4" />,
  randomizer: <Dice5 className="w-4 h-4" />,
  transition: <ArrowRight className="w-4 h-4" />,
  style: <Palette className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
  end: <Square className="w-4 h-4" />,
};

const NODE_LABELS: Record<CanvasNodeType, string> = {
  start: 'Start Node',
  track: 'Track Node',
  conditional: 'Conditional',
  randomizer: 'Randomizer/Sequence',
  transition: 'Transition',
  style: 'Style',
  comment: 'Comment',
  end: 'End Node',
};

export default function Sidebar() {
  const nodes = usePathStore((s) => s.nodes);
  const selectedNodeIds = usePathStore((s) => s.selectedNodeIds);
  const normalizeSplitters = usePathStore((s) => s.normalizeSplitters);
  const readOnly = useGraphReadOnly();

  const handleAddNode = useCallback((type: CanvasNodeType) => {
    const error = addCanvasNode(type);
    if (error) alert(error);
  }, []);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, type: CanvasNodeType) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify(canvasNodeDragPayload(type))
    );
  };

  return (
    <aside className="synapse-sidebar" data-tutorial="sidebar">
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
        {CANVAS_NODE_TYPES.map((nodeType) => (
          <div key={nodeType.type}>
            <div
              draggable={!readOnly}
              onDragStart={readOnly ? undefined : (e) => onDragStart(e, nodeType.type)}
              onClick={readOnly ? undefined : () => handleAddNode(nodeType.type)}
              className={`synapse-rack-item group${readOnly ? ' is-readonly' : ''}`}
              aria-disabled={readOnly}
              data-tutorial={`rack-${nodeType.type}`}
            >
              <div className="synapse-rack-icon">{NODE_ICONS[nodeType.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] m-0">
                  {NODE_LABELS[nodeType.type]}
                </p>
                <p className="text-[0.65rem] text-[var(--text-faint)] m-0 mt-0.5 font-mono tracking-wide">
                  {readOnly ? 'View only' : 'Drag or click'}
                </p>
              </div>
              {readOnly ? null : (
                <Plus className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--accent)] transition-colors" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 space-y-2">
        <BringOntoPageButtons selected={selectedNodeIds.length > 0} />
      </div>

      {readOnly ? null : nodes.some((n) => n.type === 'conditional') ? (
        <div className="mt-1">
          <button
            onClick={normalizeSplitters}
            className="synapse-btn-secondary"
            title="Flatten stacked weighted-random conditionals, keeping path odds. Weather, time, and day conditionals stay separate."
          >
            Normalize Conditionals
          </button>
        </div>
      ) : null}

      <div className="flex-1" />
      <div className="mt-2 pt-3 border-t border-[var(--border)]">
        <p className="synapse-section-label">Guide</p>
        <p className="text-xs text-[var(--text-muted)] mb-3 m-0 leading-relaxed">
          {readOnly
            ? 'This path is view only. Click a node to inspect it. Remix to edit your own copy.'
            : 'Tip: Click nodes on canvas to edit. Click edges to delete. Ctrl/Cmd+K opens commands.'}
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
