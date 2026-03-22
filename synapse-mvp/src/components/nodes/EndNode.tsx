import { Handle, Position } from '@xyflow/react';
import { Square } from 'lucide-react';

export default function EndNode() {
  return (
    <div className="bg-slate-800 border-2 border-red-500 p-3 rounded-lg w-32 shadow-lg flex flex-col items-center gap-2">
      <Square className="w-5 h-5 text-red-400" />
      <strong className="text-sm">End</strong>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
