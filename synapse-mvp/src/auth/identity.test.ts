import { describe, expect, it } from 'vitest';
import {
  identityFromFields,
  isIdentityComplete,
  identityForEmail,
  TEST_ACCOUNT,
} from './identity';

describe('account identity', () => {
  it('requires username and display name', () => {
    expect(isIdentityComplete('', '')).toBe(false);
    expect(isIdentityComplete('ab', 'Ada')).toBe(false);
    expect(isIdentityComplete('ada_lovelace', '')).toBe(false);
    expect(isIdentityComplete('ada_lovelace', 'Ada Lovelace')).toBe(true);
  });

  it('normalizes a valid identity from form fields', () => {
    expect(identityFromFields(' @Ada_Lovelace ', '  Ada  ')).toEqual({
      username: 'ada_lovelace',
      displayName: 'Ada',
    });
    expect(identityFromFields('no', 'Ada')).toBeNull();
  });

  it('maps the test account by email', () => {
    expect(identityForEmail(TEST_ACCOUNT.email)?.username).toBe(
      'synapse_tester'
    );
    expect(identityForEmail('other@example.com')).toBeNull();
  });
});
