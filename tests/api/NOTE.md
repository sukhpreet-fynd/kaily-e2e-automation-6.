# API layer — consolidation notes

Instructions for the consolidator. Do not run `test:api` without the saved SSO
session (`npm run auth:setup`); it depends on the `auth` project.

## 1. New npm scripts (`package.json`)

Add these two scripts; do not rename or remove existing ones:

```json
"test:api": "playwright test --project=api",
"test:api:health": "playwright test --project=api tests/api/health.spec.ts"
```

## 2. New Playwright project (`playwright.config.ts`)

Append to the `projects` array, after `p0`:

```ts
{ name: 'api', testMatch: '**/api/*.spec.ts', dependencies: ['auth'] }
```

The suite-wide `fullyParallel: false, workers: 1, retries: 0` already applies.
The `api` project MUST keep those defaults — specs assume serial execution and
no mutation retries. Each spec also uses `test.describe.serial(...)` for intra-
file ordering.

## 3. README section snippet

Add under the existing "Reuse the login" section (3–5 lines):

```md
## API read-only suite

`npm run test:api` runs typed GET-only clients against the approved org's main
API gateway, covering threads, copilot apps, settings, analytics, audit,
developers scopes/keys, agent users and health probes. `npm run test:api:health`
hits only the unauthenticated `/_healthz`, `/_livez` and `/_readyz` endpoints.
No writes, no retries, no body or header logging. Requires `.env` with the
same `KAILY_MAIN_API_BASE_URL` and `KAILY_API_ORIGINS` already used by the
helpdesk project.
```

## 4. No env changes required

Existing `.env.example` entries (`KAILY_MAIN_API_BASE_URL`, `KAILY_API_ORIGINS`,
auth state path) are sufficient. Inbound write envs stay disabled.
