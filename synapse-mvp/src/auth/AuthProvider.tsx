import { useEffect, type ReactNode } from 'react';
import { applyIdentityToProfile, subscribeAuth } from './client';
import { useAuthStore } from './authStore';
import {
  identityForEmail,
  isIdentityComplete,
  readAccountCache,
  writeAccountCache,
  type AccountIdentity,
} from './identity';
import { useProfileStore } from '../profile/profileStore';
import type { SessionUser } from './session';
import {
  hydratePublishedThemes,
  readStaffAdmin,
  subscribeAccountStatus,
  subscribeStaffAdmin,
  upsertOwnUser,
} from '../admin/syncAccount';
import { recordConsents } from '../admin/privacy';

function restoreIdentity(user: SessionUser): AccountIdentity | null {
  const cached = readAccountCache(user.uid);
  const fromEmail = identityForEmail(user.email);
  const identity: AccountIdentity | null = cached || fromEmail;
  if (identity) {
    writeAccountCache(user.uid, identity);
    applyIdentityToProfile(identity);
    return identity;
  }
  const { profile, setDisplayName } = useProfileStore.getState();
  if (!profile.displayName.trim() && user.displayName) {
    setDisplayName(user.displayName);
  }
  if (isIdentityComplete(profile.username, profile.displayName)) {
    return { username: profile.username, displayName: profile.displayName };
  }
  return null;
}

function currentIdentity(): AccountIdentity | null {
  const profile = useProfileStore.getState().profile;
  if (!isIdentityComplete(profile.username, profile.displayName)) return null;
  return { username: profile.username, displayName: profile.displayName };
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const setFromUser = useAuthStore((s) => s.setFromUser);
  const setStaffState = useAuthStore((s) => s.setStaffState);

  useEffect(() => {
    let stopRole: (() => void) | undefined;
    let stopStatus: (() => void) | undefined;
    let cancelled = false;

    const stopAuth = subscribeAuth((user) => {
      stopRole?.();
      stopStatus?.();
      stopRole = undefined;
      stopStatus = undefined;
      setFromUser(user);
      if (!user) {
        useProfileStore.getState().clearAccount();
        setStaffState(false, 'active');
        return;
      }

      const cached = readAccountCache(user.uid);
      useProfileStore.getState().adoptAccount(user.uid, cached?.username);
      const identity = restoreIdentity(user) || currentIdentity();

      void (async () => {
        let accountStatus: 'active' | 'suspended' = 'active';
        try {
          if (identity) accountStatus = await upsertOwnUser(user, identity);
          try {
            await recordConsents('login');
          } catch {
            /* consent table may not be migrated yet */
          }
          const staffAdmin = await readStaffAdmin(user.uid);
          if (!cancelled) setStaffState(staffAdmin, accountStatus);
          void hydratePublishedThemes();
        } catch {
          if (!cancelled) setStaffState(false, accountStatus);
        }
      })();

      stopRole = subscribeStaffAdmin(user.uid, (activeAdmin) => {
        setStaffState(activeAdmin, useAuthStore.getState().accountStatus);
      });
      stopStatus = subscribeAccountStatus(user.uid, (status) => {
        setStaffState(useAuthStore.getState().role === 'admin', status);
      });
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
