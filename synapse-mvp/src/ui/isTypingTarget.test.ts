import { describe, expect, it } from 'vitest';
import { isTypingTarget } from './isTypingTarget';

function field(tagName: string, isContentEditable = false): EventTarget {
  return { tagName, isContentEditable } as unknown as EventTarget;
}

describe('isTypingTarget', () => {
  it('treats form fields as typing targets', () => {
    expect(isTypingTarget(field('INPUT'))).toBe(true);
    expect(isTypingTarget(field('textarea'))).toBe(true);
    expect(isTypingTarget(field('SELECT'))).toBe(true);
    expect(isTypingTarget(field('DIV', true))).toBe(true);
  });

  it('ignores ordinary buttons', () => {
    expect(isTypingTarget(field('BUTTON'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
