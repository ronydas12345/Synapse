/** Configurable marketing-site copy. Keep claims honest to the current release. */

export const SITE = {
  name: 'Synapse',
  title: 'Synapse — Visual Music Paths',
  description:
    'Music paths for YouTube: nodes, conditions, randomizers, transitions, portals, and themes.',
  ogTitle: 'Synapse — Visual Music Paths',
  ogDescription:
    'Music paths for YouTube: nodes, conditions, randomizers, transitions, portals, and themes.',
  ogImage: '/og.svg',
  canonicalOrigin: '',
};

export const CREATOR = {
  displayName: '',
  role: 'Creator of Synapse',
  username: 'dasrony231',
  photoSrc: '/creator.jpg',
  photoAlt: 'Synapse developer',
  bio: "I'm the developer behind Synapse.",
  why: "A lot of it comes from trying to turn ideas that stay in my head into something people can use.",
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
      'Portals between playlists (leave or receive, not both)',
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
      'No ads, if ads ship',
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
    a: 'A graph of tracks, conditionals, randomizers, transitions, and portals — not a fixed list of songs.',
  },
  {
    q: 'What is a Portal?',
    a: 'A doorway between playlists. Wire into it to leave this playlist, or out of it to receive from another. Never both. An exit needs a destination (playlist start or an entry Portal ID). Beginning hops are blue; hops to another playlist\'s portal are purple. After a hop, the player shows a [playlist, portal id] trail you can click to go back. Unlisted playlists block inbound portals until you allow them in Settings.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes for Edit, Listen, Settings, Profile, and staff dashboards. Marketing pages stay public. Username and display name are required.',
  },
  {
    q: 'What can I play?',
    a: 'YouTube URLs or video IDs in Track nodes. Synapse does not host an audio library.',
  },
  {
    q: 'Is the Workshop live?',
    a: 'Yes. Publish private, unlisted, or public Music Paths and themes from Settings → Workshop. Public items show on /workshop.',
  },
  {
    q: 'Where is my data stored?',
    a: 'On your account. Details are on the Privacy Policy page. Clearing this browser does not delete the account.',
  },
  {
    q: 'Who can open Admin or Superadmin?',
    a: 'Same login as everyone else. The owner opens /superadmin. Promoted admins open /admin.',
  },
  {
    q: 'How do I copy nodes on the canvas?',
    a: 'Shift-click or box-select, then Ctrl/Cmd+C, V, or D. Middle- or right-drag pans. Ctrl/Cmd+K opens the command palette.',
  },
  {
    q: 'How do I jump around the app quickly?',
    a: 'Ctrl/Cmd+K, or click Commands. Pause keeps the queue; Stop ends it.',
  },
  {
    q: 'Can I name sequences and gather them on the canvas?',
    a: 'Yes. Name nodes in the inspector, then use Bring selected/all onto page. Playback speed is on the deck.',
  },
  {
    q: 'Can I hide the bottom player?',
    a: 'Yes. Minimize the deck. YouTube stays loaded so playback does not restart.',
  },
  {
    q: 'How do I download or delete my account?',
    a: 'Settings → Privacy / Data.',
  },
] as const;
