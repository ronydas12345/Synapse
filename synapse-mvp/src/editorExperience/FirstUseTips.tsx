import { useMemo, useState } from 'react';
import { usePathStore } from '../store';
import { useTutorialStore } from '../tutorial/tutorialStore';
import {
  dismissFirstUseTip,
  loadDismissedTips,
  pickFirstUseTip,
  type FirstUseTipId,
} from './tips';
import { useEditorExperience } from './useEditorExperience';

export default function FirstUseTips() {
  const enabled = useEditorExperience().firstUseTips;
  const nodes = usePathStore((s) => s.nodes);
  const edges = usePathStore((s) => s.edges);
  const selectedId = usePathStore((s) => s.selectedNodeId);
  const [dismissed, setDismissed] = useState(() => loadDismissedTips());

  const selectedType = useMemo(() => {
    if (!selectedId) return null;
    return nodes.find((node) => node.id === selectedId)?.type ?? null;
  }, [nodes, selectedId]);

  const tip = useMemo(() => {
    if (!enabled) return null;
    return pickFirstUseTip({
      selectedType,
      nodeCount: nodes.filter((node) => !node.hidden).length,
      edgeCount: edges.length,
      dismissed,
    });
  }, [dismissed, edges.length, enabled, nodes, selectedType]);

  if (!tip) return null;

  const dismiss = (id: FirstUseTipId) => {
    dismissFirstUseTip(id);
    setDismissed(loadDismissedTips());
  };

  return (
    <div className="synapse-first-use-tip" role="status">
      <p>
        <strong>{tip.title}</strong>
        {' — '}
        {tip.body}
      </p>
      <div className="synapse-first-use-tip-actions">
        <button
          type="button"
          className="synapse-first-use-tip-learn"
          onClick={() => {
            dismiss(tip.id);
            useTutorialStore.getState().startSection(tip.tutorialId);
          }}
        >
          Learn more
        </button>
        <button
          type="button"
          className="synapse-first-use-tip-dismiss"
          aria-label="Dismiss tip"
          onClick={() => dismiss(tip.id)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
