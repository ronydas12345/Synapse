import { Handle, Position } from '@xyflow/react';
import { Music } from 'lucide-react';

export default function TrackNode({ data = {} }: any) {
  return (
    <div className="bg-slate-800 border border-slate-600 p-3 rounded-lg w-64 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Music className="w-4 h-4 text-amber-500" />
        <strong className="text-sm">Track</strong>
      </div>
      <p className="text-xs text-slate-400 mb-2 break-all">ID: {data?.videoId || 'Not set'}</p>
      <p className="text-xs text-slate-400">Duration: {data?.duration || 0}s</p>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}