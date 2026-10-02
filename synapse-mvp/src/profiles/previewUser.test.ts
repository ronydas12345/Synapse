import { describe, expect, it } from 'vitest';
import { isBuiltinThemeClone } from '../theme/isPresetTheme';
import {
  mergePublicCreators,
  visPreviewCreator,
  VIS_PREVIEW_USERNAME,
} from './previewCatalog';
import {
  isPreviewProfile,
  isVisPreview,
  isWorkshopPreview,
  PREVIEW_USERNAME,
  previewCreator,
  previewPublishThemes,
} from './previewUser';

describe('workshop preview user', () => {
  it('matches the local /u/workshop_preview handle', () => {
    expect(isWorkshopPreview('Workshop_Preview')).toBe(true);
    expect(isPreviewProfile('Workshop_Preview')).toBe(true);
    expect(isPreviewProfile('ada_lovelace')).toBe(false);
    expect(previewCreator().username).toBe(PREVIEW_USERNAME);
  });

  it('seeds a renamed default theme and an original palette', () => {
    const [renamed, original] = previewPublishThemes();
    expect(isBuiltinThemeClone(renamed)).toBe(true);
    expect(isBuiltinThemeClone(original)).toBe(false);
  });
});

describe('visibility preview user', () => {
  it('matches /u/vis_preview and starts private', () => {
    expect(isVisPreview('Vis_Preview')).toBe(true);
    expect(isPreviewProfile('vis_preview')).toBe(true);
    expect(visPreviewCreator('private').username).toBe(VIS_PREVIEW_USERNAME);
    expect(visPreviewCreator('private').visibility).toBe('private');
  });

  it('lists the test user in Workshop only when public', () => {
    const publicRow = visPreviewCreator('public');
    const merged = mergePublicCreators(
      [publicRow],
      [{ ...publicRow, uid: 'server-copy' }]
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].uid).toBe(publicRow.uid);
  });
});
