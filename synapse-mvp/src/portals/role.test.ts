import { describe, expect, it } from 'vitest';
import { makeEdge } from '../engine/graphFixtures';
import { portalConnectError } from './connect';
import { portalHandleEnabled, portalRole } from './role';
import { PORTAL_IN_HANDLE, PORTAL_OUT_HANDLE } from './types';
import { makeNode } from '../engine/graphFixtures';

describe('portal role XOR', () => {
  it('treats incoming as exit and outgoing as entry', () => {
    expect(portalRole('p', [makeEdge('t1', 'p', undefined)])).toBe('exit');
    expect(portalRole('p', [makeEdge('p', 't2')])).toBe('entry');
    expect(portalRole('p', [])).toBe('unset');
    expect(portalRole('p', [makeEdge('t1', 'p'), makeEdge('p', 't2')])).toBe('invalid');
  });

  it('disables the unused handle once one side is plugged', () => {
    expect(portalHandleEnabled('exit', PORTAL_OUT_HANDLE)).toBe(false);
    expect(portalHandleEnabled('exit', PORTAL_IN_HANDLE)).toBe(true);
    expect(portalHandleEnabled('entry', PORTAL_IN_HANDLE)).toBe(false);
    expect(portalHandleEnabled('entry', PORTAL_OUT_HANDLE)).toBe(true);
    expect(portalHandleEnabled('unset', PORTAL_IN_HANDLE)).toBe(true);
    expect(portalHandleEnabled('unset', PORTAL_OUT_HANDLE)).toBe(true);
  });

  it('rejects connecting the other side after one is plugged', () => {
    const portal = makeNode('p', 'portal', { portalId: 'P-AAA11BBB' });
    const track = makeNode('t1', 'track');
    const track2 = makeNode('t2', 'track');
    expect(
      portalConnectError(
        { source: 't2', target: 'p', targetHandle: PORTAL_IN_HANDLE },
        [portal, track, track2],
        [makeEdge('p', 't1')]
      )
    ).toMatch(/entry/i);
    expect(
      portalConnectError(
        { source: 'p', target: 't2', sourceHandle: PORTAL_OUT_HANDLE },
        [portal, track, track2],
        [makeEdge('t1', 'p')]
      )
    ).toMatch(/leaving/i);
  });
});
