import { create } from 'zustand';

interface PaletteState {
  open: boolean;
  query: string;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  setQuery: (query: string) => void;
}

export const usePaletteStore = create<PaletteState>((set) => ({
  open: false,
  query: '',
  openPalette: () => set({ open: true, query: '' }),
  closePalette: () => set({ open: false, query: '' }),
  togglePalette: () =>
    set((state) =>
      state.open ? { open: false, query: '' } : { open: true, query: '' }
    ),
  setQuery: (query) => set({ query }),
}));

export function isAppleHotkeyHost(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

export function paletteShortcutLabel(): string {
  return isAppleHotkeyHost() ? '⌘K' : 'Ctrl+K';
}
