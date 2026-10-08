import { describe, expect, it } from 'vitest';
import { collectPortalIds, generatePortalId, isPortalId, normalizePortalId } from './ids';

describe('portal ids', () => {
  it('normalizes and validates Portal IDs', () => {
    expect(normalizePortalId(' p-abc12xyz ')).toBe('P-ABC12XYZ');
    expect(isPortalId('P-ABC12XYZ')).toBe(true);
    expect(isPortalId('abc')).toBe(false);
    expect(isPortalId('P-TOOLONG01')).toBe(false);
  });

  it('generates unique ids', () => {
    const used = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const id = generatePortalId(used);
      expect(isPortalId(id)).toBe(true);
      expect(used.has(id)).toBe(false);
      used.add(id);
    }
  });

  it('collects ids from nodes', () => {
    const ids = collectPortalIds([
      { data: { portalId: 'P-ABC12XYZ' } },
      { data: { portalId: 'nope' } },
    ]);
    expect([...ids]).toEqual(['P-ABC12XYZ']);
  });
});
