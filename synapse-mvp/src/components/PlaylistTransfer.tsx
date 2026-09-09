import { useRef, useState } from 'react';
import { usePathStore } from '../store';
import { looksLikeZipBytes, ZIP_PLAYLIST_ERROR } from '../playlists/format';

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
  const [error, setError] = useState('');
  const [notices, setNotices] = useState<string[]>([]);

  const exportCurrent = (kind: 'playlist' | 'package') => {
    const file = exportPlaylistFile(activePathId, kind);
    if (!file) return;
    downloadTextFile(file.filename, file.json);
  };

  return (
    <div className="synapse-playlist-transfer">
      <p className="synapse-settings-lead">
        Playlists download as <code>.synapse</code> JSON, including any custom
        themes Style nodes (and the current Settings theme) depend on. A package
        is the same graph plus a manifest. Preset themes are referenced by id
        and are not duplicated. Files never run code. ZIP archives and overlay
        images or GIFs are not imported yet — those are skipped with a notice
        instead of being stripped silently.
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
          onClick={() => fileRef.current?.click()}
        >
          Import file
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
            const bytes = new Uint8Array(await file.arrayBuffer());
            if (looksLikeZipBytes(bytes)) {
              setError(ZIP_PLAYLIST_ERROR);
              setNotices([]);
              return;
            }
            const text = new TextDecoder().decode(bytes);
            const result = importPlaylistFile(text);
            setError(result.error || '');
            setNotices(result.error ? [] : result.notices);
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
