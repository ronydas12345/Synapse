import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { APP_PATHS, navigateApp } from '../app/routes';
import { EDITOR_EXPERIENCE_OPTIONS } from './config';
import { setEditorExperience, useEditorExperience } from './useEditorExperience';
import { useTutorialStore } from '../tutorial/tutorialStore';
import { useAppSettings } from '../settings/settingsStore';
import type { EditorExperienceMode } from '../settings/types';

export default function ExperienceSelector() {
  const config = useEditorExperience();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const modes = EDITOR_EXPERIENCE_OPTIONS.map((option) => option.mode);
      const current = useAppSettings.getState().general.editorExperience;
      const index = modes.indexOf(current);
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const next = modes[(index + delta + modes.length) % modes.length];
      if (next) setEditorExperience(next);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (mode: EditorExperienceMode) => {
    setEditorExperience(mode);
    setOpen(false);
  };

  return (
    <div className="synapse-experience-selector" ref={wrapRef}>
      <button
        type="button"
        className="synapse-experience-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Editor experience: ${config.label}`}
        data-tutorial="editor-experience"
        onClick={() => setOpen((value) => !value)}
      >
        {config.label}
        <ChevronDown className="synapse-experience-chevron" aria-hidden />
      </button>
      {open ? (
        <div
          className="synapse-experience-popover"
          role="dialog"
          aria-labelledby={titleId}
        >
          <p id={titleId} className="synapse-experience-kicker">
            Editor experience
          </p>
          <div role="radiogroup" aria-labelledby={titleId} className="synapse-experience-options">
            {EDITOR_EXPERIENCE_OPTIONS.map((option) => {
              const selected = option.mode === config.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`synapse-experience-option${selected ? ' is-selected' : ''}`}
                  onClick={() => choose(option.mode)}
                >
                  <span className="synapse-experience-option-label">{option.label}</span>
                  <span className="synapse-experience-option-summary">{option.summary}</span>
                </button>
              );
            })}
          </div>
          <div className="synapse-experience-links">
            <button
              type="button"
              className="synapse-experience-link"
              onClick={() => {
                setOpen(false);
                useTutorialStore.getState().openTopics();
              }}
            >
              Manage tutorials
            </button>
            <button
              type="button"
              className="synapse-experience-link"
              onClick={() => {
                setOpen(false);
                navigateApp(APP_PATHS.settings, 'settings-canvas');
              }}
            >
              Editor preferences
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
