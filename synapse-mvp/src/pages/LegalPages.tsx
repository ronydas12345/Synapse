export default function PrivacyPage() {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>Privacy</h1>
      <p>
        Synapse currently runs in your browser. Music paths, themes, and profile
        fields are stored in localStorage on this device. There is no Synapse
        account server in this release.
      </p>
      <p>
        When you play a track, YouTube loads and may collect data under Google’s
        policies. Geocoding on the profile page, if used, calls a public Photon
        endpoint.
      </p>
      <p>
        Clearing this site’s data in your browser removes locally saved paths,
        themes, and profile information.
      </p>
    </main>
  );
}

export function TermsPage() {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>Terms</h1>
      <p>
        Synapse is provided as-is for personal use. You are responsible for how
        you use YouTube content and for complying with YouTube’s terms.
      </p>
      <p>
        Features marked planned or coming soon are not a promise of availability
        or a paid entitlement. Pro is not for sale in this release.
      </p>
    </main>
  );
}

export function CookiesPage() {
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-mkt-prose">
      <h1>Cookie settings</h1>
      <p>
        Synapse does not set advertising or analytics cookies in this release.
        The app uses localStorage for paths, themes, and profile so your work
        survives a refresh.
      </p>
      <p>
        Third-party embeds (YouTube) may set their own cookies when you play a
        track. That happens in the editor and listen views, not on this
        marketing site.
      </p>
    </main>
  );
}
