export const RELEASE_ID = '0.4.2';

export const WHATS_NEW_KEY = `synapse_whats_new_${RELEASE_ID}`;

export const KNOWN_ISSUES: string[] = [
  'Graph editing is desktop-first. Small touch screens can browse, Listen, and use Workshop, but drawing paths is limited.',
  'The visualizer needs tab-audio capture or a microphone. YouTube audio cannot be read directly.',
  'Pitch, tempo, and EQ fields in the inspector are experimental and do not change YouTube playback.',
  'Share links currently unfurl with generic site metadata because this is a single-page app.',
];

export function isWhatsNewDismissed(): boolean {
  try {
    return localStorage.getItem(WHATS_NEW_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissWhatsNew(): void {
  try {
    localStorage.setItem(WHATS_NEW_KEY, '1');
  } catch {
    /* ignore */
  }
}
