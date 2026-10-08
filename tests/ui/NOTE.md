# UI layer — merge instructions

A dedicated Playwright project for lightweight, read-only UI sanity checks of
authenticated routes outside Helpdesk. Each spec navigates with the shared
`storageState` and asserts a stable landmark; no deep interactions, no new API
side-effects. Keep this suite flake-free so one QA can own it.

## package.json — add to `scripts`

```json
"test:ui": "playwright test --project=ui"
```

## playwright.config.ts — add to `projects`

```ts
{ name: 'ui', testMatch: '**/ui/*.spec.ts', dependencies: ['auth'] }
```

## Notes for the integrator

- API Keys route in trinity is `/accounts/:orgId/helpdesk/settings/api-keys`
  (per `trinity/src/pages/Helpdesk/Settings/index.js:405`). The brief listed
  `/accounts/:orgId/account/api-keys` which does not exist — the real path was
  used. Update if trinity grows an account-level alias.
- Teams page has no stable `data-testid` wrapper; `TeamList` uses the text
  `Team` as its heading (`Body_S_Bold` at `TeamList/index.js:311`). If the
  product rewords this, swap the selector in `src/pages/teams.page.ts`.
- `navigation.spec.ts` only fails on `pageerror` (hard JS errors), ignoring
  console warnings to keep signal-to-noise high.
