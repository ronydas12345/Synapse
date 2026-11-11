import { describe, expect, it } from 'vitest';
import {
  nextValueBeat,
  PLAY_D,
  VALUE_BEAT_MS,
  VALUE_BEATS,
} from './ValuePathDemo';
import { BY_ID, fromTx, grabPoint, sampleDemo } from './valueDemoTimeline';

describe('homepage value carousel', () => {
  it('advances build → branch → play → build', () => {
    expect(nextValueBeat('build')).toBe('branch');
    expect(nextValueBeat('branch')).toBe('play');
    expect(nextValueBeat('play')).toBe('build');
  });

  it('keeps each motion beat long enough for the staged animation', () => {
    for (const beat of VALUE_BEATS) {
      expect(VALUE_BEAT_MS[beat]).toBeGreaterThan(2500);
    }
    expect(VALUE_BEAT_MS.branch).toBeGreaterThan(VALUE_BEAT_MS.build);
    expect(VALUE_BEAT_MS.play).toBeGreaterThan(VALUE_BEAT_MS.build);
  });

  it('sends the play marker through End on the right', () => {
    expect(PLAY_D).toContain('L844');
    expect(PLAY_D.startsWith('M144 208')).toBe(true);
  });

  it('drags Start, Track, and If from the left, then the rest after a pause', () => {
    const early = sampleDemo('build', 400, true);
    expect(early.node.start.opacity).toBe(1);
    expect(early.node.start.tx).toBeLessThan(0);
    expect(early.node.start.tx).toBeGreaterThan(fromTx(BY_ID.start));
    expect(early.node.trackA.opacity).toBe(0);
    expect(early.edgeOn['start-track']).toBe(false);

    const grab = grabPoint(BY_ID.start, early.node.start.tx, early.node.start.ty);
    expect(Math.abs(early.cursor.x - grab.x)).toBeLessThan(1);
    expect(Math.abs(early.cursor.y - grab.y)).toBeLessThan(1);
    expect(early.cursor.opacity).toBe(1);

    const pause = sampleDemo('build', 3400, true);
    expect(pause.node.start.tx).toBe(0);
    expect(pause.node.trackA.tx).toBe(0);
    expect(pause.node.iff.tx).toBe(0);
    expect(pause.node.iff.opacity).toBe(1);
    expect(pause.node.trackB.opacity).toBe(0);
    expect(pause.node.end.opacity).toBe(0);

    const late = sampleDemo('build', 7200, true);
    expect(late.node.end.tx).toBe(0);
    expect(late.node.end.opacity).toBe(1);
    expect(Object.values(late.edgeOn).every((on) => !on)).toBe(true);
  });

  it('draws connections under the cursor, then flashes play', () => {
    const drawing = sampleDemo('branch', 450, true);
    expect(drawing.rubber).toBeTruthy();
    expect(drawing.cursor.opacity).toBe(1);
    expect(drawing.edgeOn['start-track']).toBe(false);

    const wired = sampleDemo('branch', 7600, true);
    expect(Object.values(wired.edgeOn).every(Boolean)).toBe(true);

    const burst = sampleDemo('branch', 8200, true);
    expect(burst.playBurst).toBeGreaterThan(0.4);

    const after = sampleDemo('branch', 9100, true);
    expect(after.playBurst).toBeLessThan(0.2);
  });

  it('walks the playhead along the path, then box-selects and clears', () => {
    const start = sampleDemo('play', 200, true);
    expect(start.playhead).toBeTruthy();
    expect(start.playhead!.x).toBeLessThan(200);

    const mid = sampleDemo('play', 1800, true);
    expect(mid.playhead).toBeTruthy();
    expect(mid.playhead!.x).toBeGreaterThan(start.playhead!.x);
    expect(mid.playhead!.x).toBeLessThan(700);

    const end = sampleDemo('play', 6300, true);
    expect(end.playhead).toBeTruthy();
    expect(end.playhead!.x).toBeGreaterThan(790);

    const select = sampleDemo('play', 7200, true);
    expect(select.marquee).toBeTruthy();
    expect(select.marquee!.w).toBeGreaterThan(100);
    expect(select.cursor.opacity).toBe(1);

    const gone = sampleDemo('play', 8200, true);
    expect(gone.graphOpacity).toBe(0);
  });
});
