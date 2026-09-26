# Synapse --- Badges, Profile Decorations & Workshop Handoff

## 1. Overview

Implement a persistent **Badges + Profile Decorations + Workshop**
system for Synapse.

The system should make user profiles more expressive, reward meaningful
participation, and turn the Workshop into a major organic discovery and
sharing surface.

Core goals:

-   Reward account age and continued participation.
-   Reward Workshop creation and contribution.
-   Recognize community status without creating pay-to-win mechanics.
-   Display staff roles clearly.
-   Give users collectible profile badges and decorations.
-   Make Workshop creations easy to discover, play, inspect, remix, and
    share.
-   Create organic distribution loops through public profiles, Workshop
    creations, follows, likes, remixes, and creator recognition.
-   Keep all badge awards server-controlled so users cannot grant
    themselves badges.

------------------------------------------------------------------------

## 2. Important Existing Account Rules

The current account model requires:

-   `email` --- required
-   `username` --- required
-   `displayName` --- required

Optional profile information includes:

-   `bio`
-   `location`
-   `favoriteSongs`
-   `favoriteGenres`
-   `playlists`
-   `listeningStats`

The badge and Workshop systems must not make optional profile fields
required.

Authentication should continue using the existing sign-in system.

Admin and Superadmin authentication should use the existing sign-in
page, but route users to different dashboards based on their
server-controlled role.

------------------------------------------------------------------------

# 3. Badge System

## 3.1 Badge Concept

A badge is a persistent achievement/status marker attached to a user
account.

Badges should be:

-   visually distinct
-   easy to understand
-   earned through clearly defined conditions
-   server-awarded
-   visible on profiles
-   optionally visible beside usernames in Workshop
-   searchable/filterable where appropriate
-   revocable only by authorized backend/admin logic when necessary

Badges should not normally be purchasable.

The goal is recognition rather than monetization.

------------------------------------------------------------------------

# 4. Badge Categories

Use categories so the system can grow without becoming disorganized.

Suggested categories:

-   **Account** --- account age and milestones
-   **Creator** --- Workshop creation milestones
-   **Community** --- followers, likes, remixes, participation
-   **Explorer** --- discovering/using Workshop content
-   **Staff** --- Admin/Superadmin roles
-   **Special** --- manually awarded or event-based achievements
-   **Seasonal** --- temporary events/challenges

------------------------------------------------------------------------

# 5. Account Age Badges

Suggested progression:

  Badge          Requirement
  -------------- --------------------------
  New Synapse    Account created
  First Week     Account reaches 7 days
  One Month      Account reaches 30 days
  Three Months   Account reaches 90 days
  Six Months     Account reaches 180 days
  One Year       Account reaches 365 days
  Two Years      Account reaches 730 days
  Veteran        Account reaches 3 years
  Legacy         Account reaches 5 years

Do not award multiple account-age badges automatically if the product UI
becomes cluttered. The user can own all earned badges while selecting
which one appears prominently.

Account age must be calculated from the trusted account creation
timestamp, not from client-provided values.

------------------------------------------------------------------------

# 6. Workshop Upload Badges

Suggested progression:

  Badge              Requirement
  ------------------ -----------------------
  First Creation     First Workshop upload
  Creator            5 Workshop uploads
  Builder            10 Workshop uploads
  Pathmaker          25 Workshop uploads
  Architect          50 Workshop uploads
  Workshop Veteran   100 Workshop uploads
  Workshop Legend    250 Workshop uploads
  Master Creator     500 Workshop uploads

Only count successfully published Workshop creations.

Deleted, rejected, private drafts, or failed uploads should not increase
the public-upload milestone count.

If a creation is later removed by moderation, decide whether the
historical milestone remains. Recommended behavior: **earned milestones
remain once legitimately earned**, while the current public-upload count
reflects currently available creations.

------------------------------------------------------------------------

# 7. First Workshop Upload

The first published Workshop creation should automatically award:

**First Creation**

Possible profile tooltip:

> Published your first creation to the Synapse Workshop.

This should be one of the earliest badges most active users can earn.

------------------------------------------------------------------------

# 8. Community Badges

Possible community progression:

  Badge               Requirement
  ------------------- ------------------
  Known Creator       10 followers
  Rising Creator      25 followers
  Community Creator   100 followers
  Popular Creator     500 followers
  Featured Creator    1,000 followers
  Community Star      5,000 followers
  Creator Icon        10,000 followers

Follower counts must be calculated from real account relationships.

Do not use follower badges as an official verification system.
Popularity and verification are separate concepts.

Avoid displaying exact follower thresholds as a competition that
encourages spam. The profile can simply show the earned badge and
current follower count.

------------------------------------------------------------------------

# 9. Workshop Engagement Badges

Add badges for meaningful Workshop impact.

Examples:

-   **First Like** --- first creation receives a like.
-   **100 Likes** --- creations collectively reach 100 likes.
-   **1K Likes** --- creations collectively reach 1,000 likes.
-   **First Remix** --- someone remixes the user's creation.
-   **Remix Magnet** --- creations receive 10 remixes.
-   **Community Favorite** --- creation is featured by staff.
-   **Trending Creator** --- temporary staff/system-awarded recognition
    based on a defined period.

Avoid awarding badges solely for raw view counts if views can be cheaply
generated or refreshed.

Prefer meaningful events such as saves, remixes, follows, and completed
plays.

------------------------------------------------------------------------

# 10. Staff Badges

Staff badges must be controlled by server-side roles.

## Superadmin

Display a **crown** badge.

Suggested appearance:

-   crown icon
-   distinct but restrained styling
-   tooltip: `Superadmin`

The badge must never be granted based only on username, email, or
frontend state.

The actual authorization should use the existing server-controlled
role/custom-claims architecture.

## Admin

Display an **Admin** badge.

Suggested appearance:

-   shield or administrator icon
-   tooltip: `Admin`

Admin and Superadmin badges should automatically update if the user's
role changes.

------------------------------------------------------------------------

# 11. Additional Badge Ideas

Consider adding:

### Early Adopter

Awarded to users who joined during the initial launch period.

### Beta Tester

Awarded to users who participated in a designated beta period.

### Feedback Contributor

Awarded after submitting a meaningful number of accepted feedback
reports.

### Bug Hunter

Awarded for verified bug reports that materially help development.

### Tutorial Explorer

Awarded after completing the interactive tutorial.

### Workshop Explorer

Awarded after playing/saving a certain number of Workshop creations.

### Remix Artist

Awarded after publishing a certain number of remixes.

### Theme Creator

Awarded for publishing themes or theme-related Workshop content if that
feature is exposed publicly.

### Collaborator

Awarded after participating in a collaborative creation.

### Event Winner

Manually awarded for official community challenges.

### Staff Pick

A creation-level badge rather than a permanent user achievement. Staff
can feature a creation without permanently changing the creator's
account status.

------------------------------------------------------------------------

# 12. Badge Ownership Data Model

Suggested conceptual structure:

``` text
users/{userId}
  badgeIds: []
  featuredBadgeId: string | null
  profileDecorationId: string | null
```

For a scalable implementation, use a subcollection or separate
collection:

``` text
users/{userId}/badges/{badgeId}
  badgeId
  earnedAt
  source
  metadata
```

Where `source` can identify the reason for the award, such as:

-   `account_age`
-   `workshop_upload_count`
-   `followers`
-   `staff_role`
-   `event`
-   `manual_award`

The backend should be the authority for awarding badges.

------------------------------------------------------------------------

# 13. Badge Display

Users should have a **Badges** section on their profile.

Profile should show:

-   selected/featured badge
-   badge collection
-   badge category
-   earned date where appropriate
-   badge description

Workshop cards can optionally show:

-   creator avatar
-   display name
-   selected badge
-   staff badge when applicable

Do not display 20 badges beside every username. Keep compact surfaces
limited to one or a few selected badges.

------------------------------------------------------------------------

# 14. Profile Decorations

Badges and decorations should be separate systems.

A badge communicates:

> What the user has achieved or what role they have.

A decoration communicates:

> How the user's profile looks.

Examples:

-   profile frame
-   avatar ring
-   banner frame
-   username accent
-   badge plate
-   profile background
-   animated frame, where technically appropriate

------------------------------------------------------------------------

# 15. Profile Decoration Categories

Suggested categories:

### Account Age

Examples:

-   1 Month frame
-   6 Month frame
-   1 Year frame
-   Veteran frame

### Creator

Examples:

-   Creator frame
-   Workshop frame
-   Architect frame

### Seasonal

Examples:

-   Halloween
-   Winter
-   New Year
-   Summer

### Event

Limited decorations for official Synapse events.

### Staff

Special Admin/Superadmin decorations tied to role.

### Community

Decorations earned through meaningful community participation.

------------------------------------------------------------------------

# 16. Decoration Rules

Decorations should be cosmetic only.

They should not:

-   affect playback
-   increase discovery ranking artificially
-   grant moderation permissions
-   change account permissions
-   affect Workshop recommendations

Staff decorations should be automatically controlled by role.

Users should be able to select from decorations they have legitimately
unlocked.

------------------------------------------------------------------------

# 17. Workshop Overview

Create a first-class **Workshop** inside Synapse.

The Workshop is the public discovery and sharing layer for Synapse
creations.

It should support:

-   public Music Paths
-   themes
-   potentially overlays/assets where permitted
-   creator profiles
-   likes
-   saves
-   follows
-   remixes
-   comments where enabled
-   search
-   tags
-   categories
-   featured content
-   trending content
-   newest content
-   personalized discovery later

------------------------------------------------------------------------

# 18. Workshop Navigation

Suggested top-level navigation:

``` text
Workshop
├── Home
├── Trending
├── New
├── Featured
├── Following
├── Categories
├── Search
├── My Creations
└── Saved
```

Additional filters:

-   Music Paths
-   Themes
-   Overlays
-   Community Creations
-   Official Synapse

------------------------------------------------------------------------

# 19. Workshop Home

Workshop Home should immediately show useful content rather than an
empty marketplace-style page.

Suggested sections:

### Featured

Staff-selected creations.

### Trending

Content showing meaningful recent engagement.

### New

Recently published creations.

### Popular Creators

Creators with strong recent engagement.

### Recommended

Later, personalized based on follows, saves, tags, and usage.

### Challenge

Current community challenge or event.

------------------------------------------------------------------------

# 20. Workshop Creation Card

Each creation card should show:

-   thumbnail
-   title
-   creator
-   creator avatar
-   selected badge
-   creation type
-   tags
-   likes
-   saves
-   remix count
-   publish date
-   optional play count

Primary actions:

-   Play
-   Open
-   Save
-   Like
-   Remix

Do not overwhelm the card with every metric.

------------------------------------------------------------------------

# 21. Workshop Creation Page

A dedicated creation page should contain:

-   creation title
-   creator information
-   creator badges
-   thumbnail/preview
-   description
-   tags
-   Play button
-   Open in Synapse
-   Remix
-   Save
-   Like
-   Share
-   comments if enabled
-   creation statistics where appropriate
-   version/history information where appropriate

The creation should be understandable before requiring the user to open
the full editor.

------------------------------------------------------------------------

# 22. Remix System

One of the most important Workshop features should be:

**Remix this**

When a user clicks Remix:

1.  Create a copy of the public creation.
2.  Associate the new creation with the original.
3.  Mark the creator as the remixer.
4.  Preserve attribution to the original creator.
5.  Allow the new creator to modify the copy.
6.  Prevent accidental modification of the original.

Example:

``` text
Original Path
     ↓
   Remix
     ↓
User's Copy
     ↓
Modified Path
     ↓
Published Remix
```

Display:

> Remixed from \[Original Creation\]

This creates a direct organic distribution loop.

------------------------------------------------------------------------

# 23. Sharing

Every public Workshop creation should have a shareable URL.

Example conceptual route:

``` text
/workshop/{creationId}
```

Social preview metadata should include:

-   creation title
-   creator
-   thumbnail
-   Synapse branding
-   short description

Share targets can include:

-   Copy link
-   Discord
-   X
-   Reddit
-   other supported native share mechanisms

Do not automatically spam social networks or post on behalf of users
without explicit action.

------------------------------------------------------------------------

# 24. Workshop Search

Search should eventually support:

-   title
-   creator
-   username
-   tags
-   category
-   creation type

Filters:

-   newest
-   trending
-   most liked
-   most saved
-   most remixed

Search should not rank content solely by raw engagement because this can
create runaway popularity loops.

Use a combination of recency, engagement, relevance, moderation state,
and other product-defined signals.

------------------------------------------------------------------------

# 25. Tags and Categories

Users should be able to add a limited number of tags to a Workshop
creation.

Example tags:

-   chill
-   focus
-   gaming
-   study
-   anime
-   electronic
-   rock
-   ambient
-   sleep
-   workout
-   coding
-   driving
-   experimental

Staff moderation should be able to remove inappropriate or misleading
tags.

------------------------------------------------------------------------

# 26. Workshop Moderation

All public Workshop content should have a moderation state.

Suggested states:

``` text
Draft
Pending Review
Published
Hidden
Rejected
Removed
```

Normal creations may publish automatically if the platform chooses
automated/basic moderation.

Flagged content should enter a moderation queue.

------------------------------------------------------------------------

# 27. Profile Picture Moderation

Profile pictures require a moderation workflow because they are public
user-generated content.

Admin/Superadmin moderation tools should support:

-   view image
-   approve
-   reject
-   remove
-   request replacement
-   record moderation reason
-   audit moderator action

Do not permanently delete the account merely because a profile picture
violates content rules unless a separate policy requires it.

------------------------------------------------------------------------

# 28. Workshop Image/GIF Overlay Moderation

Because Synapse supports image/GIF overlays, these assets should have
their own moderation state.

Admin/Superadmin should be able to:

-   preview overlay
-   approve
-   reject
-   hide
-   remove
-   inspect creator
-   inspect usage
-   record moderation reason

GIF/animated assets should receive the same moderation treatment as
static images.

------------------------------------------------------------------------

# 29. Reporting System

Add a Report button to public Workshop content and relevant profile
content.

Report categories could include:

-   inappropriate content
-   harassment
-   spam
-   copyright concern
-   impersonation
-   malicious content
-   misleading content
-   other

Reports should create moderation cases rather than directly deleting
content.

------------------------------------------------------------------------

# 30. Admin Workshop Moderation Queue

Admin dashboard module:

``` text
Moderation
├── Profile Pictures
├── Workshop Creations
├── Images
├── GIFs / Overlays
├── Reports
└── Moderation History
```

Each queue should support:

-   filtering
-   sorting
-   search
-   preview
-   creator information
-   previous reports
-   action history
-   moderation action

------------------------------------------------------------------------

# 31. Superadmin Workshop Controls

Superadmin should additionally be able to configure:

-   moderation policies
-   featured content
-   official collections
-   badge definitions
-   profile decoration definitions
-   event badges
-   Workshop categories
-   global tags
-   staff-picked creations

------------------------------------------------------------------------

# 32. Admin vs Superadmin

## Admin

Admin can manage normal operational systems:

-   user management
-   support tickets
-   usage statistics
-   Workshop moderation
-   profile picture moderation
-   overlay moderation
-   reports

## Superadmin

Superadmin can do everything Admin can, plus:

-   create admin accounts
-   modify admin accounts
-   delete admin accounts
-   view admin data
-   inspect admin edit history
-   manage role assignments
-   manage badge definitions
-   manage profile decoration definitions
-   manage Workshop configuration
-   build/edit themes
-   push theme presets
-   manage global platform configuration

Superadmin actions should receive stronger audit logging.

------------------------------------------------------------------------

# 33. Audit Logging

Record sensitive actions.

Examples:

``` text
adminCreated
adminModified
adminDeleted
roleChanged
userBlocked
userReactivated
usernameChanged
profilePictureRemoved
workshopRemoved
workshopFeatured
badgeGranted
badgeRevoked
profileDecorationGranted
themePublished
moderationAction
```

Each audit event should contain conceptually:

``` text
actorId
actorRole
action
targetType
targetId
timestamp
reason
metadata
```

Audit logs should be immutable from normal admin interfaces.

------------------------------------------------------------------------

# 34. Badge Administration

Superadmin should have a Badge Manager.

Capabilities:

-   create badge
-   edit badge metadata
-   deactivate badge
-   define requirements
-   configure icon
-   configure description
-   configure category
-   configure visibility
-   manually award badge
-   revoke manually awarded badge
-   view earning statistics

Automatically earned badges should preferably be determined by backend
rules rather than manually maintained lists.

------------------------------------------------------------------------

# 35. Profile Decoration Administration

Superadmin should have a Decoration Manager.

Capabilities:

-   create decoration
-   upload asset
-   preview decoration
-   define unlock condition
-   activate/deactivate
-   assign seasonal dates
-   assign event
-   manually grant decoration
-   remove decoration

Decoration assets must be validated and stored securely.

------------------------------------------------------------------------

# 36. Workshop Organic Growth Loop

The Workshop should intentionally create this loop:

``` text
User creates path
        ↓
Publishes to Workshop
        ↓
Creation gets public page
        ↓
Creator shares page
        ↓
New user discovers creation
        ↓
New user plays it
        ↓
New user clicks Remix
        ↓
New user creates account
        ↓
New user publishes remix
        ↓
Original creator receives engagement
        ↓
More people discover both creations
```

This should be considered a core distribution feature, not merely a
content library.

------------------------------------------------------------------------

# 37. Creator Profiles

Public creator profiles should eventually show:

-   avatar
-   display name
-   username
-   bio
-   selected badge
-   decorations
-   follower count
-   following count
-   Workshop creations
-   liked/saved public creations where privacy permits
-   featured creation
-   creator statistics

Potential route:

``` text
/u/{username}
```

Privacy settings should determine what non-public information is
visible.

------------------------------------------------------------------------

# 38. Following System

Allow users to follow creators.

Following should create a personalized Workshop feed:

> New from creators you follow

This gives Workshop content a reason to bring users back.

------------------------------------------------------------------------

# 39. Creator Recognition

Create recurring recognition surfaces:

-   Creator of the Week
-   Path of the Week
-   Workshop Spotlight
-   Staff Pick
-   Community Pick
-   Rising Creator
-   Most Remixed
-   Most Helpful Creator

Recognition should be based on transparent or clearly described criteria
where possible.

Avoid presenting popularity as an objective measure of quality.

------------------------------------------------------------------------

# 40. Workshop Events

Build periodic community challenges.

Examples:

### The 10-Node Challenge

Create a useful path using exactly 10 nodes.

### Randomizer Challenge

Create the most interesting experience using branching/randomization.

### Theme Challenge

Create a path around a specific visual theme.

### One Song Challenge

Build an interesting experience around a single track.

### Mood Challenge

Build a path designed around a specific mood.

Participants can earn event badges and decorations.

------------------------------------------------------------------------

# 41. Privacy Controls

Users should be able to choose whether a creation is:

-   Private
-   Unlisted/shareable by link
-   Public Workshop

Private creations must not appear in public Workshop search, profiles,
recommendations, or leaderboards.

------------------------------------------------------------------------

# 42. Deletion and Ownership

Deleting an account should trigger a defined ownership policy for public
Workshop creations.

Possible options:

1.  Remove all creations.
2.  Preserve creations under a deleted-user identity.
3.  Allow creators to transfer ownership.

Choose one policy before launch and implement it consistently.

Recommended default for early Synapse: preserve public creations only if
legally and technically appropriate, with the creator displayed as a
deleted/removed account; otherwise remove them.

------------------------------------------------------------------------

# 43. Anti-Abuse Controls

Workshop must account for:

-   spam uploads
-   fake followers
-   automated likes
-   repeated low-quality creations
-   malicious links
-   inappropriate assets
-   harassment
-   impersonation
-   report abuse

Possible controls:

-   rate limits
-   upload limits
-   account-age requirements for certain actions
-   report thresholds
-   moderation queues
-   suspicious activity detection
-   follower/like integrity checks

Do not make engagement manipulation profitable or badge-eligible.

------------------------------------------------------------------------

# 44. Backend Security

Never trust the client for:

-   badge ownership
-   role ownership
-   follower counts
-   Workshop statistics
-   moderation status
-   admin permissions
-   Superadmin permissions
-   published creation ownership

Use Firebase Security Rules plus trusted server-side/backend logic.

Roles should remain separate from account status.

Suggested roles:

``` text
user
admin
superadmin
```

Suggested statuses:

``` text
active
suspended
disabled
pending
```

A suspended Admin must not retain operational access merely because
their role remains `admin`.

------------------------------------------------------------------------

# 45. Suggested Firestore Structure

Conceptual structure:

``` text
users/{userId}
users/{userId}/badges/{badgeId}
users/{userId}/decorations/{decorationId}
users/{userId}/followers/{otherUserId}
users/{userId}/following/{otherUserId}

badges/{badgeId}
decorations/{decorationId}

workshop/{creationId}
workshop/{creationId}/likes/{userId}
workshop/{creationId}/saves/{userId}
workshop/{creationId}/remixes/{remixId}
workshop/{creationId}/reports/{reportId}
workshop/{creationId}/comments/{commentId}

moderation/{caseId}
auditLogs/{logId}
```

Actual schema should be adjusted to the existing Firebase architecture
and query/index requirements.

------------------------------------------------------------------------

# 46. Implementation Architecture

Do not place badge-awarding logic throughout React components.

Recommended separation:

``` text
src/
├── badges/
│   ├── badgeDefinitions.ts
│   ├── badgeTypes.ts
│   ├── badgeDisplay.ts
│   └── badgeUtils.ts
│
├── decorations/
│   ├── decorationDefinitions.ts
│   ├── decorationTypes.ts
│   └── decorationDisplay.ts
│
├── workshop/
│   ├── types.ts
│   ├── workshopService.ts
│   ├── workshopQueries.ts
│   ├── remixService.ts
│   └── sharing.ts
│
├── moderation/
│   ├── moderationTypes.ts
│   └── moderationService.ts
│
└── profiles/
    ├── ProfileBadges.tsx
    ├── ProfileDecorations.tsx
    └── CreatorProfile.tsx
```

Backend/cloud functions should handle trusted achievement evaluation and
privileged operations.

------------------------------------------------------------------------

# 47. Badge Evaluation Strategy

Do not evaluate every badge on every page load.

Use event-driven evaluation where possible.

Examples:

``` text
accountCreated
    → evaluate account-related badges

workshopPublished
    → evaluate upload badges
    → evaluate creator badges

followerCreated
    → evaluate follower badges

workshopLiked
    → update engagement counters
    → evaluate engagement badges

workshopRemixed
    → evaluate remix badges

roleChanged
    → update staff badge state
```

This keeps the system efficient and easier to reason about.

------------------------------------------------------------------------

# 48. First Implementation Phase

Implement the smallest complete version first.

### Phase 1 badges

-   First Creation
-   10 Uploads
-   25 Uploads
-   100 Uploads
-   One Month
-   One Year
-   Admin
-   Superadmin
-   10 Followers
-   100 Followers

### Phase 1 decorations

-   Default
-   One Month
-   One Year
-   Creator
-   Admin
-   Superadmin

### Phase 1 Workshop

-   Workshop Home
-   New
-   Featured
-   Search
-   Creation page
-   Publish
-   Private/Public
-   Like
-   Save
-   Share
-   Remix
-   Creator profile

### Phase 1 moderation

-   Reports
-   Workshop moderation
-   Profile picture moderation
-   Overlay moderation

------------------------------------------------------------------------

# 49. Phase 2

Add:

-   Following feed
-   Trending algorithm
-   Creator statistics
-   More badges
-   Seasonal decorations
-   Workshop events
-   Comments
-   Creator Spotlight
-   Community Picks
-   Advanced search
-   Collections
-   Better social previews

------------------------------------------------------------------------

# 50. Phase 3

Potential future systems:

-   personalized Workshop recommendations
-   creator reputation
-   advanced analytics
-   collaborative Workshop collections
-   creator subscriptions/follow notifications
-   achievement showcases
-   profile customization marketplace if ever appropriate
-   public API/embed system
-   Workshop discovery integrations

Any future monetization should keep cosmetic recognition separate from
moderation privileges and core account security.

------------------------------------------------------------------------

# 51. Acceptance Criteria

The implementation is successful when:

-   [ ] Users can earn persistent badges.
-   [ ] Badge awards are controlled by trusted backend logic.
-   [ ] Account-age badges are based on trusted timestamps.
-   [ ] Workshop upload badges count published creations correctly.
-   [ ] Follower badges use real follower relationships.
-   [ ] Admin badge reflects the server-controlled Admin role.
-   [ ] Superadmin badge uses a crown and reflects the server-controlled
    Superadmin role.
-   [ ] Users can select a featured badge.
-   [ ] Users can equip unlocked profile decorations.
-   [ ] Staff decorations cannot be manually equipped by ordinary users.
-   [ ] Users can publish Workshop creations.
-   [ ] Users can choose Private, Unlisted, or Public visibility where
    implemented.
-   [ ] Public creations have shareable URLs.
-   [ ] Users can like/save/share/remix public creations.
-   [ ] Remixes preserve attribution to the original creation.
-   [ ] Public creator profiles display relevant badges/decorations.
-   [ ] Workshop supports search and basic discovery categories.
-   [ ] Admins can moderate Workshop content and user profile images.
-   [ ] Superadmins can manage badge/decorations definitions.
-   [ ] Moderation actions are audited.
-   [ ] Sensitive role and badge state cannot be manipulated from the
    frontend.
-   [ ] Privacy rules prevent private creations from leaking into public
    discovery.
-   [ ] Existing Synapse playback/editor architecture remains intact.

------------------------------------------------------------------------

# 52. Product Principle

The Workshop should not become a generic file-sharing page.

It should become the **social creation layer of Synapse**.

The intended loop is:

> **Build → Publish → Discover → Play → Remix → Create → Share**

Badges and decorations then provide persistent recognition for people
who participate in that ecosystem.

The result should make Synapse feel less like a standalone music
application and more like a platform where people build, discover, and
remix interactive Music Paths.
