import { useEffect, type ReactNode } from 'react';
import { applyIdentityToProfile, subscribeAuth } from './client';
import { useAuthStore } from './authStore';
import {
  firstCompleteIdentity,
  readAccountCache,
  writeAccountCache,
  type AccountIdentity,
} from './identity';
import { useProfileStore } from '../profile/profileStore';
import type { SessionUser } from './session';
import {
  hydratePublishedThemes,
  readOwnIdentity,
  readStaffAdmin,
  subscribeAccountStatus,
  subscribeStaffAdmin,
  upsertOwnUser,
} from '../admin/syncAccount';
import { hydrateUserWorkspace, resetUserWorkspace } from '../cloud/workspace';
import { recordConsents } from '../admin/privacy';
import { evaluateOwnProgress } from '../badges/api';

function restoreIdentity(user: SessionUser): AccountIdentity | null {
  return firstCompleteIdentity(
    readAccountCache(user.uid),
    { username: user.username, displayName: user.displayName }
  );
}

function currentIdentity(): AccountIdentity | null {
  const profile = useProfileStore.getState().profile;
  return firstCompleteIdentity(profile);
}

function adoptIdentity(uid: string, identity: AccountIdentity | null): void {
  if (identity) {
    writeAccountCache(uid, identity);
    useProfileStore.getState().adoptAccount(uid, identity.username);
    applyIdentityToProfile(identity);
    return;
  }
  useProfileStore.getState().adoptAccount(uid);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const setFromUser = useAuthStore((s) => s.setFromUser);
  const setStaffState = useAuthStore((s) => s.setStaffState);

  useEffect(() => {
    let stopRole: (() => void) | undefined;
    let stopStatus: (() => void) | undefined;
    let cancelled = false;
    let ticket = 0;

    const stopAuth = subscribeAuth((user, event) => {
      const prevUid = useAuthStore.getState().user?.uid;
      const sameUser = Boolean(user && prevUid === user.uid);
      setFromUser(user);
      if (sameUser && event !== 'INITIAL_SESSION') return;

      stopRole?.();
      stopStatus?.();
      stopRole = undefined;
      stopStatus = undefined;
      const my = ++ticket;

      if (!user) {
        useProfileStore.getState().clearAccount();
        setStaffState(false, 'active');
        void resetUserWorkspace();
        return;
      }

      adoptIdentity(user.uid, restoreIdentity(user) || currentIdentity());

      stopRole = subscribeStaffAdmin(user.uid, (activeAdmin) => {
        setStaffState(activeAdmin, useAuthStore.getState().accountStatus);
      });
      stopStatus = subscribeAccountStatus(user.uid, (status) => {
        setStaffState(useAuthStore.getState().role === 'admin', status);
      });

      void (async () => {
        let accountStatus: 'active' | 'suspended' = 'active';
        try {
          const fromDb = await readOwnIdentity(user.uid);
          if (cancelled || my !== ticket) return;
          const identity =
            fromDb || restoreIdentity(user) || currentIdentity();
          adoptIdentity(user.uid, identity);
          if (identity) accountStatus = await upsertOwnUser(user, identity);
          try {
            await recordConsents('login');
          } catch {
            /* consent table may not be migrated yet */
          }
          const staffAdmin = await readStaffAdmin(user.uid);
          if (!cancelled && my === ticket) setStaffState(staffAdmin, accountStatus);
        } catch {
          if (!cancelled && my === ticket) setStaffState(false, accountStatus);
        }
        if (!cancelled && my === ticket) {
          await hydrateUserWorkspace();
          void hydratePublishedThemes();
          void evaluateOwnProgress();
        }
      })();
    });

    return () => {
      cancelled = true;
      stopAuth();
      stopRole?.();
      stopStatus?.();
    };
  }, [setFromUser, setStaffState]);

  return children;
}
