import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { usePathStore } from '../store';
import { FIT_NODES_EVENT } from '../canvas/fitEvents';
import { validateGraph, validationSummary } from '../engine/validateGraph';

export default function ValidationBar() {
  const nodes = usePathStore((s) => s.nodes);
  const edges = usePathStore((s) => s.edges);
  const selectNode = usePathStore((s) => s.selectNode);
  const [open, setOpen] = useState(false);
  const [hiddenOk, setHiddenOk] = useState(false);
  const issues = useMemo(() => validateGraph(nodes, edges), [nodes, edges]);
  const summary = validationSummary(issues);
  const hasProblems = summary.errors + summary.warnings + summary.infos > 0;

  useEffect(() => {
    if (hasProblems) setHiddenOk(false);
  }, [hasProblems]);

  if (!hasProblems && hiddenOk) return null;

  return (
    <div
      className={`synapse-validation is-${summary.errors ? 'error' : summary.warnings ? 'warning' : 'ok'}`}
      data-tutorial="validation"
    >
      <div className="synapse-validation-row">
        {hasProblems ? (
          <button
            type="button"
            className="synapse-validation-toggle"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {summary.label}
          </button>
        ) : (
          <p className="synapse-validation-ok">No detected issues — path looks playable</p>
        )}
        {hasProblems ? null : (
          <button
            type="button"
            className="synapse-validation-dismiss"
            aria-label="Hide path check"
            onClick={() => setHiddenOk(true)}
          >
            <X size={13} strokeWidth={2.25} aria-hidden />
          </button>
        )}
      </div>
      {open && issues.length > 0 ? (
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
      ) : null}
    </div>
  );
}
