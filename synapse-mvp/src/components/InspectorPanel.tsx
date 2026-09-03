import { usePathStore } from '../store';
import NodeInspector from './NodeInspector';

export default function InspectorPanel() {
  const selectedNodeIds = usePathStore((s) => s.selectedNodeIds);
  const count = selectedNodeIds.length;
  const open = count >= 1;

  return (
    <aside
      className={`synapse-inspector-rail ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
    >
      <div className="synapse-inspector-rail-inner">
        {count > 1 ? (
          <div className="synapse-inspector">
            <p className="synapse-section-label">Inspector</p>
            <h3
              className="font-semibold text-[var(--text)] m-0 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Multiple nodes
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-3 m-0">
              {count} nodes selected. Select a single node to edit its settings.
            </p>
          </div>
        ) : (
          <NodeInspector />
        )}
      </div>
    </aside>
  );
}
