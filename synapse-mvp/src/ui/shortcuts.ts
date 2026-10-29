export interface ShortcutRow {
  keys: string;
  action: string;
  when?: 'edit';
}

/** Only shortcuts the editor actually handles. */
export const EDITOR_SHORTCUTS: ShortcutRow[] = [
  { keys: 'Ctrl/Cmd+Z', action: 'Undo', when: 'edit' },
  { keys: 'Ctrl/Cmd+Shift+Z or Ctrl+Y', action: 'Redo', when: 'edit' },
  { keys: 'Ctrl/Cmd+S', action: 'Save now' },
  { keys: 'Ctrl/Cmd+C', action: 'Copy selected nodes', when: 'edit' },
  { keys: 'Ctrl/Cmd+V', action: 'Paste nodes', when: 'edit' },
  { keys: 'Ctrl/Cmd+D', action: 'Duplicate selected nodes', when: 'edit' },
  { keys: 'Ctrl/Cmd+A', action: 'Select visible nodes', when: 'edit' },
  { keys: 'Delete / Backspace', action: 'Delete selected nodes', when: 'edit' },
  { keys: 'Space', action: 'Play / pause' },
  { keys: 'Ctrl/Cmd+K', action: 'Command palette' },
  { keys: 'Ctrl/Cmd+/', action: 'Keyboard shortcuts' },
  { keys: 'Esc', action: 'Close dialogs or exit the tutorial' },
];
