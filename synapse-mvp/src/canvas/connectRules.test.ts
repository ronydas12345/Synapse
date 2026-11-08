import { describe, expect, it } from 'vitest';
import { connectionBlockReason } from './connectRules';

describe('connection rules', () => {
  it('blocks comments on the play path', () => {
    expect(
      connectionBlockReason({
        sourceId: 'c1',
        targetId: 't1',
        sourceType: 'comment',
        targetType: 'track',
        edges: [],
      })
    ).toBe('Comment nodes cannot be part of the play path.');
  });

  it('blocks a second outgoing line from Start', () => {
    expect(
      connectionBlockReason({
        sourceId: 's',
        targetId: 't2',
        sourceType: 'start',
        targetType: 'track',
        edges: [{ id: 'e1', source: 's', target: 't1' }],
      })
    ).toMatch(/Start already has an outgoing connection/);
  });

  it('allows a second incoming line into a Track', () => {
    expect(
      connectionBlockReason({
        sourceId: 's',
        targetId: 't1',
        sourceType: 'start',
        targetType: 'track',
        edges: [{ id: 'e1', source: 'x', target: 't1' }],
      })
    ).toBeNull();
  });

  it('blocks a second incoming line into Start', () => {
    expect(
      connectionBlockReason({
        sourceId: 't1',
        targetId: 's',
        sourceType: 'track',
        targetType: 'start',
        edges: [{ id: 'e1', source: 't0', target: 's' }],
      })
    ).toMatch(/Start already has an incoming connection/);
  });
});
