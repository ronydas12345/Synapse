import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';
import { nodeDisplayName } from '../../nodes/nodeName';

export default function EndNode({ data }: { data?: Record<string, unknown> }) {
  return (
    <div className="synapse-node w-36 flex flex-col items-center gap-2 p-3 is-end">
      <div className="w-9 h-9 rounded-lg grid place-items-center bg-[rgba(240,113,120,0.12)]">
        <Square className="w-4 h-4 text-[var(--danger)]" />
      </div>
      <strong className="text-sm tracking-tight truncate max-w-full px-1" style={{ fontFamily: 'var(--font-display)' }}>
        {nodeDisplayName('end', data)}
      </strong>
      <Handle
        type="target"
        position={Position.Left}
        className="synapse-handle !bg-[var(--danger)]"
      />
    </div>
  );
}
