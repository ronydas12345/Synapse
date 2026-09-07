import type { SynapseTheme } from './types';
import { luminance, withAlpha } from './color';
import { fontStack } from './fonts';

export function themeCssVars(theme: SynapseTheme): Record<string, string> {
  const c = theme.colors;
  const s = theme.style;
  const t = theme.typography;
  return {
    '--bg-void': c.workspaceBackground,
    '--bg-deep': c.workspaceSurface,
    '--bg-panel': c.panelBackground,
    '--bg-elevated': c.panelElevated,
    '--bg-hover': c.panelHover,
    '--border': withAlpha(c.border, 0.55),
    '--border-strong': withAlpha(c.borderStrong, 0.8),
    '--text': c.textPrimary,
    '--text-muted': c.textSecondary,
    '--text-faint': c.textFaint,
    '--accent': c.accent,
    '--accent-dim': withAlpha(c.accent, 0.15),
    '--accent-warm': c.accentWarm,
    '--accent-warm-dim': withAlpha(c.accentWarm, 0.14),
    '--danger': c.danger,
    '--ok': c.ok,
    '--warning': c.warning,
    '--font-ui': fontStack(t.ui, 'ui'),
    '--font-display': fontStack(t.display, 'display'),
    '--font-mono': fontStack(t.mono, 'mono'),
    '--font-node': fontStack(t.node, 'ui'),
    '--radius': `${s.radius}px`,
    '--radius-sm': `${s.radiusSm}px`,
    '--border-width': `${s.borderWidth}px`,
    '--node-bg': c.nodeBackground,
    '--node-border': c.nodeBorder,
    '--node-header': c.nodeHeader,
    '--node-track': c.nodeTrack,
    '--node-conditional': c.nodeConditional,
    '--node-randomizer': c.nodeRandomizer,
    '--node-transition': c.nodeTransition,
    '--node-comment': c.nodeComment,
    '--node-start': c.nodeStart,
    '--node-end': c.nodeEnd,
    '--edge-color': c.edge,
    '--player-bg': c.playerBackground,
    '--input-bg': c.inputBackground,
    '--grid-line': withAlpha(c.gridLine, s.gridIntensity * 4),
    '--shadow-panel': `0 1px 0 ${withAlpha(c.textPrimary, 0.04)} inset, 0 12px 40px ${withAlpha('#000000', s.shadowIntensity)}`,
    '--brand-from': luminance(c.workspaceBackground) > 0.55 ? c.textPrimary : '#ffffff',
  };
}

export function applyThemeToElement(
  el: HTMLElement,
  theme: SynapseTheme
): void {
  const vars = themeCssVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    el.style.setProperty(key, value);
  }
  const light = luminance(theme.colors.workspaceBackground) > 0.55;
  el.style.colorScheme = light ? 'light' : 'dark';
  el.dataset.themeScheme = light ? 'light' : 'dark';
}

export function applyTheme(theme: SynapseTheme): void {
  applyThemeToElement(document.documentElement, theme);
}
