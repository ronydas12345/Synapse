import { useEffect, useMemo, useRef, useState } from 'react';
import ThemePreview from './ThemePreview';
import {
  allThemes,
  filterThemes,
  resolveTheme,
  useThemeStore,
} from '../theme/themeStore';
import { COLOR_KEYS, COLOR_LABELS } from '../theme/types';
import { FONT_OPTIONS } from '../theme/fonts';

export default function ThemeSettings({ hintQuery = '' }: { hintQuery?: string }) {
  const activeId = useThemeStore((s) => s.activeId);
  const customThemes = useThemeStore((s) => s.customThemes);
  const draft = useThemeStore((s) => s.draft);
  const setActiveId = useThemeStore((s) => s.setActiveId);
  const startEdit = useThemeStore((s) => s.startEdit);
  const updateDraft = useThemeStore((s) => s.updateDraft);
  const saveDraft = useThemeStore((s) => s.saveDraft);
  const cancelEdit = useThemeStore((s) => s.cancelEdit);
  const duplicateActive = useThemeStore((s) => s.duplicateActive);
  const resetDraft = useThemeStore((s) => s.resetDraft);
  const importJson = useThemeStore((s) => s.importJson);
  const exportActive = useThemeStore((s) => s.exportActive);
  const deleteCustom = useThemeStore((s) => s.deleteCustom);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hintQuery) return;
    setQuery(hintQuery);
    setOpen(true);
  }, [hintQuery]);

  const themes = allThemes(customThemes);
  const filtered = useMemo(() => filterThemes(themes, query), [themes, query]);
  const active = resolveTheme(activeId, customThemes);
  const preview = draft ?? active;
  const editing = Boolean(draft);

  const exportFile = () => {
    const json = exportActive();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preview.id}.synapse-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="synapse-theme-settings">
      {editing ? (
        <div className="synapse-theme-lock" role="status">
          <strong>Editing theme</strong>
          <label className="synapse-theme-name-field">
            <span className="synapse-sr-only">Theme name</span>
            <input
              className="synapse-settings-input"
              value={draft?.name ?? ''}
              onChange={(e) => updateDraft({ name: e.target.value })}
              placeholder="Theme name"
              maxLength={64}
              aria-label="Theme name"
            />
          </label>
          <div className="synapse-theme-lock-actions">
            <button type="button" className="synapse-btn synapse-btn-play" onClick={saveDraft}>
              Save
            </button>
            <button type="button" className="synapse-btn synapse-btn-ghost" onClick={cancelEdit}>
              Cancel
            </button>
            <button type="button" className="synapse-btn synapse-btn-ghost" onClick={resetDraft}>
              Reset
            </button>
          </div>
        </div>
      ) : null}

      <label className="synapse-settings-field">
        <span>Theme</span>
        <div className="synapse-theme-combobox">
          <input
            className="synapse-settings-input"
            value={open ? query : active.name}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setQuery('');
              setOpen(true);
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            placeholder="Search themes"
            aria-label="Search themes"
            disabled={editing}
          />
          {open && !editing ? (
            <ul className="synapse-theme-menu" role="listbox">
              {filtered.length === 0 ? (
                <li className="synapse-theme-empty">No matches</li>
              ) : (
                filtered.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={t.id === activeId ? 'is-active' : ''}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setActiveId(t.id);
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      {t.name}
                      {t.builtin ? '' : ' (custom)'}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      </label>

      <div className="synapse-theme-actions">
        <button type="button" className="synapse-btn synapse-btn-ghost" onClick={() => startEdit()} disabled={editing}>
          Edit
        </button>
        <button type="button" className="synapse-btn synapse-btn-ghost" onClick={duplicateActive} disabled={editing}>
          Duplicate
        </button>
        <button type="button" className="synapse-btn synapse-btn-ghost" onClick={exportFile}>
          Export JSON
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => fileRef.current?.click()}
          disabled={editing}
        >
          Import JSON
        </button>
        {!active.builtin ? (
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => deleteCustom(active.id)}
            disabled={editing}
          >
            Delete
          </button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const text = await file.text();
            setImportError(importJson(text) || '');
          }}
        />
      </div>
      {importError ? <p className="synapse-settings-error">{importError}</p> : null}

      <ThemePreview theme={preview} />

      {draft ? (
        <div className="synapse-theme-editor">
          <p className="synapse-section-label">Colors</p>
          <div className="synapse-theme-color-grid">
            {COLOR_KEYS.map((key) => (
              <label key={key} className="synapse-theme-color">
                <span>{COLOR_LABELS[key]}</span>
                <input
                  type="color"
                  value={draft.colors[key]}
                  onChange={(e) => updateDraft({ colors: { [key]: e.target.value } })}
                />
              </label>
            ))}
          </div>

          <p className="synapse-section-label">Typography</p>
          {(
            [
              ['ui', 'Main UI'],
              ['display', 'Headings'],
              ['mono', 'Mono'],
              ['node', 'Nodes'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="synapse-settings-field">
              <span>{label}</span>
              <select
                className="synapse-settings-input"
                value={draft.typography[key]}
                onChange={(e) =>
                  updateDraft({
                    typography: { [key]: e.target.value } as Partial<
                      typeof draft.typography
                    >,
                  })
                }
              >
                {FONT_OPTIONS[key].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <p className="synapse-section-label">Style</p>
          <label className="synapse-settings-field">
            <span>Corner radius ({draft.style.radius}px)</span>
            <input
              type="range"
              min={0}
              max={24}
              value={draft.style.radius}
              onChange={(e) =>
                updateDraft({ style: { radius: Number(e.target.value) } })
              }
            />
          </label>
          <label className="synapse-settings-field">
            <span>Grid intensity</span>
            <input
              type="range"
              min={0.01}
              max={0.2}
              step={0.01}
              value={draft.style.gridIntensity}
              onChange={(e) =>
                updateDraft({ style: { gridIntensity: Number(e.target.value) } })
              }
            />
          </label>
          <label className="synapse-settings-field">
            <span>Shadow intensity</span>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={draft.style.shadowIntensity}
              onChange={(e) =>
                updateDraft({ style: { shadowIntensity: Number(e.target.value) } })
              }
            />
          </label>
        </div>
      ) : (
        <p className="synapse-settings-hint">
          Choose a preset or saved theme. Duplicate or Edit to create a custom
          theme. Changes stay in a locked editor until you Save.
        </p>
      )}
    </div>
  );
}
