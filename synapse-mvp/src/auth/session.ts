export type AuthRole = 'user' | 'admin' | 'superadmin';

export const SUPERADMIN_EMAILS = ['dasrony231@gmail.com'] as const;

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providers: string[];
}

export function parseSuperadminEmails(
  raw: string | undefined,
  defaults: readonly string[] = SUPERADMIN_EMAILS
): string[] {
  const extra = String(raw || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...defaults.map((email) => email.toLowerCase()), ...extra])];
}

export function isVerifiedSuperadmin(
  user: SessionUser | null,
  emails: string[] = parseSuperadminEmails(undefined)
): boolean {
  if (!user?.email || !user.emailVerified) return false;
  return emails.includes(user.email.toLowerCase());
}

export function bootstrapRole(
  user: SessionUser | null,
  superadminEmails: string[]
): AuthRole {
  return isVerifiedSuperadmin(user, superadminEmails) ? 'superadmin' : 'user';
}

export function resolveAuthRole(
  user: SessionUser | null,
  superadminEmails: string[],
  staffAdmin: boolean
): AuthRole {
  if (isVerifiedSuperadmin(user, superadminEmails)) return 'superadmin';
  if (staffAdmin) return 'admin';
  return 'user';
}

export function usernameFromEmail(email: string): string {
  const local = email.split('@')[0] || '';
  return local
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20);
}

export function authErrorMessage(
  code: string,
  fallback = 'Could not sign in. Try again.'
): string {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked. Allow popups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Synapse sign-in yet.';
    case 'auth/account-exists-with-different-credential':
      return 'That email is already used with a different sign-in method.';
    case 'user_already_exists':
    case 'email_exists':
    case 'auth/email-already-in-use':
      return 'That email already has an account. Sign in instead.';
    case 'email_address_invalid':
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'invalid_credentials':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'weak_password':
    case 'auth/weak-password':
      return 'Use a password with at least 6 characters.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'email_not_confirmed':
      return 'Confirm your email before signing in.';
    case 'provider_disabled':
    case 'oauth_provider_not_supported':
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled.';
    default:
      return fallback;
  }
}
