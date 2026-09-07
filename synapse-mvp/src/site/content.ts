/** Configurable marketing-site copy. Keep claims honest to the current release. */

export const SITE = {
  name: 'Synapse',
  title: 'Synapse — Visual Music Paths',
  description:
    'Build dynamic music paths with visual nodes, conditional playback, randomization, transitions, and themes.',
  ogTitle: 'Synapse — Visual Music Paths',
  ogDescription:
    'Build dynamic music paths with visual nodes, conditional playback, randomization, transitions, and themes.',
  ogImage: '/og.svg',
  canonicalOrigin: '',
};

export const CREATOR = {
  displayName: '',
  role: 'Creator of Synapse',
  photoSrc: '',
  photoAlt: 'Portrait of the Synapse creator',
  bio: 'I built Synapse because traditional playlists felt too restrictive. I wanted music to behave more like a system—something that could react, branch, change direction, and create a different experience every time.',
  why:
    'Linear queues decide the next song for you, or make you decide every time. Synapse lets you design the rules once, then listen.',
  philosophy:
    'Give listeners control without making them do all the work. Creativity in how a path is built, control over the rules, and room left for surprise.',
  links: {
    github: '',
    portfolio: '',
    linkedin: '',
    contact: '',
  },
};

export const PRICING = {
  note: 'Prices are not published yet. Checkout is not open.',
  free: {
    name: 'Free',
    summary: 'The editor that runs in your browser, on this device.',
    items: [
      'Visual Music Path editor',
      'Listen mode',
      'YouTube track playback',
      'Weighted and time-of-day conditionals',
      'Sequence and weighted randomizers, with play-count limits',
      'Silence, audio, and YouTube transitions',
      'Preset and custom themes',
      'Local profile and playlists',
    ],
  },
  pro: {
    name: 'Pro',
    summary: 'Planned. Not available to purchase in this release.',
    items: [
      'Collaborative playlists',
      'Advanced Workshop publishing',
      'Image overlays and animations',
      'No banner or mid-roll ads, once ads exist',
      'Other Pro features as they ship',
    ],
  },
};

export const WORKSHOP_EXAMPLES = [
  {
    name: 'Morning / evening split',
    creator: 'Synapse',
    tags: ['example', 'time of day'],
    kind: 'Music Path',
  },
  {
    name: 'Weighted night mix',
    creator: 'Synapse',
    tags: ['example', 'randomizer'],
    kind: 'Music Path',
  },
  {
    name: 'Cherry Tree',
    creator: 'Synapse',
    tags: ['example', 'theme'],
    kind: 'Theme',
  },
  {
    name: 'Cyberpunk',
    creator: 'Synapse',
    tags: ['example', 'theme'],
    kind: 'Theme',
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: 'What is a Music Path?',
    a: 'A Music Path is a graph of nodes—tracks, conditionals, randomizers, transitions—that decides what plays next. It is not a fixed list of songs.',
  },
  {
    q: 'Do I need an account?',
    a: 'Not for the current app. Paths, themes, and profile data save in this browser. Cloud login is not wired yet.',
  },
  {
    q: 'What can I play?',
    a: 'Track nodes play YouTube videos. You paste a URL or video ID. Synapse does not host audio files as a library.',
  },
  {
    q: 'Is the Workshop live?',
    a: 'No. You can browse a preview of how sharing will look. Publishing and discovery are not available yet.',
  },
  {
    q: 'Where is my data stored?',
    a: 'On this device, in localStorage. Clearing site data removes paths, themes, and profile. Playing a track still uses YouTube.',
  },
] as const;
