import { create } from 'zustand';

interface ShortcutHelpState {
  open: boolean;
  show: () => void;
  close: () => void;
  toggle: () => void;
}

export const useShortcutHelpStore = create<ShortcutHelpState>((set, get) => ({
  open: false,
  show: () => set({ open: true }),
  close: () => set({ open: false }),
  toggle: () => set({ open: !get().open }),
}));
