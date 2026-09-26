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
    summary: 'The editor in your browser. Signed-in Music Paths save to your account.',
    items: [
      'Visual Music Path editor',
      'Listen mode',
      'YouTube track playback',
      'Weighted, time-of-day, weather, and day/date conditionals',
      'Sequence and weighted randomizers, with play-count limits',
      'Silence, audio, and YouTube transitions',
      'Preset and custom themes',
      'Account profile and playlists',
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
    a: 'Yes for the workspace (Edit, Listen, Settings, Profile) and staff dashboards. The marketing pages stay public. Log in at `/login` or create an account at `/signup`. Username and display name are required. Your paths, themes, settings, and profile save to your Supabase account. Admins land on `/admin`; the owner lands on `/superadmin`.',
  },
  {
    q: 'What can I play?',
    a: 'Track nodes play YouTube videos. You paste a URL or video ID. Synapse does not host audio files as a library.',
  },
  {
    q: 'Is the Workshop live?',
    a: 'Yes. Signed-in accounts can publish Music Paths from Settings → Workshop as private, unlisted, or public. Public creations appear on /workshop. Anyone with the link can open an unlisted creation. Like, save, remix, and follow live on creation and creator pages. Staff moderate reports, Workshop listings, profile pictures, and overlay reports.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Your Music Paths, themes, settings, profile extras, and tutorial progress save to your Supabase account (US West) with row-level security so only you can read them. Public Workshop creations, badges, and public creator profiles are readable by other people. Sign-in identity, staff roles, support tickets, profile pictures awaiting review, and published theme presets also use Supabase. A cookie-notice flag and an optional song-credits cache can remain in this browser. Clearing site data does not delete your Synapse account.',
  },
  {
    q: 'Who can open Admin or Superadmin?',
    a: 'The same login page is used for everyone. The verified owner email is Superadmin and opens `/superadmin` only. Promoted admins open `/admin` only. Overlapping tools (users, tickets, stats, moderation) exist on both dashboards as separate pages. Row-level security still blocks Superadmin-only writes from Admin accounts.',
  },
  {
    q: 'How do I copy nodes on the canvas?',
    a: 'Shift-click or drag a box on empty canvas to select several nodes. Ctrl+C / Cmd+C copies, Ctrl+V pastes, Ctrl+D duplicates. Middle- or right-drag pans while box-select is on.',
  },
  {
    q: 'Can I hide the bottom player?',
    a: 'Yes. Use the minimize control on the deck. The YouTube video stays loaded so playback does not restart when you expand it or switch Edit, Listen, Settings, or Profile.',
  },
  {
    q: 'How do I download or delete my account?',
    a: 'Settings → Privacy / Data. Download my data gives a JSON copy of your cloud profile, workspace, tickets, and consents. Delete my account removes the auth user and related rows. Profile pictures go through staff review before they appear on the public profile.',
  },
  {
    q: 'Where is personal data processed?',
    a: 'Account data and Music Paths are in Supabase (AWS us-west-2, United States). The static app is hosted on Vercel. Details are on the Privacy Policy page.',
  },
] as const;
