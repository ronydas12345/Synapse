import type { SynapseTheme, ThemeEdgeType } from './types';
import { luminance, withAlpha } from './color';
import { sanitizeEdgeType } from './edgeType';
import { fontStack } from './fonts';
import { sanitizeVisualizerBarCount } from './visualizerBars';

export const LOGO_INK_LIGHT = '#111111';
export const LOGO_INK_DARK = '#c5cad3';

let appliedEdgeType: ThemeEdgeType = 'bezier';
let appliedVisualizerBarCount = 28;
const appliedListeners = new Set<() => void>();

export function getAppliedEdgeType(): ThemeEdgeType {
  return appliedEdgeType;
}

export function getAppliedVisualizerBarCount(): number {
  return appliedVisualizerBarCount;
}

export function subscribeAppliedTheme(listener: () => void): () => void {
  appliedListeners.add(listener);
  return () => appliedListeners.delete(listener);
}

export function isLightTheme(theme: SynapseTheme): boolean {
  return luminance(theme.colors.workspaceBackground) > 0.55;
}

export function logoInk(theme: SynapseTheme): string {
  return isLightTheme(theme) ? LOGO_INK_LIGHT : LOGO_INK_DARK;
}

export function themeCssVars(theme: SynapseTheme): Record<string, string> {
  const c = theme.colors;
  const s = theme.style;
  const t = theme.typography;
  const light = isLightTheme(theme);
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
    '--node-style': c.nodeStyle,
    '--node-comment': c.nodeComment,
    '--node-start': c.nodeStart,
    '--node-end': c.nodeEnd,
    '--edge-color': c.edge,
    '--player-bg': c.playerBackground,
    '--input-bg': c.inputBackground,
    '--grid-line': withAlpha(c.gridLine, s.gridIntensity * 4),
    '--shadow-panel': `0 1px 0 ${withAlpha(c.textPrimary, 0.04)} inset, 0 12px 40px ${withAlpha('#000000', s.shadowIntensity)}`,
    '--brand-from': light ? c.textPrimary : '#ffffff',
    '--logo-ink': logoInk(theme),
    '--edge-type': s.edgeType ?? 'bezier',
    '--visualizer-bars': String(
      sanitizeVisualizerBarCount(s.visualizerBarCount)
    ),
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
  const light = isLightTheme(theme);
  el.style.colorScheme = light ? 'light' : 'dark';
  el.dataset.themeScheme = light ? 'light' : 'dark';
}

export function applyTheme(theme: SynapseTheme): void {
  applyThemeToElement(document.documentElement, theme);
  appliedEdgeType = sanitizeEdgeType(theme.style?.edgeType);
  appliedVisualizerBarCount = sanitizeVisualizerBarCount(
    theme.style?.visualizerBarCount
  );
  document.documentElement.dataset.edgeType = appliedEdgeType;
  document.documentElement.dataset.visualizerBars = String(appliedVisualizerBarCount);
  for (const listener of appliedListeners) listener();
}
