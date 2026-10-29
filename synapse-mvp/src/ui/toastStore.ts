import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  timeoutMs?: number;
  quiet?: boolean;
}

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
  quiet?: boolean;
  leaving?: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id' | 'leaving'> & ToastOptions) => string;
  dismiss: (id: string) => void;
}

let seq = 0;
const hideTimers = new Map<string, number>();
const removeTimers = new Map<string, number>();
const EXIT_MS = 280;

function clearTimer(map: Map<string, number>, id: string): void {
  const handle = map.get(id);
  if (handle) window.clearTimeout(handle);
  map.delete(id);
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = toast.id || `toast-${Date.now()}-${seq++}`;
    clearTimer(hideTimers, id);
    clearTimer(removeTimers, id);
    set((state) => ({
      toasts: [
        ...state.toasts.filter((item) => item.id !== id),
        {
          id,
          tone: toast.tone,
          message: toast.message,
          action: toast.action,
          quiet: toast.quiet,
          leaving: false,
        },
      ].slice(-4),
    }));
    const timeout = toast.timeoutMs ?? (toast.tone === 'error' ? 8000 : toast.quiet ? 1800 : 4200);
    if (timeout > 0) {
      hideTimers.set(
        id,
        window.setTimeout(() => get().dismiss(id), timeout)
      );
    }
    return id;
  },
  dismiss: (id) => {
    const existing = get().toasts.find((item) => item.id === id);
    if (!existing || existing.leaving) return;
    clearTimer(hideTimers, id);
    set((state) => ({
      toasts: state.toasts.map((item) =>
        item.id === id ? { ...item, leaving: true } : item
      ),
    }));
    removeTimers.set(
      id,
      window.setTimeout(() => {
        removeTimers.delete(id);
        set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
      }, EXIT_MS)
    );
  },
}));

export function toast(
  message: string,
  tone: ToastTone = 'info',
  action?: ToastAction,
  options?: ToastOptions
): string {
  return useToastStore.getState().push({ message, tone, action, ...options });
}
