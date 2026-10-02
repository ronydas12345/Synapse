import { describe, expect, it } from 'vitest';
import { profileIdentity } from './identity';

describe('profileIdentity', () => {
  it('shows a username once when it matches the display name', () => {
    expect(profileIdentity('rony', 'rony')).toEqual({ title: 'rony', handle: '' });
  });

  it('keeps a distinct display name and one handle', () => {
    expect(profileIdentity('Rony Das', 'rony')).toEqual({
      title: 'Rony Das',
      handle: '@rony',
    });
  });
});
