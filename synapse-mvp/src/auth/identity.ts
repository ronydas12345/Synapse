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

export function firstFilled(
  ...values: Array<string | null | undefined>
): string {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return '';
}

export function firstCompleteIdentity(
  ...candidates: Array<
    | { username?: string | null; displayName?: string | null }
    | null
    | undefined
  >
): AccountIdentity | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const next = identityFromFields(
      String(candidate.username || ''),
      String(candidate.displayName || '')
    );
    if (next) return next;
  }
  return null;
}

const identities = new Map<string, AccountIdentity>();

export function readAccountCache(uid: string): AccountIdentity | null {
  const row = identities.get(uid);
  if (!row) return null;
  if (!isIdentityComplete(row.username, row.displayName)) return null;
  return {
    username: normalizeUsername(row.username),
    displayName: row.displayName.trim().slice(0, 40),
  };
}

export function writeAccountCache(uid: string, identity: AccountIdentity): void {
  identities.set(uid, {
    username: normalizeUsername(identity.username),
    displayName: identity.displayName.trim().slice(0, 40),
  });
}

export function clearAccountCache(uid?: string): void {
  if (uid) identities.delete(uid);
  else identities.clear();
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
