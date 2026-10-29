import { useEffect } from 'react';
import { EDITOR_SHORTCUTS } from './shortcuts';
import { useShortcutHelpStore } from './shortcutHelpStore';

export default function ShortcutHelp() {
  const open = useShortcutHelpStore((s) => s.open);
  const close = useShortcutHelpStore((s) => s.close);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="synapse-tutorial-dialog-layer" role="presentation">
      <div
        className="synapse-tutorial-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="synapse-shortcuts-title"
      >
        <h2 id="synapse-shortcuts-title">Keyboard shortcuts</h2>
        <ul className="synapse-shortcut-list">
          {EDITOR_SHORTCUTS.map((row) => (
            <li key={row.keys}>
              <kbd>{row.keys}</kbd>
              <span>{row.action}</span>
            </li>
          ))}
        </ul>
        <div className="synapse-tutorial-actions">
          <button type="button" className="synapse-btn synapse-btn-play" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
