import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';
import { nodeDisplayName } from '../../nodes/nodeName';

export default function StartNode({ data }: { data?: Record<string, unknown> }) {
  return (
    <div className="synapse-node w-36 flex flex-col items-center gap-2 p-3 is-start" data-tutorial="node-start">
      <div className="w-9 h-9 rounded-lg grid place-items-center bg-[rgba(125,206,160,0.12)]">
        <Play className="w-4 h-4 text-[var(--ok)]" />
      </div>
      <strong className="text-sm tracking-tight truncate max-w-full px-1" style={{ fontFamily: 'var(--font-display)' }}>
        {nodeDisplayName('start', data)}
      </strong>
      <Handle
        type="source"
        position={Position.Right}
        className="synapse-handle !bg-[var(--ok)]"
        aria-label="Connect from Start"
      />
    </div>
  );
}
