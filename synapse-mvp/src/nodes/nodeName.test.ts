import { describe, expect, it } from 'vitest';
import { nodeCustomName, nodeDisplayName, nodeTypeLabel } from './nodeName';

describe('node names', () => {
  it('reads a trimmed custom name', () => {
    expect(nodeCustomName({ name: '  travel  ' })).toBe('travel');
    expect(nodeCustomName({ name: '' })).toBe('');
    expect(nodeCustomName({})).toBe('');
  });

  it('labels sequence vs randomizer from mode', () => {
    expect(nodeTypeLabel('randomizer', { mode: 'sequence' })).toBe('Sequence');
    expect(nodeTypeLabel('randomizer', { mode: 'randomizer' })).toBe('Randomizer');
  });

  it('prefers a custom name over the type label', () => {
    expect(nodeDisplayName('randomizer', { mode: 'sequence', name: 'childhood' })).toBe(
      'childhood'
    );
    expect(nodeDisplayName('conditional', { name: 'techno' })).toBe('techno');
    expect(nodeDisplayName('start', {})).toBe('Start');
  });

  it('uses song title for tracks instead of a custom node name', () => {
    expect(
      nodeDisplayName('track', { name: 'travel', songTitle: 'Bohemian Rhapsody' })
    ).toBe('Bohemian Rhapsody');
  });
});
