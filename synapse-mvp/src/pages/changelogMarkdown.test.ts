import { describe, expect, it } from 'vitest';
import { parseChangelogBlocks, splitChangelogVersions } from './changelogMarkdown';

describe('changelog markdown', () => {
  it('splits versions and parses headings, lists, and paragraphs', () => {
    const raw = `# Changelog

## [1.0.0] — 2026-01-01

Intro line.

### Added

- First **item**
- Second with \`code\`

### Fixed

- A link [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
`;
    const versions = splitChangelogVersions(raw);
    expect(versions).toHaveLength(1);
    expect(versions[0].title).toBe('[1.0.0] — 2026-01-01');
    expect(parseChangelogBlocks(versions[0].body)).toEqual([
      { kind: 'p', text: 'Intro line.' },
      { kind: 'h3', text: 'Added' },
      { kind: 'ul', items: ['First **item**', 'Second with `code`'] },
      { kind: 'h3', text: 'Fixed' },
      {
        kind: 'ul',
        items: ['A link [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)'],
      },
    ]);
  });
});
