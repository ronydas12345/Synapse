import { Handle, Position } from '@xyflow/react';
import { DoorOpen } from 'lucide-react';
import { usePathStore } from '../../store';
import { nodeDisplayName } from '../../nodes/nodeName';
import { parsePortalNodeData } from '../../portals/parse';
import { portalHandleEnabled, portalRole, portalRoleLabel } from '../../portals/role';
import { portalColorKind } from '../../portals/tint';
import { PORTAL_IN_HANDLE, PORTAL_OUT_HANDLE } from '../../portals/types';

export default function PortalNode({
  id,
  data,
}: {
  id: string;
  data?: Record<string, unknown>;
}) {
  const edges = usePathStore((s) => s.edges);
  const playingId = usePathStore((s) => s.currentPlayingNodeId);
  const parsed = parsePortalNodeData(data, '');
  const role = portalRole(id, edges);
  const inOn = portalHandleEnabled(role, PORTAL_IN_HANDLE);
  const outOn = portalHandleEnabled(role, PORTAL_OUT_HANDLE);
  const dest =
    parsed.destination?.mode === 'portal' && parsed.destination.portalId
      ? parsed.destination.portalId
      : parsed.destination?.playlistId
        ? 'Playlist start'
        : 'No destination';
  const tint = portalColorKind(parsed.destination, role);

  return (
    <div
      className={`synapse-node w-44 flex flex-col items-center gap-1.5 p-3 is-portal is-portal-${tint}${
        playingId === id ? ' is-playing' : ''
      }${role === 'invalid' ? ' is-portal-invalid' : ''}`}
      data-tutorial="node-portal"
    >
      <div className="synapse-portal-mark w-9 h-9 rounded-lg grid place-items-center">
        <DoorOpen className="w-4 h-4" />
      </div>
      <strong
        className="text-sm tracking-tight truncate max-w-full px-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {nodeDisplayName('portal', data)}
      </strong>
      <p className="text-[0.65rem] text-[var(--text-faint)] m-0 font-mono">{parsed.portalId || '—'}</p>
      <p className="text-[0.65rem] text-[var(--text-muted)] m-0">
        {portalRoleLabel(role)}
        {role === 'exit' ? ` · ${dest}` : ''}
      </p>
      <Handle
        id={PORTAL_IN_HANDLE}
        type="target"
        position={Position.Left}
        isConnectable={inOn}
        className={`synapse-handle${inOn ? '' : ' is-disabled'}`}
        aria-label={inOn ? 'Enter portal to leave this playlist' : 'Entry path disabled'}
      />
      <Handle
        id={PORTAL_OUT_HANDLE}
        type="source"
        position={Position.Right}
        isConnectable={outOn}
        className={`synapse-handle${outOn ? '' : ' is-disabled'}`}
        aria-label={outOn ? 'Leave portal into this playlist' : 'Exit path disabled'}
      />
    </div>
  );
}
