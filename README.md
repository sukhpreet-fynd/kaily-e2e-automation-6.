# kaily-e2e-automation-6.

Playwright TypeScript post-deployment sanity automation suite for Kaily.  7.

## P0 sanity foundation

This repository targets an **allowlist** of authorized environments defined in
`src/config/env.ts`. Select the active one with `KAILY_ENV=prod|uat` (default `prod`).

| Env | Console | Org |
| --- | --- | --- |
| `prod` | `https://console.fynd.com/kaily/asia-south1/` | `e6af7bff-e89d-467b-9efe-69a2c9ad0957` |
| `uat`  | `https://console.uat.fyndx1.de/kaily/asia-south1/` | `1e31f28f-f6bd-45b6-995d-fd02076d6d78` |

Both tuples (console URL + org + API host + API origins) are hard-coded as
approved pairs. Any mismatch — wrong env, swapped org, foreign API host — is
rejected before a request is made. Other organizations remain blocked at the
account-scope guard and will trigger a browser navigation abort.

## Continuous integration

`.github/workflows/ci.yml` runs offline checks (typecheck + unit + SCA) on every
PR and push to `main`. The live UAT job (api + ui + security) runs nightly at
20:00 UTC and on manual dispatch; it depends on two repository secrets:

- `KAILY_AUTH_STATE_B64_UAT` — base64 of a locally captured `.auth/user.json`
  for the UAT org. Capture via `npm run auth:setup` (with `KAILY_ENV=uat`), then
  `base64 -i .auth/user.json | pbcopy` and paste as the secret. Refresh when it
  expires. The workflow decodes into `.auth/user.json` with mode 0600 for the run.
- `KAILY_BEARER_UAT` (optional) — a short-lived UAT bearer used by the on-demand
  `k6-smoke` job. Capture with `npm run load:bearer`. If missing, the k6 job
  only runs the no-auth health scenario.

## Implemented scope

- Interactive SSO session capture and a separate saved-session validation project.
- Helpdesk loading and visible thread rows.
- An opt-in, API-injected inbound text scenario with unique synthetic data.
- Ownership/credential preflight, API persistence polling, exact UI text and timestamp checks.
- A small inbound adapter interface for future channels.

This is **API-injected web-labelled coverage**, not proof of widget/provider ingress.
No outbound replies, notes, external provider calls, DB operations, cleanup, or Git
operations are implemented. Test records are retained. Message insertion itself
can trigger configured integrations, automations and notifications; isolation must
be established before enabling inbound writes. The isolation flag records operator
confirmation, not an automated verification of every server-side side effect.

## Suite layers

Four Playwright projects and a k6 load layer sit on top of the shared `.auth/user.json`
session. All layers are additive: the P0 flow still runs the same way; the new layers
reuse the same login and never re-enter MFA.

| Layer | Scope | How to run |
| --- | --- | --- |
| `api` | Read-only typed clients for threads, copilotapps, settings, analytics, audit, developers, agent-users and health probes. All GETs enforce the approved-org guard, map 401 to a session re-login prompt, and never log bodies or headers. | `npm run test:api` (health-only: `npm run test:api:health`) |
| `ui` | Lightweight Playwright specs for Insights, My Agents, API Keys (Helpdesk settings), Contacts, Teams, and a cross-page navigation smoke that fails only on hard `pageerror`. Page objects live under `src/pages/`. | `npm run test:ui` |
| `security` | Static authz probes: 401 on missing/malformed bearer, 403 on wrong-org accountId (tenant isolation via the Neo `account-parser` middleware), public-API bearer-only auth, and a header-leakage guard that asserts tracing/screenshots stay off. Opt-in 10-GET rate-limit probe behind `KAILY_PROBE_RATE_LIMITS=true`. | `npm run test:security` |
| `contract` | Response-shape guards: thread list / detail, messages, copilot apps, health, audit, developer scopes. Fail loudly when the server renames or retypes a field the UI depends on. | `npm run test:contract` |
| `load` (k6) | 10 scenarios: `_healthz`, `health-concurrent`, threads list, copilotapps list, copilotapps detail, thread messages, analytics, settings, audit, agent-users. `smoke` / `baseline` / `stress` / `health-soak` profiles with SLO thresholds. Rate-limit math respects the Neo `6/60s` cap; `stress` is only allowed on `health-concurrent`. | `brew install k6`, then `npm run load:bearer` once to stash a short-lived bearer in `.auth/bearer`, then `export K6_BEARER=$(cat .auth/bearer); npm run load:health` (etc). Full workflow in `tests/load/README.md`. Never run `K6_PROFILE=stress` against prod. |
| SCA | `npm audit --json` with a severity gate + lockfile freshness gate (fails if `package-lock.json` is >7d older than `package.json`). | `npm run audit:sca`. Combine with security specs via `npm run security:all`. |

All five layers depend on the `auth` project and reuse `.auth/user.json`; email,
password and OTP are never re-entered per layer. Bearer tokens stay in memory —
only `scripts/capture-bearer.ts` ever writes one to disk, atomically with mode 0600,
into the gitignored `.auth/bearer` file to bridge Playwright to k6.

## Offline checks (no Kaily traffic)

Requires Node 24+.

```sh
npm run typecheck
npm test
npm run test:list
```

`npm test` intentionally runs only offline unit tests. API mocks exist solely in
`tests/unit`; production P0 tests never mock application responses.

## Manual authentication: do this first

No `.env` or API configuration is needed for this step. Use the approved account.

```sh
npm run auth:setup
```

1. A **headed** Playwright browser opens Kaily's login page and follows its SSO redirect.
2. Enter your email, password and **Google Authenticator OTP manually** in that browser.
   The script waits up to 10 minutes; keep the browser open. No credentials, OTP,
   TOTP seed or browser console output are captured in logs.
3. After successful sign-in, the script automatically opens the approved organization's
   dashboard. It verifies session/account authorization, the exact dashboard route,
   and the visible dashboard header subtitle from the frontend source.
4. Only then does it save Playwright `storageState` (cookies and local storage) to
   **`.auth/user.json`** and close the browser. No Helpdesk navigation is required.

The file is written atomically with owner-only permissions. `.auth/` is gitignored;
never commit or upload it. The previous state is retained if login fails. There is
no TOTP automation. `npm run auth:capture` remains an alias for the same setup.

```sh
npm run test:login
```

`test:login` uses `.auth/user.json` in a fresh context and verifies the dashboard.
Missing/invalid state, a revoked/expired session (HTTP 401), or a redirect to sign-in
reports **Run npm run auth:setup again**. Dashboard/network/access failures are
separate failures; the suite never bypasses MFA or silently recaptures authentication.

## Reuse the login in Helpdesk tests

Every Playwright project uses `.auth/user.json` from the shared configuration. The
`auth` project validates it before the dependent Helpdesk/P0 project. Each test gets
an isolated browser context with the same login; email/password/OTP are not re-entered
for each test. Shared cookies/local storage do not imply shared page state. No
sessionStorage authentication dependency was found in the reviewed Kaily flow.

For Helpdesk API checks, copy `.env.example` to `.env` and populate the **verified**
main API gateway base and its exact origin in `KAILY_API_ORIGINS`. Base URLs may
include a gateway prefix but must not include `/v1`, credentials or query parameters.
API origins are not guessed. Leave inbound writes disabled.

```sh
npm run test:helpdesk
```

The UI may perform its normal activity/status calls; this is not a guarantee of a
strictly read-only backend transaction. Renew expired sessions with `auth:setup`.
No unattended SSO/CI credential flow is assumed. Older `.env` files must remove
`KAILY_AUTH_STATE_PATH` or change it to `.auth/user.json`; the old
`playwright/.auth/agent.json` is not used and remains gitignored.

## Enable the inbound scenario only after isolation

1. Identify the dedicated app in the authorized organization.
2. Confirm its integration webhooks, CRM sync, automation actions and notification
   recipients cannot cause real external calls. Do not use real customer identities.
3. Populate the app ID, integration API base, integration ID and token in `.env` or
   an approved secret store. Never paste tokens into reports or commit them.
4. The integration must be active and permit `users/create`, `conversations/create`
   and `conversations/messages/create`. The preflight checks the integration through
   the account/app-scoped main API, including app ID and token equality. If the
   deployed response omits these fields, it fails closed; do not bypass the check.
5. Set `KAILY_SIDE_EFFECTS_ISOLATED=true` and `KAILY_ENABLE_INBOUND=true`.

```sh
npm run test:p0
```

The adapter creates a contact, then a conversation, then a user message. It validates
the persisted thread's app, customer and surface before message insertion. The test
polls account-scoped read APIs by returned IDs, then finds the synthetic customer in
the Helpdesk table and verifies the exact message and displayed time.

No creation request is retried; test retries are zero and execution uses one worker.
A failed run can leave partial synthetic records. Retain the run ID for manual
review; agree a retention policy before repeated production runs. Disabled inbound
coverage is reported as skipped, not as a passed scenario.

## Privacy and diagnostics

Traces, screenshots and video are disabled. Raw HTTP bodies, headers, browser
console output, tokens and cookies are not logged. API errors retain only status or
generic failure information. Do not enable `DEBUG`, `PWDEBUG`, HAR collection or
custom request logging with production credentials. Storage state is sensitive.

## Source evidence and deployment verification

Source root: `/Users/sukhpreetsinghlohiya/Desktop/Copilot-repo/Boltic/services/`.

| Behavior | Source relative to that root |
| --- | --- |
| SSO redirect and session guard | `trinity/src/pages/Auth/index.js`, `trinity/src/guards/auth.guard.js` |
| Account bearer token | `trinity/src/common/redux/actions/orgActions.js`, `trinity/src/services/api.service.js` |
| Region prefix | `trinity/src/index.js` |
| Helpdesk routes/query state | `trinity/src/pages/Helpdesk/index.js`, `trinity/src/pages/Helpdesk/Threads/threadRouteState.js` |
| Table columns and surface label | `trinity/src/pages/Helpdesk/Threads/Views/TableView.js`, `trinity/src/pages/Helpdesk/components/SurfaceIcon.js` |
| Bubble test ID and local timestamp | `trinity/src/pages/Helpdesk/Threads/Chat/MessageBubble.js` |
| Account thread reads | `neo/app/api/routes/main/v1/org/threads.route.js` |
| Message reads | `neo/app/api/routes/main/v1/org/copilotapps/threads.route.js` |
| Integration ownership read | `neo/app/api/routes/main/v1/org/copilotapps/integrations.route.js` |
| Integration routes/payloads | `neo/app/pkg/integrations/apiSpecificationGenerator.js`, `neo/app/pkg/integrations/operations.js` |
| Persistence and side effects | `neo/app/pkg/conversations/model.js`, `neo/app/pkg/conversations/service.js`, `neo/app/pkg/integrations/util.js` |

Known constraints:

- Selectors and response shapes are source-backed but still require verification
  against the deployed revision. No production run was performed during scaffolding.
- `appendMeta: true` is implemented but not explicitly documented in the conversation
  creation schema; deployed support must be confirmed. Without it, surface metadata
  is nested under the integration and Helpdesk may not identify the web surface.
- Omit `generateAssistantMessage`; the string `false` is truthy in the current
  backend implementation. Do not add it as a query parameter.
- Agent tokens stay in memory. API reads use captured authenticated request headers
  through the same configured gateway; internal identity headers are never forged.
- The smoke test expects at least one existing thread. The inbound test generates
  its own fixture; an empty organization needs an approved fixture before smoke runs.
- Delivery summaries are currently disabled in the main message response. Delivery
  receipts, failures, duplicates, rich formatting and outbound tests are deferred.
- The generic message-bubble test ID does not encode sender direction. Direction is
  asserted from persisted `role=user`, not guessed from generated CSS classes.
