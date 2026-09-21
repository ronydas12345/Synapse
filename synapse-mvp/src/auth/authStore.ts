import { create } from 'zustand';
import {
  bootstrapRole,
  parseSuperadminEmails,
  resolveAuthRole,
  type AuthRole,
  type SessionUser,
} from './session';
import type { AccountStatus } from '../admin/model';

function superadminEmails(): string[] {
  return parseSuperadminEmails(import.meta.env.VITE_SUPERADMIN_EMAILS);
}

interface AuthState {
  status: 'loading' | 'ready';
  roleStatus: 'loading' | 'ready';
  user: SessionUser | null;
  role: AuthRole;
  accountStatus: AccountStatus;
  error: string | null;
  busy: boolean;
  setFromUser: (user: SessionUser | null) => void;
  setStaffState: (staffAdmin: boolean, accountStatus: AccountStatus) => void;
  setBusy: (busy: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  roleStatus: 'loading',
  user: null,
  role: 'user',
  accountStatus: 'active',
  error: null,
  busy: false,
  setFromUser: (user) => {
    const role = bootstrapRole(user, superadminEmails());
    set({
      status: 'ready',
      user,
      role,
      roleStatus: !user || role === 'superadmin' ? 'ready' : 'loading',
      accountStatus: 'active',
      busy: false,
    });
  },
  setStaffState: (staffAdmin, accountStatus) => {
    const { user } = get();
    set({
      role: resolveAuthRole(user, superadminEmails(), staffAdmin),
      accountStatus,
      roleStatus: 'ready',
    });
  },
  setBusy: (busy) => set({ busy }),
  setError: (error) => set({ error, busy: false }),
}));
