import { experienceConfig, type EditorExperienceConfig } from './config';
import { useAppSettings } from '../settings/settingsStore';
import type { EditorExperienceMode } from '../settings/types';

export function useEditorExperience(): EditorExperienceConfig {
  const mode = useAppSettings((s) => s.general.editorExperience);
  return experienceConfig(mode);
}

export function setEditorExperience(mode: EditorExperienceMode): void {
  useAppSettings.getState().updateGeneral({ editorExperience: mode });
}
