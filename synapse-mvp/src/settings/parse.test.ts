import { describe, expect, it } from 'vitest';
import {
  defaultSettings,
  parseSettings,
  parseSettingsJson,
  scaleVolume,
  settingsToJson,
  workspaceStartRoute,
} from './parse';
import { resolveReducedMotion } from './motion';

describe('app settings schema', () => {
  it('fills defaults and clamps junk', () => {
    const parsed = parseSettings({
      type: 'synapse-settings',
      general: { language: 'fr', motion: 'explode', confirmDestructive: 0 },
      canvas: { gridSize: 19, snapToGrid: 'yes' },
      nodes: { defaultVolume: 140, defaultPlayCount: 0 },
      playback: { masterVolume: -4 },
      visualizer: { visible: 0 },
    });
    expect(parsed.general.language).toBe('en');
    expect(parsed.general.motion).toBe('system');
    expect(parsed.general.confirmDestructive).toBe(false);
    expect(parsed.canvas.gridSize).toBe(16);
    expect(parsed.canvas.snapToGrid).toBe(true);
    expect(parsed.nodes.defaultVolume).toBe(100);
    expect(parsed.nodes.defaultPlayCount).toBe(1);
    expect(parsed.playback.masterVolume).toBe(0);
    expect(parsed.visualizer.visible).toBe(false);
  });

  it('rejects non-settings JSON', () => {
    expect(parseSettingsJson('{')).toBeNull();
    expect(parseSettingsJson(JSON.stringify({ type: 'synapse-theme' }))).toBeNull();
    const ok = parseSettingsJson(settingsToJson(defaultSettings()));
    expect(ok?.type).toBe('synapse-settings');
    expect(ok?.canvas.showMinimap).toBe(true);
  });

  it('scales node volume by master volume', () => {
    expect(scaleVolume(80, 50)).toBe(40);
    expect(scaleVolume(100, 100)).toBe(100);
    expect(scaleVolume('nope', 50)).toBe(50);
  });

  it('picks the remembered workspace when enabled', () => {
    const settings = defaultSettings();
    settings.general.startupWorkspace = 'edit';
    settings.general.lastWorkspace = 'listen';
    settings.general.rememberLastWorkspace = true;
    expect(workspaceStartRoute(settings)).toBe('listen');
    settings.general.rememberLastWorkspace = false;
    expect(workspaceStartRoute(settings)).toBe('edit');
  });

  it('resolves motion preference against the OS', () => {
    expect(resolveReducedMotion('reduce', false)).toBe(true);
    expect(resolveReducedMotion('full', true)).toBe(false);
    expect(resolveReducedMotion('system', true)).toBe(true);
    expect(resolveReducedMotion('system', false)).toBe(false);
  });
});
