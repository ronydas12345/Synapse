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
  workspaceStatus: 'idle' | 'loading' | 'ready';
  user: SessionUser | null;
  role: AuthRole;
  accountStatus: AccountStatus;
  error: string | null;
  busy: boolean;
  setFromUser: (user: SessionUser | null) => void;
  setStaffState: (staffAdmin: boolean, accountStatus: AccountStatus) => void;
  setWorkspaceStatus: (workspaceStatus: 'idle' | 'loading' | 'ready') => void;
  setBusy: (busy: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  roleStatus: 'loading',
  workspaceStatus: 'idle',
  user: null,
  role: 'user',
  accountStatus: 'active',
  error: null,
  busy: false,
  setFromUser: (user) => {
    const prev = get();
    const sameUser = Boolean(user && prev.user?.uid === user.uid);
    const role = bootstrapRole(user, superadminEmails());
    set({
      status: 'ready',
      user,
      role: sameUser && role !== 'superadmin' ? prev.role : role,
      roleStatus:
        !user || role === 'superadmin'
          ? 'ready'
          : sameUser
            ? prev.roleStatus
            : 'loading',
      workspaceStatus: user
        ? sameUser
          ? prev.workspaceStatus
          : 'loading'
        : 'ready',
      accountStatus: sameUser ? prev.accountStatus : 'active',
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
  setWorkspaceStatus: (workspaceStatus) => set({ workspaceStatus }),
  setBusy: (busy) => set({ busy }),
  setError: (error) => set({ error, busy: false }),
}));
