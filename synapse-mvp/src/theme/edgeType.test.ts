import { describe, expect, it } from 'vitest';
import {
  getTriangularPath,
  previewEdgePath,
  sanitizeEdgeType,
  toReactFlowEdgeType,
} from './edgeType';
import { BUILTIN_THEMES } from './presets';
import { THEME_EDGE_TYPES } from './types';

describe('theme edge types', () => {
  it('accepts known types and falls back otherwise', () => {
    expect(sanitizeEdgeType('triangular')).toBe('triangular');
    expect(sanitizeEdgeType('nope')).toBe('bezier');
    expect(sanitizeEdgeType(12, 'straight')).toBe('straight');
  });

  it('maps theme types onto React Flow edge types', () => {
    expect(toReactFlowEdgeType('bezier')).toBe('default');
    expect(toReactFlowEdgeType('simpleBezier')).toBe('simplebezier');
    expect(toReactFlowEdgeType('straight')).toBe('straight');
    expect(toReactFlowEdgeType('rectangular')).toBe('step');
    expect(toReactFlowEdgeType('rounded')).toBe('smoothstep');
    expect(toReactFlowEdgeType('triangular')).toBe('triangular');
  });

  it('builds a straight-45-straight path between right and left handles', () => {
    const { path } = getTriangularPath({
      sourceX: 0,
      sourceY: 0,
      targetX: 200,
      targetY: 80,
      sourcePosition: 'right',
      targetPosition: 'left',
      stub: 20,
    });
    expect(path.startsWith('M 0 0')).toBe(true);
    expect(path.includes('L 200 80')).toBe(true);
    const { path: preview } = getTriangularPath({
      sourceX: 20,
      sourceY: 0,
      targetX: 180,
      targetY: 80,
      sourcePosition: 'right',
      targetPosition: 'left',
      stub: 0,
    });
    expect(preview).toContain('L');
  });

  it('emits a 45-degree middle segment when height differs', () => {
    const { path } = getTriangularPath({
      sourceX: 0,
      sourceY: 0,
      targetX: 200,
      targetY: 80,
      sourcePosition: 'right',
      targetPosition: 'left',
      stub: 20,
    });
    expect(path).toContain('L 100 0');
    expect(path).toContain('L 180 80');
  });

  it('draws a preview path for every type', () => {
    for (const type of THEME_EDGE_TYPES) {
      expect(previewEdgePath(type).startsWith('M ')).toBe(true);
    }
  });

  it('gives each builtin theme a known arrow type that matches its vibe', () => {
    const byId = Object.fromEntries(BUILTIN_THEMES.map((t) => [t.id, t.style.edgeType]));
    expect(byId['standard-dark']).toBe('bezier');
    expect(byId['cyberpunk']).toBe('triangular');
    expect(byId['monochrome']).toBe('rectangular');
    expect(byId['midnight']).toBe('straight');
    expect(byId['warm-cream']).toBe('rounded');
    expect(byId['pretty-pink']).toBe('simpleBezier');
    for (const theme of BUILTIN_THEMES) {
      expect(THEME_EDGE_TYPES).toContain(theme.style.edgeType);
    }
  });
});
