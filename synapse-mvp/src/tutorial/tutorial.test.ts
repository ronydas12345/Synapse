import { describe, expect, it } from 'vitest';
import { actionsMatch, tokenize } from './tutorialMatch';
import { searchHits, searchSections, TUTORIAL_SECTIONS } from './tutorialCatalog';
import { markSectionComplete, parseProgress, emptyProgress } from './tutorialStorage';
import { paddedRect, placeWindow, rectsClose } from './placement';

describe('tutorial engine', () => {
  it('parses stored progress and ignores junk', () => {
    expect(parseProgress(null)).toEqual(emptyProgress());
    const parsed = parseProgress({
      skipped: true,
      completedFull: false,
      completedSections: ['getting-started', 3, 'track-nodes'],
      lastSection: 'randomizer',
      lastStep: 2.7,
      dismissedWelcome: 1,
    });
    expect(parsed.skipped).toBe(true);
    expect(parsed.completedSections).toEqual(['getting-started', 'track-nodes']);
    expect(parsed.lastSection).toBe('randomizer');
    expect(parsed.lastStep).toBe(2);
    expect(parsed.dismissedWelcome).toBe(true);
  });

  it('marks a section complete once', () => {
    const once = markSectionComplete(emptyProgress(), 'building');
    const twice = markSectionComplete(once, 'building');
    expect(twice.completedSections).toEqual(['building']);
  });

  it('matches expected tutorial actions', () => {
    expect(
      actionsMatch(
        { type: 'node-created', nodeType: 'track' },
        { type: 'node-created', nodeType: 'track' }
      )
    ).toBe(true);
    expect(
      actionsMatch(
        { type: 'node-created', nodeType: 'track' },
        { type: 'node-created', nodeType: 'comment' }
      )
    ).toBe(false);
    expect(
      actionsMatch({ type: 'node-selected', nodeType: 'track' }, { type: 'node-selected' })
    ).toBe(false);
    expect(
      actionsMatch({ type: 'node-selected' }, { type: 'node-selected', nodeType: 'track' })
    ).toBe(true);
    expect(actionsMatch({ type: 'playing' }, { type: 'playing' })).toBe(true);
    expect(actionsMatch({ type: 'playing' }, { type: 'paused' })).toBe(false);
  });

  it('searches sections by keyword', () => {
    expect(tokenize('random')).toEqual(['random']);
    const hits = searchHits('random');
    expect(hits.some((h) => h.section.id === 'randomizer')).toBe(true);
    expect(hits.some((h) => /weighted random/i.test(h.label) || /randomizer/i.test(h.label))).toBe(
      true
    );
    const weather = searchSections('weather');
    expect(weather.some((s) => s.id === 'conditionals')).toBe(true);
    const align = searchSections('center line');
    expect(align.some((s) => s.id === 'align-guides')).toBe(true);
    expect(TUTORIAL_SECTIONS.some((s) => s.steps.some((st) => st.id === 'ag-center'))).toBe(true);
    expect(TUTORIAL_SECTIONS.some((s) => s.steps.some((st) => st.id === 'st-arrows'))).toBe(true);
    expect(TUTORIAL_SECTIONS.some((s) => s.steps.some((st) => st.id === 'st-viz-bars'))).toBe(true);
  });

  it('has a data-driven catalog with unique step ids', () => {
    const ids = TUTORIAL_SECTIONS.flatMap((s) => s.steps.map((st) => st.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(TUTORIAL_SECTIONS.length).toBeGreaterThanOrEqual(14);
  });
});

describe('tutorial spotlight placement', () => {
  it('treats tiny rect jitter as the same box', () => {
    const a = { left: 10, top: 20, width: 100, height: 40 };
    expect(rectsClose(a, { ...a, left: 10.2 })).toBe(true);
    expect(rectsClose(a, { ...a, left: 12 })).toBe(false);
    expect(rectsClose(a, null)).toBe(false);
    expect(rectsClose(null, null)).toBe(true);
  });

  it('pads the spotlight and keeps the window on screen', () => {
    const padded = paddedRect({ left: 40, top: 80, width: 120, height: 50 });
    expect(padded).toEqual({ left: 32, top: 72, width: 136, height: 66 });
    const pos = placeWindow(padded, 1280, 800, false);
    expect(pos.sheet).toBe(false);
    expect(pos.left).toBeGreaterThan(padded.left);
    expect(pos.top).toBeGreaterThanOrEqual(12);
  });
});
