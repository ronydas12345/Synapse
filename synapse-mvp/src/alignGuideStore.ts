import { useSyncExternalStore } from 'react';
import type { OverlayGuide } from './alignGuides';

type AlignOverlay = {
  shift: boolean;
  dragging: boolean;
  guides: OverlayGuide[];
};

let overlay: AlignOverlay = { shift: false, dragging: false, guides: [] };
const listeners = new Set<() => void>();
let keybound = false;

function emit() {
  for (const listener of listeners) listener();
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Shift') return;
  if (overlay.shift) return;
  overlay = { ...overlay, shift: true };
  emit();
}

function onKeyUp(event: KeyboardEvent) {
  if (event.key !== 'Shift') return;
  if (!overlay.shift) return;
  overlay = { ...overlay, shift: false };
  emit();
}

function onBlur() {
  if (!overlay.shift && !overlay.dragging) return;
  overlay = { ...overlay, shift: false };
  emit();
}

function bindKeys() {
  if (keybound || typeof window === 'undefined') return;
  keybound = true;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
}

export function getAlignOverlay(): AlignOverlay {
  return overlay;
}

export function subscribeAlignOverlay(listener: () => void): () => void {
  bindKeys();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAlignOverlay(next: Partial<AlignOverlay>) {
  overlay = { ...overlay, ...next };
  emit();
}

export function setAlignShift(shift: boolean) {
  if (overlay.shift === shift) return;
  overlay = { ...overlay, shift };
  emit();
}

export function useAlignOverlay(): AlignOverlay {
  return useSyncExternalStore(subscribeAlignOverlay, getAlignOverlay, getAlignOverlay);
}
