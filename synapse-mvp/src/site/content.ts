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
  username: 'dasrony231',
  photoSrc: '/creator.jpg',
  photoAlt: 'Portrait of the Synapse developer',
  bio: 'Synapse is an independent project built around a simple idea: music should feel more like something you explore than something you simply press play on.',
  why: "I'm the developer behind Synapse, and I've been building it around experimentation, visual interfaces, personalization, and giving listeners more control over how they experience music. A lot of Synapse comes from trying to turn ideas that normally stay in my head into something people can actually use.",
  philosophy:
    "I'm continuing to build Synapse as a long-term project, with new features, experiments, and improvements along the way.",
  email: 'connect.to.synapse@gmail.com',
  discordUsername: 'connect_with_synapse',
  links: {
    github: 'https://github.com/ronydas12345',
    portfolio: '',
    linkedin: '',
    discord: '',
    contact: 'mailto:connect.to.synapse@gmail.com',
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
    tags: ['chill', 'focus'],
    kind: 'Music Path',
  },
  {
    name: 'Weighted night mix',
    creator: 'Synapse',
    tags: ['lo-fi', 'night'],
    kind: 'Music Path',
  },
  {
    name: 'Cherry Tree',
    creator: 'Synapse',
    tags: ['cute', 'pink'],
    kind: 'Theme',
  },
  {
    name: 'Cyberpunk',
    creator: 'Synapse',
    tags: ['cyberpunk', 'neon'],
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
    a: 'Yes. Signed-in accounts can publish Music Paths from Settings → Workshop as private, unlisted, or public. Public creations appear on /workshop. Anyone with the ID or link can open an unlisted creation or profile. Like, save, comment, remix, follow, and bookmark live on creation and creator pages. Creators can turn likes, comments, saves, and follows off. Staff moderate reports, Workshop listings, profile pictures, and overlay reports.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Your Music Paths, themes, settings, profile extras, and tutorial progress save to your Supabase account (US West) with row-level security so only you can read them. Public Workshop creations, badges, and public or unlisted creator profiles are readable by other people who have the listing or the share ID. Sign-in identity, staff roles, support tickets, profile pictures awaiting review, and published theme presets also use Supabase. A cookie-notice flag and an optional song-credits cache can remain in this browser. Clearing site data does not delete your Synapse account.',
  },
  {
    q: 'Who can open Admin or Superadmin?',
    a: 'The same login page is used for everyone. The verified owner email is Superadmin and opens `/superadmin` only. Promoted admins open `/admin` only. Overlapping tools (users, tickets, stats, moderation) exist on both dashboards as separate pages. Row-level security still blocks Superadmin-only writes from Admin accounts.',
  },
  {
    q: 'How do I copy nodes on the canvas?',
    a: 'Shift-click or drag a box on empty canvas to select several nodes. Ctrl+C / Cmd+C copies, Ctrl+V pastes, Ctrl+D duplicates. Middle- or right-drag pans while box-select is on. Ctrl/Cmd+K opens the command palette for navigation, Play/Pause/Stop, adding nodes, and Settings sections. Holding Shift to snap alignment does not start while a text box is focused.',
  },
  {
    q: 'How do I jump around the app quickly?',
    a: 'Press Ctrl/Cmd+K (or click Commands) to search pages, playlists, themes, playback, and settings. Pause keeps the queue; Stop ends the session. Workshop is in the workspace top nav next to Listen. The playlist name sits to the right of that nav, not beside the Synapse mark.',
  },
  {
    q: 'Can I name sequences and gather them on the canvas?',
    a: 'Yes. Every node has a Name field in the inspector (travel, childhood, techno, and so on). Bring selected onto page keeps their spacing and moves them to one page; Bring all onto page packs named groups together. Speed for the current song is on the bottom deck.',
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
    a: 'Account data and Music Paths are stored with your Synapse account and related infrastructure providers. Details are on the Privacy Policy page.',
  },
] as const;
