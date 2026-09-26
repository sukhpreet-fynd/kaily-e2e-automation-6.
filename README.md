# kaily-e2e-automation-6.

Playwright TypeScript post-deployment sanity automation suite for Kaily.  7.

## P0 sanity foundation

This repository targets only organization `e6af7bff-e89d-467b-9efe-69a2c9ad0957` at
`https://console.fynd.com/kaily/asia-south1/`. Production use for this organization
was explicitly authorized. Other organizations are rejected by configuration and
blocked when their account-scoped browser URLs are requested.

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

## Offline checks (no Kaily traffic)

Requires Node 24+.

```sh
npm run typecheck
npm test
npm run test:list
```

`npm test` intentionally runs only offline unit tests. API mocks exist solely in
`tests/unit`; production P0 tests never mock application responses.

## Configure and capture a session

Copy `.env.example` to `.env`. Populate the **verified** main API gateway base and
its exact origin in `KAILY_API_ORIGINS`. Base URLs may include a gateway prefix but
must not include `/v1`, credentials or query parameters. API origins are not guessed.
Use a dedicated test agent with membership in the approved organization only.

```sh
npm run auth:capture
```

This command opens a real browser and contacts production. Complete legitimate
SSO/OTP yourself; the script does not bypass authentication. Navigate to the approved
Helpdesk table view. The script waits for it to render after MFA and saves automatically.
Session state is saved with
owner-only file permissions under ignored `playwright/.auth/`.

```sh
npm run test:helpdesk
```

This contacts production and validates the saved session before the Helpdesk check.
The UI may perform its normal activity/status calls; this is not a guarantee of a
strictly read-only backend transaction. Renew expired sessions with `auth:capture`.
All test contexts use this same authenticated account through the saved storage state;
they do not request a new OTP for each test. The auth dependency verifies the session
once before the P0 project. Expired or revoked sessions require fresh MFA; OTP codes
are never stored or reused. No unattended SSO/CI credential flow is assumed.

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
