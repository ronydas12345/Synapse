import { describe, expect, it } from 'vitest';
import { pickFirstUseTip } from './tips';

describe('first-use tips', () => {
  it('explains the selected node first', () => {
    const tip = pickFirstUseTip({
      selectedType: 'randomizer',
      nodeCount: 3,
      edgeCount: 0,
      dismissed: new Set(),
    });
    expect(tip?.id).toBe('randomizer');
  });

  it('falls back to a connect hint when nodes are unlinked', () => {
    const tip = pickFirstUseTip({
      selectedType: 'start',
      nodeCount: 2,
      edgeCount: 0,
      dismissed: new Set(['start']),
    });
    expect(tip?.id).toBe('connect');
  });

  it('stays quiet after dismissals', () => {
    expect(
      pickFirstUseTip({
        selectedType: 'track',
        nodeCount: 2,
        edgeCount: 0,
        dismissed: new Set(['track', 'connect']),
      })
    ).toBeNull();
  });
});
