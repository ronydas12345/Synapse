import { describe, expect, it } from 'vitest';
import { makeNode } from '../engine/graphFixtures';
import { ensurePortalNodeData } from './remap';

describe('ensurePortalNodeData', () => {
  it('keeps existing Portal IDs on save', () => {
    const nodes = [
      makeNode('p', 'portal', { portalId: 'P-KEEP12AB', name: 'Gate' }),
    ];
    const next = ensurePortalNodeData(nodes);
    expect(next[0].data?.portalId).toBe('P-KEEP12AB');
  });

  it('issues new IDs on paste/import', () => {
    const nodes = [
      makeNode('p', 'portal', { portalId: 'P-KEEP12AB' }),
    ];
    const next = ensurePortalNodeData(nodes, { reissue: true });
    expect(next[0].data?.portalId).not.toBe('P-KEEP12AB');
    expect(String(next[0].data?.portalId)).toMatch(/^P-[A-Z0-9]{8}$/);
  });
});
