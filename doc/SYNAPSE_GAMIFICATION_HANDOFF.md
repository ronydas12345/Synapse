```
# Synapse Minimal Games, Events & Token Economy — Cursor Handoff
```

- `## 1. Overview` 

```
Synapse is a music player with a broader gamification layer designed to increase
long-term engagement without turning the product into a gambling platform.
```

```
The goal of this handoff is to implement a lightweight, extensible gamification
system containing:
```

- `A virtual token/currency system` 

- `Small skill-based games` 

- `A Playground for accessing games` 

- `Daily/weekly gameplay limits` 

- `Rewards for gameplay and normal Synapse activity` 

- `Badges and profile decorations` 

- `Limited-time events` 

- `Creator/admin-controlled events` 

- `Superadmin-only unreleased game development tools` 

- `Feature flags for controlled releases` 

- `Firebase-backed persistence` 

- `Anti-abuse protections` 

- `Analytics` 

- `Audit logging` 

- `A system that can be expanded later without rewriting the core economy` 

```
The system should feel like an additional layer on top of Synapse, not like the
primary purpose of the application.
```

```
The implementation must prioritize:
```

`1. Security` 

`2. Abuse prevention` 

`3. Clear economy rules` 

`4. Expandability` 

`5. Simple UX` 

`6. Server-authoritative rewards` 

`7. Controlled feature releases` 

```
## 2. Core Design Philosophy
```

```
The gamification system must NOT become gambling.
```

```
Do not implement:
```

- `Loot boxes` 

- `Paid random rolls` 

- `Slot-machine mechanics` 

- `Betting` 

- `Wagering` 

- `Gambling-style jackpots` 

- `Real-money cash-out` 

- `Randomized purchases that can consume paid currency` 

- `Mechanics where users risk earned currency for a chance at more currency` 

```
Games should instead be:
```

- `Skill-based` 

- `Short` 

- `Optional` 

- `Replayable` 

- `Deterministic or primarily skill-driven` 

- `Appropriate for a general Synapse audience` 

# `- Reward-limited` 

```
Tokens are a virtual progression/reward currency.
```

```
They have no real-world monetary value.
```

```
Users must not be able to:
```

- `Withdraw tokens for money` 

- `Transfer tokens for money` 

- `Sell tokens` 

- `Gamble tokens` 

- `Purchase tokens through gambling mechanics` 

# `## 3. Gamification Architecture` 

```
The system should be separated into the following major components:
```

- `Token Economy` 

- `Token Ledger` 

- `Rewards` 

- `Games` 

- `Playground` 

- `Events` 

- `Badges` 

- `Decorations` 

- `Challenges` 

- `Feature Flags` 

- `Analytics` 

- `Anti-Abuse` 

- `Audit Logs` 

- `Superadmin Game Lab` 

```
Recommended conceptual architecture:
```

```
Synapse UI
```

```
    |
    +-- Gamification UI
            |
```

- `+-- Token Balance` 

```
            +-- Playground
```

```
            +-- Decorations
```

```
            +-- Challenges
    |
    +-- Firebase
            |
```

```
            +-- Firestore
```

```
            +-- Authentication
```

```
            +-- Cloud Functions / trusted backend
```

```
            +-- Analytics
```

```
            +-- Security Rules
```

```
## 4. Terminology
```

```
Use consistent terminology throughout the application.
```

# `### Token` 

```
The virtual currency earned through approved Synapse activities.
```

```
Avoid calling it:
```

- `Money` 

- `Cash` 

- `Credits, unless the existing Synapse UI already uses that terminology` 

- `Coins, unless specifically desired by the final visual design` 

```
The implementation should use a centralized token terminology constant so the
displayed name can be changed later.
```

# `### Game` 

```
A short interactive activity available through the Playground.
```

# `### Playground` 

```
The central area where users discover and launch games.
```

# `### Event` 

```
A limited-time activity or reward campaign.
```

# `### Badge` 

```
A persistent achievement that demonstrates that the user completed a specific
condition.
```

# `### Decoration` 

```
A cosmetic profile/UI customization unlocked through progression.
```

# `### Feature Flag` 

```
A remotely controlled switch determining whether a feature is available.
```

# `### Game Lab` 

```
A Superadmin-only development area for creating/testing games before public
release.
```

```
# 5. Token Economy
```

```
## 5.1 Token Balance
```

```
Every user should have a token balance.
```

```
Example Firestore structure:
```

```
users/{uid}
```

```
    gamification:
        tokenBalance
        lifetimeTokensEarned
        lifetimeTokensSpent
        dailyTokensEarned
        weeklyTokensEarned
        lastDailyReset
        lastWeeklyReset
```

```
Do not rely on the client to modify token balances directly.
```

```
The client may request an action.
```

```
The trusted backend must validate the action and issue the reward.
```

```
Never allow:
```

```
    client -> directly set tokenBalance
```

```
Instead:
```

```
    client
```

- `-> request reward` 

- `-> backend validation` 

- `-> token ledger transaction` 

- `-> balance update` 

```
## 5.2 Token Ledger
```

```
Every token change should produce a ledger record.
```

```
Recommended collection:
```

```
gamificationTokenLedger/{transactionId}
Example:
```

```
{
    userId: "...",
    type: "game_reward",
    amount: 25,
    balanceBefore: 120,
    balanceAfter: 145,
    source: "game_name",
    sourceId: "game-session-id",
    description: "Reward for completing game",
    createdAt: timestamp,
    metadata: {},
    status: "completed"
}
```

```
Possible transaction types:
```

```
- game_reward
- daily_reward
- weekly_reward
- event_reward
- achievement_reward
- challenge_reward
- cosmetic_purchase
- admin_adjustment
- refund
- expiration
```

```
Avoid deleting ledger entries.
```

```
If a correction is necessary, create a compensating transaction.
```

```
This preserves an audit trail.
```

```
## 5.3 Idempotency
```

```
Every reward-producing action must have a unique identifier.
```

```
Example:
```

```
rewardRequestId
```

```
The backend must reject duplicate requests.
```

```
This prevents users from repeatedly sending the same request to receive the same
reward.
```

```
Example:
```

```
Game completion
    |
    +-- sessionId generated
    |
    +-- game completed
    |
    +-- reward request
    |
    +-- backend checks sessionId
    |
    +-- if already rewarded -> reject
    |
    +-- otherwise -> award tokens
```

```
## 5.4 Token Earning
```

```
Tokens can be earned from:
```

```
- Games
- Daily activities
- Weekly challenges
- Events
- Achievements
- Normal Synapse engagement
- Future community features
```

```
Do not reward every single action indefinitely.
```

```
Rewards should have limits.
```

```
Example:
Game reward
    10–50 tokens
Daily gameplay cap
    configurable
Weekly gameplay cap
    configurable
Event reward
    configurable
```

```
All values should be configurable through backend-controlled configuration
rather than hardcoded throughout the frontend.
```

```
# 6. Anti-Abuse System
```

```
The gamification system must assume that some users will attempt to manipulate
rewards.
```

```
Implement server-side protections.
```

```
## Required protections
```

# `### Duplicate reward prevention` 

```
Use unique IDs for:
```

- `Game sessions` 

- `Reward claims` 

- `Event claims` 

- `Challenge completions` 

- `Achievement unlocks` 

# `### Daily limits` 

```
Track the amount of tokens earned through gameplay each day.
```

```
Example:
```

```
dailyGameTokensEarned
```

```
If the limit is reached:
```

- `The game can still be playable if desired` 

- `Additional token rewards are disabled` 

- `The user should clearly see that the reward limit has been reached` 

```
Do not silently remove rewards.
```

# `### Weekly limits` 

```
Provide similar protection at the weekly level.
```

# `### Rate limiting` 

```
Prevent extremely rapid reward requests.
```

```
Example:
```

```
A game that normally takes 30 seconds should not be capable of generating
hundreds of valid reward requests per minute.
```

# `### Server-side validation` 

```
Never trust:
```

- `Score` 

- `Completion time` 

- `Token amount` 

- `Game result` 

- `Event completion` 

- `Achievement completion` 

```
sent directly from the client.
```

```
The backend should validate whatever information is necessary for the specific
game.
```

```
### Suspicious activity tracking
```

```
Track suspicious patterns such as:
```

- `Excessive reward requests` 

- `Duplicate session IDs` 

- `Impossible completion times` 

- `Excessive daily token generation` 

- `Repeated failed validation requests` 

- `Unusual event claim behavior` 

```
Do not automatically punish users based solely on one suspicious event.
```

```
Instead, record signals and allow future moderation tooling.
```

```
# 7. Playground
```

```
Create a dedicated Playground section.
```

```
Suggested route:
```

```
/playground
```

```
or, if Synapse already has a preferred route structure:
```

```
/dashboard/playground
```

```
## Playground layout
```

```
The page should contain:
```

- `Header` 

- `Token balance` 

- `Featured game` 

- `Available games` 

- `Daily reward status` 

- `Current event` 

- `Challenges` 

- `Recently played` 

- `Badges/progress - Locked/upcoming content` 

```
Example:
```

```
PLAYGROUND
```

```
Your Tokens
1,240
Featured
[Game Card]
Games
[Game] [Game] [Game]
Daily Rewards
██████░░
Events
[Current Event]
Achievements
[View Badges]
```

# `## Game cards` 

```
Each game card should display:
```

- `Game name` 

- `Short description` 

- `Icon/thumbnail` 

- `Estimated play time` 

- `Reward range` 

- `Daily reward availability` 

- `Locked/unlocked state` 

- `Event association if applicable` 

```
Do not make reward amounts the only visual focus.
```

```
The games themselves should remain the primary focus.
```

```
# 8. Initial Game Library
```

```
Implement the architecture so games are modular.
```

```
Initial games can include approximately 11 lightweight games.
Use the following conceptual categories:
```

`1. Reaction` 

`2. Memory` 

`3. Rhythm` 

`4. Pattern recognition` 

`5. Timing` 

`6. Logic` 

`7. Visual recognition` 

`8. Audio/music recognition` 

`9. Sequence` 

`10. Precision` 

`11. Speed/accuracy` 

```
The exact games should be implemented as independent modules.
Each game should expose a common interface.
Conceptually:
```

```
GameDefinition
```

```
    id
    name
    description
    category
    icon
    enabled
    featured
    rewardConfig
    difficulty
    estimatedDuration
    component
    validationConfig
```

```
Each game should have:
```

```
- Start state
```

- `Active state` 

- `Completion state` 

- `Results state` 

- `Reward state` 

```
# 9. Game Session Architecture
When a user starts a game:
1. Create a game session.
2. Assign a unique session ID.
3. Record start time.
4. Load game state.
5. Run the game.
6. Record result.
7. Validate result.
8. Determine eligibility for reward.
9. Issue reward through backend.
10. Write analytics.
11. Display result.
Example:
startGame()
    |
    v
createSession()
    |
    v
playGame()
    |
    v
submitResult()
    |
    v
validateResult()
    |
    +-- invalid -> no reward
    |
    +-- valid
            |
            v
        calculateReward()
            |
            v
        issueTokenTransaction()
            |
            v
        updateStats()
            |
            v
        showResults()
```

```
# 10. Reward Rules
Rewards should be predictable.
```

```
Do not use random reward mechanics that resemble gambling.
A reward may be based on:
```

```
- Score
```

- `Accuracy` 

- `Completion` 

- `Difficulty` 

- `Streak` 

- `Challenge conditions` 

```
Example:
```

```
Score 0–49
    10 tokens
Score 50–79
    20 tokens
Score 80–94
    30 tokens
Score 95–100
    40 tokens
```

```
The exact values should remain configurable.
```

```
# 11. Practice vs Rewarded Play
```

```
Games should distinguish between:
```

- `Practice` 

- `Rewarded play` 

```
A user may continue practicing even after reaching their token earning limit.
Example:
```

```
Daily reward limit reached.
```

```
UI:
```

```
Daily game rewards
LIMIT REACHED
```

```
You can still play for practice.
```

```
This prevents the system from artificially blocking gameplay simply because the
user has exhausted rewards.
```

```
# 12. Streaks
```

```
Streaks may be used for:
```

- `Daily activity` 

- `Challenges` 

- `Gameplay participation` 

- `Listening activity` 

```
Avoid making streaks punitive.
```

```
Do not remove large amounts of previously earned tokens because a streak ends.
A streak ending should primarily affect future bonus opportunities.
```

```
# 13. Daily Rewards
```

```
Create a daily reward system.
```

```
Example:
```

```
Day 1
    10 tokens
Day 2
    15 tokens
Day 3
    20 tokens
Day 4
    25 tokens
Day 5
    30 tokens
Day 6
    35 tokens
Day 7
    50 tokens
```

```
The exact reward schedule must be configurable.
```

```
Users should have a clear indication of:
```

- `Current day` 

- `Claimed/unclaimed status` 

- `Next reward` 

- `Reset time` 

```
# 14. Weekly Challenges
```

```
Weekly challenges should encourage normal engagement.
```

```
Examples:
```

- `Complete 3 games` 

- `Complete 5 games` 

- `Listen to music on 3 different days` 

- `Create a playlist` 

- `Use Workshop` 

- `Complete a specific game` 

- `Earn an achievement` 

```
Challenges should have:
```

- `ID` 

- `Name` 

- `Description` 

- `Requirement` 

- `Progress` 

- `Reward` 

- `Start date` 

- `End date` 

- `Enabled state` 

```
# 15. Badges
```

```
Badges are persistent achievements.
```

```
Examples:
```

- `First Game` 

- `First 100 Tokens` 

- `First 1,000 Tokens` 

- `Game Explorer` 

- `Perfect Score` 

- `Weekly Challenger` 

- `Event Participant` 

- `Long-Term Listener` 

- `Playlist Builder` 

- `Workshop Creator` 

```
Badges should not be tied exclusively to spending tokens.
```

```
They should represent meaningful activity.
```

```
## Badge data
```

```
Example:
```

```
badges/{badgeId}
```

```
    name
    description
    icon
    rarity
    requirement
    enabled
```

```
User unlocks:
```

```
users/{uid}/badges/{badgeId}
```

```
    unlockedAt
    progress
    metadata
```

```
# 16. Profile Decorations
```

```
Users may unlock cosmetic decorations.
```

```
Examples:
```

- `Avatar frames` 

- `Profile backgrounds` 

- `Nameplate styles` 

- `Token effects` 

- `Player/profile accents` 

- `Playground profile cards` 

```
Cosmetics should not provide gameplay advantages.
```

```
They are purely visual.
```

```
# 17. Token Spending
```

```
Tokens may eventually be spent on cosmetics.
```

```
Potential purchases:
```

- `Profile decorations` 

- `Avatar frames` 

- `Themes` 

- `Cosmetic effects` 

- `Playground cosmetics` 

- `Other non-competitive customization` 

```
Do not introduce pay-to-win mechanics.
```

```
Do not allow users to spend tokens to increase their real-world monetary value.
Every purchase should create a ledger transaction.
Example:
tokenBalance: 500
Purchase:
    "Neon Profile Frame"
    cost: 200
After:
tokenBalance: 300
Ledger:
    type: cosmetic_purchase
    amount: -200
# 18. Events
Create an event system that allows temporary activities.
Events may include:
```

- `Seasonal events - Community events - Synapse anniversary events` 

- `New feature launch events` 

- `Creator events` 

- `Game-specific events - Listening challenges` 

```
## Event structure
```

```
Example:
events/{eventId}
```

```
    name
    description
    banner
    startAt
    endAt
    enabled
    featured
```

```
    rewards
    challenges
    games
    metadata
```

```
Events should automatically become inactive after their end time.
```

```
Do not rely solely on frontend hiding.
```

```
Backend reward validation must also check the event's active period.
```

# `# 19. Creator Events` 

```
The system should support future creator/community events.
```

```
A creator event could allow a verified creator to host:
```

- `A challenge` 

- `A game event` 

- `A playlist challenge` 

- `A listening challenge` 

- `A community activity` 

```
Creators should not automatically receive unrestricted administrative
capabilities.
```

```
Use explicit permissions/roles.
```

```
Potential future role:
```

```
Content Creator
```

# `or` 

```
Event Creator
```

```
# 20. Superadmin Game Lab
```

```
Create a Superadmin-only development environment called:
```

```
Game Lab
```

```
This is NOT part of the normal public Playground.
```

```
Suggested route:
```

```
/admin/game-lab
```

```
Only Super Admin users may access it.
```

```
The Game Lab should allow Super Admins to:
```

- `Create game definitions` 

- `Edit game metadata` 

- `Enable/disable games` 

- `Preview games` 

- `Test games` 

- `Configure rewards` 

- `Configure difficulty` 

- `Configure limits` 

- `Create draft events` 

- `Test event behavior` 

- `Manage feature flags` 

- `View game analytics` 

- `Move games between development stages` 

```
# 21. Game Development States
```

```
Games should support states such as:
```

```
- Draft
- Internal Testing
- Superadmin Testing
- Staged
- Public
- Disabled
- Archived
Example lifecycle:
Draft
    ->
Internal Testing
    ->
Superadmin Testing
    ->
Staged Release
    ->
Public
```

```
# 22. Feature Flags
Implement centralized feature flags.
Example:
gamificationEnabled
playgroundEnabled
eventsEnabled
badgesEnabled
decorationsEnabled
dailyRewardsEnabled
weeklyChallengesEnabled
gameLabEnabled
```

```
Per-game flags:
```

```
games/{gameId}
```

```
    enabled
    public
    featured
    maintenance
    minimumAppVersion
```

```
Feature flags should be evaluated server-side for security-sensitive behavior.
```

```
# 23. Release Strategy
```

```
Do not expose every planned feature immediately.
```

```
Initial public release should be intentionally limited.
```

```
Suggested first release:
```

```
- Playground
- Small initial game selection
- Token balance
- Basic rewards
- Daily limits
- Basic badges
- Basic analytics
- Anti-abuse
- Feature flags
```

```
Later releases:
```

```
- Additional games
- Events
- Weekly challenges
- Decorations
- Creator events
- More advanced achievements
- Expanded cosmetics
- Game Lab improvements
```

```
# 24. Firebase Data Model
Suggested structure:
users/{uid}
gamification:
    tokenBalance
    lifetimeTokensEarned
    lifetimeTokensSpent
    dailyGameTokensEarned
    weeklyGameTokensEarned
    lastDailyReset
    lastWeeklyReset
    currentStreak
    longestStreak
users/{uid}/badges/{badgeId}
users/{uid}/decorations/{decorationId}
users/{uid}/gameSessions/{sessionId}
users/{uid}/challenges/{challengeId}
gamificationTokenLedger/{transactionId}
games/{gameId}
events/{eventId}
challenges/{challengeId}
decorations/{decorationId}
featureFlags/{flagId}
```

```
gamificationConfig/{configId}
```

```
gamificationAuditLogs/{logId}
```

```
# 25. Firebase Security
```

```
Do not depend on React/UI restrictions.
```

```
A user hiding a button does not constitute authorization.
```

```
Firebase Security Rules and trusted backend functions must enforce permissions.
```

```
Users should be able to read their own:
```

- `Token balance` 

- `Game history` 

- `Badges` 

- `Decorations` 

- `Challenges` 

- `Personal statistics` 

```
Users must NOT be able to directly modify:
```

- `Token balance` 

- `Lifetime token totals` 

- `Reward history` 

- `Badge unlock timestamps` 

- `Event reward claims` 

- `Admin-only configuration` 

- `Game definitions` 

- `Global reward configuration` 

```
Admin permissions should be based on the existing Synapse role architecture.
```

```
Do NOT make someone an admin solely because their email matches a hardcoded
address.
```

```
Use the existing custom-claims/server-controlled role model.
```

```
Keep role and account status separate.
```

```
Possible roles include:
```

- `User` 

- `Moderator` 

- `Support Agent` 

- `Content Manager` 

- `Developer` 

- `Admin` 

- `Super Admin` 

```
Possible account statuses include:
```

- `Active` 

- `Suspended` 

- `Disabled` 

- `Pending` 

```
# 26. Server Authority
```

```
The server/backend is authoritative for:
```

- `Token balances` 

- `Reward amounts` 

- `Reward eligibility` 

- `Game reward limits` 

- `Event eligibility` 

- `Badge unlocks` 

- `Challenge completion` 

- `Cosmetic purchases` 

- `Economy configuration` 

```
The frontend is responsible for:
```

- `Display - Interaction - Animation - Game rendering - User feedback - Local temporary state` 

```
# 27. Analytics
```

```
Track gamification usage without collecting unnecessary personal information.
```

```
Useful events:
```

```
game_started
game_completed
game_failed
game_rewarded
game_reward_denied
daily_reward_claimed
weekly_challenge_started
weekly_challenge_completed
badge_unlocked
decoration_unlocked
decoration_equipped
token_earned
token_spent
event_started
event_completed
event_reward_claimed
game_session_invalidated
```

```
Important aggregate metrics:
```

- `Daily active Playground users` 

- `Weekly active Playground users` 

- `Games played` 

- `Games completed` 

- `Average sessions per user` 

- `Rewarded sessions` 

- `Practice sessions` 

- `Tokens earned` 

- `Tokens spent` 

- `Badge unlocks` 

- `Event participation` 

- `Challenge completion` 

- `Game retention` 

- `Reward-limit reach rate` 

```
Do not expose sensitive internal anti-abuse information to ordinary users.
```

```
# 28. Admin Analytics
```

```
The Admin Dashboard should eventually include:
```

```
## Gamification Overview
```

```
- Total Playground users
- Games played today
- Games played this week
- Tokens generated
- Tokens spent
- Active events
- Active challenges
```

# `## Economy` 

```
- Total tokens earned
- Total tokens spent
- Token generation by source
- Token spending by source
- Unusual token-generation patterns
```

```
## Games
```

```
- Most played games
- Completion rates
- Average scores
- Average sessions
- Reward distribution
- Error rates
```

# `## Events` 

```
- Participants
- Completion rate
- Rewards distributed
- Start/end activity
```

```
# 29. Audit Logging
```

```
Administrative actions must be logged.
```

```
Examples:
```

- `Game created` 

- `Game edited` 

- `Game enabled` 

- `Game disabled` 

- `Reward configuration changed` 

- `Event created` 

- `Event modified` 

- `Feature flag changed` 

- `Token balance manually adjusted` 

- `Decoration created` 

- `Challenge modified` 

```
Example:
```

```
gamificationAuditLogs/{logId}
```

```
    actorId
    actorRole
    action
    targetType
    targetId
    timestamp
    previousValue
    newValue
    reason
    metadata
```

```
# 30. Manual Token Adjustments
Super Admins may need to correct token balances.
Do not allow:
    set balance = X
without an audit trail.
Instead:
    adjustment transaction
        amount: +X / -X
        reason: required
        actor: required
        timestamp: required
The adjustment should appear in the ledger.
Require a reason for manual adjustments.
```

```
# 31. UI Integration
Gamification should integrate with the existing Synapse visual language.
Do not create a completely separate visual identity.
```

```
Use existing:
```

- `Theme system` 

- `Typography` 

- `Buttons` 

- `Cards` 

- `Navigation` 

- `Modal system` 

- `Notifications` 

- `Responsive behavior` 

```
The token balance can appear in appropriate locations such as:
```

- `Dashboard - Playground` 

- `Profile` 

- `Event pages` 

```
Do not permanently place a large token counter across every page.
```

```
Gamification should remain optional.
```

# `# 32. Notifications` 

```
Use subtle notifications for:
```

- `Reward earned` 

- `Badge unlocked` 

- `Challenge completed` 

- `Event started` 

- `Daily reward available` 

- `Daily reward claimed` 

- `New game released` 

```
Avoid excessive notifications.
```

```
Users should not feel pressured to constantly interact with the gamification
system.
```

# `# 33. Accessibility` 

```
Games and gamification UI should support:
```

- `Keyboard navigation where practical` 

- `Screen readers for menus and controls` 

- `Clear focus states` 

- `Sufficient contrast` 

- `Reduced-motion preferences` 

- `Responsive layouts` 

- `Non-color-only indicators` 

```
Animations should respect:
```

```
prefers-reduced-motion
```

# `# 34. Mobile/Responsive Behavior` 

```
The Playground must work on:
```

- `Desktop` 

- `Laptop` 

- `Tablet` 

- `Mobile` 

```
Game interfaces should adapt to smaller screens.
```

```
Do not design games that require hover-only interactions.
```

```
Touch controls should be supported where applicable.
```

```
# 35. Game Component Contract
```

```
Create a consistent contract for all games.
```

```
Conceptually:
```

```
GameComponent
```

```
    initialize()
    start()
```

```
    pause()
    resume()
    reset()
    submit()
    getResult()
    cleanup()
```

```
The exact implementation should follow the existing Synapse architecture.
Do not duplicate token/economy logic inside every game.
Games should only report their result.
```

```
The central gamification system handles rewards.
```

```
# 36. Configuration
```

```
Reward values, limits, and event settings should be configurable.
Do not scatter constants across game files.
```

```
Centralize configuration.
```

```
Example:
```

```
gamificationConfig:
```

```
    dailyGameTokenCap
    weeklyGameTokenCap
    dailyRewardAmount
    maxSessionsPerMinute
    defaultGameReward
    enabledGames
    enabledEvents
```

```
Game-specific:
```

```
gameRewardConfig:
```

```
    baseReward
    maxReward
    difficultyMultiplier
    dailyCap
    enabled
```

```
# 37. Error Handling
```

```
The UI must clearly handle:
```

- `Game failed to load` 

- `Session creation failed` 

- `Reward validation failed` 

- `Network interruption` 

- `Event expired` 

- `Daily reward already claimed` 

- `Daily game limit reached` 

- `Invalid session` 

- `Feature disabled` 

- `Game under maintenance` 

```
Do not show raw Firebase errors to normal users.
```

```
Provide readable messages.
```

```
Example:
```

```
"Your game result could not be verified, so no reward was issued."
```

- `# 38. Offline Behavior` 

```
Do not award tokens based solely on offline client activity.
```

```
A game may be playable offline if the architecture allows it, but reward
issuance must be validated once the user reconnects.
```

```
If validation cannot be completed safely:
```

- `Store the temporary result locally if appropriate` 

- `Do not display the reward as permanently earned` 

- `Sync/validate through the backend later` 

# `# 39. Performance` 

```
Games should be lightweight.
```

```
Avoid loading every game asset when Playground opens.
```

```
Use lazy loading where appropriate.
```

```
Only load a game when the user launches it.
```

```
Avoid unnecessarily large animations, images, or audio assets.
```

# `# 40. Data Retention` 

```
Game sessions should not grow indefinitely without consideration.
```

```
Determine a retention policy for detailed session records.
```

```
Aggregate statistics should be retained longer than raw session details where
appropriate.
```

```
Never delete financial-like ledger history simply to reduce storage.
```

```
Tokens are virtual, but the ledger is still important for auditing the economy.
```

- `# 41. Testing Requirements` 

# `## Economy tests` 

```
Verify:
```

- `Token balances update correctly` 

- `Duplicate rewards are rejected` 

- `Negative balances cannot occur` 

- `Token caps work` 

- `Daily resets work` 

- `Weekly resets work` 

- `Ledger entries are created` 

- `Manual adjustments are logged` 

```
## Game tests
```

```
Verify:
```

- `Game loads` 

- `Game starts` 

- `Game ends` 

- `Score is recorded` 

- `Invalid scores are rejected` 

- `Reward is issued once` 

- `Practice mode does not incorrectly issue rewards` 

# `## Event tests` 

```
Verify:
```

- `Event becomes active at start` 

- `Event becomes inactive at end` 

- `Rewards cannot be claimed after expiration` 

- `Duplicate claims are rejected` 

# `## Security tests` 

```
Attempt to:
```

- `Directly edit token balance` 

- `Directly unlock badges` 

- `Directly claim rewards` 

- `Modify game configuration` 

- `Access Game Lab as a normal user` 

- `Modify another user's data` 

- `Replay reward requests` 

```
All unauthorized attempts must fail.
```

```
# 42. Development Phases
```

```
## Phase 1 — Foundation
```

```
Implement:
```

- `Gamification data model` 

- `Token balance` 

- `Token ledger` 

- `Backend reward service` 

- `Security rules` 

- `Basic configuration` 

- `Feature flags` 

- `Audit logging` 

```
Do not build all games yet.
```

```
## Phase 2 — Playground
```

```
Implement:
```

- `Playground page` 

- `Game cards` 

- `Token balance` 

- `Game launching` 

- `Game session management` 

- `Results UI` 

- `Practice mode` 

```
## Phase 3 — Initial Games
Implement the first group of lightweight games.
Each game must use the shared GameComponent contract.
Do not duplicate economy logic.
```

```
## Phase 4 — Rewards
```

```
Implement:
```

- `Daily limits - Weekly limits` 

- `Reward validation` 

- `Daily rewards` 

- `Streaks` 

- `Basic challenges` 

```
## Phase 5 — Achievements
```

```
Implement:
```

- `Badges` 

- `Progress tracking` 

- `Badge unlocks` 

- `Profile display` 

```
## Phase 6 — Events
```

```
Implement:
```

- `Event model` 

- `Event UI` 

- `Event rewards` 

- `Event challenges` 

- `Expiration handling` 

```
## Phase 7 — Cosmetics
```

```
Implement:
```

- `Decorations` 

- `Cosmetic inventory` 

- `Cosmetic equipping` 

- `Token purchases` 

```
## Phase 8 — Game Lab
```

```
Implement Superadmin-only:
```

- `Game management` 

- `Game testing` 

- `Reward configuration` 

- `Event drafts` 

- `Feature flags` 

- `Analytics` 

```
## Phase 9 — Analytics and Hardening
```

```
Implement:
```

- `Admin analytics` 

- `Anti-abuse signals` 

- `Audit logs` 

- `Rate limiting` 

- `Security testing` 

- `Performance optimization` 

```
# 43. Initial Public Release
```

```
The initial public release should NOT expose every planned system.
```

```
Start with:
```

- `Playground` 

- `Initial games` 

- `Token balance` 

- `Token rewards` 

- `Daily limits` 

- `Practice mode` 

- `Basic badges` 

- `Basic analytics` 

- `Feature flags` 

- `Anti-abuse` 

- `Firebase security` 

```
Keep unreleased systems behind feature flags.
```

```
# 44. Future Expansion
```

```
The architecture should leave room for:
```

- `More games` 

- `More game categories` 

- `Seasonal events` 

- `Creator events` 

- `Community challenges` 

- `Additional badges` 

- `Profile cosmetics` 

- `Theme unlocks` 

- `Social achievements` 

- `Multiplayer games` 

- `Music-based games` 

- `Workshop integration` 

- `Collaboration-based challenges` 

- `Synapse Pro-related cosmetic rewards` 

```
Do not implement these simply because the architecture supports them.
```

```
Build the foundation so they can be added later.
```

```
# 45. Important Product Constraints
```

```
Do not:
```

- `Turn Synapse into a gambling product` 

- `Add wagering` 

- `Add gambling-style mechanics` 

- `Let users buy chances at rewards` 

- `Let clients directly award tokens` 

- `Trust client-submitted token amounts` 

- `Trust client-submitted reward eligibility` 

- `Store passwords manually` 

- `Use email matching as the only admin authorization mechanism` 

- `Put admin controls exclusively in the frontend` 

- `Make cosmetics provide gameplay advantages` 

- `Force users to play games` 

- `Make gamification dominate the music-player experience` 

# `# 46. Cursor Implementation Rules` 

```
Before modifying the project:
```

`1. Inspect the existing Synapse architecture.` 

`2. Identify the current Firebase setup.` 

`3. Identify the existing user/admin role system.` 

`4. Identify the existing routing system.` 

`5. Identify the existing theme/component system.` 

`6. Identify existing dashboard structures.` 

`7. Reuse existing components whenever practical.` 

`8. Do not replace working systems unnecessarily.` 

`9. Follow existing naming conventions.` 

`10. Keep gamification modular.` 

```
Do not create an isolated second authentication system.
```

```
Do not create a second unrelated admin system.
```

```
Use the existing Synapse infrastructure.
```

# `# 47. Recommended Folder Structure` 

```
Adapt this to the actual Synapse project rather than blindly creating every
folder.
```

# `Example:` 

```
src/
```

```
    gamification/
        components/
        games/
            game-01/
            game-02/
            game-03/
        hooks/
        services/
        types/
        utils/
        config/
        analytics/
        rewards/
```

```
    pages/
```

```
        Playground/
        Events/
        Badges/
```

```
    admin/
        GameLab/
        GamificationAnalytics/
```

```
Backend:
```

```
functions/
    gamification/
        rewards/
        games/
        events/
        challenges/
        admin/
        validation/
```

```
Again, use the project's existing architecture if equivalent structures already
exist.
```

# `# 48. Definition of Done` 

```
The gamification system is considered ready for the initial release when:
```

- `Playground exists` 

- `Initial games can be launched` 

- `Game sessions have unique IDs` 

- `Results are validated` 

- `Tokens are awarded server-side` 

- `Duplicate rewards are prevented` 

- `Daily limits work` 

- `Weekly limits work` 

- `Token balances persist` 

- `Token ledger records every balance change` 

- `Users cannot directly modify their token balances` 

- `Users cannot unlock badges through direct Firestore writes` 

- `Practice mode works` 

- `Basic badges work` 

- `Feature flags work` 

- `Admin permissions use the existing role architecture` 

- `Superadmin-only functionality is protected` 

- `Analytics events are recorded` 

- `Audit logs work` 

- `Responsive UI works` 

- `Accessibility requirements are addressed` 

- `Error states are handled` 

- `No gambling mechanics are present` 

- `The music-player experience remains the primary Synapse product` 

# `# 49. Final Implementation Principle` 

```
The most important architectural principle is:
```

```
    Games generate results.
    The backend validates results.
    The economy generates rewards.
    The ledger records rewards.
    Firebase security controls access.
    Analytics records behavior.
    The UI displays the result.
```

# `Never reverse this relationship.` 

```
The client should never be the authority over the economy.
```

```
The gamification system should be designed as a modular subsystem of Synapse
that can grow from a small collection of games into a larger
events/achievement/cosmetic ecosystem without requiring the core music-player
architecture to be rewritten.
```

