import { describe, expect, it } from 'vitest';
import { primaryCtaLabel } from './OpenWorkspaceLink';

describe('primary workspace CTA', () => {
  it('asks guests to get started', () => {
    expect(primaryCtaLabel(false)).toBe('Get Started');
  });

  it('opens the workspace for signed-in users', () => {
    expect(primaryCtaLabel(true)).toBe('Open Synapse');
  });
});
