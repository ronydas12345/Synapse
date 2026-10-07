import type { ReactNode } from 'react';
import { AppLink } from '../app/AppLink';
import { LEGAL } from '../site/legal';

type LegalDoc = 'privacy' | 'terms' | 'cookies';

function LegalNav({ here }: { here: LegalDoc }) {
  const items: { id: LegalDoc; to: LegalDoc; label: string }[] = [
    { id: 'privacy', to: 'privacy', label: 'Privacy' },
    { id: 'terms', to: 'terms', label: 'Terms' },
    { id: 'cookies', to: 'cookies', label: 'Cookies' },
  ];
  return (
    <nav className="synapse-legal-nav" aria-label="Legal documents">
      {items.map((item) => (
        <AppLink
          key={item.id}
          to={item.to}
          aria-current={here === item.id ? 'page' : undefined}
        >
          {item.label}
        </AppLink>
      ))}
    </nav>
  );
}

function LegalMeta({
  title,
  version,
}: {
  title: string;
  version: string;
}) {
  return (
    <p className="synapse-legal-updated">
      {title}. Version {version}. Effective {LEGAL.effectiveDate}. Operator:{' '}
      {LEGAL.operator}. Contact:{' '}
      <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
    </p>
  );
}

function LegalDisclaimer() {
  return (
    <p className="synapse-legal-disclaimer">
      These policies are intended to describe the current operation of Synapse
      and are not legal advice. If applicable law provides rights or protections
      that differ from these policies, those legal requirements control.
    </p>
  );
}

function LegalPageLayout({
  title,
  version,
  here,
  children,
}: {
  title: string;
  version: string;
  here: LegalDoc;
  children: ReactNode;
}) {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>{title}</h1>
      <LegalMeta title={title} version={version} />
      <LegalNav here={here} />
      {children}
      <LegalDisclaimer />
    </main>
  );
}

function MailLink() {
  return <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      version={LEGAL.privacyVersion}
      here="privacy"
    >
      <p>
        This Privacy Policy explains what information Synapse may collect,
        receive, store, use, disclose, and retain when you use the Synapse
        website, application, and related services. The specific information
        involved depends on which features you use.
      </p>
      <p>
        Synapse is the operator of the service described in these policies. For
        questions regarding these policies, privacy, accounts, or the service,
        contact <MailLink />.
      </p>
      <p>
        Applicable law may provide additional rights or impose additional
        obligations depending on your circumstances. Nothing in this Privacy
        Policy is intended to remove or restrict rights that cannot lawfully be
        removed or restricted.
      </p>

      <h2>Information we may collect</h2>
      <p>
        Not every user generates every category below. Information is collected
        or received only as needed for the features you use.
      </p>
      <h3>Account information</h3>
      <p>
        If you create an account, this may include an email address, username,
        display name, profile information you choose to provide, a profile
        picture or avatar, account status, verification state, and account
        creation or modification information. Authentication credentials are
        handled by the authentication infrastructure used by Synapse. Synapse
        does not intentionally store users’ plaintext passwords.
      </p>
      <h3>Content you create</h3>
      <p>
        Depending on how you use the service, this may include Music Paths,
        playlists, custom themes, profile content, settings, tutorial progress,
        and other content you intentionally create or save. Uploading content
        does not transfer ownership to Synapse.
      </p>
      <h3>Support information</h3>
      <p>
        If you contact support, this may include your request, replies,
        attachments, and metadata needed to handle the request.
      </p>
      <h3>Moderation and safety information</h3>
      <p>
        Where relevant, this may include reported content, moderation decisions,
        account restrictions, staff actions, and related records reasonably
        necessary for safety and service operation.
      </p>
      <h3>Technical information</h3>
      <p>
        Depending on hosting, authentication, security, and infrastructure
        configuration, service providers may process technical information such
        as IP address, browser or device information, timestamps, request
        information, error information, and security-related logs.
      </p>

      <h2>How we use information</h2>
      <p>
        Synapse may use information to provide and operate the service,
        authenticate accounts, store user-created content, maintain security,
        provide support, prevent abuse and unauthorized access, moderate content,
        diagnose technical problems, improve reliability, comply with applicable
        legal obligations, respond to lawful requests, protect Synapse, users,
        and third parties, and enforce the Terms of Service.
      </p>
      <p>
        Where applicable law requires a specific legal basis, Synapse may rely
        on a basis permitted by that law, such as performance of a service,
        legitimate interests, consent, or compliance with a legal obligation.
      </p>

      <h2>Public, unlisted, and private content</h2>
      <p>
        Visibility depends on the settings you choose and the feature involved.
      </p>
      <ul>
        <li>
          <strong>Private.</strong> Intended to be accessible only to you and to
          authorized Synapse systems or personnel as reasonably necessary for
          operation, support, security, or moderation.
        </li>
        <li>
          <strong>Unlisted.</strong> Not intended to be publicly indexed by
          Synapse, but anyone who obtains the relevant link or identifier may be
          able to access or share it.
        </li>
        <li>
          <strong>Public.</strong> May be discoverable and viewable by other
          users of the service.
        </li>
      </ul>

      <h2>License to operate the service</h2>
      <p>
        You retain ownership of content to the extent you have rights in that
        content. To operate Synapse, you grant Synapse a limited, non-exclusive,
        worldwide, royalty-free license to store, reproduce technically, display
        to the intended audience, deliver through the service, moderate, back up
        where applicable, and transform technically as needed for functionality.
        That license is limited to operating, maintaining, displaying,
        moderating, and improving the service where technically necessary.
      </p>

      <h2>Staff access</h2>
      <p>
        Authorized personnel may access account or content information when
        reasonably necessary for support, moderation, security, abuse
        prevention, service operation, or legal compliance. Access is
        role-based where that control exists. Synapse does not imply that staff
        may freely inspect all information for unrelated purposes.
      </p>

      <h2>Third-party services</h2>
      <p>
        Synapse uses other providers to run the product. Those providers may
        process information as part of providing their services. Their own terms
        and privacy policies may also apply.
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication, database, and related
          infrastructure.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and delivery
          infrastructure.
        </li>
        <li>
          <strong>Google / YouTube</strong> — authentication and/or media
          playback where those features are used.
        </li>
        <li>
          <strong>Open-Meteo</strong> — weather data when weather-based
          functionality is used.
        </li>
        <li>
          <strong>Photon</strong> — location or geocoding when that feature is
          used.
        </li>
      </ul>
      <p>
        Synapse and its service providers may process information in locations
        different from where you live. Where applicable law requires safeguards
        for international transfers, appropriate mechanisms may be used.
      </p>

      <h2>When information may be disclosed</h2>
      <p>
        Information may be disclosed to service and infrastructure providers,
        authentication and media providers, support or moderation personnel,
        legal authorities when legally required, parties involved in protecting
        rights, safety, security, or the service, and successors if Synapse is
        transferred, acquired, reorganized, or otherwise changes control.
      </p>
      <p>
        Synapse does not currently operate a business model based on selling
        users’ personal information.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        We retain information for as long as reasonably necessary for the
        purposes described in this policy, including providing the service,
        maintaining security, resolving disputes, enforcing agreements,
        preventing abuse, and meeting applicable legal obligations. Retention
        periods may vary depending on the type of information, how it is used,
        technical requirements, and legal obligations.
      </p>
      <p>
        You may request deletion of your account and associated personal
        information through available account controls or by contacting Synapse.
        Deletion may not remove information that Synapse is required or
        permitted to retain under applicable law, or that is necessary for
        security, fraud prevention, dispute resolution, or enforcement. Residual
        copies may temporarily remain in backups or technical systems until those
        systems are overwritten or otherwise processed according to their
        retention cycle.
      </p>
      <p>
        Clearing browser storage does not necessarily delete information stored
        on your Synapse account or on third-party systems. In the app, signed-in
        users can use Settings → Privacy / Data to download a copy of available
        account data or delete the account.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on applicable law, you may have rights including access,
        correction, deletion, portability, restriction, objection, withdrawal of
        consent, appeal or review where required, information about processing,
        and the ability to complain to an applicable regulator.
      </p>
      <p>
        Synapse may need to verify your request before fulfilling it. We will
        respond within the period required by applicable law. You can also
        contact <MailLink />.
      </p>

      <h2>Security</h2>
      <p>
        Synapse uses reasonable technical and organizational measures intended to
        protect information against unauthorized access, alteration, disclosure,
        or destruction. No method of transmission or storage is completely
        secure, and Synapse cannot guarantee absolute security.
      </p>

      <h2>Age-related requirements</h2>
      <p>
        Synapse does not intentionally design its services to circumvent
        age-related privacy or consent requirements. Where applicable law
        requires parental authorization, age verification, or other protections,
        those requirements apply.
      </p>

      <h2>Automated processing</h2>
      <p>
        Some Synapse features use automated rules or software logic to determine
        how content or playback behaves, including graph routing such as weather,
        time, or randomization. These features are intended to operate the
        service and are not intended to make decisions about a person’s
        eligibility for credit, employment, insurance, housing, or similar
        high-impact opportunities.
      </p>

      <h2>Changes</h2>
      <p>
        Synapse may update this Privacy Policy from time to time. The effective
        date will be updated when changes are published. Where applicable law
        requires additional notice or consent for material changes, Synapse will
        provide it.
      </p>
    </LegalPageLayout>
  );
}

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      version={LEGAL.termsVersion}
      here="terms"
    >
      <p>
        These Terms govern your access to and use of Synapse. By accessing or
        using Synapse, you agree to these Terms to the extent permitted by
        applicable law. If you do not agree, do not use the service. How
        information is handled is described in the{' '}
        <AppLink to="privacy">Privacy Policy</AppLink>. For questions, contact{' '}
        <MailLink />.
      </p>
      <p>
        Nothing in these Terms limits rights that cannot lawfully be limited.
        Mandatory consumer, privacy, and other protections that apply to you are
        not excluded.
      </p>

      <h2>Eligibility</h2>
      <p>
        You may use Synapse only if you are legally permitted to enter into and
        use online services under the laws applicable to you. If additional
        authorization, consent, or restrictions apply to your use of the
        service, you are responsible for complying with them. Synapse may
        restrict access where required by law or where reasonably necessary to
        protect the service and its users.
      </p>

      <h2>The service</h2>
      <p>
        Synapse is a browser application for building visual Music Paths that
        can play YouTube media and limited local audio. Features marked planned,
        preview, or coming soon are not a promise and are not for sale unless
        separately offered. Synapse may modify, limit, suspend, or discontinue
        features. Synapse does not guarantee that the service will always be
        available, uninterrupted, error-free, or compatible with every device,
        browser, operating system, or third-party service.
      </p>

      <h2>Accounts</h2>
      <p>
        You agree to provide accurate information where requested and not to
        impersonate others or access accounts without authorization. You are
        responsible for taking reasonable steps to protect your account
        credentials and for promptly notifying Synapse if you believe your
        account has been compromised.
      </p>

      <h2>Third-party services</h2>
      <p>
        Synapse may integrate with or rely on third-party services, including
        media, authentication, hosting, weather, location, and other providers.
        Third-party services are subject to their own terms and policies.
        Synapse does not control those services and is not responsible for
        changes, outages, restrictions, or content provided by them, except
        where applicable law provides otherwise.
      </p>
      <p>
        Use of YouTube content through Synapse may also be subject to{' '}
        <a href="https://www.youtube.com/t/terms" rel="noreferrer" target="_blank">
          YouTube’s terms
        </a>
        . Synapse does not grant rights to music, videos, recordings, artwork,
        or other material provided by third parties.
      </p>

      <h2>Your content</h2>
      <p>
        You retain ownership of content you create to the extent you have rights
        in it. You must have the rights needed to upload and use that content.
        You grant Synapse a limited, non-exclusive, worldwide, royalty-free
        license to operate, maintain, display, moderate, and improve the service
        where technically necessary. Public content may be visible to other
        users. Synapse may remove content that violates these Terms and does not
        guarantee permanent preservation of content.
      </p>

      <h2>Workshop</h2>
      <p>
        Workshop lets signed-in users publish Music Paths and related creations
        as private, unlisted, or public, subject to the visibility rules in the
        Privacy Policy. Public listings may appear in Workshop. Unlisted items
        may be opened by anyone with the relevant link or identifier. Synapse
        may, but is not required to, review, moderate, restrict, or remove
        content, including for copyright concerns, prohibited material,
        impersonation, or abuse. Moderation does not guarantee safety. If legal
        requirements impose notice or action procedures, those take precedence.
      </p>

      <h2>Acceptable use</h2>
      <p>You may not:</p>
      <ul>
        <li>access accounts, systems, or data without authorization;</li>
        <li>exploit vulnerabilities, distribute malware, or steal credentials;</li>
        <li>scrape other users’ private data or interfere with the service;</li>
        <li>harass people, impersonate others, or commit fraud;</li>
        <li>use the service for unlawful activity;</li>
        <li>bypass restrictions, moderation, or account limits;</li>
        <li>abuse staff tools or administrative functionality;</li>
        <li>upload content without the required rights;</li>
        <li>use malicious automation against the service.</li>
      </ul>

      <h2>Copyright</h2>
      <p>
        Users are responsible for having rights to content they upload. For
        copyright or intellectual-property concerns, contact <MailLink /> with
        enough information to identify the material and the nature of the
        concern. Synapse is not a designated copyright agent unless that status
        is separately established.
      </p>

      <h2>Suspension and termination</h2>
      <p>
        Synapse may suspend, restrict, or terminate access when required by law,
        reasonably necessary for security, where abuse or fraud occurs, where
        these Terms are violated, where service integrity is threatened, or
        where continued access creates material risk. Where required by
        applicable law, users may have rights regarding suspension or
        termination. You may delete your account in Settings.
      </p>

      <h2>Disclaimers</h2>
      <p>
        To the maximum extent permitted by applicable law, Synapse is provided
        without warranties of any kind. This includes service availability,
        third-party services, data loss, compatibility, user-generated content,
        playback, internet or browser failures, and planned features. Nothing in
        these Terms excludes or limits liability that cannot lawfully be
        excluded or limited.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, Synapse will not be
        liable for indirect, incidental, special, consequential, exemplary, or
        similar damages arising from or related to use of the service. Nothing
        in these Terms excludes or limits liability that cannot lawfully be
        excluded or limited.
      </p>

      <h2>Responsibility for certain claims</h2>
      <p>
        To the extent permitted by applicable law, you may be responsible for
        claims arising from your unlawful use of the service, your violation of
        these Terms, or your infringement of another person’s rights.
      </p>

      <h2>Disputes</h2>
      <p>
        These Terms are subject to applicable law. Nothing in these Terms
        prevents either party from exercising rights or seeking remedies that
        cannot lawfully be waived.
      </p>

      <h2>Changes</h2>
      <p>
        Synapse may update these Terms as the service evolves. Updated Terms
        will be posted with a new effective date. Where applicable law requires
        additional notice or consent, Synapse will provide it.
      </p>
    </LegalPageLayout>
  );
}

export function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      version={LEGAL.cookiesVersion}
      here="cookies"
    >
      <p>
        This Cookie Policy describes how Synapse and related technologies may
        store information in your browser. Browsers may store information using
        cookies and similar technologies, including cookies, local storage,
        session storage, and other browser storage mechanisms actually used by
        the service.
      </p>
      <p>
        Some storage mechanisms are necessary for the service to function. Where
        applicable law requires consent for non-essential storage or similar
        technologies, Synapse will request consent through the available
        controls.
      </p>

      <h2>First-party storage</h2>
      <h3>Strictly necessary</h3>
      <p>
        Synapse may use browser storage to keep you signed in, remember that you
        have seen the cookie notice, preserve essential application state, and
        support security of the session.
      </p>
      <h3>Functional</h3>
      <p>
        Synapse may also store optional functional state in the browser, such as
        player layout, tutorial progress locally, a song-credits cache so
        lookups are not repeated, and similar preferences. These items help the
        app work more smoothly and are not advertising.
      </p>
      <p>
        Synapse does not currently use first-party analytics cookies. Synapse
        does not currently use first-party advertising cookies.
      </p>

      <h2>Third-party technologies</h2>
      <p>
        Third-party embedded services may set their own cookies or similar
        technologies. The marketing pages do not load the YouTube player. Edit,
        Listen, and other workspace pages may load it so playback can continue.
        Google or YouTube may set cookies and collect data under their policies
        when that player runs, and signing in with Google uses Google’s account
        technologies.
      </p>
      <p>
        Third-party technologies are controlled by the relevant provider and may
        change independently of Synapse. Synapse cannot prevent all third-party
        cookies.
      </p>

      <h2>Your choices</h2>
      <p>
        You can use browser controls, clear site data, sign out, use Synapse
        privacy settings, or delete your account. Clearing browser storage does
        not necessarily delete information stored on your Synapse account or on
        third-party systems. Blocking all cookies or similar storage may break
        sign-in or other necessary functions.
      </p>
    </LegalPageLayout>
  );
}
