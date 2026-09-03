export type ViewportTransform = { x: number; y: number; zoom: number };
export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
export type GraphRect = { x: number; y: number; width: number; height: number };

export function viewportCenterInGraph(
  viewport: ViewportTransform,
  size: Size
): Point {
  const zoom = viewport.zoom || 1;
  return {
    x: (-viewport.x + size.width / 2) / zoom,
    y: (-viewport.y + size.height / 2) / zoom,
  };
}

export function viewportBoundsInGraph(
  viewport: ViewportTransform,
  size: Size
): GraphRect {
  const zoom = viewport.zoom || 1;
  return {
    x: -viewport.x / zoom,
    y: -viewport.y / zoom,
    width: size.width / zoom,
    height: size.height / zoom,
  };
}

export function isRectInViewport(
  rect: GraphRect,
  viewport: ViewportTransform,
  size: Size
): boolean {
  const view = viewportBoundsInGraph(viewport, size);
  return (
    rect.x + rect.width > view.x &&
    rect.x < view.x + view.width &&
    rect.y + rect.height > view.y &&
    rect.y < view.y + view.height
  );
}

export function isStartInViewport(
  rect: GraphRect,
  viewport: ViewportTransform,
  size: Size
): boolean {
  return isRectInViewport(rect, viewport, size);
}

export function arrowAngleRad(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function pickClosestStart<T extends { center: Point }>(
  starts: T[],
  origin: Point
): T | null {
  if (starts.length === 0) return null;
  let best = starts[0];
  let bestDist =
    (best.center.x - origin.x) ** 2 + (best.center.y - origin.y) ** 2;
  for (let i = 1; i < starts.length; i++) {
    const s = starts[i];
    const d = (s.center.x - origin.x) ** 2 + (s.center.y - origin.y) ** 2;
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}

export interface StartArrowTarget {
  id: string;
  rect: GraphRect;
}

export interface StartArrowState {
  visible: boolean;
  angleRad: number;
  targetId: string | null;
}

/**
 * If any Start is visible, hide the arrow. Otherwise point at the closest
 * off-screen Start from the viewport center (graph coordinates).
 */
export function startArrowState(
  starts: StartArrowTarget[],
  viewport: ViewportTransform,
  size: Size
): StartArrowState {
  if (starts.length === 0 || size.width <= 0 || size.height <= 0) {
    return { visible: false, angleRad: 0, targetId: null };
  }
  if (starts.some((s) => isStartInViewport(s.rect, viewport, size))) {
    return { visible: false, angleRad: 0, targetId: null };
  }
  const origin = viewportCenterInGraph(viewport, size);
  const withCenter = starts.map((s) => ({
    id: s.id,
    center: {
      x: s.rect.x + s.rect.width / 2,
      y: s.rect.y + s.rect.height / 2,
    },
  }));
  const closest = pickClosestStart(withCenter, origin);
  if (!closest) {
    return { visible: false, angleRad: 0, targetId: null };
  }
  return {
    visible: true,
    angleRad: arrowAngleRad(origin, closest.center),
    targetId: closest.id,
  };
}
