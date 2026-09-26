import { AppLink } from '../app/AppLink';
import { LEGAL } from '../site/legal';

function LegalMeta() {
  return (
    <p className="synapse-legal-updated">
      Effective {LEGAL.effectiveDate}. Operator: {LEGAL.operator}. Contact:{' '}
      <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
    </p>
  );
}

export default function PrivacyPage() {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>Privacy Policy</h1>
      <LegalMeta />
      <p>
        This policy explains how Synapse (“we”, “us”) handles personal data when
        you use the website and app. It is written for a global audience and is
        meant to satisfy the substance of the EU/UK GDPR, California CPRA, Brazil
        LGPD, Canada PIPEDA, Australia’s Privacy Act, Singapore PDPA, and similar
        access/erasure/portability rules. It is not legal advice, and a local
        regulator’s wording always wins if there is a conflict.
      </p>

      <h2>Who is responsible</h2>
      <p>
        The controller for account data is the Synapse operator, reachable at{' '}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. YouTube,
        Google, Supabase, Open-Meteo, and Photon are independent controllers or
        processors for the services they provide. Hosting and the database run on{' '}
        {LEGAL.authHost} in {LEGAL.hostingRegion}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> email, password hash (held by Supabase Auth,
          not by the app), username, display name, optional photo URL, email
          verification, last seen time, account status.
        </li>
        <li>
          <strong>Session:</strong> an auth token in this browser after you sign
          in (Google or email).
        </li>
        <li>
          <strong>Support:</strong> tickets and replies you send.
        </li>
        <li>
          <strong>Staff records:</strong> admin roles, moderation items, published
          theme payloads, and an audit log of staff actions.
        </li>
        <li>
          <strong>Consents and rights requests:</strong> which policy version you
          accepted and any access/erasure request you file.
        </li>
        <li>
          <strong>Your workspace in Postgres:</strong> Music Paths, app settings,
          custom themes, profile extras, listen stats, and tutorial progress,
          stored per account with row-level security.
        </li>
        <li>
          <strong>Profile pictures:</strong> uploaded to private-to-folder Storage
          and held in the moderation queue until staff approve them.
        </li>
        <li>
          <strong>On this device only:</strong> a cookie-notice choice, the auth
          session token, and an optional song-credits cache. Music Paths are
          stored in your account, not in the browser.
        </li>
      </ul>
      <p>
        We do not sell personal information. We do not run advertising or
        analytics cookies in this release. We do not ask for payment card data.
        We do not knowingly collect data from children under 16 (or 13 where that
        is the local digital-consent age).
      </p>

      <h2>Why we use it</h2>
      <ul>
        <li>To create and secure your account (contract / legitimate interest).</li>
        <li>To show your username and run staff tools you are allowed to use.</li>
        <li>To answer support tickets.</li>
        <li>To meet legal duties (tax, abuse, court orders) when they apply.</li>
        <li>
          Consent where the law requires it (optional geolocation for weather
          branches; marketing would need a separate opt-in if it ever ships).
        </li>
      </ul>

      <h2>Who else sees it</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication and Postgres, region{' '}
          {LEGAL.hostingRegion}. Transfers out of the EEA/UK use that provider’s
          terms and standard contractual clauses.
        </li>
        <li>
          <strong>Google / YouTube</strong> — if you sign in with Google, or when
          a track plays. Their policies apply to that activity.
        </li>
        <li>
          <strong>Open-Meteo</strong> and <strong>Photon</strong> — only if you
          use weather/location features; they receive a place name or coordinates,
          not your account password.
        </li>
        <li>
          <strong>Vercel</strong> — hosts the static app. It sees typical web
          request logs (IP, user agent) under their terms.
        </li>
        <li>
          Staff (Admin / Superadmin) can read account rows needed to moderate and
          support. Superadmin-only tables stay Superadmin-only in the database
          rules, not just the UI.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Account rows and your workspace last until you delete the account or we
        close the service. Support tickets stay while the account exists. Auth
        logs follow the host’s retention. A cookie-notice flag and song-credits
        cache stay in this browser until you clear this site’s data or use
        Settings → Privacy → Erase leftover Synapse keys. After erasure we keep
        only what the law still requires (for example a stub that the deletion
        happened).
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you can request access, a portable copy,
        correction, deletion, restriction, or objection, and you can withdraw
        consent. California residents can also ask us to confirm whether we
        sell or share personal information (we do not) and to not use sensitive
        data for extra purposes. Brazil, Canada, Australia, Singapore, and other
        regimes have equivalent access and deletion rights; we honour the same
        tools for everyone.
      </p>
      <p>
        In the app: Settings → Privacy / Data → Download my data, or Delete my
        account. You can also email {LEGAL.contactEmail}. We aim to answer within
        30 days (or the shorter local deadline). You can complain to your data
        protection authority (for example a European DPA, the UK ICO, California
        CPPA, or Brazil ANPD).
      </p>

      <h2>Security</h2>
      <p>
        Passwords are stored by the auth provider, not in our profile table.
        Database access uses row-level security. The public website key cannot
        read other people’s private rows. No method is perfect; do not reuse
        passwords.
      </p>

      <h2>Automated decisions</h2>
      <p>
        Playback routing (weather, time, random) uses rules you put on the graph.
        It is not credit scoring or profiling for ads.
      </p>

      <h2>Changes</h2>
      <p>
        Policy version {LEGAL.privacyVersion}. If we change it in a material way
        we will update this page and the version string recorded with new
        consents.
      </p>
      <p>
        Related: <AppLink to="terms">Terms</AppLink>,{' '}
        <AppLink to="cookies">Cookies</AppLink>, <AppLink to="faq">FAQ</AppLink>.
      </p>
    </main>
  );
}

export function TermsPage() {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>Terms of Use</h1>
      <LegalMeta />
      <p>
        By creating an account or using Synapse you agree to these terms. If you
        do not agree, do not use the app.
      </p>
      <h2>The service</h2>
      <p>
        Synapse is a browser app for building visual Music Paths that play
        YouTube (and limited local) audio. It is provided as-is, currently as a
        personal project, without a paid subscription. Features marked planned,
        preview, or coming soon — including Pro, overlays, and collaborative
        editing — are not a promise and are not for sale in this release.
        Workshop publishing is live: public and unlisted Music Paths can be
        listed or shared by link, subject to moderation. Music Paths you build
        while signed in are stored with your account.
      </p>
      <h2>Your account</h2>
      <p>
        You must be old enough to consent to online services in your country
        (at least 16 in much of the EU, 13 in the United States unless a parent
        consents). Username and display name are required. You are responsible
        for the account and for keeping the password or Google session safe.
        We may suspend accounts that abuse the service or other people.
      </p>
      <h2>Your content</h2>
      <p>
        Paths, themes, and profile copy you create stay yours. You grant us a
        limited licence to store and display them as needed to run the product
        (for example staff reviewing a reported avatar). Do not upload anything
        you do not have the right to use. YouTube videos remain on YouTube; you
        must follow{' '}
        <a href="https://www.youtube.com/t/terms" rel="noreferrer" target="_blank">
          YouTube’s terms
        </a>{' '}
        and copyright law. Synapse does not grant you a licence to the underlying
        music.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not attack the service, scrape other users’ private data, impersonate
        staff, harass people, or use the app for anything illegal in your
        country. Staff tools are only for appointed Admins and the Superadmin.
      </p>
      <h2>Disclaimer</h2>
      <p>
        The app is provided without warranties of any kind, to the fullest extent
        the law allows. We are not liable for lost playlists, YouTube outages,
        or indirect damages. Some places do not allow these limits; in that case
        they apply only as far as local law permits.
      </p>
      <h2>Ending the agreement</h2>
      <p>
        You can delete your account in Settings. We can stop offering the app or
        close an account that breaks these terms. Download your data from
        Settings before you leave if you want a copy of your Music Paths.
      </p>
      <h2>Law</h2>
      <p>
        These terms are designed to be used worldwide. Mandatory consumer
        protections in your country still apply and cannot be waived. For
        disputes that can be heard in court, the operator may be reached at the
        contact email above.
      </p>
      <p>
        Related: <AppLink to="privacy">Privacy</AppLink>,{' '}
        <AppLink to="cookies">Cookies</AppLink>.
      </p>
    </main>
  );
}

export function CookiesPage() {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>Cookies and local storage</h1>
      <LegalMeta />
      <p>
        This page is the cookie notice required under the EU ePrivacy Directive,
        UK PECR, and similar rules. Synapse is a single-page app. It does not
        set advertising or analytics cookies of its own in this release.
      </p>
      <h2>Strictly necessary</h2>
      <ul>
        <li>
          <strong>Auth session</strong> after you log in, stored by the Supabase
          client in this browser so you stay signed in.
        </li>
        <li>
          <strong>Cookie notice choice</strong> (<code>synapse_cookie_notice</code>
          ) so we do not show the banner again.
        </li>
        <li>
          <strong>Song-credits cache</strong> (optional) so YouTube lookups are
          not repeated. You can clear it in Settings. Music Paths and profile
          data live in your Supabase account, not in this cache.
        </li>
      </ul>
      <h2>Third parties when you play music</h2>
      <p>
        The marketing pages do not load the YouTube player. Edit, Listen, and
        other workspace pages mount it so playback can continue. Google/YouTube
        may set cookies and collect data under their policies when that player
        runs. That is required for the core product if you play a track. Signing
        in with Google also uses Google’s account cookies.
      </p>
      <h2>Your choices</h2>
      <p>
        You can clear leftover site data in the browser, use Settings → Erase
        leftover Synapse keys, sign out, or delete the account. Blocking all
        cookies may break sign-in. There is no separate “ads” switch because we
        do not run ads. Clearing this browser does not delete Music Paths stored
        on your account.
      </p>
      <p>
        Related: <AppLink to="privacy">Privacy</AppLink>.
      </p>
    </main>
  );
}
