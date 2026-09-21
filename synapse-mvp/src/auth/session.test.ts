import { describe, expect, it } from 'vitest';
import {
  authErrorMessage,
  bootstrapRole,
  parseSuperadminEmails,
  resolveAuthRole,
  usernameFromEmail,
  type SessionUser,
} from './session';

function user(partial: Partial<SessionUser> = {}): SessionUser {
  return {
    uid: 'uid-1',
    email: 'dasrony231@gmail.com',
    displayName: 'Rony',
    photoURL: null,
    emailVerified: true,
    providers: ['google.com'],
    ...partial,
  };
}

describe('auth session helpers', () => {
  it('treats the owner as superadmin only when email is verified', () => {
    const emails = parseSuperadminEmails(undefined);
    expect(bootstrapRole(user(), emails)).toBe('superadmin');
    expect(bootstrapRole(user({ emailVerified: false }), emails)).toBe('user');
    expect(bootstrapRole(user({ email: 'someone@example.com' }), emails)).toBe(
      'user'
    );
    expect(bootstrapRole(null, emails)).toBe('user');
  });

  it('does not let a staff admin override a verified superadmin', () => {
    const emails = parseSuperadminEmails(undefined);
    expect(resolveAuthRole(user(), emails, true)).toBe('superadmin');
    expect(
      resolveAuthRole(user({ email: 'editor@example.com' }), emails, true)
    ).toBe('admin');
    expect(
      resolveAuthRole(user({ email: 'editor@example.com' }), emails, false)
    ).toBe('user');
  });

  it('merges extra superadmin emails from env', () => {
    const emails = parseSuperadminEmails(
      ' Owner@example.com ,dasrony231@gmail.com'
    );
    expect(emails).toEqual(['dasrony231@gmail.com', 'owner@example.com']);
    expect(
      bootstrapRole(user({ email: 'owner@example.com' }), emails)
    ).toBe('superadmin');
  });

  it('builds a username from the email local part', () => {
    expect(usernameFromEmail('Ada.Lovelace+dev@example.com')).toBe(
      'ada_lovelace_dev'
    );
    expect(usernameFromEmail('ab@x.com')).toBe('ab');
  });

  it('maps common auth errors to short copy', () => {
    expect(authErrorMessage('auth/popup-closed-by-user')).toMatch(/cancelled/i);
    expect(authErrorMessage('auth/unauthorized-domain')).toMatch(/authorized/i);
    expect(authErrorMessage('invalid_credentials')).toMatch(/incorrect/i);
    expect(authErrorMessage('email_not_confirmed')).toMatch(/confirm/i);
    expect(authErrorMessage('auth/mystery')).toMatch(/try again/i);
  });
});
