import { create } from 'zustand';

export interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface OpenConfirm extends ConfirmRequest {
  resolve: (ok: boolean) => void;
}

interface ConfirmState {
  current: OpenConfirm | null;
  open: (request: OpenConfirm) => void;
  close: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  current: null,
  open: (request) => {
    const previous = get().current;
    previous?.resolve(false);
    set({ current: request });
  },
  close: (ok) => {
    const current = get().current;
    if (!current) return;
    current.resolve(ok);
    set({ current: null });
  },
}));

export function requestConfirm(request: ConfirmRequest): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().open({ ...request, resolve });
  });
}

export function resetConfirmStoreForTests(): void {
  const current = useConfirmStore.getState().current;
  current?.resolve(false);
  useConfirmStore.setState({ current: null });
}
