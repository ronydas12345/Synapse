import { Handle, Position } from '@xyflow/react';
import { usePathStore } from '../../store';
import { Link2 } from 'lucide-react';

export default function CommentNode({ data = {}, id }: any) {
  const { updateNodeData, nodes, commentLinkingId, setCommentLinkingId } = usePathStore();
  
  const linkedNodeId = data?.linkedNodeId || null;
  const linkedNode = linkedNodeId ? nodes.find((n) => n.id === linkedNodeId) : null;
  const isLinking = commentLinkingId === id;

  return (
    <div className="synapse-node w-64 overflow-hidden border-[rgba(255,255,255,0.12)]">
      {/* Handles for edges */}
      <Handle type="target" position={Position.Left} className="synapse-handle !bg-[var(--text-faint)]" />
      <Handle type="source" position={Position.Right} className="synapse-handle !bg-[var(--text-faint)]" />

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
        <div className="px-3 py-2 bg-slate-750 border-b border-slate-700">
          <p className="text-xs text-slate-400">
            Linked to: <span className="text-slate-300">{linkedNode.type}</span>
          </p>
          <button
            onClick={() => updateNodeData(id, { linkedNodeId: null })}
            className="text-xs text-red-400 hover:text-red-300 mt-1"
          >
            Unlink
          </button>
        </div>
      )}

      {/* Linking Mode Info */}
      {isLinking && (
        <div className="px-3 py-2 bg-blue-900 border-b border-blue-700">
          <p className="text-xs text-blue-200">Click a node to link to it</p>
          <button
            onClick={() => setCommentLinkingId(null)}
            className="text-xs text-blue-300 hover:text-blue-100 mt-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Text Content */}
      <div className="px-3 py-3">
        <textarea
          value={data?.text || ''}
          onChange={(e) => updateNodeData(id, { text: e.target.value })}
          placeholder="Add a note..."
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-xs placeholder-slate-500 resize-none h-24 focus:outline-none focus:border-slate-500"
        />
      </div>
    </div>
  );
}
