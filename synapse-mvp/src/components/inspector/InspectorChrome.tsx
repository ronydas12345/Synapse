import { usePathStore } from '../../store';
import { nodeCustomName, nodeTypeLabel } from '../../nodes/nodeName';
import { RevertibleTextInput } from '../fields/RevertibleField';
import { scrollWithin } from '../../ui/scrollWithin';

export function InspectorNameField({
  nodeId,
  type,
  data,
}: {
  nodeId: string;
  type: string;
  data: Record<string, unknown> | undefined;
}) {
  const updateNodeData = usePathStore((s) => s.updateNodeData);
  if (type === 'track') return null;
  const kind = nodeTypeLabel(type, data);
  return (
    <div className="space-y-1.5">
      <label htmlFor={`node-name-${nodeId}`}>Name</label>
      <RevertibleTextInput
        id={`node-name-${nodeId}`}
        className="w-full p-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded text-[var(--text)]"
        placeholder={`${kind} name (travel, childhood…)`}
        maxLength={60}
        value={nodeCustomName(data)}
        onCommit={(name) => updateNodeData(nodeId, { name: name.trim() })}
      />
    </div>
  );
}

export type InspectorMainTab = 'settings' | 'youtube' | 'path';

export function InspectorMainTabs({
  value,
  onChange,
}: {
  value: InspectorMainTab;
  onChange: (next: InspectorMainTab) => void;
}) {
  const tabs: { id: InspectorMainTab; label: string }[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'youtube', label: 'Song info' },
    { id: 'path', label: 'Playlist' },
  ];
  return (
    <div className="synapse-inspector-tabs" role="tablist" aria-label="Node inspector">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={`synapse-inspector-tab ${value === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function InspectorJumpTabs({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  if (sections.length < 2) return null;
  return (
    <div className="synapse-inspector-jumps" role="navigation" aria-label="Jump to section">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className="synapse-inspector-jump"
          onClick={() => {
            scrollWithin(
              document.getElementById(section.id),
              '.synapse-inspector-rail-inner',
              '.synapse-inspector-jumps'
            );
          }}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}

export function BringOntoPageButtons({ selected }: { selected: boolean }) {
  const bringNodesOntoPage = usePathStore((s) => s.bringNodesOntoPage);
  return (
    <div className="synapse-inspector-bring">
      <button
        type="button"
        className="synapse-btn-secondary"
        disabled={!selected}
        title="Keep relative spacing and move the selection onto one canvas page"
        onClick={() => bringNodesOntoPage('selected')}
      >
        Bring selected onto page
      </button>
      <button
        type="button"
        className="synapse-btn-secondary"
        title="Pack named nodes (or the whole path) onto one canvas page"
        onClick={() => bringNodesOntoPage('all')}
      >
        Bring all onto page
      </button>
    </div>
  );
}
