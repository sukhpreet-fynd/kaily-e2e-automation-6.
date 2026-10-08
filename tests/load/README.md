# Load testing with k6

Standalone layer. k6 is a separate runtime from Playwright, so these scripts
are plain JavaScript (k6 ES modules) and are invoked outside the Playwright
test runner.

## Install

```sh
brew install k6
```

## Capture a bearer

Account-scoped scenarios need a short-lived user bearer. k6 cannot run the
Playwright login flow, so we bridge the two worlds with a tiny helper:

```sh
# 1. Make sure .auth/user.json exists (npm run auth:setup if not).
# 2. Capture a fresh bearer into .auth/bearer (mode 0600, gitignored).
npm run load:bearer
# 3. Export it for k6.
export K6_BEARER=$(cat .auth/bearer)
```

The capture script opens a headed browser, loads Helpdesk, snapshots the
first `Authorization: Bearer ...` header sent to `/v1/org/{approved}/...`,
and prints only `Bearer captured`. The token itself is never logged.

## Required env

| Var           | Required for          | Notes                                                 |
| ------------- | --------------------- | ----------------------------------------------------- |
| `K6_BASE_URL` | every scenario        | e.g. `https://console.fynd.com/kaily/asia-south1`     |
| `K6_BEARER`   | all except `health`   | from `.auth/bearer`                                   |
| `K6_ORG_ID`   | optional              | defaults to the approved org                          |
| `K6_PROFILE`  | optional              | `smoke` (default), `baseline`, `stress`               |
| `K6_THREAD_ID`| `thread-detail` only  | script skips cleanly if unset                         |

## Example runs

```sh
# Health, no auth, safe anywhere:
K6_BASE_URL=https://<uat-api> k6 run tests/load/scenarios/health.js

# Threads list (6/60s per account; stay on smoke):
K6_BASE_URL=https://<uat-api> K6_BEARER=$(cat .auth/bearer) \
  k6 run tests/load/scenarios/threads-list.js

# Analytics overview (server-cached ~10m):
K6_BASE_URL=https://<uat-api> K6_BEARER=$(cat .auth/bearer) \
  k6 run tests/load/scenarios/analytics-overview.js

# Agents list:
K6_BASE_URL=https://<uat-api> K6_BEARER=$(cat .auth/bearer) \
  k6 run tests/load/scenarios/copilotapps-list.js
```

## Rate-limit math (from Neo source)

- `GET /v1/org/{accountId}/threads` — 6 req / 60s per **account**
  (`neo/.../v1/org/threads.route.js:176-180`). Scenarios sleep 11s per VU
  to stay under 6/60s on smoke (1 VU). Baseline/stress on this scenario
  would blow the account bucket.
- `POST /copilotapps` — 1 req / 5s per account. **Never created under load.**
- `/generate-content` — 3 req / 60s per IP. **Never hit under load.**
- Health endpoints `/_healthz`, `/_livez`, `/_readyz` — no auth, cheap.

## Safety

- **Never** run `K6_PROFILE=stress` against production without written approval.
- Scenarios are read-only. No POST/PUT/DELETE anywhere.
- Public API (`Authorization: Bearer <api-key>`) is not exercised; use a
  dedicated test key if that ever gets wired up.
- Bearer tokens are never logged. Response bodies are never logged.
