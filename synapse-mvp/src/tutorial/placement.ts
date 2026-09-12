export interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const PAD = 8;
const WIN_W = 360;
const WIN_H = 280;
const GAP = 14;

export function queryTutorialTarget(id: string | undefined): HTMLElement | null {
  if (!id || typeof document === 'undefined') return null;
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tutorial="${id}"]`);
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (r.width >= 2 && r.height >= 2) return el;
  }
  return nodes[0] ?? null;
}

export function rectFromElement(el: HTMLElement): SpotlightRect | null {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

export function measureTarget(id: string | undefined): SpotlightRect | null {
  const el = queryTutorialTarget(id);
  return el ? rectFromElement(el) : null;
}

export function scrollTutorialTargetIntoView(id: string | undefined): void {
  const el = queryTutorialTarget(id);
  el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

export function rectsClose(
  a: SpotlightRect | null,
  b: SpotlightRect | null,
  eps = 0.5
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.left - b.left) < eps &&
    Math.abs(a.top - b.top) < eps &&
    Math.abs(a.width - b.width) < eps &&
    Math.abs(a.height - b.height) < eps
  );
}

/** Follow a `data-tutorial` target through pan, zoom, drag, and layout. */
export function watchTutorialTarget(
  id: string | undefined,
  onRect: (rect: SpotlightRect | null) => void
): () => void {
  if (typeof window === 'undefined') {
    onRect(null);
    return () => undefined;
  }

  let el: HTMLElement | null = queryTutorialTarget(id);
  let last: SpotlightRect | null = null;
  let raf = 0;

  const resolveEl = (): HTMLElement | null => {
    if (el?.isConnected && id && el.getAttribute('data-tutorial') === id) return el;
    el = queryTutorialTarget(id);
    return el;
  };

  const emit = () => {
    const node = resolveEl();
    const next = node ? rectFromElement(node) : null;
    if (rectsClose(last, next)) return;
    last = next;
    onRect(next);
  };

  emit();
  const tick = () => {
    emit();
    raf = window.requestAnimationFrame(tick);
  };
  raf = window.requestAnimationFrame(tick);

  window.addEventListener('resize', emit);
  window.addEventListener('scroll', emit, true);
  window.visualViewport?.addEventListener('resize', emit);
  window.visualViewport?.addEventListener('scroll', emit);

  return () => {
    window.cancelAnimationFrame(raf);
    window.removeEventListener('resize', emit);
    window.removeEventListener('scroll', emit, true);
    window.visualViewport?.removeEventListener('resize', emit);
    window.visualViewport?.removeEventListener('scroll', emit);
  };
}

export function paddedRect(rect: SpotlightRect): SpotlightRect {
  return {
    left: rect.left - PAD,
    top: rect.top - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
}

export function placeWindow(
  target: SpotlightRect | null,
  vw: number,
  vh: number,
  mobile: boolean
): { left: number; top: number; sheet: boolean } {
  if (mobile) {
    return { left: 12, top: vh, sheet: true };
  }
  const ww = Math.min(WIN_W, vw - 24);
  const wh = WIN_H;
  if (!target) {
    return {
      left: Math.max(12, (vw - ww) / 2),
      top: Math.max(12, (vh - wh) / 2),
      sheet: false,
    };
  }
  const right = target.left + target.width + GAP;
  const leftOf = target.left - ww - GAP;
  let left = right;
  if (right + ww > vw - 12 && leftOf >= 12) left = leftOf;
  left = Math.min(Math.max(12, left), Math.max(12, vw - ww - 12));

  let top = target.top;
  if (top + wh > vh - 12) top = vh - wh - 12;
  if (top < 12) top = 12;
  return { left, top, sheet: false };
}
