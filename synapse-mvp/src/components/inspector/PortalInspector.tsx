import { useMemo, useState } from 'react';
import { usePathStore } from '../../store';
import { isPortalId, normalizePortalId } from '../../portals/ids';
import {
  parsePortalAccessPolicy,
  parsePortalDestination,
  parsePortalNodeData,
} from '../../portals/parse';
import { findPortalNode } from '../../portals/remap';
import { portalRole, portalRoleLabel } from '../../portals/role';
import { editorPortalStatus, validatePortalGraph } from '../../portals/validate';
import type { PortalAccessMode, PortalDestinationMode } from '../../portals/types';

function copyText(value: string) {
  void navigator.clipboard?.writeText(value).catch(() => {});
}

export default function PortalInspector({
  nodeId,
  data,
}: {
  nodeId: string;
  data: Record<string, unknown> | undefined;
}) {
  const nodes = usePathStore((s) => s.nodes);
  const edges = usePathStore((s) => s.edges);
  const summaries = usePathStore((s) => s.pathSummaries);
  const activePathId = usePathStore((s) => s.activePathId);
  const updateNodeData = usePathStore((s) => s.updateNodeData);
  const parsed = parsePortalNodeData(data, '');
  const role = portalRole(nodeId, edges);
  const issues = useMemo(() => validatePortalGraph(nodes, edges), [nodes, edges]);
  const selected =
    nodes.find((node) => node.id === nodeId) ||
    ({
      id: nodeId,
      type: 'portal',
      position: { x: 0, y: 0 },
      data: data ?? {},
    } as (typeof nodes)[number]);
  const status = editorPortalStatus(selected, edges, issues);
  const dest = parsed.destination;
  const destPlaylistId = dest?.playlistId || '';
  const destPath =
    summaries.find((path) => path.id === destPlaylistId) ||
    summaries.find((path) => path.workshopId === destPlaylistId);
  const destPortals = useMemo(() => {
    if (!destPlaylistId || destPlaylistId === activePathId) {
      return nodes.filter((node) => node.type === 'portal' && node.id !== nodeId);
    }
    return [];
  }, [destPlaylistId, activePathId, nodes, nodeId]);

  const [copied, setCopied] = useState(false);

  const patch = (next: Record<string, unknown>) => {
    updateNodeData(nodeId, next);
  };

  return (
    <div className="space-y-3" data-tutorial="inspector-portal">
      <div>
        <label htmlFor={`portal-id-${nodeId}`}>Portal ID</label>
        <div className="flex gap-2">
          <input
            id={`portal-id-${nodeId}`}
            className="w-full p-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded text-[var(--text)] font-mono text-xs"
            value={parsed.portalId}
            readOnly
          />
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => {
              copyText(parsed.portalId);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)] m-0 leading-relaxed">{status}</p>
      <p className="text-xs text-[var(--text)] m-0">
        Role: <strong>{portalRoleLabel(role)}</strong>
      </p>

      {role === 'entry' || role === 'unset' ? (
        <div>
          <label htmlFor={`portal-access-${nodeId}`}>Who may enter this portal</label>
          <select
            id={`portal-access-${nodeId}`}
            className="w-full p-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded text-[var(--text)]"
            value={parsed.accessPolicy.mode}
            onChange={(e) =>
              patch({
                accessPolicy: {
                  ...parsed.accessPolicy,
                  mode: e.target.value as PortalAccessMode,
                },
              })
            }
          >
            <option value="inherit">Use playlist rules</option>
            <option value="allowlist">Allow selected source portals</option>
            <option value="blacklist">Block selected source portals</option>
          </select>
          {parsed.accessPolicy.mode !== 'inherit' ? (
            <RevertibleIdList
              label={
                parsed.accessPolicy.mode === 'allowlist' ? 'Allowed Portal IDs' : 'Blocked Portal IDs'
              }
              value={
                parsed.accessPolicy.mode === 'allowlist'
                  ? parsed.accessPolicy.allowedSourcePortalIds
                  : parsed.accessPolicy.blockedSourcePortalIds
              }
              onChange={(ids) => {
                const accessPolicy = parsePortalAccessPolicy({
                  ...parsed.accessPolicy,
                  allowedSourcePortalIds:
                    parsed.accessPolicy.mode === 'allowlist'
                      ? ids
                      : parsed.accessPolicy.allowedSourcePortalIds,
                  blockedSourcePortalIds:
                    parsed.accessPolicy.mode === 'blacklist'
                      ? ids
                      : parsed.accessPolicy.blockedSourcePortalIds,
                });
                patch({ accessPolicy });
              }}
            />
          ) : null}
        </div>
      ) : null}

      {role === 'exit' || role === 'unset' ? (
        <>
          <div>
            <label htmlFor={`portal-dest-${nodeId}`}>Destination playlist</label>
            <select
              id={`portal-dest-${nodeId}`}
              className="w-full p-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded text-[var(--text)]"
              value={destPlaylistId === activePathId ? activePathId : destPlaylistId}
              onChange={(e) => {
                const playlistId = e.target.value;
                patch({
                  destination: parsePortalDestination({
                    type: 'internal',
                    playlistId,
                    mode: dest?.mode || 'playlist_start',
                    portalId: dest?.portalId || '',
                  }),
                });
              }}
            >
              <option value="">Select a playlist</option>
              {summaries.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.name}
                  {path.id === activePathId ? ' (this playlist)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`portal-mode-${nodeId}`}>Route</label>
            <select
              id={`portal-mode-${nodeId}`}
              className="w-full p-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded text-[var(--text)]"
              value={dest?.mode || 'playlist_start'}
              disabled={!destPlaylistId}
              onChange={(e) => {
                const mode = e.target.value as PortalDestinationMode;
                patch({
                  destination: parsePortalDestination({
                    type: dest?.type || 'internal',
                    playlistId: destPlaylistId,
                    mode,
                    portalId: mode === 'portal' ? dest?.portalId || '' : '',
                  }),
                });
              }}
            >
              <option value="playlist_start">Playlist beginning (blue)</option>
              <option value="portal">Specific portal (purple)</option>
            </select>
          </div>
          {dest?.mode === 'portal' ? (
            <div>
              <label htmlFor={`portal-target-${nodeId}`}>Destination portal</label>
              {destPlaylistId === activePathId && destPortals.length > 0 ? (
                <select
                  id={`portal-target-${nodeId}`}
                  className="w-full p-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded text-[var(--text)]"
                  value={dest.portalId}
                  onChange={(e) =>
                    patch({
                      destination: parsePortalDestination({
                        ...dest,
                        mode: 'portal',
                        portalId: e.target.value,
                      }),
                    })
                  }
                >
                  <option value="">Select a portal</option>
                  {destPortals.map((node) => {
                    const item = parsePortalNodeData(node.data, '');
                    return (
                      <option key={node.id} value={item.portalId}>
                        {item.portalId}
                        {item.name ? ` · ${item.name}` : ''}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  id={`portal-target-${nodeId}`}
                  className="w-full p-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded text-[var(--text)] font-mono text-xs"
                  placeholder="P-XXXXXXXX"
                  value={dest.portalId}
                  onChange={(e) =>
                    patch({
                      destination: parsePortalDestination({
                        ...dest,
                        mode: 'portal',
                        portalId: normalizePortalId(e.target.value),
                      }),
                    })
                  }
                />
              )}
              {destPlaylistId === activePathId && destPortals.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] m-0 mt-1">
                  This playlist has no other portals. Use the playlist beginning, or add an entry
                  portal first.
                </p>
              ) : null}
              {dest.portalId && destPlaylistId === activePathId && !findPortalNode(nodes, dest.portalId) ? (
                <p className="text-xs text-[var(--danger)] m-0 mt-1">
                  That Portal ID is not on this playlist.
                </p>
              ) : null}
              {dest.portalId && !isPortalId(dest.portalId) ? (
                <p className="text-xs text-[var(--danger)] m-0 mt-1">Portal ID looks invalid.</p>
              ) : null}
            </div>
          ) : null}
          {destPath && destPath.visibility === 'private' && destPath.id !== activePathId ? (
            <p className="text-xs text-[var(--text-muted)] m-0">
              Private destinations only work for you. Other listeners cannot follow this portal.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function RevertibleIdList({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="mt-2">
      <label>{label}</label>
      <textarea
        className="w-full p-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded text-[var(--text)] font-mono text-xs min-h-[4.5rem]"
        value={value.join('\n')}
        placeholder="One Portal ID per line"
        onChange={(e) =>
          onChange(
            e.target.value
              .split(/[\s,]+/)
              .map((id) => normalizePortalId(id))
              .filter(Boolean)
          )
        }
      />
    </div>
  );
}
