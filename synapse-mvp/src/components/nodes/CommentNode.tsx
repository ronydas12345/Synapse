import { Handle, Position } from '@xyflow/react';
import { usePathStore } from '../../store';
import { Link2 } from 'lucide-react';

export default function CommentNode({ data = {}, id }: any) {
  const { updateNodeData, nodes, commentLinkingId, setCommentLinkingId } = usePathStore();
  
  const linkedNodeId = data?.linkedNodeId || null;
  const linkedNode = linkedNodeId ? nodes.find((n) => n.id === linkedNodeId) : null;
  const isLinking = commentLinkingId === id;

  return (
    <div className="bg-slate-800 border border-slate-500 rounded-lg shadow-lg overflow-hidden w-64">
      {/* Handles for edges */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-slate-700 p-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-3 h-3 rounded-full bg-slate-500 flex-shrink-0" />
          <strong className="text-sm text-slate-100 truncate">Comment</strong>
        </div>
        <button
          onClick={() => setCommentLinkingId(isLinking ? null : id)}
          className={`p-1 rounded transition-colors ${
            isLinking
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-600'
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
