# Load layer — consolidator notes

## New npm scripts (append to `package.json` → `scripts`)

```json
"load:bearer": "node --experimental-strip-types scripts/capture-bearer.ts",
"load:health": "k6 run tests/load/scenarios/health.js",
"load:threads": "k6 run tests/load/scenarios/threads-list.js",
"load:agents": "k6 run tests/load/scenarios/copilotapps-list.js",
"load:analytics": "k6 run tests/load/scenarios/analytics-overview.js"
```

## Playwright projects

None. The k6 scenarios run outside Playwright. The only Playwright touchpoint
is `scripts/capture-bearer.ts`, which is invoked directly via `npm run
load:bearer` and does not need to be registered as a Playwright project.

## README section (append verbatim, 5 lines)

```md
### Load testing

k6 scenarios live under `tests/load/`. Install k6 (`brew install k6`), run
`npm run load:bearer` once per session to capture a short-lived bearer into
`.auth/bearer`, then `export K6_BEARER=$(cat .auth/bearer)` and invoke any
`npm run load:*` script. Full workflow, rate-limit math, and env vars are in
`tests/load/README.md`. Never run `K6_PROFILE=stress` against prod.
```

## Files added

- `tests/load/lib/config.js`
- `tests/load/lib/profiles.js`
- `tests/load/lib/thresholds.js`
- `tests/load/scenarios/health.js`
- `tests/load/scenarios/threads-list.js`
- `tests/load/scenarios/copilotapps-list.js`
- `tests/load/scenarios/analytics-overview.js`
- `tests/load/scenarios/thread-detail.js`
- `tests/load/README.md`
- `scripts/capture-bearer.ts`

## Not touched

- `package.json`, `playwright.config.ts`, repo-root `README.md` (per boundary).
- `.gitignore` already excludes `.auth/`, which covers `.auth/bearer`.

## Caveats

- `thread-detail.js` requires `K6_THREAD_ID`; otherwise runs a single no-op
  iteration and exits 0.
- `threads-list.js` and `thread-detail.js` share the per-account 6/60s
  bucket; keep them on `smoke`. `baseline` would exceed the Neo rate limit.
- `copilotapps-list.js` downgrades `stress` to `baseline` internally.
- `generate-content` and `POST /copilotapps` are intentionally absent.
