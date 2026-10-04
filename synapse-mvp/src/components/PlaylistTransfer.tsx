import { useRef, useState } from 'react';
import { confirmDestructive } from '../settings/settingsStore';
import { usePathStore } from '../store';
import { looksLikeZipBytes, ZIP_PLAYLIST_ERROR } from '../playlists/format';
import { getWorkshopCreation, listOwnWorkshop, publishWorkshopCreation } from '../workshop/api';

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PlaylistTransfer() {
  const activePathId = usePathStore((s) => s.activePathId);
  const exportPlaylistFile = usePathStore((s) => s.exportPlaylistFile);
  const importPlaylistFile = usePathStore((s) => s.importPlaylistFile);
  const fileRef = useRef<HTMLInputElement>(null);
  const importMode = useRef<'new' | 'replace'>('new');
  const [error, setError] = useState('');
  const [notices, setNotices] = useState<string[]>([]);

  const exportCurrent = (kind: 'playlist' | 'package') => {
    const file = exportPlaylistFile(activePathId, kind);
    if (!file) return;
    downloadTextFile(file.filename, file.json);
  };

  const pickFile = (mode: 'new' | 'replace') => {
    importMode.current = mode;
    fileRef.current?.click();
  };

  async function publishReplacedListing(): Promise<boolean> {
    const state = usePathStore.getState();
    const summary = state.pathSummaries.find((path) => path.id === state.activePathId);
    if (!summary) return false;
    let listingId = summary.workshopId || '';
    let existing = listingId ? await getWorkshopCreation(listingId) : null;
    if (!existing || existing.kind === 'theme') {
      const own = await listOwnWorkshop();
      existing =
        own.find(
          (row) =>
            row.kind === 'playlist' &&
            (row.sourcePathId === summary.id || row.id === listingId)
        ) || null;
    }
    if (!existing || existing.kind === 'theme') return false;
    await publishWorkshopCreation({
      id: existing.id,
      sourcePathId: existing.sourcePathId || summary.id,
      title: existing.title || summary.name,
      description: existing.description,
      visibility: existing.visibility,
      payload: { name: summary.name, nodes: state.nodes, edges: state.edges },
      kind: 'playlist',
      tags: summary.tags.length ? summary.tags : existing.tags,
    });
    state.syncWorkshopListing(existing.id, existing.visibility, summary.id);
    usePathStore.setState({
      workshopShareKey: existing.shareCode || existing.id,
    });
    return true;
  }

  return (
    <div className="synapse-playlist-transfer">
      <p className="synapse-settings-lead">
        Playlists download as <code>.synapse</code> JSON, including any custom
        themes Style nodes (and the current Settings theme) depend on. A package
        is the same graph plus a manifest. Preset themes are referenced by id
        and are not duplicated. Files never run code. ZIP archives and overlay
        images or GIFs are not imported yet — those are skipped with a notice
        instead of being stripped silently. Import as new playlist adds another
        Music Path. Replace current playlist clears this workspace and loads
        the file into it. If this playlist is already listed on Workshop, that
        listing is updated too.
      </p>
      <div className="synapse-theme-actions">
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          data-tutorial="export-playlist"
          onClick={() => exportCurrent('playlist')}
        >
          Export playlist
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          data-tutorial="export-package"
          onClick={() => exportCurrent('package')}
        >
          Export package
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          data-tutorial="import-playlist"
          onClick={() => pickFile('new')}
        >
          Import as new playlist
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => pickFile('replace')}
        >
          Replace current playlist
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".synapse,.json,application/json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const replaceActive = importMode.current === 'replace';
            if (
              replaceActive &&
              !confirmDestructive(
                `Replace everything in the current playlist with “${file.name}”?`
              )
            ) {
              return;
            }
            const bytes = new Uint8Array(await file.arrayBuffer());
            if (looksLikeZipBytes(bytes)) {
              setError(ZIP_PLAYLIST_ERROR);
              setNotices([]);
              return;
            }
            const text = new TextDecoder().decode(bytes);
            const result = importPlaylistFile(text, { replaceActive });
            if (result.error) {
              setError(result.error);
              setNotices([]);
              return;
            }
            const notes = [...result.notices];
            if (replaceActive) {
              try {
                const updated = await publishReplacedListing();
                if (updated) notes.push('Workshop listing updated.');
              } catch (err) {
                notes.push(
                  err instanceof Error
                    ? `Playlist replaced locally, but Workshop was not updated: ${err.message}`
                    : 'Playlist replaced locally, but Workshop was not updated.'
                );
              }
            }
            setError('');
            setNotices(notes);
          }}
        />
      </div>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {notices.length > 0 ? (
        <ul className="synapse-settings-notices">
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
