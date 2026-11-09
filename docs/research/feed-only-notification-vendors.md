# Which hosted notification vendor fits Cadence if the Notification Feed is the only channel?

Research for [#7](https://github.com/gugelhupf50/cohort-005-project/issues/7), child of the map [#5](https://github.com/gugelhupf50/cohort-005-project/issues/5). Sources are official vendor docs, pricing pages, SDK READMEs and the npm registry, all read on 2026-11-09. Prices change, so re-check them before signing up.

Scope: the only channel is an in-app Notification Feed. The vendor sends no email, there is no web push, and there are no Notification preferences. Volume assumption: about 3,000 Notifications a month across Students, Instructors, Platform Admins and Team Admins, each delivered to one Notification Feed. Every vendor counts per recipient, so a Notification fanned out to 200 Students counts as 200 units. That means "low thousands" means low thousands of recipient-deliveries.

## Recommendation (input to #8, "Which vendor does Cadence use?")

The decision is made in #8. This is input to it.

- **Vendor pick: Knock.** It still fits best.
  - Its free plan covers 10K messages a month [1].
  - It has a documented headless feed with unread and unseen counts, seen/read/archive actions and a WebSocket [3][4].
  - Its user tokens are server-signed RS256 JWTs with `exp`, and the Node SDK ships a `signUserToken` helper [2][5].
  - The free plan has unlimited isolated environments [1].
- **Runner-up: Courier.** It is the best fit for the DevUI switcher, because its docs say to call `signIn({ userId, jwt })` again when the user changes and `signOut` to tear down [10]. Its pricing curve is also the gentlest: 10K sends free, then $0.005 per send with no platform fee [9][11].
- **SuprSend is now viable.** It was ruled out before only because of preferences.
- **Build it ourselves on SQLite is a serious baseline.** It was not researched in depth. A Feed-only scope removes most of what a vendor adds: channel routing, push, email and preferences. What remains is a `notifications` table, a loader for the list and counts, an action to mark read/seen/archive, and polling or revalidation instead of a WebSocket. That fits the existing `MailTransport` and `.outbox/` pattern with no network at all. #8 should weigh it against Knock explicitly.

## Comparison

| | Knock | Novu Cloud | MagicBell | Courier | SuprSend | Engagespot |
|---|---|---|---|---|---|---|
| Free volume, and what is counted | 10K messages/mo. 1 message = 1 user on 1 channel. No hard cap [1] | 10K workflow runs/mo. "Workflow run" is undefined on the page [6] | **1K deliveries/mo.** Counted per channel per user [12] | 10K sends/mo. 1 send = 1 template to 1 recipient, all environments incl. Test [9][11] | 10K notifications/mo. Per user per channel, in-app included [15] | Unknown: pricing unreachable [21] |
| Free retention, MAU | 30-day logs, unlimited feed retention. No MAU cap on messages (500 is the cap for Guides only) [1] | 24h activity feed. Inbox 30 days per the limits doc, which may be dated. Unlimited subscribers [6][8] | Not stated. "Unlimited Users" [12] | Not stated on pricing [9] | 30-day logs. Inbox retention not stated [15] | Unknown |
| Headless feed | `useNotifications`, `useNotificationStore`. REST list with `unread_count`/`unseen_count`. Mark seen/read/archive. WebSocket [3][4] | `useNotifications`, `useCounts` (unread/unseen/total), `read`, `archive`. WebSocket events [7] | REST: list, count unread, mark read/seen, read-all/seen-all, archive [13]. `react-headless` package exists [14]. Transport not stated | `useCourier()` inbox surface. `getMessages`, `getUnreadCounts`, `read`/`unread`/`open`/`archive`. WebSocket. No "seen", `open` is the closest [10b][10c] | `useFeedData` (`@suprsend/react-core`). `markAsSeen`/`markAsRead`/`markAsArchived`. Socket [16][17] | `useFeed`, `useUnseenCount`, `useActions` (read, seen, delete). No archive. Realtime transport not named [20] |
| Client auth | RS256 JWT signed by our server, `sub` required, `exp` recommended. Enhanced security is **off by default** and "should" be enabled in prod. No plan gating stated [2] | HMAC-SHA256(secret, subscriberId). Static, no expiry. Docs conflict on whether it is mandatory [7b][7c][7d] | HS256 JWT signed with the project secret. Doc examples use 1-year expiry [13b] | JWT from `POST /auth/issue-token` with `user_id:` scope and optional `expires_in` (no expiry if omitted). Algorithm not stated [10] | ES256 JWT with `entity_id`, `exp`, `iat`. Enhanced security is optional, recommended for prod. `refreshUserToken` callback [16b] | JWT `userToken` from `generateUserToken` with a signing key. "Production apps must enable secure mode." Algorithm and expiry not stated [20][20b] |
| DevUI switcher fit | Good. Server signs a token per request. `KnockProvider` `enabled` toggles logout/login. Behaviour on `userId` change is undocumented [5b] | Good mechanically (a hash per subscriberId), but the hash is a permanent credential | Good mechanically. Token passed as a provider prop. Switching is undocumented [14b] | **Best.** `signIn` again on user change, `signOut` clears and disconnects [10] | Good. `identify(id, token)`. Re-identify is implied, not documented [16b] | Unknown |
| Node SDK (latest on npm) | `@knocklabs/node` 1.41.0, 2026-11-03 [22] | `@novu/api` 3.19.1, 2026-09-02, "in beta" [7e][22] | `magicbell-js` 1.8.0, 2026-07-29 [22] | `@trycourier/courier` 10.0.0, 2026-10-29 [22] | `@suprsend/node-sdk` 1.15.1, 2026-05-19 [22] | `@engagespot/node` 1.7.0, **2024-11-06** [22] |
| Local / offline | None. CLI pulls and pushes workflows against Knock [18]. Base URL can be overridden (`baseURL`/`KNOCK_BASE_URL`, client `host`) [23] | **Self-host via Docker** (API, worker, ws, dashboard + MongoDB + Redis). Inbox components work self-hosted [19][19b] | None found. `baseUrl` override [23] | None. Test env is cloud and billed [11]. `baseURL` / `apiUrls` overrides [23] | None found. `host` / `socketHost` overrides [23] | None found |
| First paid tier, overage | Starter $250/mo for 50K, then $0.005 [1] | Pro from $30/mo for 30K, then $1.20/1K [6] | Startup $249/mo for 50K, then $0.0025 [12] | Business: pay-as-you-go $0.005/send [9] | Essentials $100/mo for 50K, then $2/1K. Free shows SuprSend branding on the feed [15] | Unknown |

## Notes per vendor

- **Knock.**
  - The free tier is ample for Feed-only volume, and feed retention is unlimited [1].
  - `signUserToken` defaults to a 3600s expiry, and `onUserTokenExpiring` handles refresh on the client [2]. That fits a server-minted-per-request model.
  - **Correction to the prior report:** enhanced security is not mandatory in production. It is off by default, and the docs say production "should" enable it [2]. Cadence must turn it on deliberately.
  - The prior report's claim that preference-suppressed messages are not billed cites the Messages concept page [1b in that report]. That page says nothing about billing. Moot under Feed-only.
  - The React headless page shows only `userId` + `apiKey`. The token is passed as `userToken`, per the package README [4][5b].
- **Novu Cloud.**
  - It is the cheapest paid step and the only vendor with a real local server. Self-hosting needs MongoDB and Redis, and has a one-team-member limit and no snooze [19][19b].
  - Auth is still a static HMAC with no expiry [7b].
  - The prepare-for-production page calls HMAC an optional toggle [7b]. Novu's own skill reference says "HMAC is mandatory in production" [7c]. A July 2026 security advisory says HMAC is "not enabled on the in-app integration (the default)" and that `POST /v1/inbox/session` then issues a JWT for any subscriberId [7d]. So treat it as opt-in.
  - The Node SDK README says it is in beta with possible breaking changes [7e].
- **MagicBell.**
  - **Confirmed:** the free tier is 1,000 deliveries a month, and the next step is $249 [12]. At about 3,000 Feed deliveries a month this is over the free tier from day one. The FAQ says extra deliveries are "charged per use", but no Builder overage rate is listed.
  - Auth is HS256 with a shared project secret [13b]. That is weaker than the asymmetric keys at Knock and SuprSend, but it does expire if you set `exp`.
  - The in-app channel page describes only prebuilt components [14c]. Headless use relies on the REST endpoints [13] or the `react-headless` package [14].
- **Courier.**
  - Counting is the friendliest: one template to one recipient is one send, regardless of channel [11].
  - Test-environment sends are billed [11], so local development should not hit Courier at all.
  - The token algorithm is not documented, and a missing `expires_in` creates a token that never expires [10]. Cadence must always set `expires_in`.
  - Courier Inbox has "no fee of its own" beyond the send [11].
- **SuprSend.**
  - With preferences out of scope, its earlier disqualifier is gone.
  - It has ES256 tokens with a refresh callback [16b], 10K free [15] and a cheaper first paid tier than Knock.
  - Weak points:
    - The Free plan shows SuprSend branding on the in-app feed [15]. Whether that applies to a headless UI is unstated.
    - The headless React docs are inconsistent about counts and package names [17].
    - The Node SDK was last published in May 2026 [22].
- **Engagespot.**
  - The pricing page is still unreachable: `engagespot.co/pricing` returned 404, and `www.engagespot.com` failed the TLS handshake [21].
  - The docs show a reasonable hooks API and a secure mode [20][20b].
  - `@engagespot/node` has not been published since 2024-11 [22].
  - Not recommendable without pricing.

## Fake-transport seam (criterion 5)

The trigger side fits the `MailTransport` pattern for every vendor. Define a `NotificationTransport` with a vendor implementation used when the API key is set, and an outbox implementation otherwise. The outbox can write JSON to `.outbox/`, or better, insert into a local SQLite table.

The read side is the hard part. Each vendor's feed hooks talk from the browser directly to the vendor. There are two ways to fake it:

- **Point the client SDK at a local mock server.** All SDKs inspected expose a base-URL override: Knock `host`, Novu `backendUrl`/`socketUrl`, Courier `apiUrls`, SuprSend `host`/`socketHost`, MagicBell `baseUrl` [23]. But no vendor ships an official mock, so we would write and maintain one, WebSocket included.
- **Hide the feed behind our own `FeedSource` interface and hooks.** Use vendor hooks in production and a SQLite-backed loader offline.

Novu is the exception: its self-hosted Docker stack is a real local backend [19]. The cost is MongoDB, Redis and a heavier dev setup. The second option above is the same code as the build-it-ourselves baseline, which strengthens that baseline.

## What changes under Feed-only criteria

- **Web push and email no longer differentiate.** MagicBell's and SuprSend's native VAPID web push, and Knock's FCM-only push, are now irrelevant.
- **Preferences no longer differentiate.** SuprSend's Business-plan gating of preferences [15] stops being disqualifying.
- **Per-channel counting matters less.** With one channel, Knock's, MagicBell's and SuprSend's per-channel units equal Courier's per-recipient units. The prior report's "in-app + email = 2" penalty disappears.
- **Novu's auth weakness still matters.** A static, non-expiring hash, opt-in by default [7b][7d], is unchanged by scope.
- **MagicBell's limit is still 1K, now confirmed** [12]. It is still too small for the assumed volume.
- **A correction carried forward.** Knock's enhanced security is recommended, not enforced [2].
- **The vendor value proposition shrinks.** Without multi-channel orchestration, a vendor mainly buys a hosted feed store, real-time delivery and prebuilt hooks. That is why the SQLite baseline deserves a place in #8.

## Weak evidence / unreachable sources

- **Engagespot:**
  - The pricing page is unreachable (404 or TLS failure) [21], so free tier, counting and paid tiers are unknown.
  - The token algorithm and expiry are undocumented in the pages found [20b].
- **Novu:**
  - "Workflow run" is not defined on the pricing page; the FAQ answer did not render [6].
  - Inbox retention (30 days on Free) comes from a limits page that may be dated [8].
  - The docs conflict on whether HMAC is mandatory [7b][7c][7d].
- **MagicBell:**
  - Retention is not stated, and there is no Builder overage rate [12].
  - The real-time transport is not stated [14c].
  - Exact REST paths were not readable: the reference page's table of contents lists the operations, but their bodies were truncated [13].
- **Courier:**
  - The JWT algorithm is not stated [10].
  - Retention is not stated [9].
- **SuprSend:**
  - Inbox retention is not stated [15].
  - Whether Free-plan branding applies to headless UIs is not stated.
  - Unseen-count hook names are inconsistent across docs [17].
- **Knock:** behaviour when `KnockProvider`'s user changes is undocumented. Only the `enabled` toggle is described [5b].
- **Offline mocks:** no vendor documents an official offline mock. "None found" means not found in the docs searched, not confirmed absent.
- **SDK base-URL overrides** [23] come from grepping the published npm packages' code, not from prose docs.

## Sources

All read 2026-11-09.

1. Knock pricing, https://knock.app/pricing
2. Knock, Security and authentication, https://docs.knock.app/in-app-ui/security-and-authentication
3. Knock, In-app API overview, https://docs.knock.app/in-app-ui/api-overview
4. Knock, React headless feed, https://docs.knock.app/in-app-ui/react/headless/feed
5. `@knocklabs/node` README, https://github.com/knocklabs/knock-node
5b. `@knocklabs/react` README, https://github.com/knocklabs/javascript/tree/main/packages/react
6. Novu pricing, https://novu.co/pricing
7. Novu, Headless Inbox API reference, https://docs.novu.co/platform/inbox/headless/api-reference
7b. Novu, Prepare Inbox for production, https://docs.novu.co/platform/inbox/prepare-for-production
7c. Novu, Inbox integration skill: security reference, https://docs.novu.co/.mintlify/skills/inbox-integration/references/security
7d. Novu security advisory GHSA-wjx8-c9gq-37gg (published 2026-07-08), https://github.com/novuhq/novu/security/advisories/GHSA-wjx8-c9gq-37gg
7e. `@novu/api` README, https://github.com/novuhq/novu-ts
8. Novu, Limits, https://docs.novu.co/platform/developer/limits (via search result summary, not fetched directly)
9. Courier pricing, https://www.courier.com/pricing
10. Courier, Inbox authentication, https://www.courier.com/docs/platform/inbox/authentication
10b. Courier, JS SDK, https://www.courier.com/docs/sdk-libraries/courier-js-web
10c. Courier, React SDK (`useCourier`), https://www.courier.com/docs/sdk-libraries/courier-react-web
11. Courier, Billing, https://www.courier.com/docs/workspaces/billing
12. MagicBell pricing, https://www.magicbell.com/pricing
13. MagicBell, API reference, https://www.magicbell.com/docs/api/reference
13b. MagicBell, User authentication, https://www.magicbell.com/docs/api/authentication/user
14. `magicbell-js` monorepo README, https://github.com/magicbell/magicbell-js
14b. MagicBell, React library, https://www.magicbell.com/docs/libraries/magicbell-react
14c. MagicBell, In-app channel, https://www.magicbell.com/docs/channels/in_app
15. SuprSend pricing (plans and FAQ), https://www.suprsend.com/pricing
16. SuprSend, JS in-app feed, https://docs.suprsend.com/docs/js-inapp-feed
16b. SuprSend, Client authentication, https://docs.suprsend.com/docs/client-authentication
17. SuprSend, Headless feed (React), https://docs.suprsend.com/docs/react-sdk-headless-feed ; Inbox overview, https://docs.suprsend.com/docs/inbox-overview
18. Knock CLI, https://docs.knock.app/developer-tools/knock-cli
19. Novu, Deploy with Docker, https://docs.novu.co/community/self-hosting-novu/deploy-with-docker
19b. Novu, Self-hosted and Novu Cloud, https://docs.novu.co/community/self-hosted-and-novu-cloud
20. Engagespot, React hooks reference, https://docs.engagespot.co/docs/sdks-n-libraries/frontend/react-hooks/reference/
20b. Engagespot, Node SDK, https://docs.engagespot.co/docs/sdks-n-libraries/backend-sdks/node/
21. Engagespot pricing, https://engagespot.co/pricing (HTTP 404), https://www.engagespot.com/pricing (TLS error)
22. npm registry metadata (latest version and publish time), https://registry.npmjs.org/{package} for each package named above
23. Published npm tarballs inspected for base-URL options: `@knocklabs/client` 0.23.1, `@knocklabs/node` 1.41.0, `@novu/js` 3.19.2, `@novu/api` 3.19.1, `magicbell-js` 1.8.0, `@trycourier/courier` 10.0.0, `@trycourier/courier-js` 3.7.1, `@suprsend/web-sdk` 5.4.0
