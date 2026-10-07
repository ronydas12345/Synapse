import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGAL } from './legal';

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), 'src', relative), 'utf8');
}

describe('legal copy hardening', () => {
  const pages = readSrc('pages/LegalPages.tsx');
  const auth = readSrc('auth/AuthPanel.tsx');
  const notice = readSrc('pages/chrome/CookieNotice.tsx');
  const seo = readSrc('site/seo.ts');
  const combined = `${pages}\n${auth}\n${notice}`;

  it('versions, contact, and dates stay in sync', () => {
    expect(LEGAL.contactEmail).toBe('connect.to.synapse@gmail.com');
    expect(LEGAL.effectiveDate).toBe('6 October 2026');
    expect(LEGAL.privacyVersion).toBe('1.1');
    expect(LEGAL.termsVersion).toBe('1.1');
    expect(LEGAL.cookiesVersion).toBe('1.1');
    expect(pages).toContain('LEGAL.effectiveDate');
    expect(pages).toContain('LEGAL.contactEmail');
    expect(pages).toContain('LEGAL.privacyVersion');
    expect(pages).toContain('LEGAL.termsVersion');
    expect(pages).toContain('LEGAL.cookiesVersion');
  });

  it('avoids overclaims and invented jurisdiction details', () => {
    const forbidden = [
      'must be at least 13',
      'must be at least 16',
      'must be at least 18',
      'children under 16',
      'children under 13',
      'gdpr',
      'cpra',
      'lgpd',
      'pipeda',
      'us-west-2',
      'oregon',
      'texas',
      'united states',
      'we comply with',
      'this policy complies',
      'this policy satisfies',
      'bulletproof',
      'fully secure',
      'completely encrypted',
      'impossible to hack',
      'public key cannot read',
      'eu representative',
      'data protection officer',
      'within 30 days',
      'indexeddb',
    ];
    const haystack = combined.toLowerCase();
    for (const phrase of forbidden) {
      expect(haystack, phrase).not.toContain(phrase);
    }
  });

  it('uses the signup and cookie-notice wording from the handoff', () => {
    expect(auth).toContain(
      'By creating an account, you agree to the'
    );
    expect(auth).toContain('Terms of Service');
    expect(auth).toContain('acknowledge');
    expect(auth).toContain('Privacy Policy');
    expect(notice).toContain('Some browser storage is necessary');
    expect(notice).toContain('Cookie Policy');
  });

  it('keeps legal SEO titles descriptive, not keyword-stuffed', () => {
    expect(seo).toContain("title: 'Synapse Privacy Policy'");
    expect(seo).toContain("title: 'Synapse Terms of Service'");
    expect(seo).toContain("title: 'Synapse Cookie Policy'");
  });
});
