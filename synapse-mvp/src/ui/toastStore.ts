import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'> & { id?: string; timeoutMs?: number }) => string;
  dismiss: (id: string) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = toast.id || `toast-${Date.now()}-${seq++}`;
    set((state) => ({
      toasts: [
        ...state.toasts.filter((item) => item.id !== id),
        {
          id,
          tone: toast.tone,
          message: toast.message,
          action: toast.action,
        },
      ].slice(-4),
    }));
    const timeout = toast.timeoutMs ?? (toast.tone === 'error' ? 8000 : 4200);
    if (timeout > 0) {
      window.setTimeout(() => get().dismiss(id), timeout);
    }
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));

export function toast(
  message: string,
  tone: ToastTone = 'info',
  action?: ToastAction
): string {
  return useToastStore.getState().push({ message, tone, action });
}
