import { describe, expect, it } from 'vitest';
import { browserCaptureProfile } from './captureAudio';

describe('browserCaptureProfile', () => {
  it('returns a Chromium-style tab-audio hint by default in tests', () => {
    const profile = browserCaptureProfile();
    expect(profile).toHaveProperty('preferMic');
    expect(profile).toHaveProperty('label');
    expect(typeof profile.label).toBe('string');
  });
});
