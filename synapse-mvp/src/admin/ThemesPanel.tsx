import { useEffect, useState } from 'react';
import { listPublishedThemes, publishTheme } from './api';
import { allThemes, useThemeStore } from '../theme/themeStore';
import { themeToJson } from '../theme/parseTheme';
import { formatWhen } from './dates';
import type { PublishedThemeDoc } from './model';

export default function ThemesPanel() {
  const customThemes = useThemeStore((s) => s.customThemes);
  const themes = allThemes(customThemes);
  const [selectedId, setSelectedId] = useState(themes[0]?.id || '');
  const [published, setPublished] = useState<PublishedThemeDoc[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      setPublished(await listPublishedThemes());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load themes.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const selected = themes.find((theme) => theme.id === selectedId) || themes[0];

  return (
    <section className="synapse-staff-section">
      <h2>Theme presets</h2>
      <p className="synapse-settings-lead">
        Publish a local preset for signed-in users. The theme builder still
        lives in Settings; this panel pushes and archives the live catalog.
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <label className="synapse-settings-field">
        <span>Local theme</span>
        <select
          className="synapse-settings-input"
          value={selected?.id || ''}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="synapse-btn synapse-btn-play"
        disabled={busy || !selected}
        onClick={() => {
          if (!selected) return;
          const themeId = (`pub-${selected.id}`)
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 64);
          setBusy(true);
          void publishTheme({
            themeId,
            name: selected.name,
            payloadJson: themeToJson({ ...selected, id: themeId, builtin: false }),
            status: 'published',
          })
            .then(reload)
            .catch((err) =>
              setError(err instanceof Error ? err.message : 'Publish failed.')
            )
            .finally(() => setBusy(false));
        }}
      >
        Publish for users
      </button>
      <div className="synapse-staff-table-wrap">
        <table className="synapse-staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Id</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {published.map((row) => (
              <tr key={row.themeId}>
                <td>{row.name}</td>
                <td>{row.themeId}</td>
                <td>{row.status}</td>
                <td>{formatWhen(row.updatedAt)}</td>
                <td>
                  <button
                    type="button"
                    className="synapse-btn synapse-btn-ghost"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void publishTheme({
                        themeId: row.themeId,
                        name: row.name,
                        payloadJson: row.payloadJson,
                        status: row.status === 'published' ? 'archived' : 'published',
                      })
                        .then(reload)
                        .catch((err) =>
                          setError(err instanceof Error ? err.message : 'Update failed.')
                        )
                        .finally(() => setBusy(false));
                    }}
                  >
                    {row.status === 'published' ? 'Archive' : 'Restore'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
