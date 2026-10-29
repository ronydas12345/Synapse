import { useMemo, useState } from 'react';
import { usePathStore } from '../store';
import { FIT_NODES_EVENT } from '../canvas/fitEvents';
import { validateGraph, validationSummary } from '../engine/validateGraph';

export default function ValidationBar() {
  const nodes = usePathStore((s) => s.nodes);
  const edges = usePathStore((s) => s.edges);
  const selectNode = usePathStore((s) => s.selectNode);
  const [open, setOpen] = useState(false);
  const issues = useMemo(() => validateGraph(nodes, edges), [nodes, edges]);
  const summary = validationSummary(issues);

  return (
    <div
      className={`synapse-validation is-${summary.errors ? 'error' : summary.warnings ? 'warning' : 'ok'}`}
      data-tutorial="validation"
    >
      <button
        type="button"
        className="synapse-validation-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {summary.label}
      </button>
      {open ? (
        issues.length === 0 ? (
          <p className="synapse-validation-empty">This path looks playable.</p>
        ) : (
          <ul className="synapse-validation-list">
            {issues.map((issue) => (
              <li key={issue.id}>
                <button
                  type="button"
                  className={`synapse-validation-item is-${issue.severity}`}
                  onClick={() => {
                    if (!issue.nodeId) return;
                    selectNode(issue.nodeId);
                    window.dispatchEvent(
                      new CustomEvent(FIT_NODES_EVENT, {
                        detail: { nodeIds: [issue.nodeId] },
                      })
                    );
                  }}
                >
                  <span className="synapse-validation-sev">{issue.severity}</span>
                  {issue.message}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
