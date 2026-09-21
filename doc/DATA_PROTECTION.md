# Synapse data protection note

This is an engineering record of worldwide privacy duties we designed for, not a lawyer’s opinion. Product copy lives on `/privacy`, `/terms`, and `/cookies`. Contact: dasrony231@gmail.com.

## What we actually store

| Store | Data | Region |
| --- | --- | --- |
| Browser | Cookie-notice choice, auth session, optional song-credits cache | User device |
| Supabase Auth | Email, password hash, Google identity, sessions | AWS us-west-2 |
| Postgres `profiles`, `user_workspaces`, related tables | Username, display name, Music Paths, settings, themes, profile extras, tickets, staff roles, consents, DSRs | AWS us-west-2 |
| Supabase Storage `avatars` | Profile pictures pending or approved by staff | AWS us-west-2 |
| YouTube / Google | Playback and optional Google sign-in | Google |
| Open-Meteo / Photon | Weather/geocode if the user uses those features | Their services |
| Vercel | Static hosting request logs | Vercel |

Playlists belong to the signed-in account in `user_workspaces`. Profile pictures are not public until staff approve them.

## Regulations we mapped

We cannot “implement every law on Earth.” We implemented the rights that show up in the major regimes and applied them to everyone, not only EU users.

| Regime | Core duties we mapped | In this product |
| --- | --- | --- |
| EU GDPR / UK GDPR | Lawful basis, access, rectify, erase, portability, restrict, object, SCCs for US hosting, DPA complaint path | Privacy policy; download JSON; delete account RPC; consent rows; US region disclosed |
| California CPRA | Know, delete, correct; no sell/share; limit sensitive use | Same tools; we do not sell or run ads |
| Brazil LGPD | Access, correction, anonymization/deletion, portability | Same tools |
| Canada PIPEDA | Consent, access, accuracy, safeguards | Signup/login consent; RLS; export |
| Australia Privacy Act APPs | Collection notice, access/correction, overseas disclosure | Policy + US hosting named |
| Singapore PDPA | Consent, access, correction, transfer notice | Same |
| EU ePrivacy / UK PECR | Cookie notice for non-essential / third-party | Cookie page + site banner; YouTube only on workspace playback |

Children: we state 16 (EU) / 13 (US) and do not offer a kids product.

## Database objects

Migration `supabase/migrations/20260921_privacy_rights.sql`:

- `user_consents` — policy id + version + accepted + source
- `data_subject_requests` — access/export/erase/… with status
- `delete_own_account()` — authenticated, definer, deletes `auth.users` for `auth.uid()` only (cascades profile, tickets, consents)

RLS: owners read/insert their rows; staff may read for support. Anon cannot execute the delete function.

## App surfaces

- Settings → Privacy: download my data, erase local data, delete account
- Signup checkbox + Google “by continuing” notice
- Cookie banner (`synapse_cookie_notice`)

## Honest limits

- Custom auth email templates on the Free plan stay locked until SMTP or Pro.
- Default mail still comes from Supabase until custom SMTP is configured.
- We are not a formal company with a DPO appointment in every country. The operator email is the contact point.
- Transferring EEA data to the US relies on Supabase’s processor terms; review those before a large commercial launch.
- Staff audit rows may retain actor ids after a user is gone only if they are not cascaded; prefer not to store extra PII in logs.
