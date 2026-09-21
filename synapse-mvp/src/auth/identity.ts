import {
  displayNameError,
  normalizeUsername,
  usernameError,
} from '../profile/profileStore';

export const ACCOUNT_CACHE_KEY = 'synapse_auth_accounts';

export interface AccountIdentity {
  username: string;
  displayName: string;
}

/** Throwaway email/password user for checking Auth. */
export const TEST_ACCOUNT = {
  email: 'tester@synapse.app',
  password: 'SynapseTest1',
  username: 'synapse_tester',
  displayName: 'Synapse Tester',
} as const;

export function isIdentityComplete(
  username: string,
  displayName: string
): boolean {
  return !usernameError(username) && !displayNameError(displayName);
}

export function identityFromFields(
  username: string,
  displayName: string
): AccountIdentity | null {
  const next: AccountIdentity = {
    username: normalizeUsername(username),
    displayName: displayName.trim().slice(0, 40),
  };
  if (!isIdentityComplete(next.username, next.displayName)) return null;
  return next;
}

function readAll(): Record<string, AccountIdentity> {
  try {
    const raw = localStorage.getItem(ACCOUNT_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, AccountIdentity>;
  } catch {
    return {};
  }
}

export function readAccountCache(uid: string): AccountIdentity | null {
  const row = readAll()[uid];
  if (!row) return null;
  if (!isIdentityComplete(row.username, row.displayName)) return null;
  return {
    username: normalizeUsername(row.username),
    displayName: row.displayName.trim().slice(0, 40),
  };
}

export function writeAccountCache(uid: string, identity: AccountIdentity): void {
  const next = { ...readAll(), [uid]: identity };
  try {
    localStorage.setItem(ACCOUNT_CACHE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function identityForEmail(email: string | null): AccountIdentity | null {
  if (!email) return null;
  if (email.toLowerCase() === TEST_ACCOUNT.email) {
    return {
      username: TEST_ACCOUNT.username,
      displayName: TEST_ACCOUNT.displayName,
    };
  }
  return null;
}
