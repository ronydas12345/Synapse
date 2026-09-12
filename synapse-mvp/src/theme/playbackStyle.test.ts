import { describe, expect, it } from 'vitest';
import { STYLE_CUE_HOLD_MS, styleCueHoldMs } from './playbackStyle';

describe('styleCueHoldMs', () => {
  it('lets the next track start while a delayed cue is still waiting', () => {
    expect(styleCueHoldMs(600, false, 4000)).toBe(STYLE_CUE_HOLD_MS);
  });

  it('waits for delay plus transition when the style cue is last', () => {
    expect(styleCueHoldMs(600, true, 4000)).toBe(4600);
  });
});
