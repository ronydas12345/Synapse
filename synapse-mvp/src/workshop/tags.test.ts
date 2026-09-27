import { describe, expect, it } from 'vitest';
import {
  MAX_WORKSHOP_TAGS,
  PLAYLIST_TAGS,
  THEME_TAGS,
  WORKSHOP_TAGS,
  browseTagCatalog,
  catalogCategories,
  filterTagCatalog,
  groupTags,
  sanitizeTagIds,
  tagDef,
  tagIdsMatchingQuery,
  tagsInCategory,
} from './tags';

describe('workshop tags', () => {
  it('ships separate curated catalogs with hundreds of options', () => {
    expect(PLAYLIST_TAGS.length).toBeGreaterThan(200);
    expect(THEME_TAGS.length).toBeGreaterThan(150);
    expect(WORKSHOP_TAGS.length).toBe(PLAYLIST_TAGS.length + THEME_TAGS.length);
    const keys = WORKSHOP_TAGS.map((tag) => `${tag.kind}:${tag.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps playlist and theme vocabularies independent', () => {
    expect(tagDef('playlist', 'anime')?.label).toBe('Anime');
    expect(tagDef('theme', 'anime')?.label).toBe('Anime');
    expect(tagDef('playlist', 'cyberpunk')).toBeUndefined();
    expect(tagDef('theme', 'cyberpunk')?.category).toBe('style');
    expect(tagDef('playlist', 'workout')?.category).toBe('activity');
    expect(tagDef('theme', 'workout')).toBeUndefined();
  });

  it('rejects unknown and extra tags', () => {
    expect(
      sanitizeTagIds('playlist', ['chill', 'CHILL', 'made-up', 'focus', 12, '', 'lo-fi'])
    ).toEqual(['chill', 'focus', 'lo-fi']);
    const many = PLAYLIST_TAGS.slice(0, MAX_WORKSHOP_TAGS + 4).map((tag) => tag.id);
    expect(sanitizeTagIds('playlist', many)).toHaveLength(MAX_WORKSHOP_TAGS);
  });

  it('filters the catalog instead of dumping every tag', () => {
    const hits = filterTagCatalog('playlist', 'lo-fi');
    expect(hits.some((tag) => tag.id === 'lo-fi')).toBe(true);
    expect(hits.length).toBeLessThan(PLAYLIST_TAGS.length);
    expect(tagIdsMatchingQuery('theme', 'ocean')).toContain('ocean');
    expect(groupTags(hits).every((group) => group.tags.length > 0)).toBe(true);
    expect(browseTagCatalog('playlist', '', '')).toEqual([]);
    expect(catalogCategories('playlist').some((row) => row.category === 'genre')).toBe(
      true
    );
    const genre = tagsInCategory('playlist', 'genre');
    expect(genre.length).toBeGreaterThan(20);
    expect(genre.length).toBeLessThan(PLAYLIST_TAGS.length);
    expect(browseTagCatalog('theme', '', 'palette').some((tag) => tag.id === 'pink')).toBe(
      true
    );
  });
});
