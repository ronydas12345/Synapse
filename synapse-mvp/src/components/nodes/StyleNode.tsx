import { Handle, Position } from '@xyflow/react';
import { Palette } from 'lucide-react';
import { usePathStore } from '../../store';
import { allThemes, useThemeStore } from '../../theme/themeStore';
import { parseStyleNodeData, styleThemeDisplayName, formatStyleNodeTiming } from '../../styleNode/parse';

export default function StyleNode({ data = {}, id }: { data?: unknown; id: string }) {
  const { currentPlayingNodeId } = usePathStore();
  const customThemes = useThemeStore((s) => s.customThemes);
  const isPlaying = currentPlayingNodeId === id;
  const parsed = parseStyleNodeData(data);
  const name = styleThemeDisplayName(parsed.themeId, allThemes(customThemes));

  return (
    <div className={`synapse-node w-64 overflow-hidden is-style ${isPlaying ? 'is-playing' : ''}`} data-tutorial="node-style">
      <div className="synapse-node-header">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative">
            <Palette className="w-4 h-4 text-[var(--node-style)] flex-shrink-0" />
            {isPlaying && (
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--node-style)]" />
            )}
          </div>
          <strong
            className="text-sm text-[var(--text)] truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Style
          </strong>
        </div>
      </div>
      <div className="px-3 py-3">
        <p className="text-xs text-[var(--text)] truncate">{name}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{formatStyleNodeTiming(parsed)}</p>
      </div>
      <Handle type="target" position={Position.Left} className="synapse-handle" />
      <Handle type="source" position={Position.Right} className="synapse-handle" />
    </div>
  );
}
