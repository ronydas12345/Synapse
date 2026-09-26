import type { AppRoute } from '../app/routes';
import { APP_PATHS } from '../app/routes';

function pathForMeta(route: AppRoute): string {
  if (route === 'workshopItem' || route === 'publicProfile') {
    return window.location.pathname;
  }
  return APP_PATHS[route];
}
import { SITE } from './content';

const PAGE_META: Partial<Record<AppRoute, { title: string; description: string }>> = {
  home: { title: SITE.title, description: SITE.description },
  workshop: {
    title: 'Workshop — Synapse',
    description: 'Discover, play, and remix Music Paths published to the Synapse Workshop.',
  },
  workshopItem: {
    title: 'Workshop creation — Synapse',
    description: 'A Music Path published to the Synapse Workshop.',
  },
  publicProfile: {
    title: 'Creator — Synapse',
    description: 'A Synapse creator profile, badges, and public Workshop creations.',
  },
  playground: {
    title: 'Playground — Synapse',
    description: 'Short skill games and virtual tokens. No gambling, wagering, or cash-out.',
  },
  pricing: {
    title: 'Pricing — Synapse',
    description: 'Free editor. Signed-in Music Paths save to your account. Pro is planned; prices are not published yet.',
  },
  changelog: {
    title: 'Changelog — Synapse',
    description: 'What changed in the Synapse app.',
  },
  faq: {
    title: 'FAQ — Synapse',
    description: 'Common questions about Music Paths, YouTube playback, and account data.',
  },
  privacy: {
    title: 'Privacy — Synapse',
    description: 'How Synapse collects, uses, stores, and deletes personal data worldwide.',
  },
  terms: {
    title: 'Terms — Synapse',
    description: 'Terms of use for the Synapse app and Music Paths.',
  },
  cookies: {
    title: 'Cookies — Synapse',
    description: 'Cookies, local storage, and third-party YouTube cookies in Synapse.',
  },
  login: {
    title: 'Log in — Synapse',
    description: 'Log in to Synapse with Google or email.',
  },
  signup: {
    title: 'Create account — Synapse',
    description: 'Create a Synapse account. Username and display name are required.',
  },
  admin: {
    title: 'Admin — Synapse',
    description: 'Staff dashboard for users, tickets, stats, and moderation.',
  },
  superadmin: {
    title: 'Superadmin — Synapse',
    description: 'Owner dashboard for admins, themes, and audit history.',
  },
};

function upsertMeta(selector: string, attrs: Record<string, string>, content: string) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function applyPageMeta(route: AppRoute): void {
  const meta = PAGE_META[route];
  if (!meta) return;

  document.title = meta.title;
  upsertMeta('meta[name="description"]', { name: 'description' }, meta.description);
  upsertMeta('meta[property="og:title"]', { property: 'og:title' }, meta.title);
  upsertMeta('meta[property="og:description"]', { property: 'og:description' }, meta.description);
  upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');

  const origin = SITE.canonicalOrigin || window.location.origin;
  const url = `${origin}${pathForMeta(route)}`;
  upsertMeta('meta[property="og:url"]', { property: 'og:url' }, url);
  upsertMeta('meta[property="og:image"]', { property: 'og:image' }, `${origin}${SITE.ogImage}`);
  upsertLink('canonical', url);
}
