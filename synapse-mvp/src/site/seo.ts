import type { AppRoute } from '../app/routes';
import { APP_PATHS } from '../app/routes';
import { SITE } from './content';

const PAGE_META: Partial<Record<AppRoute, { title: string; description: string }>> = {
  home: { title: SITE.title, description: SITE.description },
  workshop: {
    title: 'Workshop — Synapse',
    description: 'Preview of the Synapse Workshop. Sharing and discovery are not live yet.',
  },
  pricing: {
    title: 'Pricing — Synapse',
    description: 'Free editor on this device. Pro is planned; prices are not published yet.',
  },
  changelog: {
    title: 'Changelog — Synapse',
    description: 'What changed in the Synapse app.',
  },
  faq: {
    title: 'FAQ — Synapse',
    description: 'Common questions about Music Paths, YouTube playback, and local data.',
  },
  privacy: {
    title: 'Privacy — Synapse',
    description: 'How Synapse stores data on this device.',
  },
  terms: {
    title: 'Terms — Synapse',
    description: 'Terms of use for the Synapse app.',
  },
  cookies: {
    title: 'Cookies — Synapse',
    description: 'Cookie and local storage settings for Synapse.',
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
  const url = `${origin}${APP_PATHS[route]}`;
  upsertMeta('meta[property="og:url"]', { property: 'og:url' }, url);
  upsertMeta('meta[property="og:image"]', { property: 'og:image' }, `${origin}${SITE.ogImage}`);
  upsertLink('canonical', url);
}
