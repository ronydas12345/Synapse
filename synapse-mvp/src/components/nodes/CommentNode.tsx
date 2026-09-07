import { usePathStore } from '../../store';
import { Link2 } from 'lucide-react';

export default function CommentNode({ data = {}, id }: any) {
  const { updateNodeData, nodes, commentLinkingId, setCommentLinkingId } = usePathStore();
  
  const linkedNodeId = data?.linkedNodeId || null;
  const linkedNode = linkedNodeId ? nodes.find((n) => n.id === linkedNodeId) : null;
  const isLinking = commentLinkingId === id;

  return (
    <div className="synapse-node w-64 overflow-hidden is-comment">
      {/* Annotation node: no playback graph handles. Link via the header button. */}

      {/* Header */}
      <div className="synapse-node-header">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--text-faint)] flex-shrink-0" />
          <strong className="text-sm text-[var(--text)] truncate" style={{ fontFamily: 'var(--font-display)' }}>
            Comment
          </strong>
        </div>
        <button
          onClick={() => setCommentLinkingId(isLinking ? null : id)}
          className={`p-1 rounded-md transition-colors ${
            isLinking
              ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
              : 'text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
          }`}
          title={isLinking ? 'Cancel linking' : 'Link to a node'}
        >
          <Link2 className="w-4 h-4" />
        </button>
      </div>

      {/* Linked Node Info */}
      {linkedNode && !isLinking && (
        <div className="synapse-node-banner">
          <p>
            Linked to: <span className="text-[var(--text)]">{linkedNode.type}</span>
          </p>
          <button
            onClick={() => updateNodeData(id, { linkedNodeId: null })}
            className="text-xs text-[var(--danger)] hover:underline mt-1"
          >
            Unlink
          </button>
        </div>
      )}

      {isLinking && (
        <div className="synapse-node-banner is-link">
          <p>Click a node to link to it</p>
          <button
            onClick={() => setCommentLinkingId(null)}
            className="text-xs mt-1 hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="px-3 py-3">
        <textarea
          value={data?.text || ''}
          onChange={(e) => updateNodeData(id, { text: e.target.value })}
          placeholder="Add a note..."
          className="nodrag nopan nowheel synapse-node-note"
        />
      </div>
    </div>
  );
}
