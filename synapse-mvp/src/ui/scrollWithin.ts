import { documentPrefersReducedMotion } from '../settings/motion';

/** Scroll `el` inside the nearest matching pane, clearing sticky chrome. */
export function scrollWithin(
  el: HTMLElement | null,
  paneSelector: string,
  stickySelector?: string
): void {
  if (!el) return;
  const pane = el.closest(paneSelector) as HTMLElement | null;
  const behavior = documentPrefersReducedMotion() ? 'auto' : 'smooth';
  if (!pane) {
    el.scrollIntoView({ block: 'start', behavior });
    return;
  }
  const sticky = stickySelector
    ? (pane.querySelector(stickySelector) as HTMLElement | null)
    : null;
  const offset = (sticky?.getBoundingClientRect().height ?? 0) + 8;
  const top =
    el.getBoundingClientRect().top -
    pane.getBoundingClientRect().top +
    pane.scrollTop -
    offset;
  pane.scrollTo({ top: Math.max(0, top), behavior });
}
