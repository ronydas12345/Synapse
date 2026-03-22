import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

export default function StartNode() {
  return (
    <div className="bg-slate-800 border-2 border-green-500 p-3 rounded-lg w-32 shadow-lg flex flex-col items-center gap-2">
      <Play className="w-5 h-5 text-green-400" />
      <strong className="text-sm">Start</strong>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
